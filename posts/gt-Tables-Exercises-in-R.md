---
title: "gt Tables Exercises in R: 22 Real-World Practice Problems"
slug: "gt-Tables-Exercises-in-R"
description: "22 hands-on gt package exercises in R: build, format, style, and publish boardroom-grade tables with headers, spanners, summaries, and footnotes."
keywords: "gt package exercises, R tables, gt R, publication tables R, fmt_number, tab_style, summary_rows, tab_spanner, gtsave"
mathjax: false
webr: true
date: "2026-05-13"
post_type: "EX"
sidebar_title: "gt Tables Exercises"
sidebar_order: 410
fr_parent: "gt-Package.html"
auto_link_terms: "gt package|gt tables|publication tables|fmt_number|tab_style|summary_rows"
auto_link_case_sensitive: false
target_keyword: "gt package exercises"
sibling_block_enabled: false
difficulty: "Mixed"
---

# gt Tables Exercises in R: 22 Real-World Practice Problems

<p class="lead">Twenty-two practice problems for building publication-grade tables with the gt package in R. Each problem comes with a domain-flavoured task, an expected output, and a hidden solution you reveal only after you write your own. Topics: table construction, headers and spanners, number and date formatting, conditional styling, summary rows, row groups, and saving the final artifact.</p>

```r title="Run this once before any exercise"
library(gt)
library(dplyr)
library(tibble)
```

## Section 1. Building basic gt tables (3 problems)

### Exercise 1.1: Turn a tibble into a basic gt table

**Task:** A reporting analyst wants the simplest possible publication object for a small `mtcars` slice. Take the first 5 rows of `mtcars`, keep only `mpg`, `cyl`, and `hp`, move the rownames into a `model` column, and pipe the result into `gt()`. Save to `ex_1_1`.

**Expected result:**

```
#> gt_tbl: HTML table, 5 rows x 4 columns
#> columns: model (chr), mpg (dbl), cyl (dbl), hp (dbl)
#> rows: Mazda RX4, Mazda RX4 Wag, Datsun 710, Hornet 4 Drive, Hornet Sportabout
#> no header, no spanners, default styling
```

**Difficulty:** Beginner

[HINTS]
Model names live in the row names rather than a real column, and the table object silently discards row names, so they must be lifted out first.
Use rownames_to_column("model"), then head(5) and select(model, mpg, cyl, hp), and finish by passing the result to gt().

```r title="Your turn"
ex_1_1 <- # your code here
ex_1_1
```

<details>
<summary>Click to reveal solution</summary>

```r title="Solution"
ex_1_1 <- mtcars |>
  tibble::rownames_to_column("model") |>
  head(5) |>
  select(model, mpg, cyl, hp) |>
  gt()
ex_1_1
#> An HTML table with 5 rows and columns: model, mpg, cyl, hp
```

**Explanation:** `gt()` accepts any data frame or tibble and returns a `gt_tbl` object that renders as HTML. Because `mtcars` stores model names in row names, `rownames_to_column()` lifts them into a real column before you call `gt()`, which is critical: `gt()` silently drops row names. Pipe order matters here, slice first or after the rename, but the rename must precede `gt()`.

</details>

### Exercise 1.2: Use a rowname column with gt for a clean stub

**Task:** The reporting analyst now wants the model name to appear as a row label (the "stub") rather than a regular column. Take the first 5 rows of `mtcars`, keep `mpg` and `cyl`, and pass `rowname_col = "model"` to `gt()` so the model becomes the stub. Save the table to `ex_1_2`.

**Expected result:**

```
#> gt_tbl: 5 rows x 2 data columns + stub column
#> stub (rowname): Mazda RX4, Mazda RX4 Wag, Datsun 710, Hornet 4 Drive, Hornet Sportabout
#> data columns: mpg, cyl
#> no group label
```

**Difficulty:** Beginner

[HINTS]
A row-label column behaves differently from an ordinary column and has to be declared as the table is created, not bolted on afterward.
Pass rowname_col = "model" inside gt() after the usual rownames_to_column, head, and select steps.

```r title="Your turn"
ex_1_2 <- # your code here
ex_1_2
```

<details>
<summary>Click to reveal solution</summary>

```r title="Solution"
ex_1_2 <- mtcars |>
  tibble::rownames_to_column("model") |>
  head(5) |>
  select(model, mpg, cyl) |>
  gt(rowname_col = "model")
ex_1_2
#> HTML table with stub = model, 2 data columns
```

**Explanation:** The stub is gt's special leftmost label column. Passing `rowname_col` at construction time turns that column into the stub, which unlocks features like summary rows, row group labels, and the `cells_stub()` location helper for `tab_style()`. A regular column has none of those affordances, so the choice between "data column" and "stub" sets the entire downstream styling vocabulary.

</details>

### Exercise 1.3: Construct a gt table from an inline tibble of weekly KPIs

**Task:** The growth team needs a quick weekly snapshot for stand-up. Construct an inline tibble with columns `week` (W1 to W4), `signups` (320, 410, 388, 502), and `revenue_usd` (4820, 6105, 5740, 7888), then turn it into a basic gt table with `week` as the stub. Save to `ex_1_3`.

**Expected result:**

```
#> gt_tbl: 4 rows x 2 data columns + stub
#> stub: W1, W2, W3, W4
#> signups: 320, 410, 388, 502
#> revenue_usd: 4820, 6105, 5740, 7888
```

**Difficulty:** Beginner

[HINTS]
Prototype the data inline as a small table, then hand it to the constructor with the week column marked as the row label.
Build it with tibble(week = ..., signups = ..., revenue_usd = ...) and call gt(..., rowname_col = "week").

```r title="Your turn"
ex_1_3 <- # your code here
ex_1_3
```

<details>
<summary>Click to reveal solution</summary>

```r title="Solution"
kpi <- tibble(
  week        = c("W1", "W2", "W3", "W4"),
  signups     = c(320, 410, 388, 502),
  revenue_usd = c(4820, 6105, 5740, 7888)
)
ex_1_3 <- gt(kpi, rowname_col = "week")
ex_1_3
#> HTML table with stub = week and 2 data columns
```

**Explanation:** Inline tibbles are how analysts prototype gt outputs without dragging in a large dataset. Building the data with `tibble()` and piping directly into `gt()` is a fast iteration loop for stand-up reports. Once the styling is locked, you swap the inline tibble for the real query result with one line and the table format stays identical.

</details>

## Section 2. Headers, spanners, and column labels (4 problems)

### Exercise 2.1: Add a title and subtitle with tab_header

**Task:** The product manager asked for a labelled monthly report. Take `ex_1_3` and add a title "Weekly Growth Snapshot" plus a subtitle "Signups and revenue, last 4 weeks" using `tab_header()`. Save the result to `ex_2_1`.

**Expected result:**

```
#> gt_tbl with header
#> title:    Weekly Growth Snapshot
#> subtitle: Signups and revenue, last 4 weeks
#> body: same 4 rows x 2 columns + stub as ex_1_3
```

**Difficulty:** Beginner

[HINTS]
A title block stacks two text rows above the column labels and travels with the table object itself.
Pipe ex_1_3 into tab_header(title = ..., subtitle = ...).

```r title="Your turn"
ex_2_1 <- # your code here
ex_2_1
```

<details>
<summary>Click to reveal solution</summary>

```r title="Solution"
ex_2_1 <- ex_1_3 |>
  tab_header(
    title    = "Weekly Growth Snapshot",
    subtitle = "Signups and revenue, last 4 weeks"
  )
ex_2_1
#> Header is two stacked rows above the column labels
```

**Explanation:** `tab_header()` adds a two-tier title block above the column labels: title is bold, subtitle smaller and lighter. Both accept `md()` or `html()` helpers if you need bold or links inline. Putting the title in the gt object itself (rather than the report prose) keeps the artifact self-describing when stakeholders screenshot it and paste it into Slack.

</details>

### Exercise 2.2: Rename columns with cols_label

**Task:** The finance team finds machine-readable column names like `revenue_usd` ugly in the boardroom deck. Take `ex_2_1` and use `cols_label()` to relabel `signups` to "New Signups" and `revenue_usd` to "Revenue (USD)". Save the table to `ex_2_2`.

**Expected result:**

```
#> gt_tbl, same header as ex_2_1
#> column labels (displayed): New Signups | Revenue (USD)
#> underlying data columns still named signups, revenue_usd
```

**Difficulty:** Beginner

[HINTS]
Display labels can differ from the underlying column names, so rename only what the reader sees and leave the data names untouched.
Pipe ex_2_1 into cols_label(signups = "New Signups", revenue_usd = "Revenue (USD)").

```r title="Your turn"
ex_2_2 <- # your code here
ex_2_2
```

<details>
<summary>Click to reveal solution</summary>

```r title="Solution"
ex_2_2 <- ex_2_1 |>
  cols_label(
    signups     = "New Signups",
    revenue_usd = "Revenue (USD)"
  )
ex_2_2
#> Column labels now read "New Signups" and "Revenue (USD)"
```

**Explanation:** `cols_label()` changes only the display label, not the underlying column name. This is important because every other gt verb (`fmt_number()`, `tab_style()`, `summary_rows()`) still references the raw column name. Keep the raw names lowercase snake_case in the tibble and treat `cols_label()` as the presentation layer, the same separation `ggplot2::labs()` enforces in plots.

</details>

### Exercise 2.3: Group two columns under a spanner with tab_spanner

**Task:** The analyst wants signups and revenue grouped visually under a "This week" header. Take `ex_2_2` and use `tab_spanner(label = "This week", columns = c(signups, revenue_usd))` to draw a single banner above those two columns. Save the result to `ex_2_3`.

**Expected result:**

```
#> gt_tbl with spanner
#> header:   Weekly Growth Snapshot / subtitle
#> spanner:  "This week" spanning the signups + revenue_usd columns
#> column labels under spanner: New Signups | Revenue (USD)
```

**Difficulty:** Intermediate

[HINTS]
A banner can sit above several adjacent columns to group them visually without altering the underlying data shape.
Pipe ex_2_2 into tab_spanner(label = "This week", columns = c(signups, revenue_usd)).

```r title="Your turn"
ex_2_3 <- # your code here
ex_2_3
```

<details>
<summary>Click to reveal solution</summary>

```r title="Solution"
ex_2_3 <- ex_2_2 |>
  tab_spanner(
    label   = "This week",
    columns = c(signups, revenue_usd)
  )
ex_2_3
#> Spanner row appears between the header and the column labels
```

**Explanation:** Spanners are the gt analogue of merged header cells in Excel. They group columns visually without changing the data shape and are essential when a wide table mixes, say, "Q1" and "Q2" blocks of three columns each. You reference columns with tidy-select (`c(...)`, `starts_with("q1_")`, `where(is.numeric)`) inside `columns =`, exactly like `dplyr::select()`.

</details>

### Exercise 2.4: Move and hide columns with cols_move and cols_hide

**Task:** A junior analyst onboarding the deck needs Revenue to appear before Signups, and the index column dropped. Build an inline tibble with `idx` (1:4), `week` (W1 to W4), `signups` (c(320,410,388,502)), `revenue_usd` (c(4820,6105,5740,7888)), pipe into `gt()`, then use `cols_move(columns = revenue_usd, after = week)` and `cols_hide(columns = idx)`. Save to `ex_2_4`.

**Expected result:**

```
#> gt_tbl: 4 rows x 3 visible columns
#> visible order: week | revenue_usd | signups
#> idx column hidden (not displayed)
```

**Difficulty:** Intermediate

[HINTS]
Column order and visibility are presentation choices you can change without touching the data behind the table.
After gt(), chain cols_move(columns = revenue_usd, after = week) and cols_hide(columns = idx).

```r title="Your turn"
ex_2_4 <- # your code here
ex_2_4
```

<details>
<summary>Click to reveal solution</summary>

```r title="Solution"
kpi2 <- tibble(
  idx         = 1:4,
  week        = c("W1", "W2", "W3", "W4"),
  signups     = c(320, 410, 388, 502),
  revenue_usd = c(4820, 6105, 5740, 7888)
)
ex_2_4 <- gt(kpi2) |>
  cols_move(columns = revenue_usd, after = week) |>
  cols_hide(columns = idx)
ex_2_4
#> Columns shown: week, revenue_usd, signups (idx hidden)
```

**Explanation:** `cols_move()` and `cols_hide()` re-order and suppress columns at the presentation layer without mutating the data, so you can pass a single canonical tibble to `gt()` and customise every output for its audience. Compare with `select()` upstream: `cols_hide()` keeps the data accessible for `summary_rows()` or `tab_footnote()` references, while `select()` removes it from gt entirely.

</details>

## Section 3. Formatting numbers, currency, and dates (4 problems)

### Exercise 3.1: Format a numeric column with fmt_number

**Task:** The finance team complains the revenue column shows 4820 instead of 4,820. Take `ex_2_3` and apply `fmt_number(columns = revenue_usd, decimals = 0, use_seps = TRUE)` to insert thousands separators. Save to `ex_3_1`.

**Expected result:**

```
#> gt_tbl, revenue_usd column now displayed as: 4,820 | 6,105 | 5,740 | 7,888
#> signups column unchanged (still 320, 410, 388, 502)
```

**Difficulty:** Intermediate

[HINTS]
Large numbers read better with thousands separators, and the change affects only the displayed text, not the stored value.
Pipe ex_2_3 into fmt_number(columns = revenue_usd, decimals = 0, use_seps = TRUE).

```r title="Your turn"
ex_3_1 <- # your code here
ex_3_1
```

<details>
<summary>Click to reveal solution</summary>

```r title="Solution"
ex_3_1 <- ex_2_3 |>
  fmt_number(
    columns  = revenue_usd,
    decimals = 0,
    use_seps = TRUE
  )
ex_3_1
#> revenue_usd values render with commas: 4,820, 6,105, 5,740, 7,888
```

**Explanation:** `fmt_number()` is the workhorse formatter. `decimals = 0` rounds for display only, the underlying value is preserved for sorting and summaries. `use_seps = TRUE` honours the system locale, so `en_US` gives commas and `de_DE` gives points; pass `sep_mark = ","` to override. Format only the columns that need it: applying number formatting to ID columns is a frequent rookie mistake that turns "1001" into "1,001".

</details>

### Exercise 3.2: Apply fmt_currency to a price column

**Task:** A retailer is preparing a board pack. Build an inline tibble with `sku` (A001, A002, A003), `units` (c(120, 84, 200)), and `price` (c(19.99, 49.5, 8.25)), pipe into `gt(rowname_col = "sku")`, then format `price` as USD with two decimals using `fmt_currency(columns = price, currency = "USD")`. Save to `ex_3_2`.

**Expected result:**

```
#> gt_tbl: 3 rows, stub=sku, 2 data columns
#> price displayed: $19.99 | $49.50 | $8.25
#> units unchanged: 120, 84, 200
```

**Difficulty:** Intermediate

[HINTS]
A price column should carry a currency glyph and consistent decimals, applied as a display-time formatter.
Build the tibble, call gt(..., rowname_col = "sku"), then fmt_currency(columns = price, currency = "USD").

```r title="Your turn"
ex_3_2 <- # your code here
ex_3_2
```

<details>
<summary>Click to reveal solution</summary>

```r title="Solution"
prices <- tibble(
  sku   = c("A001", "A002", "A003"),
  units = c(120, 84, 200),
  price = c(19.99, 49.50, 8.25)
)
ex_3_2 <- gt(prices, rowname_col = "sku") |>
  fmt_currency(columns = price, currency = "USD")
ex_3_2
#> price column shows $19.99, $49.50, $8.25
```

**Explanation:** `fmt_currency()` is `fmt_number()` plus a currency glyph and ISO-aware decimal rules (most currencies default to 2 decimals, JPY to 0). Pass `currency = "EUR"` for Euros, `currency = "GBP"` for pounds, etc. For multi-currency reports, format each row group separately using the `rows =` argument or use `fmt()` with a custom function.

</details>

### Exercise 3.3: Show percentages with fmt_percent

**Task:** The performance reviewer needs conversion rates expressed as percentages. Build an inline tibble with `channel` (Email, Paid, Organic), `clicks` (c(8200, 12400, 4150)), and `cvr` (c(0.042, 0.018, 0.071) which are raw proportions), then build a gt table with stub=channel and format `cvr` to display as percent with 1 decimal using `fmt_percent(columns = cvr, decimals = 1)`. Save to `ex_3_3`.

**Expected result:**

```
#> gt_tbl: 3 rows, stub=channel, 2 data columns
#> clicks: 8200, 12400, 4150 (unchanged)
#> cvr displayed: 4.2% | 1.8% | 7.1%
```

**Difficulty:** Intermediate

[HINTS]
Raw proportions between 0 and 1 should be shown as percentages, with the formatter handling the multiply-by-100.
After gt(..., rowname_col = "channel"), apply fmt_percent(columns = cvr, decimals = 1).

```r title="Your turn"
ex_3_3 <- # your code here
ex_3_3
```

<details>
<summary>Click to reveal solution</summary>

```r title="Solution"
conv <- tibble(
  channel = c("Email", "Paid", "Organic"),
  clicks  = c(8200, 12400, 4150),
  cvr     = c(0.042, 0.018, 0.071)
)
ex_3_3 <- gt(conv, rowname_col = "channel") |>
  fmt_percent(columns = cvr, decimals = 1)
ex_3_3
#> cvr displayed as 4.2%, 1.8%, 7.1%
```

**Explanation:** `fmt_percent()` assumes the underlying value is a proportion in [0, 1] and multiplies by 100 for display. If your data already stores percentages (4.2 instead of 0.042) pass `scale_values = FALSE` to suppress the multiplication. Mixing pre-scaled and proportion data inside one column is the single most common source of "my conversion rate is 4200%" bugs, audit the source once and stick to one convention.

</details>

### Exercise 3.4: Format a Date column with fmt_date

**Task:** Build an inline tibble of release dates with `release` (the dates 2025-01-15, 2025-03-08, 2025-06-22 as a Date vector via `as.Date()`) and `version` (c("v1.0", "v1.1", "v2.0")). Build a gt table and use `fmt_date(columns = release, date_style = "month_day_year")` to display the date as "January 15, 2025" rather than ISO. Save to `ex_3_4`.

**Expected result:**

```
#> gt_tbl: 3 rows x 2 columns
#> release displayed:
#>   January 15, 2025
#>   March 8, 2025
#>   June 22, 2025
#> version: v1.0, v1.1, v2.0
```

**Difficulty:** Intermediate

[HINTS]
A genuine date value can be shown in a human-friendly written style, but the column must already hold a date type, not a string.
Coerce with as.Date(), build the table, then fmt_date(columns = release, date_style = "month_day_year").

```r title="Your turn"
ex_3_4 <- # your code here
ex_3_4
```

<details>
<summary>Click to reveal solution</summary>

```r title="Solution"
releases <- tibble(
  release = as.Date(c("2025-01-15", "2025-03-08", "2025-06-22")),
  version = c("v1.0", "v1.1", "v2.0")
)
ex_3_4 <- gt(releases) |>
  fmt_date(columns = release, date_style = "month_day_year")
ex_3_4
#> release column: January 15, 2025 / March 8, 2025 / June 22, 2025
```

**Explanation:** `fmt_date()` takes a `date_style` argument with named conventions like `"iso"`, `"month_day_year"`, `"day_m_year"`, `"yMMMd"`. Run `info_date_style()` to see the full table inside R. The column must already be a `Date` or `POSIXt`, gt does not parse strings, so `as.Date()` upstream is required. For datetimes with hour and minute use `fmt_datetime()` instead.

</details>

## Section 4. Styling cells and conditional formatting (4 problems)

### Exercise 4.1: Bold the column labels with tab_style

**Task:** The performance reviewer asks for stronger emphasis on column labels in the slide deck. Take `ex_3_1` and use `tab_style(style = cell_text(weight = "bold"), locations = cells_column_labels())` to make every column label bold. Save the result to `ex_4_1`.

**Expected result:**

```
#> gt_tbl, identical body to ex_3_1
#> column labels (New Signups, Revenue (USD)) rendered in bold
#> spanner label "This week" rendered with default weight (not affected)
```

**Difficulty:** Intermediate

[HINTS]
Styling is described as a pair: the visual change you want, and the region of the table it should land on.
Pipe ex_3_1 into tab_style(style = cell_text(weight = "bold"), locations = cells_column_labels()).

```r title="Your turn"
ex_4_1 <- # your code here
ex_4_1
```

<details>
<summary>Click to reveal solution</summary>

```r title="Solution"
ex_4_1 <- ex_3_1 |>
  tab_style(
    style    = cell_text(weight = "bold"),
    locations = cells_column_labels()
  )
ex_4_1
#> Column labels rendered with font-weight: bold
```

**Explanation:** `tab_style()` is gt's universal styling primitive: a `style =` argument (built from `cell_text()`, `cell_fill()`, `cell_borders()`) plus a `locations =` argument (one of `cells_body()`, `cells_column_labels()`, `cells_stub()`, `cells_title()`, `cells_row_groups()`, etc.). The split lets you describe what you want and where it goes orthogonally, which is why gt scales to dense, multi-block tables without spaghetti styling code.

</details>

### Exercise 4.2: Highlight a single cell with cell_fill

**Task:** The growth team wants the best revenue week called out. Take `ex_4_1` and use `tab_style(style = cell_fill(color = "#FFF59D"), locations = cells_body(columns = revenue_usd, rows = revenue_usd == max(revenue_usd)))` to paint the maximum revenue cell pale yellow. The underlying data is the kpi tibble from earlier; the max is in W4. Save to `ex_4_2`.

**Expected result:**

```
#> gt_tbl, body cell at (W4, revenue_usd) has background #FFF59D (pale yellow)
#> all other cells unchanged
```

**Difficulty:** Advanced

[HINTS]
A single cell can be singled out by a logical condition that picks the matching row, rather than a hard-coded position.
Use tab_style with cell_fill(color = "#FFF59D") and cells_body(columns = revenue_usd, rows = revenue_usd == max(revenue_usd)).

```r title="Your turn"
ex_4_2 <- # your code here
ex_4_2
```

<details>
<summary>Click to reveal solution</summary>

```r title="Solution"
ex_4_2 <- ex_4_1 |>
  tab_style(
    style    = cell_fill(color = "#FFF59D"),
    locations = cells_body(
      columns = revenue_usd,
      rows    = revenue_usd == max(revenue_usd)
    )
  )
ex_4_2
#> The W4 revenue cell is highlighted yellow
```

**Explanation:** `cells_body()` accepts `rows =` as a tidy-eval expression evaluated against the original data, so `revenue_usd == max(revenue_usd)` resolves to a logical mask over rows. This is how gt does conditional formatting without a loop: declare the predicate and gt picks the right cells. The same expression works inside `tab_footnote()` or `summary_rows()` for matched annotations.

</details>

### Exercise 4.3: Colour-scale a numeric column with data_color

**Task:** The growth team wants a heatmap effect on the signups column to spot peaks at a glance. Take `ex_4_2` and apply `data_color(columns = signups, palette = c("white", "#1B9E77"))` to fill each cell with a colour proportional to its value (white = low, green = high). Save to `ex_4_3`.

**Expected result:**

```
#> gt_tbl, signups cells coloured on a white-to-green gradient
#> W1 (320) palest, W4 (502) deepest green
#> revenue_usd retains the single-cell highlight from ex_4_2
```

**Difficulty:** Advanced

[HINTS]
A numeric column can become a heatmap by mapping its range onto a colour gradient, one fill per cell.
Pipe ex_4_2 into data_color(columns = signups, palette = c("white", "#1B9E77")).

```r title="Your turn"
ex_4_3 <- # your code here
ex_4_3
```

<details>
<summary>Click to reveal solution</summary>

```r title="Solution"
ex_4_3 <- ex_4_2 |>
  data_color(
    columns = signups,
    palette = c("white", "#1B9E77")
  )
ex_4_3
#> signups column gets a continuous colour scale
```

**Explanation:** `data_color()` linearly maps the column's numeric range onto the palette and applies `cell_fill()` per row. Pass a two-colour vector for a simple gradient, or a named viridis palette via `palette = "viridis"`. For divergent data (gains vs losses) supply three colours and centre the scale with `domain = c(-x, 0, x)`. It is the lazy analyst's heatmap, no manual breaks required.

</details>

### Exercise 4.4: Conditional text colour with tab_style + locations on rows

**Task:** A junior analyst is preparing a P&L recap. Build an inline tibble with `month` (Jan, Feb, Mar, Apr) and `pnl` (c(-1200, 800, -340, 1500)), gt it with stub=month, and use `tab_style()` so cells where `pnl < 0` render in red and cells where `pnl >= 0` render in dark green. Save to `ex_4_4`.

**Expected result:**

```
#> gt_tbl: 4 rows, stub=month, 1 data column (pnl)
#> Jan (-1200), Mar (-340): pnl text in red
#> Feb (800), Apr (1500): pnl text in dark green
```

**Difficulty:** Advanced

[HINTS]
Two-sided conditional formatting is built from two styling rules with opposite, non-overlapping conditions.
Stack two tab_style calls using cell_text(color = ...) with cells_body(rows = pnl < 0) and cells_body(rows = pnl >= 0).

```r title="Your turn"
ex_4_4 <- # your code here
ex_4_4
```

<details>
<summary>Click to reveal solution</summary>

```r title="Solution"
pnl <- tibble(
  month = c("Jan", "Feb", "Mar", "Apr"),
  pnl   = c(-1200, 800, -340, 1500)
)
ex_4_4 <- gt(pnl, rowname_col = "month") |>
  tab_style(
    style    = cell_text(color = "red"),
    locations = cells_body(columns = pnl, rows = pnl < 0)
  ) |>
  tab_style(
    style    = cell_text(color = "#1B5E20"),
    locations = cells_body(columns = pnl, rows = pnl >= 0)
  )
ex_4_4
#> Negative values red, positive dark green
```

**Explanation:** Stacking two `tab_style()` calls with mutually exclusive `rows =` predicates is the canonical gt pattern for two-sided conditional formatting. The order matters when predicates overlap: later calls win, so put the more specific predicate last. For traffic-light tables (red/yellow/green) chain three `tab_style()` blocks with breakpoints like `pnl < 0`, `pnl == 0`, `pnl > 0`.

</details>

## Section 5. Summary rows, footnotes, and source notes (4 problems)

### Exercise 5.1: Add a totals row with grand_summary_rows

**Task:** The finance team wants a grand total of revenue at the bottom of the weekly snapshot. Take `ex_3_1` and add `grand_summary_rows(columns = c(signups, revenue_usd), fns = list(Total = ~sum(.)), fmt = ~ fmt_number(., decimals = 0, use_seps = TRUE))` to compute and display column totals. Save to `ex_5_1`.

**Expected result:**

```
#> gt_tbl, identical body to ex_3_1
#> extra "Total" row at the bottom
#> signups Total: 1,620
#> revenue_usd Total: 24,553
```

**Difficulty:** Advanced

[HINTS]
A totals row aggregates the whole body and needs its own formatting pass, since column formats do not carry into it.
Pipe ex_3_1 into grand_summary_rows(columns = c(signups, revenue_usd), fns = list(Total = ~sum(.)), fmt = ~ fmt_number(., decimals = 0, use_seps = TRUE)).

```r title="Your turn"
ex_5_1 <- # your code here
ex_5_1
```

<details>
<summary>Click to reveal solution</summary>

```r title="Solution"
ex_5_1 <- ex_3_1 |>
  grand_summary_rows(
    columns = c(signups, revenue_usd),
    fns     = list(Total = ~sum(.)),
    fmt     = ~ fmt_number(., decimals = 0, use_seps = TRUE)
  )
ex_5_1
#> A Total row appears below all data: signups=1,620, revenue_usd=24,553
```

**Explanation:** `grand_summary_rows()` aggregates the entire body (ignoring row groups), whereas `summary_rows()` aggregates within each row group. `fns =` is a named list of functions or lambdas; the names become row labels. `fmt =` reapplies number formatting because the aggregate value enters the table fresh and needs its own format pass, the column-level `fmt_number()` does not propagate.

</details>

### Exercise 5.2: Add a footnote attached to a specific cell

**Task:** The compliance officer asks for a footnote on the W4 revenue cell explaining it includes a one-off enterprise deal. Take `ex_5_1` and use `tab_footnote(footnote = "Includes one enterprise deal worth $2,200.", locations = cells_body(columns = revenue_usd, rows = 4))` to attach a numbered footnote. Save to `ex_5_2`.

**Expected result:**

```
#> gt_tbl with footnote system
#> W4 revenue cell has a superscript marker (1 or letter)
#> below the table: "1 Includes one enterprise deal worth $2,200."
```

**Difficulty:** Intermediate

[HINTS]
A footnote attaches to one specific location, and the table auto-numbers the marker for you.
Pipe ex_5_1 into tab_footnote(footnote = "...", locations = cells_body(columns = revenue_usd, rows = 4)).

```r title="Your turn"
ex_5_2 <- # your code here
ex_5_2
```

<details>
<summary>Click to reveal solution</summary>

```r title="Solution"
ex_5_2 <- ex_5_1 |>
  tab_footnote(
    footnote  = "Includes one enterprise deal worth $2,200.",
    locations = cells_body(columns = revenue_usd, rows = 4)
  )
ex_5_2
#> Footnote marker attached to W4 revenue cell
```

**Explanation:** `tab_footnote()` accepts the same `locations =` helpers as `tab_style()`, so you can attach notes to column labels, the title, summary rows, or any specific body cell. gt auto-numbers footnotes and rebuilds the markers if you add more later. For glyph-style markers (asterisks, daggers) pass `opt_footnote_marks(marks = "standard")` once at the end of the pipeline.

</details>

### Exercise 5.3: Add a source note for data provenance

**Task:** The audit team requires every published table to cite its source. Take `ex_5_2` and use `tab_source_note(source_note = md("**Source:** Internal CRM, retrieved 2026-05-13."))` to add a small italicised source line under the table (the `md()` helper renders bold). Save to `ex_5_3`.

**Expected result:**

```
#> gt_tbl with source note
#> below the footnote: "Source: Internal CRM, retrieved 2026-05-13."
#> "Source:" rendered in bold (via md())
```

**Difficulty:** Intermediate

[HINTS]
A provenance line sits at the very bottom of the table, below any footnotes, and can carry light markdown styling.
Pipe ex_5_2 into tab_source_note(source_note = md("**Source:** ...")).

```r title="Your turn"
ex_5_3 <- # your code here
ex_5_3
```

<details>
<summary>Click to reveal solution</summary>

```r title="Solution"
ex_5_3 <- ex_5_2 |>
  tab_source_note(
    source_note = md("**Source:** Internal CRM, retrieved 2026-05-13.")
  )
ex_5_3
#> A "Source:" line appears under the footnote
```

**Explanation:** Source notes sit at the very bottom of the table, below footnotes. They are conventionally used for citations, retrieval timestamps, or methodology pointers ("Excludes refunds"). The `md()` helper turns Markdown into HTML inside any gt string slot, so `**bold**`, `*italic*`, and `[links](url)` work. Use `html()` instead if you need raw tags or `<sub>`/`<sup>`.

</details>

### Exercise 5.4: Group-level summary rows with summary_rows

**Task:** The audit team wants subtotals by row group. Build an inline tibble with `region` (East, East, West, West), `product` (A, B, A, B), and `revenue` (c(1200, 1500, 900, 1800)). Pipe into `gt(rowname_col = "product", groupname_col = "region")`, then use `summary_rows(groups = TRUE, columns = revenue, fns = list(Subtotal = ~sum(.)), fmt = ~ fmt_number(., decimals = 0, use_seps = TRUE))` to compute per-region subtotals. Save to `ex_5_4`.

**Expected result:**

```
#> gt_tbl with 2 row groups (East, West)
#> within East: A (1200), B (1500), Subtotal row 2,700
#> within West: A (900), B (1800), Subtotal row 2,700
```

**Difficulty:** Advanced

[HINTS]
Per-group subtotals require the table to know which column defines the groups before any within-group aggregate can run.
Call gt(..., rowname_col = "product", groupname_col = "region"), then summary_rows(groups = TRUE, columns = revenue, fns = list(Subtotal = ~sum(.)), fmt = ~ fmt_number(., decimals = 0, use_seps = TRUE)).

```r title="Your turn"
ex_5_4 <- # your code here
ex_5_4
```

<details>
<summary>Click to reveal solution</summary>

```r title="Solution"
sales <- tibble(
  region  = c("East", "East", "West", "West"),
  product = c("A", "B", "A", "B"),
  revenue = c(1200, 1500, 900, 1800)
)
ex_5_4 <- gt(sales, rowname_col = "product", groupname_col = "region") |>
  summary_rows(
    groups  = TRUE,
    columns = revenue,
    fns     = list(Subtotal = ~sum(.)),
    fmt     = ~ fmt_number(., decimals = 0, use_seps = TRUE)
  )
ex_5_4
#> Each region shows a Subtotal row right below its members
```

**Explanation:** `summary_rows()` with `groups = TRUE` runs the summary functions inside each row group, the table-level analogue of `dplyr::group_by() |> summarise()`. The `groupname_col` argument to `gt()` is what triggers the grouping; without it gt sees a flat table and `summary_rows()` has nothing to partition. Pair with `grand_summary_rows()` to get both per-group subtotals and a grand total.

</details>

## Section 6. Row groups, alignment, and exporting (4 problems)

### Exercise 6.1: Build a grouped table from mtcars by cyl

**Task:** The take-home interviewer wants a tidy view of `mtcars` grouped by cylinder count. Take `mtcars`, move row names into a `model` column, keep `model`, `cyl`, `mpg`, `hp`, then pipe into `gt(rowname_col = "model", groupname_col = "cyl")` to display rows grouped by cylinders. Save to `ex_6_1`.

**Expected result:**

```
#> gt_tbl with 3 row groups (4, 6, 8 cylinders)
#> within each group: model in stub, mpg and hp as data columns
#> 32 total rows split across the three groups
```

**Difficulty:** Intermediate

[HINTS]
An existing column can be promoted into group banners so rows are presented under shared headings.
After rownames_to_column and select(model, cyl, mpg, hp), call gt(rowname_col = "model", groupname_col = "cyl").

```r title="Your turn"
ex_6_1 <- # your code here
ex_6_1
```

<details>
<summary>Click to reveal solution</summary>

```r title="Solution"
ex_6_1 <- mtcars |>
  tibble::rownames_to_column("model") |>
  select(model, cyl, mpg, hp) |>
  gt(rowname_col = "model", groupname_col = "cyl")
ex_6_1
#> 3 group banners: 4, 6, 8, each containing the matching models
```

**Explanation:** `groupname_col` tells gt which existing column to lift into row group banners. Rows are presented in the order they appear in the data, so to get a clean group order you typically `arrange(cyl)` first. The grouped layout is the foundation for `summary_rows(groups = TRUE)`, group-level styling with `cells_row_groups()`, and `row_group_order()` to override the natural order.

</details>

### Exercise 6.2: Re-order row groups with row_group_order

**Task:** The interviewer wants the cylinders displayed in descending order (8, 6, 4) for emphasis on muscle cars. Take `ex_6_1` and apply `row_group_order(groups = c("8", "6", "4"))` to reorder the groups. Save to `ex_6_2`.

**Expected result:**

```
#> gt_tbl, same data as ex_6_1
#> row group order: 8 first, then 6, then 4
#> models within each group remain in their original order
```

**Difficulty:** Intermediate

[HINTS]
Groups appear in data order by default, but you can force an explicit display sequence of your choosing.
Pipe ex_6_1 into row_group_order(groups = c("8", "6", "4")), passing the group labels as strings.

```r title="Your turn"
ex_6_2 <- # your code here
ex_6_2
```

<details>
<summary>Click to reveal solution</summary>

```r title="Solution"
ex_6_2 <- ex_6_1 |>
  row_group_order(groups = c("8", "6", "4"))
ex_6_2
#> Groups now appear as: 8 cyl, 6 cyl, 4 cyl
```

**Explanation:** Group labels are stored as character strings, so even if the original column is numeric you pass the values as strings to `row_group_order()`. The function reorders only the named groups and leaves any unmentioned groups in their natural position. For full alphabetical or numeric reordering, `arrange(desc(cyl))` upstream is simpler than enumerating groups.

</details>

### Exercise 6.3: Right-align numeric columns and centre the stub

**Task:** A code reviewer asks for explicit alignment to avoid relying on gt defaults. Take `ex_6_2` and use `cols_align(align = "right", columns = c(mpg, hp))` and `cols_align(align = "center", columns = model)` to right-align the numerics and centre the stub column. Save to `ex_6_3`.

**Expected result:**

```
#> gt_tbl, same body as ex_6_2
#> mpg and hp values right-aligned within their cells
#> model names centred within the stub column
```

**Difficulty:** Intermediate

[HINTS]
Alignment can be set explicitly per column instead of relying on the type-based defaults.
Chain cols_align(align = "right", columns = c(mpg, hp)) and cols_align(align = "center", columns = model).

```r title="Your turn"
ex_6_3 <- # your code here
ex_6_3
```

<details>
<summary>Click to reveal solution</summary>

```r title="Solution"
ex_6_3 <- ex_6_2 |>
  cols_align(align = "right",  columns = c(mpg, hp)) |>
  cols_align(align = "center", columns = model)
ex_6_3
#> Numerics right-aligned, model centred
```

**Explanation:** `cols_align()` accepts `"left"`, `"center"`, `"right"`, or `"auto"` and applies it to both the column label and every body cell. gt picks `"right"` for numerics and `"left"` for character columns by default, but forcing alignment explicitly makes the pipeline robust against data-type drift (a column that was numeric in dev but lands as character in prod). For the stub specifically, `cols_align(columns = model)` is the right move since the stub is just another column from gt's API perspective.

</details>

### Exercise 6.4: Save the final table to disk with gtsave

**Task:** The reporting analyst needs the final artifact exported as standalone HTML for the boardroom. Take `ex_6_3` and use `gtsave(filename = tempfile(fileext = ".html"))` to write a self-contained HTML file (a temp path keeps the exercise sandboxable). Capture the returned path into `ex_6_4` so you can check the file exists.

**Expected result:**

```
#> ex_6_4 contains a file path ending in ".html"
#> file.exists(ex_6_4) returns TRUE
#> file size > 1000 bytes (gt embeds CSS inline)
```

**Difficulty:** Advanced

[HINTS]
A finished table can be written to disk as a standalone file, with the export format inferred from the filename extension.
Create a path with tempfile(fileext = ".html"), pass it to gtsave(filename = ...), and store that path in ex_6_4.

```r title="Your turn"
ex_6_4 <- # your code here
file.exists(ex_6_4)
```

<details>
<summary>Click to reveal solution</summary>

```r title="Solution"
out_path <- tempfile(fileext = ".html")
gtsave(ex_6_3, filename = out_path)
ex_6_4 <- out_path
file.exists(ex_6_4)
#> [1] TRUE
```

**Explanation:** `gtsave()` infers the export format from the extension: `.html` writes a self-contained page (CSS inlined), `.png`/`.pdf` shell out to webshot2/Chromium, `.tex`/`.rtf`/`.docx` go through dedicated converters. HTML is the lossless default; PNG is great for slide decks but rasterised, and PDF requires a working headless Chrome. For automated pipelines, gtsave to HTML and then post-process with `pagedown::chrome_print()` if you need a deterministic PDF.

</details>

## What to do next

- Pair these exercises with [The gt Package in R](gt-Package.html) to revisit the underlying grammar and the table-anatomy diagram.
- For wrangling the data that feeds these tables, work through [dplyr Exercises in R](dplyr-Exercises-in-R.html).
- To compose the same outputs in a different framework, try [DT Tables Exercises in R](DT-Tables-Exercises-in-R.html) and compare interactivity tradeoffs.
- Once the tables are publication-ready, generate the full report with [R Markdown Exercises in R](R-Markdown-Exercises-in-R.html).

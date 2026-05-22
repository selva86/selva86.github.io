---
title: "janitor row_to_names() in R: Promote a Row to Column Names"
slug: janitor-row_to_names-in-R
description: "janitor::row_to_names() promotes any data frame row to the column header. Fix messy Excel imports, multi-row headers, and stray title rows in one call."
keywords: "janitor row_to_names, row_to_names function R, janitor row_to_names example, R promote row to column names, R first row as header, fix messy Excel import R, janitor clean header row"
mathjax: false
webr: true
date: "2026-05-22"
post_type: PSEO
category_id: function-deep
subcategory_id: janitor-functions
fr_parent: janitor-Package-in-R.html
auto_link_terms: "row_to_names()|janitor row_to_names|janitor::row_to_names()|promote row to column names|row to names function"
auto_link_case_sensitive: true
target_keyword: "janitor row_to_names"
sibling_block_enabled: true
difficulty: Beginner
---

# janitor row_to_names() in R: Promote a Row to Column Names

<p class="lead">janitor::row_to_names() promotes any row of a data frame to become its column names, then drops that row (and optionally the rows above it). It is the standard fix for messy Excel imports where the real header sits below a title row.</p>

[QUICK ANSWER]
row_to_names(df, 1)                                # promote row 1, drop it
row_to_names(df, 2)                                # row 2 has headers, drop rows 1-2
row_to_names(df, 1, remove_row = FALSE)            # use row 1 as names, keep it
row_to_names(df, 3, remove_rows_above = FALSE)     # keep rows 1-2 as data
df |> row_to_names(1) |> clean_names()             # promote, then snake_case
read_excel("f.xlsx") |> row_to_names(2)            # canonical Excel fix
df |> row_to_names(1) |> mutate(across(everything(), as.numeric))   # retype

[DECISION TREE: Is row_to_names() the right tool?]
- a real header row sits inside the data: row_to_names(df, 2)
- file has clean headers but messy names: clean_names(df)
- need just a quick column rename: rename(df, new = old)
- header is split across two rows: combine then row_to_names
- ADD a header to a headerless frame: setNames(df, c("a","b"))
- column types are wrong after promotion: type.convert(df, as.is = TRUE)

## What row_to_names() does

**row_to_names() turns a data row into the column header.** You pass a data frame and the position of the row that holds the real column names. The function lifts that row up, assigns its values as `names(dat)`, then deletes the row (and by default every row above it). It returns a data frame, never a tibble, so wrap it in `as_tibble()` if you need one. The result is a frame whose first row is real data and whose names match what a human would write if the file had been clean from the start.

This is the canonical janitor fix for spreadsheet exports. Excel files often carry a title row, a blank row, and only then the actual header. `read_excel()` reads the title row as the header and pushes the real names into row 2, leaving you with columns named `...1`, `...2`, `Quarterly Report`. One call to `row_to_names(df, 2)` undoes the damage and collapses three manual cleanup steps into a single pipe-friendly call.

## Syntax and arguments

**The signature has four arguments, two of which you usually keep at default.** In day-to-day use you pass the data frame and the row position only. The two boolean flags are reserved for edge cases where you need to preserve rows around the header.

```r title="Function signature"
library(janitor)

# row_to_names(dat, row_number, remove_row = TRUE, remove_rows_above = TRUE)
args(row_to_names)
#> function (dat, row_number, remove_row = TRUE, remove_rows_above = TRUE)
#> NULL
```

| Argument | Default | What it does |
|----------|---------|--------------|
| `dat` | required | The data frame to modify |
| `row_number` | required | Position (integer) of the row to promote |
| `remove_row` | `TRUE` | Drop the promoted row from the data |
| `remove_rows_above` | `TRUE` | Drop every row above the promoted row |

`row_number` is 1-indexed and matches the row position in the data, not any preserved row label. Pick `row_number` by looking at the printed frame, not at the `rownames()` attribute, because filter and arrange operations leave the label out of sync with the visible order. Set `remove_rows_above = FALSE` when rows above the header are real data you need to keep, and `remove_row = FALSE` when the header row should stay as data.

[NOTE]
**row_to_names() converts everything to character.** When the promoted row sits inside columns that started as numeric, every column ends up character because the header value mixed with the data. Always retype after promotion (see Pitfalls).

## Examples by use case

**Four patterns cover almost every real-world call to row_to_names().** Each pattern below uses a small built-in or hand-built example so you can paste the code into a fresh R session and run it as is.

**Use 1: classic Excel import with a title row.** A common pattern is a one-cell title in row 1, the header in row 2, and data from row 3 onward.

```r title="Promote row 2 of a messy import"
library(janitor)
library(tibble)

messy <- tribble(
  ~X1,             ~X2,        ~X3,
  "Sales Report",  NA,         NA,
  "region",        "quarter",  "revenue",
  "North",         "Q1",       "1200",
  "South",         "Q1",       "900"
)

clean <- row_to_names(messy, 2)
clean
#>   region quarter revenue
#> 3  North      Q1    1200
#> 4  South      Q1     900
```

Row 2 became the header. Row 1 (the title) was dropped by `remove_rows_above = TRUE`. Row 2 itself was dropped by `remove_row = TRUE`.

**Use 2: keep the rows above as data.** Set `remove_rows_above = FALSE` when the rows above the header are also valid data, such as a subtotal row.

```r title="Keep rows above the promoted header"
library(janitor)

with_subtotal <- data.frame(
  V1 = c("Subtotal", "Item", "Apple",  "Banana"),
  V2 = c("100",      "name", "10",     "20"),
  V3 = c("USD",      "ccy",  "USD",    "USD"),
  stringsAsFactors = FALSE
)

row_to_names(with_subtotal, 2, remove_rows_above = FALSE)
#>         name ccy V3
#> 1   Subtotal 100 USD
#> 3      Apple  10 USD
#> 4     Banana  20 USD
```

The Subtotal row stays at the top with the new column names applied.

**Use 3: chain with clean_names() and retyping.** The promoted header often contains spaces, hashes, or units. Pipe through `clean_names()` to snake_case the names, then retype the columns.

```r title="Pipe with clean_names and type.convert"
library(janitor)
library(tibble)

raw <- tribble(
  ~A,           ~B,            ~C,
  "Region",     "Quarter #",   "Revenue ($)",
  "North",      "Q1",          "1200",
  "South",      "Q2",          "950"
)

tidy <- raw |>
  row_to_names(1) |>
  clean_names() |>
  type.convert(as.is = TRUE)

str(tidy)
#> 'data.frame': 2 obs. of  3 variables:
#>  $ region    : chr  "North" "South"
#>  $ quarter_number: chr  "Q1" "Q2"
#>  $ revenue   : int  1200 950
```

`row_to_names()` promotes, `clean_names()` standardises, `type.convert()` restores numeric types in one pass. This three-step recipe handles the bulk of dirty CSV and Excel imports without writing a single bracket subset. Reach for it whenever a fresh file lands and the column names look wrong on first inspection.

**Use 4: deeper in a tidy import pipeline.** Many production import scripts read a folder of files, clean each one, and bind the results into a single frame. Drop `row_to_names()` into the cleaning function and the same pipeline handles every spreadsheet the same way.

```r title="Pipeline-friendly cleaning function"
library(janitor)
library(dplyr)
library(tibble)

clean_sheet <- function(df, header_row = 1) {
  df |>
    row_to_names(header_row) |>
    clean_names() |>
    remove_empty(which = c("rows", "cols")) |>
    mutate(across(where(is.character), \(x) type.convert(x, as.is = TRUE)))
}

raw_a <- tribble(~X1, ~X2, "id", "value", "1", "100", "2", "200")
clean_sheet(raw_a)
#>   id value
#> 2  1   100
#> 3  2   200
```

Wrapping the cleanup in a named function makes each step explicit and lets you swap out individual stages without rewriting the orchestration code. Pass `header_row = 2` for files where a title precedes the header. The same function handles every variant.

## Compare with alternatives

**Three other patterns rename columns, but only row_to_names() drops the row it used.** Picking the right one comes down to two questions: do you control the file read, and do you need to keep the source row in the data after renaming.

| Approach | What it does | When to pick it |
|----------|--------------|-----------------|
| `row_to_names(df, n)` | Promotes row n, deletes row + rows above | Header lives inside the data |
| `names(df) <- df[1, ]; df <- df[-1, ]` | Manual base R equivalent | One-off, no janitor dependency |
| `setNames(df, df[1, ])` | Renames but does NOT drop the row | You want both name AND keep that row |
| `read_excel(skip = n)` | Re-read with a skip offset | You control the import call |

For interactive cleanup, prefer `row_to_names()`. For a fresh pipeline, set `skip =` at read time so the header is correct from the start. Choose the manual base R approach only when you cannot add a janitor dependency. Choose `setNames()` when you need the source row to remain in the data after renaming.

[TIP]
**Use skip in read_excel when you can.** `read_excel("f.xlsx", skip = 1)` reads the second row as the header directly. `row_to_names()` is the rescue when you cannot change how the file was loaded.

## Common pitfalls

**Three traps recur with row_to_names(), all fixable.** Each is a downstream consequence of forcing a row of strings into the header slot. The pattern is the same in every case: run `row_to_names()`, then run one follow-up call to repair what the promotion changed.

```r title="Pitfall 1: NA values in the promoted row"
library(janitor)

bad <- data.frame(
  V1 = c("region", "North"),
  V2 = c(NA,       "Q1"),
  V3 = c("rev",    "1200"),
  stringsAsFactors = FALSE
)

row_to_names(bad, 1)
#>   region NA  rev
#> 2  North Q1 1200
```

A literal `NA` ends up as a column name. Fill blanks before promotion: `bad[1, is.na(bad[1, ])] <- "col_NA"`.

```r title="Pitfall 2: duplicate header values"
library(janitor)

dup <- data.frame(
  X1 = c("id", "1"),
  X2 = c("id", "2"),
  stringsAsFactors = FALSE
)

row_to_names(dup, 1)
#>   id id
#> 2  1  2
```

Two columns named `id` will break `dplyr::select(id)`. Chain `clean_names()` after; it appends a numeric suffix to duplicates, giving `id` and `id_2`.

```r title="Pitfall 3: every column is character after promotion"
library(janitor)
library(tibble)

before <- tribble(
  ~A,         ~B,
  "label",    "value",
  "Apple",    "10",
  "Banana",   "20"
)

after <- row_to_names(before, 1)
sapply(after, class)
#>     label     value 
#> "character" "character"
```

Numeric columns are now strings. Always follow with `type.convert(as.is = TRUE)` or explicit `mutate(across(..., as.numeric))`.

[WARNING]
**row_to_names() never returns a tibble.** Even if you pass a tibble in, you get a base data.frame back. Wrap with `as_tibble()` if downstream code expects tibble printing or class checks.

## Try it yourself

**Try it:** A messy import has a title in row 1, headers in row 2, data from row 3. Use row_to_names() to clean it up, then snake_case the column names.

```r title="Your turn: clean a two-row preamble"
library(janitor)
library(tibble)

ex_raw <- tribble(
  ~X1,                   ~X2,           ~X3,
  "Q1 2026 Summary",     NA,            NA,
  "Region Name",         "Total Sales", "Year-over-Year %",
  "North America",       "12500",       "8.2",
  "Europe",              "9800",        "5.1"
)

ex_clean <- # your code here

ex_clean
#> Expected: 2 rows, columns region_name, total_sales, year_over_year_percent
```

<details>
<summary>Click to reveal solution</summary>

```r title="Solution"
ex_clean <- ex_raw |>
  row_to_names(2) |>
  clean_names()

names(ex_clean)
#> [1] "region_name"            "total_sales"            "year_over_year_percent"
nrow(ex_clean)
#> [1] 2
```

**Explanation:** `row_to_names(2)` promotes row 2 to the header and drops rows 1-2. `clean_names()` then converts the spaces, the dash, and the percent sign into snake_case.

</details>

## Related janitor functions

**janitor pairs row_to_names() with five other cleanup helpers.** Use them together when fixing real-world imports.

- `clean_names()` standardises names after promotion, converting spaces, hyphens, and special characters to underscores
- `make_clean_names()` cleans a character vector before assigning to `names()`
- `remove_empty()` drops empty rows and columns left over from the import
- `remove_constant()` drops columns that hold a single value across all rows
- `get_dupes()` finds duplicate rows once the headers are sorted out

## FAQ

**Why is my numeric column suddenly character after row_to_names()?**

The promoted row sat inside the column, so the column type was forced to character to hold the header text. After promotion, follow with `type.convert(as.is = TRUE)` to let R re-infer numeric and integer types, or use `dplyr::mutate(across(where(is.character), as.numeric))` for an explicit cast. The function itself does no retyping.

**How do I handle two header rows that should be combined?**

Concatenate the two rows first, then promote the combined row. One pattern: `df[1, ] <- paste(df[1, ], df[2, ], sep = "_")` then `row_to_names(df, 1)`. This collapses a two-row header like `Q1 / Sales`, `Q1 / Units` into `Q1_Sales`, `Q1_Units` in a single step.

**Does row_to_names() work on tibbles?**

Yes, you can pass a tibble in. The catch is that it returns a base data.frame, not a tibble, even when given one. If your pipeline depends on tibble methods, wrap the call with `tibble::as_tibble()` immediately after.

**Can I use row_to_names() to set columns from a separate vector?**

No. The function reads the names from a row that is already inside the data frame. To rename from an external vector, use `names(df) <- new_vector` or `dplyr::rename_with(df, ~ new_vector)`. Use `row_to_names()` only when the header is embedded in the data.

**What if the row I want has blank cells?**

Blank cells become literal `NA` column names, which break subsequent selection. Either fill them first with `df[row_number, is.na(df[row_number, ])] <- "blank"` or rely on the `clean_names()` follow-up, which converts `NA` to `na` and appends position suffixes when several blanks collide.

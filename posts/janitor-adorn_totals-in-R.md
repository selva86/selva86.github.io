---
title: "janitor adorn_totals() in R: Add Row and Column Totals"
slug: "janitor-adorn_totals-in-R"
description: "Use janitor adorn_totals() to add row and column totals to data frames and tabyl tables in R. Covers where, name, fill, na.rm, and percent-safe stacking."
keywords: "janitor adorn_totals, adorn_totals function R, janitor adorn_totals examples, R add row totals dataframe, R add column totals, adorn_totals tabyl, janitor sum rows columns"
mathjax: false
webr: true
date: "2026-05-22"
post_type: "PSEO"
category_id: "function-deep"
subcategory_id: "janitor-functions"
fr_parent: "janitor-Package-in-R.html"
auto_link_terms: "adorn_totals()|janitor adorn_totals|janitor::adorn_totals()|add row and column totals|adorn_totals function"
auto_link_case_sensitive: true
target_keyword: "janitor adorn_totals"
sibling_block_enabled: true
difficulty: "Beginner"
---

# janitor adorn_totals() in R: Add Row and Column Totals

<p class="lead">The <code>adorn_totals()</code> function in janitor appends a totals row, a totals column, or both to a data frame or tabyl object. It works inside a pipe, ignores non-numeric columns by default, and labels the totals line so the output ships straight to a report without a manual <code>colSums()</code> step.</p>

[QUICK ANSWER]
adorn_totals(df)                              # default: row of totals
adorn_totals(df, where = "col")               # column of row sums
adorn_totals(df, where = c("row", "col"))     # both, with grand total
adorn_totals(df, name = "Grand total")        # custom label
adorn_totals(df, fill = "-")                  # placeholder for text cols
adorn_totals(df, na.rm = FALSE)               # propagate NA in sums
tabyl(mtcars, cyl, gear) |> adorn_totals()    # tabyl pipe chain

[DECISION TREE: Is adorn_totals() the right tool?]
- append totals to a tabyl or data frame: adorn_totals(df, where = "row")
- get a single vector of column sums: colSums(df)
- compute a single grand total scalar: sum(df, na.rm = TRUE)
- add a percentage row instead of count: adorn_percentages(df) then adorn_pct_formatting()
- summary table by group: dplyr::summarize(df, .by = grp)
- format big numbers with commas: adorn_totals() then adorn_rounding() or scales::comma()
- export to Excel with built-in totals: openxlsx::writeData(..., colSums = TRUE)

## What adorn_totals() does in one sentence

**`adorn_totals()` sums each numeric column (and optionally each row) and appends the result as an extra row or column labelled `Total`.** It is the standard finishing step for tabyl output, but it works on any data frame whose numeric columns make sense to add up.

The function preserves the input's class. A tabyl in, a tabyl out. A regular data frame in, a regular data frame out. That detail matters because downstream `adorn_*` helpers (percentages, rounding, titles) only behave correctly when the class survives the pipe.

## Syntax

**`adorn_totals()` takes a data frame plus four optional arguments that control placement, label, missing-value handling, and the placeholder for non-numeric cells.** The numeric columns are detected automatically; the first column is assumed to be the identifier and is skipped.

```r title="Load janitor and a tiny demo frame"
library(janitor)
library(dplyr)

sales <- data.frame(
  region  = c("North", "South", "East", "West"),
  q1      = c(120, 90, 150, 70),
  q2      = c(140, 110, 160, 80),
  q3      = c(130, 95,  170, 75)
)

sales |>
  adorn_totals()
#>   region  q1  q2  q3
#>    North 120 140 130
#>    South  90 110  95
#>     East 150 160 170
#>     West  70  80  75
#>    Total 430 490 470
```

The full signature:

```
adorn_totals(dat, where = "row", fill = "-", na.rm = TRUE, name = "Total", ..., na_rm = NULL)
```

Only `dat` is required. `where` accepts `"row"`, `"col"`, or `c("row", "col")`. `fill` decides what to print in non-numeric columns of the totals row. `na.rm` controls whether `NA` values are skipped when summing. `name` is the label that appears in the first column of the totals row.

[TIP]
**Reach for `adorn_totals()` instead of `rbind(df, colSums(df))` whenever the input has an identifier column.** Manual `colSums()` fails on non-numeric columns and produces a vector you then have to coerce back to a data frame. `adorn_totals()` skips the identifier column, keeps the data frame class, and stays inside the pipe.

## Six common patterns

### 1. Add a totals row (the default)

```r title="Append a row of column sums"
sales |>
  adorn_totals(where = "row")
#>   region  q1  q2  q3
#>    North 120 140 130
#>    South  90 110  95
#>     East 150 160 170
#>     West  70  80  75
#>    Total 430 490 470
```

The default `where = "row"` adds one extra row at the bottom. The first column shows the label "Total" because that column is non-numeric and the function treats it as the identifier.

### 2. Add a totals column (row sums)

```r title="Append a column of row sums"
sales |>
  adorn_totals(where = "col")
#>   region  q1  q2  q3 Total
#>    North 120 140 130   390
#>    South  90 110  95   295
#>     East 150 160 170   480
#>     West  70  80  75   225
```

With `where = "col"`, each row gets a per-region annual total in a new rightmost column. The label of that column is whatever `name` is set to (default "Total").

### 3. Add both row and column totals at once

```r title="Both, with grand total in the corner"
sales |>
  adorn_totals(where = c("row", "col"))
#>   region  q1  q2  q3 Total
#>    North 120 140 130   390
#>    South  90 110  95   295
#>     East 150 160 170   480
#>     West  70  80  75   225
#>    Total 430 490 470  1390
```

The bottom-right cell is the grand total. It equals both `sum(q1, q2, q3)` and `sum(rowTotals)`; the two routes agree because `na.rm = TRUE` by default and there are no missing values here.

### 4. Customize the label with `name`

```r title="Rename the Total row"
sales |>
  adorn_totals(name = "All regions")
#>      region  q1  q2  q3
#>       North 120 140 130
#>       South  90 110  95
#>        East 150 160 170
#>        West  70  80  75
#> All regions 430 490 470
```

Use `name` when "Total" is too vague (multiple totals rows for grouped tables) or when a report style guide requires a specific label like "Subtotal" or "Grand total".

### 5. Handle non-numeric columns in the middle

```r title="Mixed column types and the fill placeholder"
mixed <- data.frame(
  region   = c("North", "South", "East"),
  manager  = c("Alice", "Bob",   "Carol"),
  q1       = c(120, 90, 150),
  q2       = c(140, 110, 160)
)

mixed |>
  adorn_totals(fill = "-")
#>   region manager  q1  q2
#>    North   Alice 120 140
#>    South     Bob  90 110
#>     East   Carol 150 160
#>    Total       - 410 410
```

The `manager` column is character, so its totals cell is filled with `"-"`. Set `fill = ""` for a blank cell, or `fill = NA_character_` to keep `NA`.

### 6. Chain with tabyl and other adorn_* helpers

```r title="Tabyl pipe with totals and percentages"
mtcars |>
  tabyl(cyl, gear) |>
  adorn_totals(where = c("row", "col")) |>
  adorn_percentages("row")
#>  cyl          3         4         5     Total
#>    4 0.09090909 0.7272727 0.1818182 1.0000000
#>    6 0.28571429 0.5714286 0.1428571 1.0000000
#>    8 0.85714286 0.0000000 0.1428571 1.0000000
#> Total 0.46875000 0.3750000 0.1562500 1.0000000
```

Order matters in this chain. Compute totals BEFORE percentages so each row (including the totals row) divides by its own total and sums to 1.0. Reversing the order produces percentages that no longer sum cleanly.

## Compare with alternatives

**The base R way is `rbind(df, c("Total", colSums(df[-1])))`, and it is clumsier than it looks.** The cast back to character mangles numeric columns, you lose the data frame class on a one-column input, and you have to write the label by hand. Three R 4.5 alternatives are worth knowing.

| Approach | Best for | Watch out for |
|---|---|---|
| `janitor::adorn_totals()` | Tabyl output, mixed-type frames, pipe chains | Treats first column as identifier; reorder if needed |
| `base::colSums()` / `rowSums()` | Quick vector of sums | Returns a vector, not a row; errors on non-numeric |
| `dplyr::bind_rows(df, summarise(df, across(where(is.numeric), sum)))` | When you already use dplyr | Verbose; misses the identifier label |
| `gt::summary_rows()` | Polished HTML/PDF tables | gt-only; not a data frame in, data frame out |

[WARNING]
**Do NOT call `adorn_totals()` twice on the same axis.** A second call adds another "Total" row and the new totals include the previous totals row in the sum, double-counting your data. If you need to re-render totals after editing the frame, drop the prior totals row with `filter(region != "Total")` first.

## Common pitfalls

**Pitfall 1: NA propagation surprises you.** With the default `na.rm = TRUE`, a column that contains an `NA` still produces a clean sum of the non-missing values. If you want `NA` in, `NA` out (i.e., flag any column with missing data), set `na.rm = FALSE`.

```r title="NA handling controlled by na.rm"
gaps <- data.frame(
  region = c("North", "South", "East"),
  q1     = c(120, NA, 150),
  q2     = c(140, 110, 160)
)

gaps |>
  adorn_totals()
#>   region  q1  q2
#>    North 120 140
#>    South  NA 110
#>     East 150 160
#>    Total 270 410

gaps |>
  adorn_totals(na.rm = FALSE)
#>   region  q1  q2
#>    North 120 140
#>    South  NA 110
#>     East 150 160
#>    Total  NA 410
```

**Pitfall 2: the first column is treated as the identifier even when it is numeric.** If your data frame leads with a numeric ID column (e.g., `year`), `adorn_totals()` will skip it. Move identifiers up front explicitly, or pass the columns to total via the `...` argument so the function knows what to sum.

**Pitfall 3: `adorn_totals()` does not respect dplyr groupings.** Group-wise subtotals are not built in. To get totals per group, split the frame with `group_split()`, apply `adorn_totals()` to each piece, and `bind_rows()` the results, or switch to `gt::summary_rows()` for grouped report tables.

## Try it yourself

**Try it:** Take `mtcars`, build a `tabyl(cyl, gear)` cross-tab, and add BOTH row and column totals with the label "All cars" instead of "Total". Save to `ex_totals`.

```r title="Your turn: tabyl with custom totals label"
# Try it: tabyl plus adorn_totals with a custom name
ex_totals <- # your code here

ex_totals
#> Expected: 4 rows, 5 columns; last row labelled "All cars"
```

<details>
<summary>Click to reveal solution</summary>

```r title="Solution"
ex_totals <- mtcars |>
  tabyl(cyl, gear) |>
  adorn_totals(where = c("row", "col"), name = "All cars")

ex_totals
#>      cyl  3 4 5 All cars
#>        4  1 8 2       11
#>        6  2 4 1        7
#>        8 12 0 2       14
#> All cars 15 12 5       32
```

**Explanation:** `where = c("row", "col")` adds totals on both axes in one call. The `name` argument relabels both the totals row identifier and the totals column header, keeping the table self-explanatory in a report.

</details>

## Related janitor functions

**`adorn_totals()` is one of seven `adorn_*` helpers that polish tabyl output.** They are designed to stack inside a pipe; each one returns the same class so the next call works.

- `adorn_percentages()`: divide counts by row, column, or grand total
- `adorn_pct_formatting()`: turn proportions into "47.2%" strings
- `adorn_rounding()`: round numeric columns for display
- `adorn_ns()`: paste raw counts onto percentage cells
- `adorn_title()`: attach a banner row above a tabyl
- `tabyl()`: the upstream frequency builder; almost always feeds this function
- `clean_names()`: standardize column names before any of the above

See the [janitor reference on tidyverse.org](https://sfirke.github.io/janitor/reference/adorn_totals.html) for the full argument list and edge-case behaviour.

## FAQ

**How do I add a totals row without losing the data frame class?**

Pipe through `adorn_totals()` directly; it preserves the input class. The pitfall is reaching for `rbind(df, colSums(df))`, which silently coerces everything to character when the first column is non-numeric. `adorn_totals()` keeps the column types intact, fills non-numeric cells with whatever you set in the `fill` argument, and returns a data frame (or tabyl) you can keep chaining on.

**Why does `adorn_totals()` skip my first numeric column?**

The first column is treated as the row identifier and is never summed. That assumption is what lets the function place the "Total" label correctly. If your first column is genuinely numeric (a year, an ID), either reorder so the identifier is first, or pass an explicit column selection through the `...` argument to control which columns get totalled.

**Can I get totals per group instead of one grand total?**

Not in a single call. `adorn_totals()` operates on a whole frame, not on dplyr groupings. The idiom is `group_split(df, grp) |> map(adorn_totals) |> bind_rows()` for compact subtotal blocks, or move to `gt::summary_rows()` for nested totals in a presentation table. For analytic work, prefer `summarize(df, total = sum(x), .by = grp)`.

**Does adorn_totals() work on tibbles and data.tables?**

Yes for tibbles (the result stays a tibble). For data.tables, the function will work but returns a data frame; copy back with `as.data.table()` if you need to continue with data.table syntax. Most janitor users pipe through tibbles or base data frames, where the class preservation is automatic.

**How do I format the totals row with commas or currency?**

Apply `adorn_rounding()` and `adorn_pct_formatting()` AFTER `adorn_totals()`, in that order. For currency, switch to `scales::dollar()` or `format(big.mark = ",")` applied with `mutate(across(where(is.numeric), ...))`. Janitor stops at counts and proportions; presentation formatting beyond rounding is delegated to scales or gt.

---
title: "janitor adorn_percentages() in R: Counts to Proportions"
slug: "janitor-adorn_percentages-in-R"
description: "Use janitor adorn_percentages() to convert counts to row, column, or grand-total proportions in tabyls. Covers denominator, NA, and the percent chain."
keywords: "janitor adorn_percentages, adorn_percentages function R, janitor adorn_percentages examples, R adorn_percentages tabyl, tabyl percentages R, adorn_percentages denominator, janitor percentage formatting"
mathjax: false
webr: true
date: "2026-05-22"
post_type: "PSEO"
category_id: "function-deep"
subcategory_id: "janitor-functions"
fr_parent: "janitor-Package-in-R.html"
auto_link_terms: "adorn_percentages()|janitor adorn_percentages|janitor::adorn_percentages()|adorn percentages|tabyl percentages"
auto_link_case_sensitive: true
target_keyword: "janitor adorn_percentages"
sibling_block_enabled: true
difficulty: "Beginner"
---

# janitor adorn_percentages() in R: Counts to Proportions

<p class="lead">The <code>janitor adorn_percentages()</code> function divides every numeric cell by a chosen denominator (row, column, or grand total) and returns proportions between 0 and 1. It is the second step of the janitor reporting chain: <code>tabyl()</code> builds counts, <code>adorn_percentages()</code> converts them to shares, and <code>adorn_pct_formatting()</code> turns those shares into "%" strings.</p>

[QUICK ANSWER]
adorn_percentages(df)                              # default: row proportions
adorn_percentages(df, denominator = "col")         # column proportions
adorn_percentages(df, denominator = "all")         # grand total share
adorn_percentages(df, na.rm = FALSE)               # propagate NA in totals
adorn_percentages(df, ..., q1:q4)                  # restrict to columns q1-q4
tabyl(mtcars, cyl, gear) |> adorn_percentages()    # tabyl pipe chain
tabyl(x) |> adorn_percentages() |> adorn_pct_formatting()  # show as "%"

[DECISION TREE: Is adorn_percentages() the right tool?]
- convert tabyl counts to row or column shares: adorn_percentages(df, denominator = "row")
- format the shares as "47.2%" strings: adorn_pct_formatting(df, digits = 1)
- show counts AND percentages together: adorn_ns(df, position = "front")
- raw proportions from a vector: prop.table(table(x))
- group share within a data frame: dplyr::mutate(share = n / sum(n), .by = grp)
- append totals row first then percent: adorn_totals(df) then adorn_percentages(df)
- percentage with confidence intervals: prop.test(x, n)

## What adorn_percentages() does in one sentence

**`adorn_percentages()` divides every numeric column by a row sum, column sum, or grand total and replaces each count with its proportion.** Output is a data frame (or tabyl) of decimals between 0 and 1, not formatted percentages. Pipe through `adorn_pct_formatting()` to get the "%" strings shown in reports.

The input class is preserved. A tabyl in, a tabyl out. That matters because downstream `adorn_*` helpers only behave correctly when the upstream object is still a tabyl.

## Syntax

**`adorn_percentages()` takes a data frame plus three optional arguments that control the denominator, NA handling, and which columns are converted.** The first column is treated as the row identifier and is skipped, mirroring the rest of the janitor adorn family.

```r title="Load janitor and a sample cross tab"
library(janitor)
library(dplyr)

counts <- mtcars |>
  tabyl(cyl, gear)

counts
#>  cyl  3 4 5
#>    4  1 8 2
#>    6  2 4 1
#>    8 12 0 2
```

The full signature:

```
adorn_percentages(dat, denominator = "row", na.rm = TRUE, ..., na_rm = NULL)
```

Only `dat` is required. `denominator` accepts `"row"` (each cell divided by its row total), `"col"` (each cell divided by its column total), or `"all"` (each cell divided by the grand total). `na.rm` controls whether `NA` values are skipped when computing the divisor. The `...` argument lets you point at specific columns when you do not want every numeric column percentaged.

## Five common patterns

**These five patterns stack from "simplest default" to "full reporting chain".** Each block reuses the `counts` tabyl from the syntax section, so you can run them in order.

### 1. Row proportions (the default)

**Row proportions answer "within each row, what share of the total is in each column?"** This is the most common request for a tabyl: among 4-cylinder cars, how are gears distributed.

```r title="Row proportions"
counts |>
  adorn_percentages()
#>  cyl          3         4         5
#>    4 0.09090909 0.7272727 0.1818182
#>    6 0.28571429 0.5714286 0.1428571
#>    8 0.85714286 0.0000000 0.1428571
```

Each row now sums to 1. The 4-cylinder row shows 9 percent of those cars have 3 gears, 73 percent have 4, and 18 percent have 5.

### 2. Column proportions

**Column proportions answer "within each column, what share is in each row?"** Use `denominator = "col"` to flip the question.

```r title="Column proportions"
counts |>
  adorn_percentages(denominator = "col")
#>  cyl          3         4   5
#>    4 0.06666667 0.6666667 0.4
#>    6 0.13333333 0.3333333 0.2
#>    8 0.80000000 0.0000000 0.4
```

Each column now sums to 1. Among 3-gear cars, 80 percent are 8-cylinder.

### 3. Grand total share

**The `"all"` denominator divides every cell by the sum of the whole numeric region.** That is the answer to "what share of ALL cars is in each cell" and is useful when you want a heatmap-friendly view of the cross-tab.

```r title="Grand total share"
counts |>
  adorn_percentages(denominator = "all")
#>  cyl       3      4       5
#>    4 0.03125 0.2500 0.06250
#>    6 0.06250 0.1250 0.03125
#>    8 0.37500 0.0000 0.06250
```

All nine cells now sum to 1. The largest single bucket (8-cylinder, 3-gear) holds 37.5 percent of the data.

[TIP]
**Pick the denominator by audience.** Row percentages compare distributions across the row variable; column percentages compare across the column variable; "all" percentages give the cell its global weight. Decide before you call, not after, since switching denominators changes which numbers are highlighted.

### 4. Restrict to specific columns

**The `...` argument accepts a column selection so non-share columns survive untouched.** This is the right tool when your frame has a count column plus a unit column or a derived metric you do not want flattened.

```r title="Percentage only selected columns"
sales <- data.frame(
  region = c("North", "South", "East"),
  q1     = c(120, 90, 150),
  q2     = c(140, 110, 160),
  note   = c("on plan", "behind", "ahead")
)

sales |>
  adorn_percentages(denominator = "col", , q1, q2)
#>   region        q1        q2    note
#>    North 0.3333333 0.3414634 on plan
#>    South 0.2500000 0.2682927  behind
#>     East 0.4166667 0.3902439   ahead
```

Only `q1` and `q2` were converted. The `note` column stayed as text and the `region` identifier was skipped.

### 5. The full reporting chain

**`adorn_percentages()` is almost never the last call.** The output (raw decimals) is unfit for a report; chain into `adorn_pct_formatting()` to get display strings, and optionally `adorn_ns()` to paste raw counts alongside.

```r title="Report-ready percentage table"
counts |>
  adorn_percentages(denominator = "row") |>
  adorn_pct_formatting(digits = 1) |>
  adorn_ns(position = "front")
#>  cyl          3         4         5
#>    4   9.1%  (1) 72.7% (8) 18.2% (2)
#>    6  28.6%  (2) 57.1% (4) 14.3% (1)
#>    8  85.7% (12)  0.0% (0) 14.3% (2)
```

`adorn_pct_formatting()` multiplies by 100, rounds, and pastes a "%". `adorn_ns()` wraps the count from the upstream tabyl in parentheses. Together they replace the manual `sprintf("%.1f%% (%d)", ...)` you would otherwise paste cell by cell.

## Compare with alternatives

**Base R offers `prop.table()`, which is more general but also more manual.** `prop.table()` takes a matrix or table and a margin (1 for rows, 2 for columns), returns a numeric matrix, and gives up class preservation. The dplyr way is `mutate(share = n / sum(n))`, which is great for long-format data but verbose for cross-tabs.

| Approach | Best for | Watch out for |
|---|---|---|
| `janitor::adorn_percentages()` | Tabyl chains, mixed-type frames | Output is decimals; format next |
| `base::prop.table()` | A `table` object | Returns matrix, loses tabyl class |
| `dplyr::mutate(share = n / sum(n), .by = grp)` | Long-format data with groups | Verbose for wide cross-tabs |
| `scales::label_percent()` | Formatting a numeric vector | Formatter only; you still need the math |

[WARNING]
**Do NOT pipe `adorn_percentages()` through `adorn_totals()` blindly.** Order matters: `adorn_totals()` first then `adorn_percentages()` divides totals by themselves and gives every "Total" cell a value of 1. The canonical order is `tabyl() |> adorn_totals() |> adorn_percentages() |> adorn_pct_formatting()`; the totals row is computed on counts, then percentaged so the totals row reads 100.0% across.

## Common pitfalls

**Pitfall 1: confusing proportions with percentages.** `adorn_percentages()` returns proportions on a 0 to 1 scale. The math is just division; the function name refers to the intended next step. Pipe through `adorn_pct_formatting()` to multiply by 100 and add the symbol.

**Pitfall 2: calling it twice flips the meaning.** A second `adorn_percentages()` on already-proportional data divides proportions by their row sums (which are 1), so nothing changes visibly but later `adorn_pct_formatting()` calls can add a second "%" or break silently. Recompute counts from the source tabyl rather than reusing the result.

[KEY INSIGHT]
**adorn_percentages() is math, adorn_pct_formatting() is presentation.** Keep them separate in your head: the first changes values, the second changes display. Mixing them up causes the two pitfalls above and is the most common bug in tabyl reports.

**Pitfall 3: NA cells silently inflate the share of present rows.** With the default `na.rm = TRUE`, an NA in a column reduces that column's denominator. Set `na.rm = FALSE` to propagate NA into the denominator and flag any column with missing data.

## Try it yourself

**Try it:** Take `mtcars`, build a `tabyl(am, cyl)` cross-tab, convert to ROW percentages, and format to 1 decimal place with the "%" symbol. Save the result to `ex_pct`.

```r title="Your turn: row percentages from tabyl"
# Try it: tabyl plus adorn_percentages plus adorn_pct_formatting
ex_pct <- # your code here

ex_pct
#> Expected: 2 rows, "0" and "1", with formatted percentages summing to 100% across each row
```

<details>
<summary>Click to reveal solution</summary>

```r title="Solution"
ex_pct <- mtcars |>
  tabyl(am, cyl) |>
  adorn_percentages(denominator = "row") |>
  adorn_pct_formatting(digits = 1)

ex_pct
#>  am     4     6     8
#>   0  15.8% 21.1% 63.2%
#>   1  61.5% 23.1% 15.4%
```

**Explanation:** `denominator = "row"` divides each cell by the row total so the row sums to 1. `adorn_pct_formatting(digits = 1)` multiplies by 100, rounds to one decimal, and pastes the "%" symbol so the table is presentation-ready.

</details>

## Related janitor functions

**`adorn_percentages()` is part of a seven-function family that polishes tabyl output.** Each returns the same class so the next call works.

- `tabyl()`: the upstream frequency builder
- `adorn_totals()`: append totals row/column before percentaging
- `adorn_pct_formatting()`: turn proportions into "47.2%" strings
- `adorn_ns()`: paste raw counts onto percentage cells
- `adorn_rounding()`: round numeric columns when not using percent
- `adorn_title()`: attach a banner row above a tabyl
- `clean_names()`: standardize column names before any of the above

See the [janitor reference on tidyverse.org](https://sfirke.github.io/janitor/reference/adorn_percentages.html) for the full argument list.

## FAQ

**How is adorn_percentages() different from prop.table()?**

`prop.table()` works on a base R `table` or `matrix`, takes a margin index (1 for rows, 2 for columns), and returns a numeric matrix that loses any tabyl class. `adorn_percentages()` works inside the janitor pipeline, takes a named string denominator, preserves the data frame or tabyl class, skips the identifier column, and chains into the rest of the `adorn_*` helpers. Use `prop.table()` for one-off math; use `adorn_percentages()` for report tables.

**Which denominator should I pick: "row", "col", or "all"?**

Pick the denominator that matches the question you are answering. "Row" answers "within each value of the row variable, how are columns distributed", the default when the row variable is your treatment or group. "Col" flips it. "All" gives global cell weights and suits heatmap views or when you want each cell to sum to 100 percent of the table.

**Can I use adorn_percentages() without tabyl()?**

Yes. The function accepts any data frame whose first column is the identifier and whose remaining columns are numeric. Build the frame with `dplyr::count()`, `data.frame()`, or read from CSV, then pipe through `adorn_percentages()`. The tabyl class is convenient but not required.

**Why are my numbers between 0 and 1 instead of percentages?**

By design. `adorn_percentages()` does the math; `adorn_pct_formatting()` does the display. Pipe the result through `adorn_pct_formatting()` to multiply by 100 and add the "%" symbol. Splitting math from presentation lets you keep numeric proportions for further calculations.

**Does adorn_percentages() work with adorn_totals() in the same chain?**

Yes, with `adorn_totals()` first and `adorn_percentages()` second. That order computes totals on raw counts, then percentages each cell by its row, column, or grand total denominator. Reversing percentages first and then sums proportions, giving a totals row of 1.0 in every cell.

---
title: "janitor adorn_title() in R: Add Title Rows to Tabyls"
slug: "janitor-adorn_title-in-R"
description: "Use janitor adorn_title() to add a banner row above a tabyl that labels what the rows and columns represent. Covers placement, row_name, col_name, chain order."
keywords: "janitor adorn_title, adorn_title function R, janitor adorn_title examples, R tabyl title rows, adorn_title placement R, janitor cross tab title, R contingency table banner"
mathjax: false
webr: true
date: "2026-05-22"
post_type: "PSEO"
category_id: "function-deep"
subcategory_id: "janitor-functions"
fr_parent: "janitor-Package-in-R.html"
auto_link_terms: "adorn_title()|janitor adorn_title|janitor::adorn_title()|tabyl banner row|tabyl title row"
auto_link_case_sensitive: true
target_keyword: "janitor adorn_title"
sibling_block_enabled: true
difficulty: "Beginner"
---

# janitor adorn_title() in R: Add Title Rows to Tabyls

<p class="lead">The <code>janitor adorn_title()</code> function adds a banner row above a tabyl that labels what the rows and columns represent, turning a bare 3x3 cross-tab into a self-documenting report block. It is a pure presentation step, always placed last in the janitor adorn chain.</p>

[QUICK ANSWER]
adorn_title(tab)                                        # default: top banner
adorn_title(tab, placement = "top")                     # same as default
adorn_title(tab, placement = "combined")                # collapse labels into corner cell
adorn_title(tab, row_name = "Cylinders")                # custom row banner label
adorn_title(tab, col_name = "Gears")                    # custom column banner label
adorn_title(df, row_name = "x", col_name = "y")         # required on non-tabyl inputs
tabyl(mtcars, cyl, gear) |> adorn_totals() |> adorn_title()   # canonical chain

[DECISION TREE: Is adorn_title() the right tool?]
- label a tabyl's row and column variables: adorn_title(tab, "top")
- pack labels into the corner cell only: adorn_title(tab, "combined")
- append totals to the body of the table: adorn_totals(df, where = "row")
- convert counts to percentages: adorn_percentages(df, denominator = "row")
- attach raw counts onto percentage cells: adorn_ns(df, position = "rear")
- ship the table to HTML or PDF with caption: knitr::kable(tab, caption = "...")
- name the variables in the data itself: dplyr::rename(df, Cylinders = cyl)

## What adorn_title() does in one sentence

**`adorn_title()` injects a banner row above a tabyl that names the column variable, and shifts the row variable label into the top-left corner.** It does not change any cell values; it relabels the table for human readers so the cross-tab can stand on its own in a report.

The function exists because a bare tabyl prints with a single header row showing only the column levels. A reader who lands on the table without the surrounding code cannot tell whether the columns are gears, years, or grades. `adorn_title()` fixes that with a single pipe call.

## Syntax

**`adorn_title()` takes a tabyl (or data frame) plus three optional arguments that control the layout and the two banner labels.** When the input is a tabyl, the labels default to the original variable names captured by `tabyl()`. When the input is a plain data frame, you must supply both labels by hand.

```r title="Build a tabyl and adorn its title"
library(janitor)
library(dplyr)

tab <- mtcars |>
  tabyl(cyl, gear)

tab
#>  cyl  3 4 5
#>    4  1 8 2
#>    6  2 4 1
#>    8 12 0 2

tab |>
  adorn_title()
#>            gear
#>  cyl        3 4 5
#>    4        1 8 2
#>    6        2 4 1
#>    8       12 0 2
```

The full signature:

```
adorn_title(dat, placement = "top", row_name = NULL, col_name = NULL)
```

Only `dat` is required when the input is a tabyl. `placement` accepts `"top"` (default) or `"combined"`. `row_name` and `col_name` override the auto-detected variable names; they are required for non-tabyl inputs.

[TIP]
**Pipe `adorn_title()` LAST, after `adorn_totals()`, `adorn_percentages()`, and `adorn_pct_formatting()`.** The title row is non-numeric and trips up downstream `adorn_*` helpers, all of which expect numeric body cells. Adding the banner at the end keeps the calculation chain clean and the presentation step isolated.

## Five common patterns

### 1. Default top banner (auto-labelled from the tabyl)

```r title="Top banner using tabyl variable names"
mtcars |>
  tabyl(cyl, gear) |>
  adorn_title(placement = "top")
#>            gear
#>  cyl        3 4 5
#>    4        1 8 2
#>    6        2 4 1
#>    8       12 0 2
```

The default `placement = "top"` adds a row above the column headers naming the column variable ("gear"), and pushes the row variable label ("cyl") into the first body column. Both labels come from the original `tabyl()` call.

### 2. Combined placement (one corner cell, no extra row)

```r title="Combined banner collapses labels into the corner"
mtcars |>
  tabyl(cyl, gear) |>
  adorn_title(placement = "combined")
#>  cyl/gear  3 4 5
#>         4  1 8 2
#>         6  2 4 1
#>         8 12 0 2
```

With `placement = "combined"`, the row and column labels merge into a single top-left cell as `"row_name/col_name"`. The body shape stays exactly as the tabyl was. Reach for combined when vertical space is tight or when the table is bound for an HTML export that does not render extra header rows well.

### 3. Custom labels for nicer wording

```r title="Override the auto-detected labels"
mtcars |>
  tabyl(cyl, gear) |>
  adorn_title(row_name = "Cylinders", col_name = "Gears")
#>            Gears
#>  Cylinders   3 4 5
#>          4   1 8 2
#>          6   2 4 1
#>          8  12 0 2
```

Variable names from a working data frame are often terse (`cyl`, `gear`). Report-ready labels usually want full words. `row_name` and `col_name` let you relabel for display without renaming the underlying columns of your data.

### 4. Title on a non-tabyl data frame

```r title="adorn_title requires both names for plain data frames"
survey <- data.frame(
  age_band = c("18-29", "30-49", "50+"),
  yes      = c(42, 58, 31),
  no       = c(18, 22, 19)
)

survey |>
  adorn_title(row_name = "Age band", col_name = "Response")
#>           Response
#>  Age band  yes no
#>     18-29   42 18
#>     30-49   58 22
#>       50+   31 19
```

For a regular data frame (built with `data.frame()` or `tibble()`), the function cannot infer the variable names because they were never recorded. Both `row_name` and `col_name` are required; omitting them raises an error.

### 5. Full presentation chain (totals, percent, format, title)

```r title="Canonical janitor reporting pipeline"
mtcars |>
  tabyl(cyl, gear) |>
  adorn_totals(where = c("row", "col")) |>
  adorn_percentages(denominator = "row") |>
  adorn_pct_formatting(digits = 1) |>
  adorn_ns() |>
  adorn_title()
#>             gear
#>  cyl        3            4           5            Total
#>      4       9.1% (1)    72.7% (8)   18.2% (2)   100.0% (11)
#>      6      28.6% (2)    57.1% (4)   14.3% (1)   100.0% (7)
#>      8      85.7% (12)    0.0% (0)   14.3% (2)   100.0% (14)
#>  Total     46.9% (15)   37.5% (12)  15.6% (5)   100.0% (32)
```

This is the order janitor expects: shape the body with totals and percentages first, format strings, then add the banner. Reversing any step on either side of `adorn_title()` either errors or produces "0% (NA)" in the totals row.

## Compare with alternatives

**The closest cousin to `adorn_title()` is `knitr::kable(caption = ...)`, but the two solve different problems.** A caption sits above the rendered HTML or PDF table; the banner lives inside the data structure itself. The right pick depends on whether the output is a printed R object or a typeset table.

| Approach | Best for | Watch out for |
|---|---|---|
| `janitor::adorn_title()` | Console output, copy/paste tables, RMarkdown body text | Result is no longer suitable for numeric `adorn_*` chains |
| `knitr::kable(caption = "...")` | Knitted reports (HTML/PDF) | Caption lives outside the data; lost if you copy the object |
| `gt::tab_spanner()` + `tab_header()` | Polished publication tables | gt-only; requires its own grammar |
| `dplyr::rename()` before `tabyl()` | When variable names ARE the labels you want | Mutates source columns, not just display |

[WARNING]
**Do NOT pipe `adorn_title()` into another `adorn_*` function.** The banner row contains text in the numeric columns, and helpers like `adorn_totals()` or `adorn_rounding()` either error or quietly skip the row. Always make `adorn_title()` the terminal step. If you must edit body cells after titling, drop the banner with `as.data.frame(tab)[-1, ]` first.

## Common pitfalls

**Pitfall 1: forgetting that `placement = "top"` adds an extra row.** Reports that hardcode row counts (e.g., `nrow(tab) == 3`) suddenly see 4 rows after `adorn_title()`. Treat the post-title object as display-only; do not loop over its rows or feed it into another transformation.

**Pitfall 2: non-tabyl inputs without explicit names error out.** `adorn_title()` on a plain `data.frame` raises `"argument 'row_name' is missing"` if you forget the labels. Either supply both labels or upgrade the frame to a tabyl with `as_tabyl()` first, which carries the variable names along.

**Pitfall 3: the combined placement looks odd when row or column names are long.** `"Age band/Response"` in the corner cell is fine; `"Quarterly revenue band/Customer segment tier"` overflows and squashes the body columns. Stick with `placement = "top"` for long labels, or shorten them via `row_name` and `col_name`.

## Try it yourself

**Try it:** Build a `tabyl(iris, Species)` cross-tab on a binned `Petal.Length` (use `cut()` with breaks `c(0, 2, 4, 7)`), add a totals row, then add a top banner with the labels "Species" and "Petal length". Save to `ex_titled`.

```r title="Your turn: tabyl with totals and titled banner"
# Try it: tabyl, totals, then adorn_title
ex_titled <- # your code here

ex_titled
#> Expected: top banner reads "Petal length"; left label reads "Species"
```

<details>
<summary>Click to reveal solution</summary>

```r title="Solution"
ex_titled <- iris |>
  dplyr::mutate(petal_band = cut(Petal.Length, breaks = c(0, 2, 4, 7))) |>
  tabyl(Species, petal_band) |>
  adorn_totals(where = "row") |>
  adorn_title(row_name = "Species", col_name = "Petal length")

ex_titled
#>             Petal length
#>  Species       (0,2] (2,4] (4,7] NA_
#>       setosa     50     0     0   0
#>   versicolor      0    11    39   0
#>    virginica      0     0    43   7
#>        Total     50    11    82   7
```

**Explanation:** The presentation chain is `tabyl() -> adorn_totals() -> adorn_title()`. Totals must come before the title because the banner row is non-numeric and would break `adorn_totals()` if added first. The two `_name` arguments override the auto-detected column names with the labels a reader will recognize.

</details>

## Related janitor functions

**`adorn_title()` is one of seven `adorn_*` helpers that polish tabyl output, and the only one focused on labelling rather than numeric transformation.** All seven are pipe-friendly; the ordering rule is "numeric helpers first, title last".

- `tabyl()`: the upstream frequency builder; almost always feeds this function
- `adorn_totals()`: append row, column, or grand totals
- `adorn_percentages()`: convert counts to row, column, or grand-total proportions
- `adorn_pct_formatting()`: render proportions as "47.2%" strings
- `adorn_ns()`: paste raw counts onto percentage cells
- `adorn_rounding()`: round numeric columns for display
- `clean_names()`: standardize column names before any of the above

See the [janitor reference on tidyverse.org](https://sfirke.github.io/janitor/reference/adorn_title.html) for the full argument list and edge-case behaviour.

## FAQ

**Why does adorn_title() error on a non-tabyl data frame?**

Because the function cannot guess what the columns represent. A `tabyl()` call captures the original variable names as object attributes; a plain `data.frame()` does not. When the attributes are missing, `adorn_title()` insists on explicit `row_name` and `col_name` so the banner is never wrong. Pass both arguments, or convert the frame with `as_tabyl()` if it already has the right shape.

**Should I use placement "top" or "combined"?**

Use `"top"` (the default) for console output and RMarkdown bodies where a reader sees the printed table directly. Switch to `"combined"` when you are about to render the table through `knitr::kable()` or `gt::gt()` and need the body shape preserved; the corner-cell label survives both pipelines without an extra header row. Combined output is also nicer for narrow Excel exports.

**Can I add a title to a regular cross-tabulation built with table()?**

Indirectly. `table()` returns a `table` object, not a data frame, so the janitor chain needs a conversion first: `as.data.frame.matrix(tab)` gets a wide data frame, then `adorn_title()` with explicit names finishes the job. For frequent cross-tabs, it is cleaner to start from `tabyl()` which is built for this pipeline and remembers the variable names automatically.

**Does adorn_title() change the underlying values of the table?**

No. The function only adds a row (or relabels the corner cell) for display. Numeric body cells are untouched. The catch is that the output's class is still a data frame, so anything that reads it expecting clean numeric rows will be off by one. Treat the post-title object as a display artifact and keep the un-titled version around if you need to do more math on it.

**How do I get a title and a caption together in a knitted report?**

Use both layers: `adorn_title()` to embed the row and column labels in the data, then pass the result to `knitr::kable(caption = "Cylinders by gear count, 1973 mtcars")` to add the figure caption above the rendered table. The banner explains what the axes are; the caption explains what the table is.

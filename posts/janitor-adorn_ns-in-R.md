---
title: "janitor adorn_ns() in R: Append Counts to Percentage Tables"
slug: "janitor-adorn_ns-in-R"
description: "Use janitor adorn_ns() to paste raw counts onto a percentage table, like 47.2% (102). Covers position, format_func, the ns argument, and column selection."
keywords: "janitor adorn_ns, adorn_ns function R, janitor adorn_ns examples, append counts to percentages R, tabyl counts and percentages, janitor crosstab counts, R show n with percent"
mathjax: false
webr: true
date: "2026-05-22"
post_type: "PSEO"
category_id: "function-deep"
subcategory_id: "janitor-functions"
fr_parent: "janitor-Package-in-R.html"
auto_link_terms: "adorn_ns()|janitor adorn_ns|janitor::adorn_ns()|append counts to percentages|show n with percent"
auto_link_case_sensitive: true
target_keyword: "janitor adorn_ns"
sibling_block_enabled: true
difficulty: "Beginner"
---

# janitor adorn_ns() in R: Append Counts to Percentage Tables

<p class="lead">The <code>janitor adorn_ns()</code> function pastes raw frequency counts in parentheses onto an already-formatted percentage table, turning cells like "47.2%" into "47.2% (102)". It is the final readability step in the janitor reporting chain and gives report readers both the share and the denominator in one glance.</p>

[QUICK ANSWER]
adorn_ns(df)                                          # default: counts after percent, "47% (12)"
adorn_ns(df, position = "front")                      # counts first, "12 (47%)"
adorn_ns(df, ns = my_counts)                          # supply counts when attribute is missing
adorn_ns(df, format_func = function(n) format(n, big.mark = ","))  # thousands separators
adorn_ns(df, , q1, q2)                                # append to selected columns only
tabyl(x) |> adorn_percentages() |> adorn_pct_formatting() |> adorn_ns()  # canonical chain

[DECISION TREE: Is adorn_ns() the right tool?]
- append counts to percentage cells: adorn_ns(df, position = "rear")
- compute the percentages themselves: adorn_percentages(df, denominator = "row")
- format proportions as percent strings: adorn_pct_formatting(df, digits = 1)
- show only counts without percentages: tabyl(x, y) without any adorn_percentages
- add row or column totals: adorn_totals(df, where = "row")
- attach a banner row above the table: adorn_title(df, "top", row_name = "cyl")
- format counts outside a tabyl: scales::label_comma()(x)

## What adorn_ns() does in one sentence

**`adorn_ns()` pastes a raw count, in parentheses, onto each cell of an already-formatted percentage table.** It does not compute anything new; it reaches for counts that `tabyl()` quietly stashed as the `"core"` attribute and concatenates them with the displayed percent strings.

The function expects the input cells to be character percent strings produced by `adorn_pct_formatting()`. Calling it directly on numeric proportions yields "0.472 (102)" rather than "47.2% (102)", which is rarely what reports want. Place `adorn_ns()` after `adorn_pct_formatting()`, never before.

## Syntax

**`adorn_ns()` takes the formatted table and four optional arguments that control placement, the source of counts, the number format, and which columns to touch.** The first column is treated as the row identifier and skipped, mirroring the rest of the janitor adorn family.

```r title="Build a tabyl, percentage it, format it"
library(janitor)
library(dplyr)

base <- mtcars |>
  tabyl(cyl, gear)

base
#>  cyl  3  4  5
#>    4  1  8  2
#>    6  2  4  1
#>    8 12  0  2

props <- base |>
  adorn_percentages(denominator = "row") |>
  adorn_pct_formatting(digits = 1)

props
#>  cyl     3     4     5
#>    4   9.1% 72.7% 18.2%
#>    6  28.6% 57.1% 14.3%
#>    8  85.7%  0.0% 14.3%
```

The full signature:

```
adorn_ns(dat, position = "rear", ns = attr(dat, "core"),
         format_func = function(x) format(x, big.mark = ","), ...)
```

Only `dat` is required. `position` is `"rear"` (the default, counts after the percent) or `"front"` (counts before). `ns` is the source of raw counts; by default it pulls from the `"core"` attribute that `tabyl()` attaches automatically. `format_func` formats each count integer to a string. The `...` argument restricts which columns receive counts.

## Five common patterns

**These five patterns cover almost every shape of count-plus-percent table you will produce.** Each block reuses the `props` table from the syntax section, so you can run them in order.

### 1. Default: counts in the rear

**Calling `adorn_ns()` with no arguments appends the raw count in parentheses after each percentage cell.** This is the most common reporting shape in surveys and clinical tables.

```r title="Default counts in the rear"
props |>
  adorn_ns()
#>  cyl          3         4          5
#>    4   9.1% (1) 72.7% (8)  18.2% (2)
#>    6  28.6% (2) 57.1% (4)  14.3% (1)
#>    8 85.7% (12)  0.0% (0)  14.3% (2)
```

Counts pull from `attr(props, "core")`, which `tabyl()` stashed at the start of the chain. The percent and count never disagree because they come from the same source frequency table.

### 2. Counts in the front via `position = "front"`

**Setting `position = "front"` swaps the order so counts lead and percentages follow in parentheses.** Use this when readers care more about the absolute denominator than the share, for example in subgroup tables where small N can mislead.

```r title="Counts then percentages"
props |>
  adorn_ns(position = "front")
#>  cyl          3         4         5
#>    4   1 (9.1%) 8 (72.7%) 2 (18.2%)
#>    6  2 (28.6%) 4 (57.1%) 1 (14.3%)
#>    8 12 (85.7%) 0 (0.0%) 2 (14.3%)
```

The argument is purely cosmetic. The underlying counts are identical to pattern 1; only the parenthesis placement changes.

[TIP]
**Pick position by stakeholder.** Executive audiences usually want the percentage first (the headline number); statisticians and clinicians often want N first to scan for low-power cells. When in doubt, stick with the rear default.

### 3. Format large counts with thousands separators

**Pass a custom `format_func` to control how counts are printed.** The default already inserts commas at every thousand, but you can override it to use any format string or apply rounding.

```r title="Build a synthetic large-N table"
sales <- data.frame(
  segment = c("SMB", "Mid", "Enterprise"),
  q1      = c(0.235, 0.412, 0.353)
)
sales_n <- data.frame(
  segment = c("SMB", "Mid", "Enterprise"),
  q1      = c(12500, 21900, 18750)
)

sales |>
  adorn_pct_formatting(digits = 1) |>
  adorn_ns(ns = sales_n,
           format_func = function(n) format(n, big.mark = ","))
#>     segment              q1
#>         SMB  23.5% (12,500)
#>         Mid  41.2% (21,900)
#>  Enterprise  35.3% (18,750)
```

For abbreviated counts in dashboards, set `format_func = function(n) paste0(round(n / 1000, 1), "k")` so 12,500 becomes "12.5k". The function receives the raw integer vector and must return a character vector of the same length.

### 4. Append counts to selected columns only

**The `...` argument accepts unquoted column names so non-percent columns stay untouched.** This keeps mixed tables (where some columns are shares and others are raw values) readable.

```r title="Restrict adorn_ns to chosen percent columns"
mixed_pct <- data.frame(
  region = c("North", "South", "East"),
  share  = c("12.3%", "45.6%", "42.1%"),
  rev    = c(125000, 480000, 395000)
)

mixed_n <- data.frame(
  region = c("North", "South", "East"),
  share  = c(120, 446, 411),
  rev    = c(NA, NA, NA)
)

mixed_pct |>
  adorn_ns(ns = mixed_n, , share)
#>   region        share     rev
#>    North  12.3% (120)  125000
#>    South  45.6% (446)  480000
#>     East  42.1% (411)  395000
```

Note the double comma before `share`: it skips the `position` argument by position so the column selector lands in `...`. The `rev` column passes through untouched because `ns_table` has `NA` for it and the selector excludes it.

### 5. Supply counts via the `ns` argument

**When the input lost its `"core"` attribute (for example after `as.data.frame()` or a `dplyr` step), pass `ns` explicitly.** This is the rescue path for chains that strip attributes silently.

```r title="Rebuild the chain when attributes are gone"
flat <- props
attributes(flat)$core <- NULL   # simulate attribute loss

flat |>
  adorn_ns(ns = base)
#>  cyl          3         4          5
#>    4   9.1% (1) 72.7% (8)  18.2% (2)
#>    6  28.6% (2) 57.1% (4)  14.3% (1)
#>    8 85.7% (12)  0.0% (0)  14.3% (2)
```

The `ns` argument accepts any data frame with the same shape as `dat` (same number of rows, same column names except the first identifier). Most often it is the raw `tabyl()` output saved earlier in the script.

## Compare with alternatives

**Base R requires manual `paste()`, and gt or kable offer prettier rendering at higher cost.** The right pick depends on whether the table lives inside a janitor chain or downstream in a reporting package.

| Approach | Best for | Watch out for |
|---|---|---|
| `janitor::adorn_ns()` | Tabyl chains, character-cell tables | Requires `adorn_pct_formatting()` first |
| `paste0(pct, " (", n, ")")` | Single-column quick fixes | Manual; no column-skipping |
| `gt::cols_merge()` | HTML reports with custom styling | Requires gt dependency and a gt object |
| `scales::label_comma()(n)` | Formatting counts before pasting | Returns vectors only, not data frames |

[WARNING]
**Do NOT call `adorn_ns()` before `adorn_pct_formatting()`.** Without formatted percent strings to paste onto, the function still runs but produces output like "0.472 (102)" instead of "47.2% (102)". Always run the chain in the order: `tabyl()`, `adorn_percentages()`, `adorn_pct_formatting()`, `adorn_ns()`.

## Common pitfalls

**Pitfall 1: losing the `"core"` attribute mid-chain.** Functions like `as.data.frame()`, `dplyr::mutate()`, or `dplyr::rename()` can silently drop the attribute that holds the original counts. When that happens, `adorn_ns()` fails with "ns is NULL" or pulls stale numbers. Save the raw `tabyl()` output to a variable up front so you can pass it via `ns =` when needed.

**Pitfall 2: applying `adorn_ns()` twice.** Each call pastes another set of parentheses, so a double call turns "47.2% (102)" into "47.2% (102) (102)". The function does not detect that counts are already present. Inspect the chain to ensure `adorn_ns()` appears exactly once.

[KEY INSIGHT]
**adorn_pct_formatting() turns numbers into strings; adorn_ns() concatenates more text onto those strings.** Both are string operations, not numeric. Once `adorn_ns()` runs, the table is purely for display and cannot be piped into any further `adorn_*` helper that expects numeric input.

**Pitfall 3: `position = "front"` with `adorn_totals()`.** When a totals row is appended before `adorn_ns()`, the totals cell becomes "100 (100.0%)" with `position = "front"`, which reads as "100 of 100 percent" and confuses readers. Run `adorn_totals()` last, after `adorn_ns()`, or stick with the `"rear"` default when totals are present.

## Try it yourself

**Try it:** Take `mtcars`, build a `tabyl(am, cyl)` cross-tab, convert to column percentages with two-decimal formatting, then append the raw counts in front with thousands separators. Save the result to `ex_ns`.

```r title="Your turn: counts in front of column percentages"
# Try it: tabyl plus adorn_percentages plus adorn_pct_formatting plus adorn_ns
ex_ns <- # your code here

ex_ns
#> Expected: 2 rows ("0" and "1") with cells like "3 (27.27%)" and "8 (72.73%)"
```

<details>
<summary>Click to reveal solution</summary>

```r title="Solution"
ex_ns <- mtcars |>
  tabyl(am, cyl) |>
  adorn_percentages(denominator = "col") |>
  adorn_pct_formatting(digits = 2) |>
  adorn_ns(position = "front",
           format_func = function(n) format(n, big.mark = ","))

ex_ns
#>  am          4          6           8
#>   0   3 (27.27%) 4 (57.14%) 12 (85.71%)
#>   1   8 (72.73%) 3 (42.86%)  2 (14.29%)
```

**Explanation:** `denominator = "col"` divides each cell by its column total so columns sum to 100 percent. The chain then formats the proportions to two decimals and pastes the raw counts in front via `position = "front"`.

</details>

## Related janitor functions

**`adorn_ns()` sits at the end of a seven-function family that polishes tabyl output.** Each call preserves the input class so the next call works.

- `tabyl()`: the upstream frequency builder; stashes raw counts in the `"core"` attribute
- `adorn_percentages()`: converts counts to proportions
- `adorn_pct_formatting()`: rounds proportions and pastes the "%" sign
- `adorn_totals()`: appends totals row or column; run after `adorn_ns()` to avoid the totals-cell pitfall
- `adorn_rounding()`: rounds non-percent numeric columns
- `adorn_title()`: attaches a banner row above the table
- `clean_names()`: standardizes column names before any of the above

See the [janitor reference on tidyverse.org](https://sfirke.github.io/janitor/reference/adorn_ns.html) for the full argument list.

## FAQ

**Where does adorn_ns() get the counts from?**

By default, `adorn_ns()` reads the `"core"` attribute that `tabyl()` attaches to its output. The attribute holds the raw frequency table that became the input to `adorn_percentages()`, so the displayed counts always match the proportions. If the attribute is missing because an intermediate step stripped it, pass the count table explicitly via the `ns` argument.

**Can I use adorn_ns() without a tabyl?**

Yes. Build a percent table by hand (or with `dplyr::summarise()`), apply `adorn_pct_formatting()`, and pass the matching counts via `ns =`. The function does not care whether the input is a tabyl object as long as the columns line up and the first column is treated as the row identifier.

**How do I format counts as thousands or abbreviate large numbers?**

Set `format_func` to a function that takes an integer vector and returns a character vector. For thousands separators, use `function(n) format(n, big.mark = ",")` (the default). For "12.5k" style abbreviations, use `function(n) paste0(round(n / 1000, 1), "k")`. The function applies to every count before pasting.

**Why does adorn_ns() add parentheses around the counts?**

The parentheses are hardcoded into the paste step to keep the format consistent across reports. There is no argument to remove them. If you need a different separator (slash, dash, brackets), use `paste()` directly on the percent and count columns after the chain, or post-process the output with `gsub("\\((.*)\\)", "[\\1]", cells)`.

**Does adorn_ns() work with adorn_totals()?**

Yes, but run `adorn_totals()` last to avoid awkward totals cells. The order `tabyl() |> adorn_totals() |> adorn_percentages() |> adorn_pct_formatting() |> adorn_ns()` works but produces a totals cell like "100.0% (32)". The order `... |> adorn_ns() |> adorn_totals()` gives a cleaner totals row that ignores the per-cell counts.

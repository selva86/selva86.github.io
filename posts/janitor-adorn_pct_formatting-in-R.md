---
title: "janitor adorn_pct_formatting() in R: Format Percent Cells"
slug: "janitor-adorn_pct_formatting-in-R"
description: "Use janitor adorn_pct_formatting() to turn tabyl proportions into rounded percent strings. Covers digits, rounding mode, affix_sign, and column selection."
keywords: "janitor adorn_pct_formatting, adorn_pct_formatting function R, janitor adorn_pct_formatting examples, R format percent columns tabyl, format tabyl percentages R, adorn percent formatting, janitor percent rounding"
mathjax: false
webr: true
date: "2026-05-22"
post_type: "PSEO"
category_id: "function-deep"
subcategory_id: "janitor-functions"
fr_parent: "janitor-Package-in-R.html"
auto_link_terms: "adorn_pct_formatting()|janitor adorn_pct_formatting|janitor::adorn_pct_formatting()|format tabyl percentages|tabyl percent formatting"
auto_link_case_sensitive: true
target_keyword: "janitor adorn_pct_formatting"
sibling_block_enabled: true
difficulty: "Beginner"
---

# janitor adorn_pct_formatting() in R: Format Percent Cells

<p class="lead">The <code>janitor adorn_pct_formatting()</code> function takes numeric proportions in a data frame (typically the output of <code>adorn_percentages()</code>), multiplies by 100, rounds to a chosen number of decimals, and pastes a "%" sign onto each cell. It is the presentation step of the janitor reporting chain and turns raw decimals like 0.4722 into the "47.2%" strings ready for a report.</p>

[QUICK ANSWER]
adorn_pct_formatting(df)                              # default: 1 decimal, "half to even"
adorn_pct_formatting(df, digits = 0)                  # whole-number percentages
adorn_pct_formatting(df, digits = 2)                  # two-decimal precision
adorn_pct_formatting(df, rounding = "half up")        # 0.5 rounds up, not to even
adorn_pct_formatting(df, affix_sign = FALSE)          # round but drop the "%"
adorn_pct_formatting(df, , q1, q2)                    # format only q1 and q2
tabyl(x) |> adorn_percentages() |> adorn_pct_formatting()  # canonical chain

[DECISION TREE: Is adorn_pct_formatting() the right tool?]
- format tabyl proportions as "47.2%" strings: adorn_pct_formatting(df, digits = 1)
- compute the proportions themselves: adorn_percentages(df, denominator = "row")
- format a numeric vector outside tabyl: scales::label_percent()(x)
- one-off sprintf formatting: sprintf("%.1f%%", x * 100)
- append raw counts to percentages: adorn_ns(df, position = "front")
- round non-percent numeric columns: adorn_rounding(df, digits = 2)
- format currency or units, not percent: scales::label_dollar()(x)

## What adorn_pct_formatting() does in one sentence

**`adorn_pct_formatting()` is a display-only step that converts numeric proportions to character strings such as "47.2%".** It does not change the underlying data semantics. It multiplies by 100, rounds, and pastes the symbol, returning the same class of object you fed in.

The conversion is lossy. Once cells become strings, you cannot pipe into another `adorn_*` helper that expects numerics. Place `adorn_pct_formatting()` at the end of the chain, never in the middle.

## Syntax

**`adorn_pct_formatting()` takes the data frame plus three optional arguments that control precision, rounding mode, and the percent sign.** The first column is treated as the row identifier and skipped, mirroring the rest of the janitor adorn family.

```r title="Load janitor and build a proportions table"
library(janitor)
library(dplyr)

props <- mtcars |>
  tabyl(cyl, gear) |>
  adorn_percentages(denominator = "row")

props
#>  cyl          3         4         5
#>    4 0.09090909 0.7272727 0.1818182
#>    6 0.28571429 0.5714286 0.1428571
#>    8 0.85714286 0.0000000 0.1428571
```

The full signature:

```
adorn_pct_formatting(dat, digits = 1, rounding = "half to even", affix_sign = TRUE, ...)
```

Only `dat` is required. `digits` controls how many decimals appear after the multiplication by 100. `rounding` is either `"half to even"` (the default, also known as banker's rounding) or `"half up"`. `affix_sign` toggles whether the "%" symbol is pasted onto each cell. The `...` argument lets you point at specific columns when only some should be formatted.

## Five common patterns

**These five patterns cover almost every formatting decision you will make.** Each block reuses the `props` proportions from the syntax section, so you can run them in order.

### 1. Default formatting

**The bare call rounds to one decimal place and appends "%".** This is the right default for most reports: one decimal is precise enough to differentiate small shares but not noisy enough to clutter a table.

```r title="Default 1-decimal formatting"
props |>
  adorn_pct_formatting()
#>  cyl     3     4     5
#>    4   9.1% 72.7% 18.2%
#>    6  28.6% 57.1% 14.3%
#>    8  85.7%  0.0% 14.3%
```

Each row sums to 100.0%. The cells are now character strings, not numbers, so you cannot do further math on them.

### 2. Precision via the digits argument

**Set `digits` to control how many decimals appear.** Zero gives whole-number percentages, ideal for executive summaries. Two gives extra precision for small effect sizes, useful in scientific tables.

```r title="Whole-number percentages"
props |>
  adorn_pct_formatting(digits = 0)
#>  cyl  3  4  5
#>    4  9% 73% 18%
#>    6 29% 57% 14%
#>    8 86%  0% 14%
```

```r title="Two-decimal precision"
props |>
  adorn_pct_formatting(digits = 2)
#>  cyl      3      4      5
#>    4   9.09% 72.73% 18.18%
#>    6  28.57% 57.14% 14.29%
#>    8  85.71%  0.00% 14.29%
```

Sums still equal 100% within rounding, but trailing zeros are preserved when `digits = 2` so columns line up.

[TIP]
**Pick digits by audience.** Use 0 for slide decks, 1 for standard reports, 2 only when the smallest meaningful share is below 5 percent. Extra decimals do not add information when sample sizes are small.

### 3. Switch rounding mode to "half up"

**The default `"half to even"` uses banker's rounding to reduce bias on large datasets, but it surprises readers who expect 0.5 to round up.** Pass `rounding = "half up"` for the conventional behavior.

```r title="Compare rounding modes on the same proportions"
edge <- data.frame(
  metric = c("A", "B", "C", "D"),
  share  = c(0.005, 0.015, 0.025, 0.035)
)

edge |>
  adorn_pct_formatting(digits = 0, rounding = "half to even")
#>  metric share
#>       A    0%
#>       B    2%
#>       C    2%
#>       D    4%

edge |>
  adorn_pct_formatting(digits = 0, rounding = "half up")
#>  metric share
#>       A    1%
#>       B    2%
#>       C    3%
#>       D    4%
```

The half-to-even result rounds 0.5%, 1.5%, 2.5%, and 3.5% to the nearest even integer (0, 2, 2, 4). Half-up always rounds 0.5 away from zero (1, 2, 3, 4).

### 4. Drop the percent sign

**Setting `affix_sign = FALSE` keeps the rounding behavior but returns numeric strings without "%".** Use this when the table caption or column header already says "Percent" and the symbol on every cell is redundant.

```r title="Round to one decimal, no symbol"
props |>
  adorn_pct_formatting(digits = 1, affix_sign = FALSE)
#>  cyl     3    4    5
#>    4   9.1 72.7 18.2
#>    6  28.6 57.1 14.3
#>    8  85.7  0.0 14.3
```

Output cells are still character strings (rounding preserves trailing zeros), not numerics. Convert with `as.numeric()` if you need to feed the values into another calculation.

### 5. Format specific columns only

**The `...` argument accepts a column selection so non-percent columns survive untouched.** Pair with `adorn_percentages(..., q1, q2)` when only some columns should be percentaged and formatted.

```r title="Format selected percent columns"
mixed <- data.frame(
  region  = c("North", "South", "East"),
  share   = c(0.123, 0.456, 0.421),
  revenue = c(125000, 480000, 395000)
)

mixed |>
  adorn_pct_formatting(digits = 1, , share)
#>  region share revenue
#>   North 12.3%  125000
#>   South 45.6%  480000
#>    East 42.1%  395000
```

Only `share` was formatted. The `revenue` column stayed numeric and the `region` identifier was skipped.

## Compare with alternatives

**Base R offers `sprintf()`, and the tidyverse offers `scales::label_percent()`.** Both are more flexible than `adorn_pct_formatting()` but force you to operate cell-by-cell or column-by-column.

| Approach | Best for | Watch out for |
|---|---|---|
| `janitor::adorn_pct_formatting()` | Tabyl chains, whole-frame formatting | Cells become character strings |
| `base::sprintf("%.1f%%", x * 100)` | One-off vector formatting | Manual `* 100`; no rounding mode option |
| `scales::label_percent()(x)` | ggplot axis labels, factor levels | Returns vectors only, not data frames |
| `formattable::percent(x, 1)` | HTML reports with bar fills | Heavier dependency, kable integration |

[WARNING]
**Do NOT call `adorn_pct_formatting()` on raw counts.** The function multiplies values by 100 unconditionally. A count of 47 becomes "4700.0%". Always pipe through `adorn_percentages()` first so values are in the 0 to 1 range that the formatter expects.

## Common pitfalls

**Pitfall 1: skipping `adorn_percentages()`.** `adorn_pct_formatting()` does not divide by anything; it assumes the input is already a proportion. Running it on raw counts produces absurd percentages like "1200.0%". The canonical chain is always `tabyl() |> adorn_percentages() |> adorn_pct_formatting()`.

**Pitfall 2: calling it twice.** A second `adorn_pct_formatting()` on already-formatted strings throws no error but pastes a second "%" onto each cell, producing "9.1%%". Inspect the chain to ensure the formatter appears exactly once.

[KEY INSIGHT]
**adorn_percentages() is math, adorn_pct_formatting() is presentation.** The first changes numeric values; the second changes display. Mixing the two causes the pitfalls above and is the most common bug in tabyl reports.

**Pitfall 3: banker's rounding surprises.** The default `rounding = "half to even"` rounds 0.5 to the nearest even integer, so 12.5% rounds to 12% and 13.5% rounds to 14%. Readers who expect 0.5 to always round up should switch to `rounding = "half up"` or document the choice in the table caption.

## Try it yourself

**Try it:** Take `mtcars`, build a `tabyl(am, cyl)` cross-tab, convert to column percentages, and format with two decimals using "half up" rounding. Save the result to `ex_fmt`.

```r title="Your turn: format column percentages"
# Try it: tabyl plus adorn_percentages plus adorn_pct_formatting
ex_fmt <- # your code here

ex_fmt
#> Expected: 2 rows, "0" and "1", with formatted percentages summing to 100.00% per column
```

<details>
<summary>Click to reveal solution</summary>

```r title="Solution"
ex_fmt <- mtcars |>
  tabyl(am, cyl) |>
  adorn_percentages(denominator = "col") |>
  adorn_pct_formatting(digits = 2, rounding = "half up")

ex_fmt
#>  am      4      6      8
#>   0  27.27% 57.14% 85.71%
#>   1  72.73% 42.86% 14.29%
```

**Explanation:** `denominator = "col"` divides each cell by the column total so columns sum to 1. `adorn_pct_formatting(digits = 2, rounding = "half up")` multiplies by 100, rounds to two decimals using conventional half-up rounding, and pastes the "%" symbol.

</details>

## Related janitor functions

**`adorn_pct_formatting()` is part of a seven-function family that polishes tabyl output.** Each call preserves the input class so the next call works.

- `tabyl()`: the upstream frequency builder
- `adorn_percentages()`: convert counts to proportions before formatting
- `adorn_totals()`: append totals row or column before percentaging
- `adorn_ns()`: paste raw counts onto percentage cells
- `adorn_rounding()`: round non-percent numeric columns
- `adorn_title()`: attach a banner row above a tabyl
- `clean_names()`: standardize column names before any of the above

See the [janitor reference on tidyverse.org](https://sfirke.github.io/janitor/reference/adorn_pct_formatting.html) for the full argument list.

## FAQ

**Why does adorn_pct_formatting() turn my numbers into strings?**

The function pastes a "%" symbol onto each cell, which forces the column to character class. R cannot mix numerics and a trailing symbol in one vector. This is intentional: the output is for display, not further math. If you need the values for downstream calculations, keep a copy of the `adorn_percentages()` output before formatting, or set `affix_sign = FALSE` and then `as.numeric()` the result.

**What is the difference between "half to even" and "half up" rounding?**

"Half to even" (banker's rounding) rounds 0.5 to the nearest even integer, so 0.5 becomes 0 and 1.5 becomes 2. "Half up" always rounds 0.5 away from zero, so 0.5 becomes 1 and 1.5 becomes 2. The default is "half to even" because it reduces cumulative bias on large datasets. Pick "half up" when readers expect conventional rounding behavior.

**Can I use adorn_pct_formatting() without a tabyl?**

Yes. The function accepts any data frame whose first column is the identifier and whose remaining columns are numeric proportions in the 0 to 1 range. Build the frame manually or with `dplyr::count()` and `mutate(share = n / sum(n))`, then pipe through `adorn_pct_formatting()`. The tabyl class is convenient but not required.

**How do I keep more than one decimal but drop trailing zeros?**

`adorn_pct_formatting()` always pads to the requested number of decimals to keep columns aligned. To drop trailing zeros, convert the formatted strings with `gsub("\\.0+%", "%", ex_fmt$col)` or write your own formatter with `formatC(x, digits = 2, format = "fg")`. Padded zeros are usually what reports want.

**Does adorn_pct_formatting() handle NA cells gracefully?**

Yes. NA values pass through as the literal "NA%" string after formatting, so the column position is preserved but the missing-ness is visible. If you want to suppress the "%" on NA cells, replace NAs with `0` before formatting or post-process with `gsub("NA%", "", x)`. The default behavior makes missing values impossible to miss in the rendered report.

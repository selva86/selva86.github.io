---
title: "janitor adorn_rounding() in R: Round Tabyl Cells Cleanly"
slug: "janitor-adorn_rounding-in-R"
description: "Use janitor adorn_rounding() to round numeric tabyl cells without changing class. Covers digits, rounding mode, column selection, and common pitfalls."
keywords: "janitor adorn_rounding, adorn_rounding function R, janitor adorn_rounding examples, round tabyl numbers R, adorn_rounding digits, R rounding tabyl, janitor round numeric"
mathjax: false
webr: true
date: "2026-05-22"
post_type: "PSEO"
category_id: "function-deep"
subcategory_id: "janitor-functions"
fr_parent: "janitor-Package-in-R.html"
auto_link_terms: "adorn_rounding()|janitor adorn_rounding|janitor::adorn_rounding()|round tabyl cells|round numeric tabyl"
auto_link_case_sensitive: true
target_keyword: "janitor adorn_rounding"
sibling_block_enabled: true
difficulty: "Beginner"
---

# janitor adorn_rounding() in R: Round Tabyl Cells Cleanly

<p class="lead">The <code>janitor adorn_rounding()</code> function rounds the numeric cells of a data frame to a chosen number of decimal places while keeping every column numeric. It is the cleanup step in the adorn chain when you want rounded values you can still pipe into <code>ggplot()</code>, joins, or further math, instead of the percent strings produced by <code>adorn_pct_formatting()</code>.</p>

[QUICK ANSWER]
adorn_rounding(df)                                # default: 1 decimal, "half to even"
adorn_rounding(df, digits = 0)                    # round to integers
adorn_rounding(df, digits = 3)                    # high precision
adorn_rounding(df, rounding = "half up")          # 0.5 rounds up, not to even
adorn_rounding(df, , q1, q2)                      # round only q1 and q2
tabyl(x) |> adorn_percentages() |> adorn_rounding(digits = 2)  # clean numeric chain
mtcars |> group_by(cyl) |> summarise(mpg = mean(mpg)) |> adorn_rounding()

[DECISION TREE: Is adorn_rounding() the right tool?]
- round tabyl cells but keep them numeric: adorn_rounding(df, digits = 2)
- round AND format as "47.2%" strings: adorn_pct_formatting(df, digits = 1)
- compute the proportions themselves: adorn_percentages(df, denominator = "row")
- round a plain numeric vector: round(x, digits = 2)
- append raw counts to percentages: adorn_ns(df, position = "front")
- format a column for ggplot axis: scales::label_number(accuracy = 0.1)
- signif() style rounding to N significant digits: signif(x, digits = 3)

## What adorn_rounding() does in one sentence

**`adorn_rounding()` rounds every numeric column of a data frame to a fixed number of decimal places and returns the same data frame class.** The first column is treated as an identifier and skipped, mirroring the rest of the janitor adorn family.

Unlike `adorn_pct_formatting()`, it does not multiply by 100, does not paste a "%" symbol, and never converts cells to character strings. Use it whenever you need rounded values for further computation, plotting, or joining, not just for display.

## Syntax

**`adorn_rounding()` takes the data frame plus three optional arguments that control precision, rounding mode, and which columns are rounded.** Only the data frame is required.

```r title="Load janitor and build a row percentage tabyl"
library(janitor)
library(dplyr)

props <- mtcars |>
  tabyl(gear, am) |>
  adorn_percentages(denominator = "row")

props
#>  gear         0         1
#>     3 1.0000000 0.0000000
#>     4 0.3333333 0.6666667
#>     5 0.0000000 1.0000000
```

The full signature:

```
adorn_rounding(dat, digits = 1, rounding = "half to even", ...)
```

`digits` sets how many decimal places survive (default 1). `rounding` is either `"half to even"` (banker's rounding, the default) or `"half up"`. The `...` slot accepts tidyselect expressions when only specific columns should be rounded. The first column is always skipped, so identifiers like `gear` stay untouched even when numeric.

## Five common patterns

**These five patterns cover every rounding decision you will face in a tabyl chain.** Each block reuses `props` from the syntax section, so you can run them in order.

### 1. Default rounding

**Calling `adorn_rounding(props)` rounds each numeric column to 1 decimal place.** This is rarely what you want for proportions (it collapses too much), but it is the right default for summary tables of integers and dollar amounts.

```r title="Default 1-decimal rounding"
props |>
  adorn_rounding()
#>  gear   0   1
#>     3 1.0 0.0
#>     4 0.3 0.7
#>     5 0.0 1.0
```

The cells are still numeric (class `numeric`), so you can pipe the result into `ggplot()` or `dplyr::mutate()` without converting back.

### 2. Increase digits for precision

**Set `digits` to 2 or 3 when the proportions span a wide range and 1 decimal loses meaningful detail.** Two decimals is the typical sweet spot for tabyl outputs.

```r title="Round proportions to two decimals"
props |>
  adorn_rounding(digits = 2)
#>  gear    0    1
#>     3 1.00 0.00
#>     4 0.33 0.67
#>     5 0.00 1.00
```

The same call with `digits = 3` keeps three decimals (`0.333`, `0.667`), which matches what most reports want when the audience cares about percentage points below 1.

[TIP]
**Pair `adorn_rounding(digits = 2)` with `adorn_percentages()` for clean numeric output.** This is the "I still want to do math on these values" alternative to `adorn_pct_formatting()`. The result is a data frame you can join, plot, or write to a CSV without parsing percent strings.

### 3. Switch rounding mode to "half up"

**The default `"half to even"` (banker's rounding) sends 0.5 to the nearest even integer to reduce cumulative bias, but it surprises readers who expect 0.5 to always round up.** Pass `rounding = "half up"` for the conventional behavior.

```r title="Compare rounding modes on midpoint values"
edge <- data.frame(
  metric = c("A", "B", "C", "D"),
  raw    = c(2.5, 3.5, 4.5, 5.5)
)

edge |>
  adorn_rounding(digits = 0, rounding = "half to even")
#>  metric raw
#>       A   2
#>       B   4
#>       C   4
#>       D   6

edge |>
  adorn_rounding(digits = 0, rounding = "half up")
#>  metric raw
#>       A   3
#>       B   4
#>       C   5
#>       D   6
```

Half-to-even sends 2.5 to 2, 3.5 to 4, 4.5 to 4, and 5.5 to 6 (each toward the nearer even integer). Half-up sends every `.5` away from zero. The choice matters most when a column has many midpoint values; for typical messy data the two modes agree almost everywhere.

### 4. Round selected columns only

**The `...` argument accepts a tidyselect expression so non-percent columns survive untouched.** This is the right call when a frame mixes proportions with raw counts or currency.

```r title="Round only the share column"
mixed <- data.frame(
  region  = c("North", "South", "East"),
  share   = c(0.1234, 0.4567, 0.4199),
  revenue = c(125000.789, 480000.123, 395000.456)
)

mixed |>
  adorn_rounding(digits = 2, , share)
#>  region share    revenue
#>   North  0.12 125000.789
#>   South  0.46 480000.123
#>    East  0.42 395000.456
```

Only `share` was rounded. The `revenue` column kept its full precision and the `region` identifier was skipped.

### 5. Round any summary data frame

**`adorn_rounding()` is not exclusive to tabyls.** Any data frame with an identifier column and numeric value columns will round cleanly.

```r title="Round a monthly summary table"
monthly <- airquality |>
  group_by(Month) |>
  summarise(
    Ozone = mean(Ozone, na.rm = TRUE),
    Wind  = mean(Wind),
    Temp  = mean(Temp),
    .groups = "drop"
  )

monthly |>
  adorn_rounding(digits = 1)
#>  Month Ozone Wind Temp
#>      5  23.6 11.6 65.5
#>      6  29.4 10.3 79.1
#>      7  59.1  8.9 83.9
#>      8  59.0  8.8 84.0
#>      9  31.4 10.2 76.9
```

`Month` stayed as an integer because it is the first column. The other three columns rounded to 1 decimal.

## Compare with alternatives

**Base R offers `round()`, the tidyverse offers `dplyr::mutate(across())`, and `signif()` rounds by significant digits.** `adorn_rounding()` wins on convenience inside janitor pipelines and loses on flexibility outside them.

| Approach | Best for | Watch out for |
|---|---|---|
| `janitor::adorn_rounding()` | Tabyl chains, identifier-first frames | Always skips column 1 |
| `base::round(x, digits)` | One-off vector or matrix rounding | No tidyverse pipe friendliness |
| `dplyr::mutate(across(where(is.numeric), round, 2))` | Column subsetting by predicate | Verbose for the common case |
| `base::signif(x, digits)` | Significant figures, not decimals | Different semantics than digits-after-decimal |

[KEY INSIGHT]
**`adorn_rounding()` is math that stays numeric, `adorn_pct_formatting()` is presentation that becomes character.** Pick the rounder when the values feed into another calculation, plot, or join. Pick the formatter when the next step is a rendered report or kable table.

## Common pitfalls

**Pitfall 1: rounded percentages do not sum to 100.** Three proportions of 0.3333 rounded to `digits = 1` give 0.3, 0.3, 0.3 totalling 0.9 (90 percent), not 1. Append `adorn_totals()` before `adorn_rounding()` to compute totals from unrounded values, or accept the visible mismatch and explain it in the table caption.

**Pitfall 2: `digits = 0` on proportions collapses everything.** A 0.4-versus-0.6 split becomes 0-versus-1, which is misleading. Use `digits = 0` only on count-scale data (counts, currency, integer summaries), not on 0-to-1 proportions.

**Pitfall 3: banker's rounding looks wrong on contrived examples.** Inputs like 0.5, 1.5, 2.5, 3.5 round to 0, 2, 2, 4, which feels off compared to the conventional 1, 2, 3, 4. On real, noisy data the difference disappears because exact midpoints almost never occur. Document the choice in the table caption if your audience expects half-up rounding.

## Try it yourself

**Try it:** Take `mtcars`, build a `tabyl(cyl, gear)` cross-tab, convert to row percentages, and round to 3 decimal places using "half up" mode. Save the result to `ex_rounded`.

```r title="Your turn: round tabyl proportions"
# Try it: tabyl plus adorn_percentages plus adorn_rounding
ex_rounded <- # your code here

ex_rounded
#> Expected: 3 rows for cyl 4, 6, 8 with proportions summing to 1 per row
```

<details>
<summary>Click to reveal solution</summary>

```r title="Solution"
ex_rounded <- mtcars |>
  tabyl(cyl, gear) |>
  adorn_percentages(denominator = "row") |>
  adorn_rounding(digits = 3, rounding = "half up")

ex_rounded
#>  cyl     3     4     5
#>    4 0.091 0.727 0.182
#>    6 0.286 0.571 0.143
#>    8 0.857 0.000 0.143
```

**Explanation:** `denominator = "row"` divides each cell by its row total so rows sum to 1. `adorn_rounding(digits = 3, rounding = "half up")` keeps three decimals using conventional half-up rounding. The cells remain numeric, so you can pipe the result into a join or a plot without parsing strings.

</details>

## Related janitor functions

**`adorn_rounding()` is one of seven adorn helpers that polish tabyl output.** Each call preserves the input class so the next call works.

- `tabyl()`: the upstream frequency builder
- `adorn_percentages()`: convert counts to proportions before rounding
- `adorn_pct_formatting()`: alternative when you want "47.2%" strings instead of numerics
- `adorn_totals()`: append totals row or column before rounding
- `adorn_ns()`: paste raw counts onto rounded percentage cells
- `adorn_title()`: attach a banner row above a tabyl
- `clean_names()`: standardize column names before any of the above

See the [janitor reference on tidyverse.org](https://sfirke.github.io/janitor/reference/adorn_rounding.html) for the full argument list.

## FAQ

**What is the difference between adorn_rounding() and adorn_pct_formatting()?**

`adorn_rounding()` keeps cells numeric and does not multiply by 100 or paste a "%" symbol. `adorn_pct_formatting()` rounds, multiplies by 100, appends "%", and returns character strings. Use the rounder when downstream code needs numbers (plots, joins, further math). Use the formatter when the next step is rendering a kable table or pasting into a report.

**Why do my rounded proportions not sum to 1?**

Rounding loses information. Three cells of 0.3333 rounded to 1 decimal give 0.3, 0.3, 0.3, which sum to 0.9, not 1. The mismatch is mathematical, not a janitor bug. Compute `adorn_totals()` first and round afterward if you want the totals row to read exactly 1.00, or accept the visible gap.

**Can I use adorn_rounding() without a tabyl?**

Yes. The function accepts any data frame whose first column is an identifier and whose remaining columns are numeric. Group summaries from `dplyr::summarise()`, descriptive statistics from `psych::describe()`, or any handmade frame works. The tabyl class is convenient but not required.

**What does "half to even" rounding mean?**

"Half to even" (banker's rounding) rounds exact midpoints like 0.5 to the nearest even integer. So 0.5 becomes 0, 1.5 becomes 2, 2.5 becomes 2, 3.5 becomes 4. The aim is to remove the upward bias that "half up" introduces across many roundings. The cumulative bias is usually negligible, but the difference is visible on small, contrived examples like a 4-row demo table.

**How is adorn_rounding() different from base R round()?**

`round()` operates on a single numeric vector or matrix. `adorn_rounding()` operates on a whole data frame, skips the first column, lets you pick rounding mode ("half to even" or "half up"), and chains cleanly with other `adorn_*` helpers. Inside a tabyl pipeline `adorn_rounding()` is the natural choice. Outside one, plain `round()` is shorter.

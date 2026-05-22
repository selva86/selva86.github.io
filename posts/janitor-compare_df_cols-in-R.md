---
title: "janitor compare_df_cols() in R: Compare Column Schemas"
slug: "janitor-compare_df_cols-in-R"
description: "Use janitor::compare_df_cols() to compare column names, types, and classes across two or more data frames in R. Examples, options, and common pitfalls."
keywords: "janitor compare_df_cols, compare_df_cols function R, janitor compare_df_cols examples, R compare data frame columns, compare data frame schemas R, janitor::compare_df_cols, check column types across data frames"
mathjax: false
webr: true
date: "2026-05-22"
post_type: "PSEO"
category_id: "function-deep"
subcategory_id: "janitor-functions"
fr_parent: "janitor-Package-in-R.html"
auto_link_terms: "compare_df_cols()|janitor compare_df_cols|janitor::compare_df_cols()|compare data frame columns|compare_df_cols_same()"
auto_link_case_sensitive: true
target_keyword: "janitor compare_df_cols"
sibling_block_enabled: true
difficulty: "Beginner"
---

# janitor compare_df_cols() in R: Compare Column Schemas

<p class="lead">The <code>compare_df_cols()</code> function in janitor lines up the column names, classes, and types of two or more data frames side by side, so you can see schema mismatches before a <code>bind_rows()</code> or <code>rbind()</code> blows up. It is the fastest way to diagnose why two tables that "look the same" will not stack.</p>

[QUICK ANSWER]
compare_df_cols(df1, df2)                                # side-by-side schema
compare_df_cols(df1, df2, return = "mismatch")           # only mismatched columns
compare_df_cols(df1, df2, return = "match")              # only matched columns
compare_df_cols(df1, df2, bind_method = "rbind")         # use rbind type rules
compare_df_cols(jan = df1, feb = df2)                    # custom column labels
compare_df_cols_same(df1, df2)                           # TRUE if safe to bind_rows
compare_df_cols(df1, df2, strict_description = TRUE)     # compare full type description

[DECISION TREE: Is compare_df_cols() the right tool?]
- diagnose why bind_rows fails on two frames: compare_df_cols(df1, df2, return = "mismatch")
- check if frames are bindable, return TRUE/FALSE: compare_df_cols_same(df1, df2)
- peek at one data frame's structure: dplyr::glimpse(df)
- list classes of every column: sapply(df, class)
- spot duplicate rows after binding: janitor::get_dupes(combined, key)
- clean column names before comparing: janitor::clean_names(df)
- compare full data, not just schema: dplyr::all_equal(df1, df2)

## What compare_df_cols() does in one sentence

**`compare_df_cols()` takes two or more data frames and returns a tibble with one row per unique column name and one extra column per input frame, showing the class of that column in each frame.** Columns that are absent in a given frame appear as `NA`, which makes structural gaps obvious at a glance.

Use it whenever you are about to stack frames row-wise (`dplyr::bind_rows()` or `rbind()`) and want to confirm the schemas match. The function is part of the janitor package, so it works on any data frame, tibble, or data.table.

## Syntax and arguments

**The function accepts any number of named or unnamed data frames followed by a few options that control what gets returned.** The full signature is:

```r title="Function signature"
compare_df_cols(
  ...,
  return = c("all", "match", "mismatch"),
  bind_method = c("bind_rows", "rbind"),
  strict_description = FALSE,
  strict_class = FALSE
)
```

| Argument | What it does |
|---|---|
| `...` | Two or more data frames. Pass them as named arguments (`jan = df1, feb = df2`) to label the result columns. |
| `return` | `"all"` shows every column (default). `"match"` keeps only columns whose classes agree across frames. `"mismatch"` keeps only the troublemakers. |
| `bind_method` | `"bind_rows"` (default) uses the dplyr type-coercion rules. `"rbind"` uses base R's stricter rules. |
| `strict_description` | If `TRUE`, compares the full type description (e.g., distinguishes `ordered` from `factor`). |
| `strict_class` | If `TRUE`, requires the full class vector to match, not just the first class. |

The output is always a tibble with `column_name` as the first column, followed by one column per input frame.

## Examples

### Example 1: side-by-side schema for two frames

**Pass two data frames and you get a tibble with one row per column.** Same-named columns line up; missing columns show `NA`.

```r title="Compare two monthly sales frames"
library(janitor)
library(dplyr)

jan_sales <- data.frame(
  order_id = 1:3,
  customer = c("a", "b", "c"),
  amount   = c(10.0, 22.5, 7.8),
  region   = c("N", "S", "N")
)

feb_sales <- data.frame(
  order_id = 1:3,
  customer = c("d", "e", "f"),
  amount   = c(15L, 18L, 9L),
  channel  = c("web", "store", "web")
)

compare_df_cols(jan_sales, feb_sales)
#>   column_name jan_sales feb_sales
#> 1      amount   numeric   integer
#> 2     channel      <NA> character
#> 3    customer character character
#> 4    order_id   integer   integer
#> 5      region character      <NA>
```

Two issues jump out: `amount` is `numeric` in January but `integer` in February (still bindable, but worth knowing), and each frame has a column the other lacks. `bind_rows()` would fill the gaps with `NA`, which may not be what you want.

[TIP]
**Name your inputs to label the result.** Pass frames as `compare_df_cols(jan = jan_sales, feb = feb_sales)` and the output columns will be labelled `jan` and `feb` instead of the variable names. Helpful when comparing more than two frames or when variable names are long.

### Example 2: return only the mismatches

**Setting `return = "mismatch"` filters the output to columns that differ across the inputs.** This is the most useful mode for diagnosing a failing bind.

```r title="Show only the problem columns"
compare_df_cols(jan_sales, feb_sales, return = "mismatch")
#>   column_name jan_sales feb_sales
#> 1      amount   numeric   integer
#> 2     channel      <NA> character
#> 3      region character      <NA>
```

`order_id` and `customer` agree across both frames, so they drop out. What remains is exactly what you need to investigate.

### Example 3: check if frames are safe to bind

**`compare_df_cols_same()` returns a single `TRUE` or `FALSE`.** It is the boolean wrapper around `compare_df_cols()` you reach for in tests or scripts.

```r title="Safe-to-bind boolean check"
compare_df_cols_same(jan_sales, feb_sales)
#> Columns not in a common position or with mismatched classes:
#>   column_name jan_sales feb_sales
#> 1      amount   numeric   integer
#> 2     channel      <NA> character
#> 3      region character      <NA>
#> [1] FALSE

# After harmonizing the schemas, the check passes
jan_fixed <- jan_sales |> select(order_id, customer, amount) |> mutate(amount = as.integer(amount))
feb_fixed <- feb_sales |> select(order_id, customer, amount)

compare_df_cols_same(jan_fixed, feb_fixed)
#> [1] TRUE
```

The function prints the mismatches on its way to returning `FALSE`, so you get both the boolean and the diagnostic in one call. Wrap it in `stopifnot()` to gate a pipeline.

[KEY INSIGHT]
**Think of `compare_df_cols()` as a `git diff` for data frame schemas.** It does not compare row values; it compares the shape. Use it before any vertical stack to catch the schema drift that bind operations silently coerce or noisily reject.

### Example 4: stricter class checks

**By default, only the first class of each column is compared.** That means a `Date` column counts as the same as a `POSIXct` column under loose checks. Tighten the comparison with `strict_class` or `strict_description`.

```r title="Strict class comparison catches subtle differences"
df_date <- data.frame(d = as.Date("2026-01-01"))
df_time <- data.frame(d = as.POSIXct("2026-01-01"))

compare_df_cols(df_date, df_time)
#>   column_name df_date  df_time
#> 1           d    Date POSIXct,POSIXt

compare_df_cols(df_date, df_time, return = "mismatch")
#>   column_name df_date  df_time
#> 1           d    Date POSIXct,POSIXt

# Without strict_class, the first class IS already different here, so it shows up.
# But factor vs ordered factor is hidden by default:
df_f <- data.frame(g = factor(c("a", "b")))
df_o <- data.frame(g = ordered(c("a", "b")))

compare_df_cols(df_f, df_o)
#>   column_name df_f df_o
#> 1           g   factor ordered,factor

compare_df_cols(df_f, df_o, strict_class = TRUE, return = "mismatch")
#>   column_name df_f          df_o
#> 1           g factor ordered,factor
```

Use `strict_class = TRUE` when ordered factors, dates with timezones, or S4 classes need to round-trip exactly. Use `strict_description = TRUE` to compare the output of `vctrs::vec_ptype_full()` rather than `class()`, which is even tighter.

## How compare_df_cols() compares with alternatives

**`compare_df_cols()` is purpose-built for the pre-bind schema check; the alternatives below do related but different jobs.**

| Tool | What it answers | When to use it |
|---|---|---|
| `compare_df_cols()` | "Which columns differ in name or class across frames?" | Before any `bind_rows()`, `rbind()`, or vertical stack |
| `dplyr::glimpse(df)` | "What does this one frame look like?" | Inspect a single frame, not a comparison |
| `sapply(df, class)` | "What is the class of each column in this frame?" | Quick class audit when janitor is not loaded |
| `all.equal(df1, df2)` | "Are these two frames the same data?" | Compare values and structure together; verbose output |
| `dplyr::bind_rows(df1, df2)` | (silent coercion) | Will run with mismatches and coerce; check first to avoid surprises |
| `rbind(df1, df2)` | (errors on mismatch) | Use after a successful `compare_df_cols_same()` check |

For programmatic checks, `compare_df_cols_same()` is the clearest choice. For exploratory inspection, the printed tibble from `compare_df_cols()` is easier to read than `str()` output.

[NOTE]
**Coming from Python pandas?** The closest equivalents are `df.dtypes` plus a manual diff, or `pd.concat([df1, df2]).dtypes`. There is no single-call equivalent.

## Common pitfalls

**`compare_df_cols()` itself is forgiving, but three things trip people up.**

[WARNING]
**Column order does not matter; column names do.** `compare_df_cols()` matches by name, so two frames with the same columns in different orders look identical. If your downstream code uses `rbind()` (which matches by position), a clean comparison can still hide a positional bug. Prefer `bind_rows()` or reorder columns first.

1. **Whitespace or case differences look like missing columns.** A column called `Amount` in one frame and `amount` in another shows up as two rows. Run `janitor::clean_names()` on every frame first.

2. **List-columns confuse the class check.** Two columns of class `list` compare equal even when contents differ wildly. `compare_df_cols()` only sees the outer class, not the contents.

3. **Factor levels are not checked, only the factor class.** Two `factor` columns with different level sets compare equal. After binding, expect unexpected `NA`s for missing levels. Use `strict_description = TRUE` if level identity matters.

## Try it yourself

**Try it:** You have three monthly sales frames and need to confirm they are safe to stack before binding. Use compare_df_cols() to find the mismatched columns, then write the boolean check.

```r title="Your turn: audit three frames"
# Try it: find mismatched columns across three sales frames
ex_jan <- data.frame(id = 1:2, amt = c(10, 20), region = c("N", "S"))
ex_feb <- data.frame(id = 3:4, amt = c(15L, 25L), region = c("E", "W"))
ex_mar <- data.frame(id = 5:6, amt = c(12.5, 18.0), channel = c("web", "store"))

ex_mismatches <- # your code here
ex_safe       <- # your code here: TRUE or FALSE

ex_mismatches
#> Expected: a tibble showing amt (numeric vs integer vs numeric) and the channel/region difference
ex_safe
#> Expected: FALSE
```

<details>
<summary>Click to reveal solution</summary>

```r title="Solution"
ex_mismatches <- compare_df_cols(ex_jan, ex_feb, ex_mar, return = "mismatch")
ex_safe       <- compare_df_cols_same(ex_jan, ex_feb, ex_mar)

ex_mismatches
#>   column_name  ex_jan    ex_feb  ex_mar
#> 1         amt numeric   integer numeric
#> 2     channel    <NA>      <NA> character
#> 3      region character character    <NA>

ex_safe
#> [1] FALSE
```

**Explanation:** `compare_df_cols()` accepts any number of frames via `...`, so all three drop in together. `compare_df_cols_same()` returns `FALSE` because of both the type mismatch on `amt` and the missing columns.

</details>

## Related janitor functions

These functions pair well with `compare_df_cols()` in a typical data-cleaning pipeline:

- [janitor::clean_names()](janitor-clean_names-in-R.html) standardizes column names before comparison, so case and punctuation differences do not masquerade as missing columns.
- [janitor::get_dupes()](janitor-get_dupes-in-R.html) finds duplicate rows after binding frames, a common follow-up check.
- [janitor::remove_empty()](janitor-remove_empty-in-R.html) drops fully empty rows or columns that can confuse schema comparison.
- [janitor::remove_constant()](janitor-remove_constant-in-R.html) drops columns with a single unique value, useful before binding wide tables.
- [janitor::tabyl()](janitor-tabyl-in-R.html) cross-tabulates frequencies once frames are safely combined.

For the full janitor reference, see the [janitor package CRAN page](https://cran.r-project.org/package=janitor).

## FAQ

**What does compare_df_cols() return?**

It returns a tibble with `column_name` as the first column and one column per input data frame. Each cell holds the class of that column in that frame, or `NA` when the column is absent. The output is sorted alphabetically by column name, which makes it easy to scan even when inputs have hundreds of columns.

**Can I compare more than two data frames at once?**

Yes. `compare_df_cols()` accepts any number of data frames through `...`. Pass them as named arguments to control the output column labels, for example `compare_df_cols(jan = df1, feb = df2, mar = df3)`. The result will have four columns: `column_name`, `jan`, `feb`, and `mar`. This is the recommended pattern when auditing many partitioned tables before a bulk bind.

**What is the difference between compare_df_cols() and compare_df_cols_same()?**

`compare_df_cols()` returns the diagnostic tibble showing every column's class in every frame. `compare_df_cols_same()` returns a single `TRUE` or `FALSE` telling you whether the frames are safely bindable, and prints the mismatch tibble as a side effect when it returns `FALSE`. Use the boolean wrapper in tests; use the full function for interactive exploration.

**Does compare_df_cols() check row values?**

No. It only inspects the schema, meaning column names and their classes. Two frames with identical schemas but completely different row values will report as a perfect match. For value-level comparison, use `dplyr::all_equal()`, `waldo::compare()`, or `all.equal()` instead.

**Why does compare_df_cols() show different output from str()?**

`str()` prints a recursive description of one object, including dimensions, class, and a preview of values. `compare_df_cols()` produces a side-by-side schema diff of multiple frames, designed to be read as a table. For multi-frame audits, `compare_df_cols()` is far easier to scan; for a single-frame inspection, stick with `str()` or `dplyr::glimpse()`.

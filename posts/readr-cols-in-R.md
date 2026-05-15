---
title: "readr cols() in R: Set Column Types When Reading Data"
slug: readr-cols-in-R
description: "readr cols() in R sets exact column types when reading data. Learn cols(), cols_only(), col_date, col_skip, and the compact type string with examples."
keywords: "readr cols, cols function R, readr cols examples, R column types readr, readr col_types, cols_only R, specify column types readr"
mathjax: false
webr: true
date: 2026-05-16
post_type: PSEO
category_id: function-deep
subcategory_id: readr--readxl--haven
fr_parent: Importing-Data-in-R.html
auto_link_terms: "cols()|cols_only()|readr cols|readr::cols()|column specification"
auto_link_case_sensitive: true
target_keyword: "readr cols"
sibling_block_enabled: true
difficulty: Beginner
---

# readr cols() in R: Set Column Types When Reading Data

<p class="lead">The readr <code>cols()</code> function builds a column specification that tells <code>read_csv()</code> and the other readr readers exactly how to parse each column, overriding readr's automatic type guessing.</p>

[QUICK ANSWER]
cols(id = col_integer())                    # set one column type
cols(.default = col_character())            # default type for all columns
cols(joined = col_date("%Y-%m-%d"))         # date with a format string
cols_only(id = col_integer())               # keep only the named columns
cols(grade = col_factor(c("A","B","C")))    # factor with explicit levels
cols(notes = col_skip())                    # drop a column on import
read_csv(f, col_types = "idcD")             # compact one-letter shorthand

[DECISION TREE: Is cols() the right tool?]
- set explicit column types: cols(x = col_double())
- keep only some columns: cols_only(id = col_integer())
- quick type string for all columns: read_csv(f, col_types = "idc")
- inspect the types readr guessed: spec(df)
- fix one column after import: type_convert(df)
- parse a stray string to a number: parse_number(x)

## What cols() does

**cols() defines column types for readr.** When `read_csv()` loads a file, it guesses each column's type from the first few thousand rows. The `cols()` function lets you replace those guesses with explicit types, so a ZIP code stays character and a messy date column parses cleanly. You build a column specification and pass it to the `col_types` argument of any readr reader.

## cols() syntax and column type functions

**cols() takes one named argument per column.** Each name matches a column header in the file, and each value is a `col_*()` function that describes the target type. Any column you do not name keeps the type readr guessed, unless you change that with `.default`.

```r title="Read a CSV and inspect guessed types"
library(readr)

csv <- "id,score,grade,joined
1,88.5,A,2023-01-15
2,72.0,B,2023-03-22
3,95.5,A,2023-05-30"

df <- read_csv(I(csv))
#> Rows: 3 Columns: 4
spec(df)
#> cols(
#>   id = col_double(),
#>   score = col_double(),
#>   grade = col_character(),
#>   joined = col_date(format = "")
#> )
```

The `spec()` function prints the specification readr inferred. Here `id` came through as a double, which you may want as an integer instead. The column type functions you pass to `cols()` cover every common case:

- `col_double()`, `col_integer()`, `col_logical()`: numeric and boolean columns.
- `col_character()`: text, and the safe choice for IDs or codes with leading zeros.
- `col_factor(levels)`, `col_date(format)`, `col_datetime(format)`: categorical and time columns.
- `col_number()`: parses values like `"1,200"` or `"$45"` into clean numbers.
- `col_skip()`: drops the column entirely instead of reading it.
- `col_guess()`: keeps readr's automatic guess for that one column.

[KEY INSIGHT]
**cols() is additive, not exclusive.** Naming three columns inside `cols()` does not drop the rest. Unnamed columns still load with their guessed types. To restrict the import to a chosen subset, you need `cols_only()`.

## Setting column types: four common tasks

**Most readr type fixes fall into four patterns.** The first is overriding a few columns while leaving the others to readr. Name only the columns you care about.

```r title="Override selected column types"
df2 <- read_csv(I(csv), col_types = cols(
  id     = col_integer(),
  grade  = col_factor(levels = c("A", "B", "C")),
  joined = col_date(format = "%Y-%m-%d")
))
sapply(df2, class)
#>        id     score     grade    joined
#> "integer" "numeric"  "factor"    "Date"
```

The `score` column was never mentioned, so it keeps its guessed double type. The second pattern sets one type for every column with `.default`, then carves out exceptions.

```r title="Set a default type for all columns"
df3 <- read_csv(I(csv), col_types = cols(
  .default = col_character(),
  score    = col_double()
))
sapply(df3, class)
#>          id       score       grade      joined
#> "character"   "numeric" "character" "character"
```

The third pattern reads only the columns you need and discards everything else. Use `cols_only()` instead of `cols()`.

```r title="Keep only the columns you name"
df4 <- read_csv(I(csv), col_types = cols_only(
  id    = col_integer(),
  grade = col_character()
))
names(df4)
#> [1] "id"    "grade"
```

The fourth pattern drops a single unwanted column with `col_skip()`, or replaces the whole specification with the compact one-letter string.

```r title="Skip a column or use the compact string"
df5 <- read_csv(I(csv), col_types = cols(joined = col_skip()))
names(df5)
#> [1] "id"    "score" "grade"

# Compact form: one letter per column, in column order
df6 <- read_csv(I(csv), col_types = "idcD")
names(df6)
#> [1] "id"     "score"  "grade"  "joined"
```

[TIP]
**Reach for the compact string on small, well-known files.** Letters map directly to types: `i` integer, `d` double, `c` character, `l` logical, `f` factor, `D` date, `T` datetime, `n` number, `?` guess, `-` skip. It is faster to type than a full `cols()` call when you know the layout.

## cols() vs cols_only() vs the compact string

**The three ways to declare types trade brevity against control.** Pick by how many columns you touch and whether you want to keep all of them.

| Approach | Use when | Example |
|---|---|---|
| `cols()` | Override some types, keep guesses for the rest | `cols(joined = col_date())` |
| `cols_only()` | Read only a subset of the columns | `cols_only(id = col_integer())` |
| Compact string | Quick spec for every column, in order | `col_types = "idcD"` |
| `col_types = NULL` | Let readr guess everything (the default) | `read_csv(file)` |

[NOTE]
**Coming from Python pandas?** The equivalent of `cols()` is the `dtype` argument of `pd.read_csv()`, and `cols_only()` maps to the `usecols` argument. readr keeps type and selection in one specification object.

## Common pitfalls

**Three mistakes account for most cols() confusion.** The first is expecting `cols()` to drop unnamed columns. It does not; only `cols_only()` restricts the column set.

The second is a date format that does not match the data. If the format string is wrong, `col_date()` returns `NA` for the whole column instead of raising an error.

```r title="A wrong date format silently produces NA"
bad <- read_csv(I(csv), col_types = cols(
  joined = col_date(format = "%m/%d/%Y")
))
bad$joined
#> [1] NA NA NA
```

The dates are `2023-01-15` style, so the `%m/%d/%Y` format finds nothing to parse. The third mistake is a compact string whose length does not equal the column count, which throws an error or shifts every type by one column.

[WARNING]
**A wrong date or datetime format fails quietly.** `col_date()` does not warn when the format mismatches; it just fills the column with `NA`. Always check the parsed column with `head()` or `summary()` right after import.

## Try it yourself

**Try it:** Read the `csv` data keeping only `id` (as an integer) and `score` (as a double). Save the result to `ex_cols`.

```r title="Your turn: read a column subset"
# Try it: keep only id and score, with explicit types
ex_cols <- # your code here

ex_cols
#> Expected: 3 rows, 2 columns (id, score)
```

<details>
<summary>Click to reveal solution</summary>

```r title="Solution"
ex_cols <- read_csv(I(csv), col_types = cols_only(
  id    = col_integer(),
  score = col_double()
))
ncol(ex_cols)
#> [1] 2
```

**Explanation:** `cols_only()` reads exactly the columns you name and drops `grade` and `joined`. Each column gets the type from its `col_*()` function.

</details>

## Related readr functions

`cols()` works alongside several other readr tools for controlling how data loads:

- [read_csv()](readr-read_csv-in-R.html): the reader that consumes the `col_types` specification.
- [col_types](readr-col_types-in-R.html): the argument that accepts a `cols()` object or compact string.
- [type_convert()](readr-type_convert-in-R.html): re-parse column types on a data frame after import.
- [parse_number()](readr-parse_number-in-R.html): convert a single messy string vector into numbers.
- [parse_date()](readr-parse_date-in-R.html): parse a date vector outside the reading step.

The official [readr column specification reference](https://readr.tidyverse.org/articles/readr.html) documents every `col_*()` function in full.

## FAQ

**What does cols() do in readr?**

`cols()` builds a column specification object that you pass to the `col_types` argument of `read_csv()` and similar readers. It tells readr the exact type for each named column instead of letting readr guess from sample rows. Columns you do not name keep their guessed types. The result is reliable, repeatable parsing, which matters most for IDs, codes, and dates that readr often guesses wrong.

**What is the difference between cols() and cols_only()?**

`cols()` is additive: it overrides the types of the columns you name and keeps every other column with its guessed type. `cols_only()` is exclusive: it reads only the columns you name and drops the rest. Use `cols()` to fix a few types in a full table, and `cols_only()` when you want a narrow subset of columns from a wide file.

**How do I set all columns to character in readr?**

Pass `cols(.default = col_character())` to `col_types`. The `.default` argument applies one type to every column that you do not explicitly name. You can still override individual columns, for example `cols(.default = col_character(), score = col_double())` keeps `score` numeric while everything else loads as text.

**Why are my dates NA after using col_date()?**

The format string does not match the data. `col_date(format = "%m/%d/%Y")` only parses dates written like `01/15/2023`. If the file uses `2023-01-15`, use `col_date(format = "%Y-%m-%d")` or the empty default. A mismatched format fails silently and fills the column with `NA`, so always inspect the column after import.

**What do the letters in the col_types string mean?**

Each letter sets one column's type in order: `c` character, `i` integer, `d` double, `l` logical, `n` number, `f` factor, `D` date, `T` datetime, `?` guess, and `-` skip. So `col_types = "idcD"` reads four columns as integer, double, character, and date. The string must have exactly one letter per column or readr raises an error.
</content>
</invoke>

---
title: "readr col_types in R: Control Column Types on Import"
slug: readr-col_types-in-R
description: "The readr col_types argument sets exact column types when reading data. Learn the compact string, cols() spec, cols_only(), and show_col_types with examples."
keywords: "readr col_types, col_types readr, readr read_csv col_types, specify column types readr, readr column types, col_types string, show_col_types"
mathjax: false
webr: true
date: 2026-05-16
post_type: PSEO
category_id: function-deep
subcategory_id: readr--readxl--haven
fr_parent: Importing-Data-in-R.html
auto_link_terms: "col_types|readr col_types|col_types argument|show_col_types|col_types string"
auto_link_case_sensitive: true
target_keyword: "readr col_types"
sibling_block_enabled: true
difficulty: Beginner
---

# readr col_types in R: Control Column Types on Import

<p class="lead">The readr <code>col_types</code> argument tells <code>read_csv()</code> and every other readr reader exactly how to parse each column, replacing readr's automatic type guessing with an explicit, repeatable specification.</p>

[QUICK ANSWER]
read_csv(f, col_types = NULL)                       # default: readr guesses every type
read_csv(f, col_types = "idcD")                     # compact string, one letter per column
read_csv(f, col_types = cols(id = col_integer()))   # cols() spec, override named columns
read_csv(f, col_types = cols(.default = "c"))       # force every column to character
read_csv(f, col_types = cols_only(id = "i"))        # read only the columns you name
read_csv(f, col_types = "i-c")                      # "-" skips the middle column
read_csv(f, show_col_types = FALSE)                 # silence the spec message

[DECISION TREE: Do you need col_types?]
- lock column types on import: read_csv(f, col_types = "idc")
- build a reusable type spec: cols(id = col_integer())
- silence the type-guess message: read_csv(f, show_col_types = FALSE)
- fix types after import: type_convert(df)
- see what readr guessed: spec(df)
- convert one messy column: parse_number(x)

## What the col_types argument does

**col_types controls how readr parses each column.** Every readr reader exposes a `col_types` argument. When you leave it at its default `NULL`, readr inspects the first 1,000 rows of the file and guesses a type for each column. Passing a value to `col_types` replaces that guessing with an explicit contract, so a phone code stays character and a date parses with the format you expect.

```r title="Default col_types guesses every column"
library(readr)

csv <- "ticket,price,paid,opened
T-0091,19.99,true,2024-02-03
T-0092,4.50,false,2024-02-05
T-0093,120.00,true,2024-02-09"

df <- read_csv(I(csv))
#> Rows: 3 Columns: 4
sapply(df, class)
#>      ticket       price        paid      opened
#> "character"   "numeric"   "logical"      "Date"
```

readr guessed sensibly here: `ticket` is text, `price` is a double, `paid` is logical, and `opened` is a date. Guessing works until a file is large or messy enough to fool the sample. That is when an explicit `col_types` earns its place.

[KEY INSIGHT]
**col_types turns a guess into a contract.** readr's guessing reads only a sample of rows, so a column that is all integers in the sample but has a decimal far down can change type between files. A `col_types` value fixes the type up front, so the import behaves identically on every run.

## The forms col_types accepts

**col_types accepts four kinds of value.** Each trades typing effort against control. You can hand it `NULL`, a compact one-letter string, a full `cols()` specification, or a `cols_only()` object that also drops columns.

| Value | What it does | Example |
|---|---|---|
| `NULL` | readr guesses every column (the default) | `read_csv(f)` |
| Compact string | One letter per column, in column order | `col_types = "cdlD"` |
| `cols()` object | Override named columns, guess the rest | `col_types = cols(price = "c")` |
| `cols_only()` object | Read only the columns you name | `col_types = cols_only(id = "i")` |

The compact string uses one letter per column: `c` character, `i` integer, `d` double, `l` logical, `n` number, `f` factor, `D` date, `T` datetime, `?` guess, and `-` skip. It is the fastest form when you know the layout.

```r title="Compact string sets all column types"
df2 <- read_csv(I(csv), col_types = "cdlD")
sapply(df2, class)
#>      ticket       price        paid      opened
#> "character"   "numeric"   "logical"      "Date"
```

A `cols()` value is more verbose but lets you name only the columns you care about. Every column you do not name keeps its guessed type, so `cols()` is ideal for correcting one or two stubborn columns in a wide table.

```r title="cols() overrides only the columns you name"
df3 <- read_csv(I(csv), col_types = cols(opened = col_character()))
sapply(df3, class)
#>      ticket       price        paid      opened
#> "character"   "numeric"   "logical" "character"
```

Here only `opened` changed; readr still guessed the other three. The full set of `col_*()` type functions is covered in the [cols()](readr-cols-in-R.html) reference.

## Reading the column specification readr prints

**readr announces every column type it chose.** After a read with default `col_types`, readr prints a "Column specification" message. Calling `spec()` reprints that block, and you can paste it straight back into `col_types` as a tested starting point.

```r title="Inspect and reuse the column spec"
spec(df)
#> cols(
#>   ticket = col_character(),
#>   price = col_double(),
#>   paid = col_logical(),
#>   opened = col_date(format = "")
#> )

df4 <- read_csv(I(csv), col_types = cols(
  ticket = col_character(),
  price  = col_double(),
  paid   = col_logical(),
  opened = col_date()
), show_col_types = FALSE)
ncol(df4)
#> [1] 4
```

The `show_col_types = FALSE` argument silences the spec message once you have settled the types. It pairs naturally with `col_types`: declare the types, then stop readr from reporting them on every run.

[TIP]
**Copy the printed spec to lock a file's types.** Read the file once with default `col_types`, copy the `cols( ... )` block readr prints, and paste it into `col_types`. The import is now reproducible and immune to a future file whose sample rows guess differently.

## col_types works the same in every readr reader

**col_types is shared across the whole readr reader family.** `read_csv()`, `read_tsv()`, `read_delim()`, `read_table()`, and `read_fwf()` all accept the same `col_types` value in the same way. Learn the argument once and it transfers to every delimited and fixed-width format readr handles.

```r title="The same col_types in read_tsv"
tsv <- "ticket\tprice\nT-1\t9.5\nT-2\t3.0"
read_tsv(I(tsv), col_types = "cd")
#> # A tibble: 2 x 2
#>   ticket price
#>   <chr>  <dbl>
#> 1 T-1      9.5
#> 2 T-2      3
```

The compact string `"cd"` reads `ticket` as character and `price` as a double, exactly as it would inside `read_csv()`. Because the argument is identical everywhere, a type spec you build for a CSV can be reused unchanged when the same data arrives as a TSV.

[NOTE]
**Coming from Python pandas?** The `col_types` argument is readr's counterpart to the `dtype` argument of `pd.read_csv()`. The compact string `"idc"` plays the role of a `dtype` dictionary, and `cols_only()` matches the pandas `usecols` argument.

## Common pitfalls

**Three col_types mistakes surface again and again.** The first is a compact string whose length does not match the column count. readr expects exactly one letter per column, so a four-column file needs a four-letter string. A shorter or longer string raises an error rather than guessing the difference.

The second mistake is a name in `cols()` that matches no column header. readr compares names case-sensitively and does not warn on a miss, so the column you meant to fix quietly keeps its guessed type.

```r title="A misspelled column name is ignored"
df_typo <- read_csv(I(csv), col_types = cols(Price = col_character()))
class(df_typo$price)
#> [1] "numeric"
```

The header is `price` in lowercase, so `Price` matches nothing and the column stays a double. The third mistake is forcing an incompatible type, such as `col_double()` on a column containing currency symbols. readr fills the unparseable values with `NA` and reports parsing problems instead of stopping.

[WARNING]
**A col_types name that matches no column is silently ignored.** readr does not warn when a name in `cols()` has no matching header. The column you meant to fix keeps its guessed type. Verify the result with `sapply(df, class)` immediately after import.

## Try it yourself

**Try it:** Read the `csv` data forcing `price` to character and dropping the `paid` column. Save the result to `ex_types`.

```r title="Your turn: set col_types"
# Try it: price as character, drop the paid column
ex_types <- # your code here

ex_types
#> Expected: 3 columns (ticket, price, opened)
```

<details>
<summary>Click to reveal solution</summary>

```r title="Solution"
ex_types <- read_csv(I(csv), col_types = cols(
  price = col_character(),
  paid  = col_skip()
))
names(ex_types)
#> [1] "ticket" "price"  "opened"
```

**Explanation:** `cols()` overrides only the named columns, so `price` becomes character and `col_skip()` drops `paid` entirely. The unnamed `ticket` and `opened` columns keep their guessed types.

</details>

## Related readr functions

The `col_types` argument works alongside several other readr tools for controlling how data loads:

- [cols()](readr-cols-in-R.html): builds the column specification object that `col_types` accepts.
- [read_csv()](readr-read_csv-in-R.html): the reader whose `col_types` argument this page explains.
- [read_delim()](readr-read_delim-in-R.html): the general delimited reader that shares the same `col_types`.
- [read_tsv()](readr-read_tsv-in-R.html): the tab-separated reader, also driven by `col_types`.
- [read_fwf()](readr-read_fwf-in-R.html): the fixed-width reader that accepts the same type spec.

The official [readr column specification reference](https://readr.tidyverse.org/articles/readr.html) documents every `col_*()` type function in full.

## FAQ

**What is col_types in readr?**

`col_types` is an argument on every readr reader, such as `read_csv()`, that sets the type of each column when a file is read. Its default value `NULL` lets readr guess types from a sample of rows. Passing a compact string, a `cols()` object, or a `cols_only()` object replaces that guess with an explicit specification, which makes the import reproducible and protects columns like IDs and dates from being parsed wrong.

**What do the letters in the col_types string mean?**

Each letter sets one column's type in column order: `c` character, `i` integer, `d` double, `l` logical, `n` number, `f` factor, `D` date, `T` datetime, `?` guess, and `-` skip. So `col_types = "idcD"` reads four columns as integer, double, character, and date. The string must contain exactly one letter per column, or readr raises an error.

**How do I stop readr from printing column types?**

Set `show_col_types = FALSE` in the reader call, for example `read_csv(file, show_col_types = FALSE)`. That suppresses the "Column specification" message that readr prints after every read. To silence it for an entire session, set `options(readr.show_col_types = FALSE)`. Supplying an explicit `col_types` value also hides the message, since readr only reports types it had to guess.

**What is the difference between col_types and cols()?**

`col_types` is the argument; `cols()` is one of the values you can pass to it. `cols()` builds a column specification object, naming columns and their `col_*()` type functions. You can also pass `col_types` a compact string like `"idc"` or leave it `NULL`. In short, `cols()` constructs the spec and `col_types` receives it.

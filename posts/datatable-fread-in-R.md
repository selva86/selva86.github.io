---
title: "data.table fread() in R: Fast CSV and Text Import"
slug: "datatable-fread-in-R"
description: "Use data.table fread() in R to import CSV and delimited files fast. Covers select, drop, nrows, colClasses, text input, and fread vs read.csv with examples."
keywords: "data.table fread, fread function R, fread examples, read csv R fast, fread vs read.csv, import data R, fread r"
mathjax: false
webr: true
date: "2026-05-16"
post_type: "PSEO"
category_id: "function-deep"
subcategory_id: "datatable-functions"
fr_parent: "data-table-vs-dplyr.html"
auto_link_terms: "fread()|data.table fread|data.table::fread()|fread|fread function|fread CSV"
auto_link_case_sensitive: true
target_keyword: "data.table fread"
sibling_block_enabled: true
difficulty: "Beginner"
---

# data.table fread() in R: Fast CSV and Text Import

<p class="lead">The <code>fread()</code> function from data.table imports CSV and delimited text files into R quickly, auto-detecting the separator, header, and column types so you rarely need to configure anything.</p>

[QUICK ANSWER]
fread("data.csv")                          # auto-detect sep, header, types
fread("data.tsv")                          # tab-delimited, still automatic
fread(text = "a,b\n1,2")                   # read straight from a string
fread("data.csv", select = c("a", "b"))    # keep only these columns
fread("data.csv", drop = "notes")          # read all columns except these
fread("data.csv", nrows = 100)             # read just the first 100 rows
fread("data.csv", colClasses = c(id = "character"))  # force a column type

[DECISION TREE: Is fread() the right tool?]
- read a CSV or delimited text file fast: fread("data.csv")
- write a data.table back to disk: fwrite(dt, "out.csv")
- read an Excel .xlsx workbook: readxl::read_excel("file.xlsx")
- convert a data.frame already in memory: setDT(df)
- read and stack many files at once: rbindlist(lapply(files, fread))
- prefer a tidyverse tibble result: readr::read_csv("data.csv")

## What fread() does in one sentence

**`fread()` is data.table's fast file reader.** You give it a path to a CSV or other delimited file, and it returns a `data.table` with the separator, header row, and column types all inferred automatically. The name stands for "fast read", and on large files it is typically several times quicker than base R `read.csv()` while using less memory.

The appeal of `data.table fread` is that it usually just works. It detects whether your file is comma, tab, semicolon, or pipe separated. It recognises integers, doubles, dates, and logicals without you listing them. It handles quoted fields, embedded newlines, and irregular whitespace. For most day-to-day imports, `fread("myfile.csv")` is the entire command.

## Syntax

**`fread()` takes a source plus a set of optional controls.** The source is usually a file path, but it can also be a URL, a shell command, or a literal string passed through the `text` argument.

```r title="Load data.table and read a CSV"
library(data.table)

# Create a small CSV file to read back
sales_csv <- tempfile(fileext = ".csv")
writeLines(c(
  "region,product,units,revenue",
  "East,Widget,120,2400.50",
  "West,Gadget,85,3187.00",
  "East,Gadget,60,2250.00",
  "West,Widget,200,4000.00"
), sales_csv)

sales <- fread(sales_csv)
sales
#>    region product units revenue
#>    <char>  <char> <int>   <num>
#> 1:   East  Widget   120  2400.5
#> 2:   West  Gadget    85  3187.0
#> 3:   East  Gadget    60  2250.0
#> 4:   West  Widget   200  4000.0
```

The most-used arguments are:

- `input`: a file path, URL, or connection. The first positional argument.
- `text`: a character string to read instead of a file.
- `sep`: the field separator. Default `"auto"` detects it for you.
- `header`: whether row one holds column names. Default `"auto"`.
- `select` / `drop`: columns to keep or skip.
- `nrows`: maximum number of rows to read.
- `colClasses`: force specific column types.
- `na.strings`: strings to treat as `NA`.

[TIP]
**Leave `sep` and `header` on auto.** `fread()` samples the file and detects them reliably. Override them only when detection fails, for example a one-column file with no header that gets misread.

## Reading data: five common patterns

### 1. Read from a string with text

When data is already in your script, or comes back from an API as text, skip the file entirely and pass it through `text`.

```r title="Read a delimited string directly"
inline <- fread(text = "id;score;grade
1;88;A
2;72;B
3;95;A")
inline
#>       id score  grade
#>    <int> <int> <char>
#> 1:     1    88      A
#> 2:     2    72      B
#> 3:     3    95      A
```

Note that the separator here is a semicolon, and `fread()` detected it without being told.

### 2. Keep only some columns with select

Reading just the columns you need is faster and lighter than reading everything and dropping later.

```r title="Read a subset of columns"
fread(sales_csv, select = c("region", "revenue"))
#>    region revenue
#>    <char>   <num>
#> 1:   East  2400.5
#> 2:   West  3187.0
#> 3:   East  2250.0
#> 4:   West  4000.0
```

### 3. Drop columns you do not want

`drop` is the inverse of `select`: read every column except the ones you name.

```r title="Read all columns except one"
fread(sales_csv, drop = "units")
#>    region product revenue
#>    <char>  <char>   <num>
#> 1:   East  Widget  2400.5
#> 2:   West  Gadget  3187.0
#> 3:   East  Gadget  2250.0
#> 4:   West  Widget  4000.0
```

### 4. Preview a large file with nrows

Before loading a multi-gigabyte file, read a handful of rows to check the structure.

```r title="Read only the first two rows"
fread(sales_csv, nrows = 2)
#>    region product units revenue
#>    <char>  <char> <int>   <num>
#> 1:   East  Widget   120  2400.5
#> 2:   West  Gadget    85  3187.0
```

### 5. Force column types with colClasses

Type detection is good but not psychic. When you need a specific type, name it.

```r title="Force the units column to numeric"
typed <- fread(sales_csv, colClasses = c(units = "numeric"))
sapply(typed, class)
#>      region     product       units     revenue
#>   "character" "character"   "numeric"    "numeric"
```

[KEY INSIGHT]
**`fread()` returns a `data.table`, not a plain data frame.** That object also inherits from `data.frame`, so base R code keeps working, but it unlocks data.table's fast `dt[i, j, by]` syntax. If a downstream function misbehaves, wrap the result in `as.data.frame()`.

## fread() vs read.csv() and read_csv()

**The three readers differ in speed, return type, and defaults.** `fread()` is fastest and returns a `data.table`. Base `read.csv()` returns a `data.frame`. `readr::read_csv()` returns a tibble and sits between the two on speed.

```r title="Compare what each reader returns"
dt <- fread(sales_csv)
class(dt)
#> [1] "data.table" "data.frame"

df <- read.csv(sales_csv)
class(df)
#> [1] "data.frame"
```

| Feature | `fread()` | `read.csv()` | `read_csv()` |
|---|---|---|---|
| Package | data.table | base R | readr |
| Return type | data.table | data.frame | tibble |
| Speed on big files | Fastest | Slowest | Fast |
| Separator detection | Automatic | Manual | Limited |
| Strings as factors | Never | Never (R 4.0+) | Never |

Use `fread()` for large files or when you already work in data.table. Use `read_csv()` if the rest of your code is tidyverse. Reach for `read.csv()` only when you want zero package dependencies.

[NOTE]
**Coming from Python pandas?** The equivalent of `fread("data.csv")` is `pandas.read_csv("data.csv")`. Both auto-detect types, and pandas `usecols=` matches the `select` argument here.

## Common pitfalls

**Pitfall 1: leading-zero codes become integers.** `fread()` sees a column of digits and reads it as a number, dropping leading zeros from ZIP codes or IDs.

```r title="Leading zeros lost, then fixed"
bad <- fread(text = "code,name\n007,Alpha\n042,Beta")
bad$code
#> [1]  7 42

good <- fread(text = "code,name\n007,Alpha\n042,Beta",
              colClasses = c(code = "character"))
good$code
#> [1] "007" "042"
```

**Pitfall 2: a string with no newline is treated as a filename.** `fread("a,b,c")` looks for a file named `a,b,c`. To read literal text, always use the `text` argument.

**Pitfall 3: forgetting the result is a data.table.** Indexing such as `dt[1]` returns the first row, not the first column, which surprises users expecting `data.frame` behaviour.

[WARNING]
**Always check `colClasses` for ID-like columns.** Account numbers, ZIP codes, and product SKUs with leading zeros are silently corrupted by automatic numeric detection. The damage is invisible until a join fails later.

## Try it yourself

**Try it:** Use `fread()` to read the CSV string below, keeping only the `city` and `temp` columns. Save the result to `ex_weather`.

```r title="Your turn: fread with select"
# Try it: read text, keep two columns
ex_weather <- # your code here

ex_weather
#> Expected: data.table with columns city and temp, 3 rows
```

<details>
<summary>Click to reveal solution</summary>

```r title="Solution"
ex_weather <- fread(
  text = "city,temp,humidity\nOslo,12,70\nCairo,34,20\nLima,19,85",
  select = c("city", "temp")
)
ex_weather
#>      city  temp
#>    <char> <int>
#> 1:   Oslo    12
#> 2:  Cairo    34
#> 3:   Lima    19
```

**Explanation:** Passing `select` inside `fread()` reads only the named columns straight from the source. That is faster and lighter than reading every column and dropping the rest afterwards.

</details>

## Related data.table functions

Once `fread()` has loaded your data, these functions pair naturally with it:

- `fwrite()`: the fast counterpart that writes a data.table back to disk.
- `setDT()`: convert an existing data.frame to a data.table in place.
- `rbindlist()`: stack a list of data.tables, ideal for combining many files read with `fread()`.
- `setnames()`: rename columns of the result.
- `setkey()`: index a column for fast joins and lookups.

A common pattern combines several of these: `rbindlist(lapply(list.files(pattern = "*.csv"), fread))` reads every CSV in a folder and binds them into one data.table in a single line.

## FAQ

**Is fread faster than read.csv?**

Yes, substantially. On files above 100 MB, `fread()` is commonly 5 to 10 times faster than `read.csv()`, and the gap widens as files grow. It achieves this with a memory-mapped, multi-threaded parser and by sampling the file to guess column types once instead of growing vectors row by row. On tiny files the difference is negligible, so the win is mainly for medium and large data.

**How do I read only specific columns with fread?**

Use the `select` argument with a character vector of column names: `fread("data.csv", select = c("id", "price"))`. You can also pass column positions, such as `select = c(1, 3)`. The opposite is `drop`, which reads every column except the ones you name. Selecting columns at read time is faster and uses less memory than reading the whole file first.

**Does fread return a data.frame or a data.table?**

`fread()` returns a `data.table`, which also inherits from `data.frame`. That means base R functions expecting a data frame still work, but you also get data.table's fast `dt[i, j, by]` query syntax. If you need a plain data frame, set `data.table = FALSE` in the call or wrap the result with `as.data.frame()`.

**How do I read a CSV from a URL with fread?**

Pass the URL as the first argument: `fread("https://example.com/data.csv")`. `fread()` downloads the file and parses it in one step, with the same automatic detection it uses for local files. For files behind authentication or needing custom headers, download the file first, then read the local copy.

**Why does fread change my column types?**

`fread()` infers each column's type from a sample of values. A column of digits becomes integer or numeric, and `TRUE`/`FALSE` text becomes logical. This is usually helpful, but it can drop leading zeros or misread mixed columns. Override it with `colClasses`, for example `colClasses = c(zip = "character")`, to lock a column to the type you need.

For the official argument reference, see the [data.table fread documentation](https://rdatatable.gitlab.io/data.table/reference/fread.html).

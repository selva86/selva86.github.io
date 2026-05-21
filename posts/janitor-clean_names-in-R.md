---
title: "janitor clean_names() in R: Standardize Messy Column Names"
slug: "janitor-clean_names-in-R"
description: "Use janitor clean_names() to convert messy column names to snake_case in R. Covers case styles, custom replacements, and make_clean_names() for vectors."
keywords: "janitor clean_names, clean_names function R, janitor clean_names examples, R clean column names, snake_case column names R, make_clean_names"
mathjax: false
webr: true
date: "2026-05-22"
post_type: "PSEO"
category_id: "function-deep"
subcategory_id: "janitor-functions"
fr_parent: "janitor-Package-in-R.html"
auto_link_terms: "clean_names()|janitor clean_names|janitor::clean_names()|make_clean_names()|standardize column names"
auto_link_case_sensitive: true
target_keyword: "janitor clean_names"
sibling_block_enabled: true
difficulty: "Beginner"
---

# janitor clean_names() in R: Standardize Messy Column Names

<p class="lead">The <code>clean_names()</code> function in janitor rewrites every column name in a data frame to clean snake_case in one call. It strips special characters, collapses whitespace, lowercases letters, and guarantees syntactic names, ideal for taming output from Excel, SAS, or messy CSV files.</p>

[QUICK ANSWER]
clean_names(df)                                # snake_case default
df |> janitor::clean_names()                   # pipe-friendly
clean_names(df, case = "small_camel")          # lowerCamelCase
clean_names(df, case = "screaming_snake")      # ALL_CAPS_SNAKE
clean_names(df, replace = c("%" = "pct"))      # custom replace
clean_names(df, ascii = FALSE)                 # keep non-ASCII chars
make_clean_names(c("Var 1", "Var 2"))          # clean a char vector

[DECISION TREE: Is clean_names() the right tool?]
- standardize messy data-frame names: clean_names(df)
- clean a character vector instead: make_clean_names(x)
- rename one or two columns by hand: rename(df, new = old)
- rename by pattern with custom control: rename_with(df, ~ gsub(" ", "_", .))
- enforce camelCase output across columns: clean_names(df, case = "small_camel")
- syntactic names only, no janitor opinions: setNames(df, make.names(names(df), unique = TRUE))
- swap specific tokens like % to pct: clean_names(df, replace = c("%" = "pct"))

## What clean_names() does in one sentence

**`clean_names()` rewrites every column name in a data frame so the result is lowercase snake_case and safe to use in R code.** It removes punctuation, replaces spaces and dots with underscores, transliterates non-ASCII characters, deduplicates collisions, and returns the same data with new names.

This solves the recurring pain of working with files where column names contain spaces, percent signs, parentheses, or unicode characters. After `clean_names()`, you can write `df$some_col` without backticks.

## Syntax

**`clean_names()` takes a data frame plus optional `case` and `replace` arguments.** All work happens on the names; the data values are untouched.

```r title="Load janitor and a messy data frame"
library(janitor)
library(dplyr)

messy <- data.frame(
  `First Name` = c("Ann", "Bob"),
  `Age (yrs)`  = c(34, 29),
  `weight%`    = c(0.55, 0.61),
  check.names  = FALSE
)
names(messy)
#> [1] "First Name" "Age (yrs)"  "weight%"
```

The full signature:

```
clean_names(dat, case = "snake", replace = c(...), ascii = TRUE,
            use_make_names = TRUE, parsing_option = 1, ...)
```

Only `dat` is required. The defaults produce snake_case names from arbitrary input, which is the right answer for most data-import workflows.

[TIP]
**Pipe `clean_names()` right after every import call.** Make `read_csv("file.csv") |> clean_names()` a reflex. Standardized names from the first step prevent silent bugs later when filter() or select() expect a column whose original spelling has a stray space or different capitalization in production data.

## Six common patterns

### 1. Snake_case the entire data frame

```r title="Default snake_case cleanup"
messy |>
  clean_names() |>
  names()
#> [1] "first_name"     "age_yrs"        "weight_percent"
```

Spaces become underscores. Parentheses are dropped. `%` auto-expands to `percent`. The result is lowercase snake_case across the board.

### 2. Switch to camelCase or another case style

```r title="Use a different case style"
messy |>
  clean_names(case = "small_camel") |>
  names()
#> [1] "firstName"     "ageYrs"        "weightPercent"
```

Valid `case` values include `"snake"` (default), `"small_camel"`, `"big_camel"`, `"screaming_snake"`, `"all_caps"`, `"lower_upper"`, `"upper_lower"`, `"title"`, and `"sentence"`. Pick one and stick with it across a project for consistency.

### 3. Custom token replacements

```r title="Replace specific tokens before cleaning"
df <- data.frame(`Revenue ($)` = 1, `Growth (%)` = 2, check.names = FALSE)
df |>
  clean_names(replace = c("\\$" = "usd", "%" = "pct")) |>
  names()
#> [1] "revenue_usd" "growth_pct"
```

`replace` is a named character vector: names are regex patterns, values are replacements. Patterns run BEFORE case conversion. Use this to preserve meaning that the default would otherwise drop, such as keeping `$` as `usd` or `%` as `pct`.

### 4. Clean a character vector with make_clean_names()

```r title="Clean a vector instead of a data frame"
make_clean_names(c("Var 1", "Sales $", "X-1"))
#> [1] "var_1" "sales" "x_1"
```

`make_clean_names()` runs the same cleanup logic on a plain character vector. Use it when you need clean names for column assignment, list elements, or factor levels outside the context of a data frame.

### 5. Handle non-ASCII characters

```r title="Transliterate accents or keep them"
df <- data.frame(`Café` = 1, `Niño` = 2, check.names = FALSE)

clean_names(df, ascii = TRUE) |> names()
#> [1] "cafe" "nino"

clean_names(df, ascii = FALSE) |> names()
#> [1] "café" "niño"
```

`ascii = TRUE` (default) transliterates accents to plain ASCII letters. `ascii = FALSE` preserves the original characters. ASCII is safer for code and SQL exports; non-ASCII can break legacy systems but reads better in localized reports.

### 6. Deduplicate colliding names automatically

```r title="Handle name collisions"
df <- data.frame(
  `Total $` = 10,
  `Total %` = 20,
  check.names = FALSE
)

df |> clean_names() |> names()
#> [1] "total"      "total_2"
```

When two original names normalize to the same string, janitor appends `_2`, `_3`, and so on. No silent overwrites; every column survives with a unique label.

[KEY INSIGHT]
**`clean_names()` is destructive of formatting but lossless on data.** The original column names are replaced, not preserved as attributes. If you need the raw names later for a report header, copy them with `original_names <- names(df)` BEFORE calling `clean_names()`. The data values themselves are never touched.

## clean_names() vs rename_with() vs make.names()

**Three tools sit in this space; pick by how much control you need.**

| Task | `clean_names()` | `rename_with()` | `make.names()` |
|---|---|---|---|
| Bulk snake_case messy names | `clean_names(df)` | `rename_with(df, ~ tolower(gsub("[^A-Za-z0-9]+", "_", .)))` | `setNames(df, make.names(names(df)))` |
| Enforce camelCase | `clean_names(df, case = "small_camel")` | custom lambda | not supported |
| Drop accents | `clean_names(df, ascii = TRUE)` | needs `stringi::stri_trans_general` | no |
| Guarantee unique names | always | manual | with `unique = TRUE` |
| Cross-package opinion | janitor convention | yours | base R minimum |

When to use which:

- Use `clean_names()` for any data-import workflow. One line, opinionated defaults, no thinking required.
- Use `rename_with()` when you want a specific custom transform across many columns.
- Use `make.names()` when you only need syntactic legality and want zero extra dependencies.

[NOTE]
**Coming from Python pandas?** The closest equivalent is `df.columns = df.columns.str.replace(r"\W+", "_", regex=True).str.lower()`. No single pandas function ships with janitor's full feature set; the `pyjanitor` package ports `clean_names()` for those who want the same behavior.

## Common pitfalls

**Pitfall 1: forgetting to assign the result.** `clean_names(df)` does NOT modify `df` in place. Capture the result: `df <- clean_names(df)` or apply it inside a pipeline.

**Pitfall 2: order matters with replace.** `replace = c("%" = "pct")` runs before case conversion, so `pct` gets case-folded by default. To keep an exact token like `PCT`, write `replace = c("%" = "PCT")` and pass `case = "none"`, otherwise janitor lowers it.

[WARNING]
**Downstream code that hard-codes the OLD names breaks silently.** If your report writes `df$"Revenue ($)"`, calling `clean_names()` rewrites that column to `revenue`. Scripts that referenced the old names raise "unknown column" errors. Rename consistently at import time, then commit to the cleaned names throughout the analysis.

**Pitfall 3: empty names become x.** A column with name `""` (blank) becomes `x`. If multiple blank columns exist, you get `x`, `x_2`, `x_3`. Inspect the result after cleaning to confirm names are meaningful, especially when reading spreadsheets with blank header cells.

## Try it yourself

**Try it:** Take `airquality` and use `clean_names()` with `case = "screaming_snake"` to get ALL-CAPS names. Save the result to `ex_aq` and print the new names.

```r title="Your turn: screaming snake case"
# Try it: convert airquality names to SCREAMING_SNAKE
ex_aq <- airquality |>
  clean_names(# your code here)

names(ex_aq)
#> Expected: c("OZONE", "SOLAR_R", "WIND", "TEMP", "MONTH", "DAY")
```

<details>
<summary>Click to reveal solution</summary>

```r title="Solution"
ex_aq <- airquality |>
  clean_names(case = "screaming_snake")

names(ex_aq)
#> [1] "OZONE"   "SOLAR_R" "WIND"    "TEMP"    "MONTH"   "DAY"
```

**Explanation:** Passing `case = "screaming_snake"` tells janitor to produce uppercase tokens joined by underscores. The data values are unchanged; only the column labels are rewritten.

</details>

## Related janitor functions

After mastering `clean_names()`, look at:

- `make_clean_names()`: the same cleanup logic for a character vector instead of a data frame
- `remove_empty()`: drop empty rows or columns, often used right after `clean_names()`
- `tabyl()`: tidy frequency tables, frequently the next step after data import
- `get_dupes()`: find duplicated rows by one or more columns
- `dplyr::rename_with()`: roll your own transform when janitor's defaults do not fit

For a fuller tour of the janitor package, see the [janitor package guide](janitor-Package-in-R.html). The package's official reference site is [sfirke.github.io/janitor](https://sfirke.github.io/janitor/).

## FAQ

**What does janitor clean_names() do?**

`clean_names()` rewrites the column names of a data frame to a clean, consistent style (snake_case by default). It removes punctuation, replaces spaces with underscores, transliterates accented characters, and guarantees every name is unique. The data values are not modified; only the column labels change, which makes the function safe to drop into any import pipeline.

**How do I use clean_names() with read_csv()?**

Pipe it directly: `readr::read_csv("file.csv") |> janitor::clean_names()`. This pattern standardizes column names the moment the data lands in R, so every downstream step sees consistent identifiers. Many R analysts treat this two-line idiom as the default import recipe and never reference the raw column names afterward.

**Can clean_names() produce camelCase instead of snake_case?**

Yes. Pass `case = "small_camel"` for `firstName`, `case = "big_camel"` for `FirstName`, or other supported styles like `"screaming_snake"` or `"all_caps"`. Run `?janitor::clean_names` to see the full list, then pick one and apply it consistently across your project. Mixing case styles between scripts is a common source of subtle bugs.

**Why does clean_names() rename two columns to the same base name?**

When two original names normalize to the same string (for example `"Total $"` and `"Total %"` both reduce to `total`), janitor appends a numeric suffix: the first stays `total`, the second becomes `total_2`. This guarantees uniqueness without losing data, so always inspect names after cleaning to confirm the auto-suffix matches your intent.

**Does clean_names() work with tibbles and data.table?**

Yes. `clean_names()` operates on any object that has a `names()` method and preserves the input class. Tibbles stay tibbles, data.tables stay data.tables, plain data frames stay plain data frames. The cleaning logic is identical across types, which makes the function safe in mixed pipelines that move between tidyverse and data.table workflows.

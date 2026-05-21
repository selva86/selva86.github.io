---
title: "janitor make_clean_names() in R: Clean Column Name Vectors"
slug: "janitor-make_clean_names-in-R"
description: "Use janitor make_clean_names() to standardize messy character vectors into snake_case in R. Covers case styles, list names, factor levels, and unique suffixes."
keywords: "janitor make_clean_names, make_clean_names function R, make_clean_names examples, clean character vector R, snake_case names R, R clean names vector"
mathjax: false
webr: true
date: "2026-05-22"
post_type: "PSEO"
category_id: "function-deep"
subcategory_id: "janitor-functions"
fr_parent: "janitor-Package-in-R.html"
auto_link_terms: "make_clean_names()|janitor make_clean_names|janitor::make_clean_names()|clean character vector|snake case names vector"
auto_link_case_sensitive: true
target_keyword: "janitor make_clean_names"
sibling_block_enabled: true
difficulty: "Beginner"
---

# janitor make_clean_names() in R: Clean Column Name Vectors

<p class="lead">The <code>make_clean_names()</code> function in janitor takes any character vector and returns a clean snake_case version, ideal for naming list elements, factor levels, or columns built outside a data frame. It is the vector-level companion to <code>clean_names()</code>.</p>

[QUICK ANSWER]
make_clean_names(c("First Name", "Age"))             # default snake_case
make_clean_names(x, case = "small_camel")            # lowerCamelCase output
make_clean_names(x, case = "screaming_snake")        # SCREAMING_SNAKE output
make_clean_names(x, replace = c("%" = "pct"))        # custom token replacement
make_clean_names(x, allow_dupes = TRUE)              # keep duplicates as-is
setNames(my_list, make_clean_names(names(my_list)))  # rename list elements
make_clean_names(levels(my_factor))                  # cleaned factor labels

[DECISION TREE: Is make_clean_names() the right tool?]
- clean a plain character vector: make_clean_names(x)
- clean every name in a data frame: clean_names(df)
- need syntactic names without janitor opinions: make.names(x, unique = TRUE)
- rename list elements after cleaning: setNames(lst, make_clean_names(names(lst)))
- clean factor levels: make_clean_names(levels(f))
- preserve duplicates without _2, _3 suffixes: make_clean_names(x, allow_dupes = TRUE)
- enforce camelCase or all-caps output: make_clean_names(x, case = "small_camel")

## What make_clean_names() does in one sentence

**The make_clean_names function takes a character vector and returns a snake_case, syntactically safe version of every element.** It removes punctuation, replaces spaces and dots with underscores, transliterates accented characters, and appends numeric suffixes to any collisions so the output vector is unique by default.

The function operates on plain vectors, which makes it the right tool when names live outside a data frame: as keys in a list, levels of a factor, sheet labels from Excel, or strings you intend to assign to columns later.

## Syntax

**`make_clean_names()` accepts a character vector plus the same options as `clean_names()`.** The signature is identical apart from the leading argument.

```r title="Basic vector cleanup with janitor"
library(janitor)

raw <- c("First Name", "Age (yrs)", "Weight %", "X-1")
make_clean_names(raw)
#> [1] "first_name" "age_yrs"    "weight_percent" "x_1"
```

The full signature:

```
make_clean_names(string, case = "snake", replace = c(...), ascii = TRUE,
                 use_make_names = TRUE, allow_dupes = FALSE,
                 sep_in = NULL, transliterations = "Latin-ASCII",
                 parsing_option = 1, numerals = "asis")
```

Only `string` is required. The defaults mirror `clean_names()` exactly, so output between the two functions is consistent on the same input.

[TIP]
**Reach for `make_clean_names()` whenever names are NOT yet attached to a data frame.** Use it on character vectors, list keys, factor levels, or sheet labels. Once names are part of a data frame, `clean_names(df)` is shorter and conveys intent more clearly to readers of your code.

## Five common patterns

### 1. Clean a raw character vector

```r title="Clean a messy vector of labels"
labels <- c("Total Sales ($)", "Q1 Growth %", "Net.Margin", "Café")
make_clean_names(labels)
#> [1] "total_sales"   "q1_growth_percent" "net_margin"   "cafe"
```

Spaces and dots become underscores. Currency symbols drop out. The percent sign expands to the word percent. Accented characters transliterate to plain ASCII letters. The vector returns in the same order it came in, ready for any downstream use such as setting column names or building a lookup table where labels must be syntactically legal R identifiers.

### 2. Apply across list element names

```r title="Rename list elements with setNames"
results <- list(`Run 1` = 0.92, `Run 2` = 0.88, `Final Test` = 0.95)
results <- setNames(results, make_clean_names(names(results)))
names(results)
#> [1] "run_1"      "run_2"      "final_test"
```

This pattern works for any named object: lists, named numeric vectors, or environments converted via as.list. The data values stay put; only the labels change. It is the cleanest way to standardize keys before serializing to JSON, writing to a database, or merging result sets where one set arrived from Excel and another from a tidy table. Inconsistent keys quietly produce missing joins, and one defensive call avoids the entire class of bug.

### 3. Clean factor levels in place

```r title="Standardize factor levels"
f <- factor(c("Group A", "Group B", "Group A", "Group C"))
levels(f) <- make_clean_names(levels(f))
levels(f)
#> [1] "group_a" "group_b" "group_c"
```

Assigning to the levels function rewrites the labels without changing which level each observation maps to. Factor counts and order are preserved. This avoids the trap of using as.character and then re-factoring, which can silently drop unused levels when a level has zero observations in the current slice.

### 4. Build column names before assignment

```r title="Generate column names for a new data frame"
metrics <- c("MAE (train)", "MAE (test)", "R^2 (train)", "R^2 (test)")
df <- data.frame(matrix(runif(4), nrow = 1))
names(df) <- make_clean_names(metrics)
names(df)
#> [1] "mae_train" "mae_test"  "r_2_train" "r_2_test"
```

When you build a data frame from a matrix or from a call such as do.call rbind, you often hold the desired column labels in a separate vector. Run them through the cleaner before assignment so the result is immediately syntactic and free of backticks. This is the standard approach when you generate labels programmatically, for example concatenating a metric name with a split label, and want consistent output regardless of how the source strings were spaced.

### 5. Allow duplicates when sources may overlap

```r title="Keep duplicates without numeric suffixes"
ids <- c("Site A", "Site B", "Site A", "Site C")

make_clean_names(ids)
#> [1] "site_a"   "site_b"   "site_a_2" "site_c"

make_clean_names(ids, allow_dupes = TRUE)
#> [1] "site_a" "site_b" "site_a" "site_c"
```

Default behavior appends a numeric suffix such as _2 and _3 to enforce uniqueness, which is the right answer for column names. Set the allow_dupes argument to TRUE when collisions are meaningful, such as a long-form factor where the same group appears across rows, or a merge key that must keep its original value so a downstream join lands on the correct records.

[KEY INSIGHT]
**`make_clean_names()` is `clean_names()` with the data frame layer removed.** Treat them as the same engine exposed at two levels: one operates on `df`, the other on `names(df)`. Whichever shape your data is in, the cleanup rules are identical.

## make_clean_names() vs clean_names() vs make.names()

**Three tools cover the same space; choose by what you are holding.**

| Task | `make_clean_names()` | `clean_names()` | `make.names()` |
|---|---|---|---|
| Input type | character vector | data frame | character vector |
| Returns | cleaned vector | data frame with new names | minimally legal names |
| Snake_case by default | yes | yes | no (legal only) |
| Drops accents | yes (`ascii = TRUE`) | yes | no |
| Custom replacements | yes (`replace = ...`) | yes | no |
| Guarantees uniqueness | yes (or `allow_dupes`) | yes | with `unique = TRUE` |
| Dependency | janitor | janitor | base R |

When to use which:

- Vector-level cleaner: any character vector you will assign as names later.
- Data frame cleaner: names already attached to a tabular object, one-liner returning the same shape.
- Base R alternative: when you cannot add janitor and only need legal syntactic names.

[NOTE]
**Coming from Python pandas?** The closest standalone equivalent is `re.sub(r"\W+", "_", s).lower()` applied with a list comprehension. The `pyjanitor` package ports `clean_names()` but does not expose a direct `make_clean_names()` alias; use list comprehensions for vector-level work.

## Common pitfalls

**Pitfall 1: not assigning the result.** The cleaning function returns a new vector and leaves the input unchanged. Capture the output into x_clean, or assign directly into the names slot of a data frame. Functional purity is a feature, not a bug, because it lets you preview a cleanup before committing to it.

**Pitfall 2: dedup suffixes surprise downstream joins.** If two sources clean to the same label and one becomes total_2, a later left_join keyed on total silently drops that column. Inspect the result by comparing the length of the unique cleaned vector against the original length, and clean once at import so downstream code never has to know about the original spellings.

[WARNING]
**Renaming factor levels with `as.character()` can drop empty levels.** Always assign to `levels(f)` directly, as in pattern 3. Round-tripping through `as.character()` then `factor()` discards levels that have zero observations, which breaks reproducibility when your downstream code expects a fixed level set.

**Pitfall 3: the case option overrides exact custom replacements.** If you map the percent sign to the uppercase token PCT and want that exact spelling, pass case equal to none. The default snake case lowercases everything after substitution, so an uppercase replacement reads as lowercase in the output.

## Try it yourself

**Try it:** Take the vector `messy_cols <- c("Order ID", "Customer.Name", "Sales (USD)", "Sales (USD)")`. Clean it with `make_clean_names()` and assign the result as the names of a 1-row data frame `ex_df <- data.frame(1, 2, 3, 4)`. Print `names(ex_df)`.

```r title="Your turn: clean and assign"
# Try it: clean a vector and use it as column names
messy_cols <- c("Order ID", "Customer.Name", "Sales (USD)", "Sales (USD)")
ex_df <- data.frame(1, 2, 3, 4)

names(ex_df) <- # your code here

names(ex_df)
#> Expected: c("order_id", "customer_name", "sales_usd", "sales_usd_2")
```

<details>
<summary>Click to reveal solution</summary>

```r title="Solution"
messy_cols <- c("Order ID", "Customer.Name", "Sales (USD)", "Sales (USD)")
ex_df <- data.frame(1, 2, 3, 4)

names(ex_df) <- make_clean_names(messy_cols)

names(ex_df)
#> [1] "order_id"     "customer_name" "sales_usd"    "sales_usd_2"
```

**Explanation:** `make_clean_names()` returns a cleaned vector that you assign with `names(df) <-`. The duplicate `"Sales (USD)"` becomes `sales_usd` and `sales_usd_2`, preserving both columns with unique labels.

</details>

## Related janitor functions

After mastering `make_clean_names()`, look at:

- `clean_names()`: the same engine applied to a full data frame in one call
- `remove_empty()`: drop empty rows or columns, often the next step after import
- `row_to_names()`: promote a data row to be the new column names, then clean them
- `get_dupes()`: inspect rows duplicated by one or more columns
- `setNames()`: base R helper to attach a name vector to any named object

For a fuller tour of the janitor package, see the [janitor package guide](janitor-Package-in-R.html). The official documentation lives at [sfirke.github.io/janitor](https://sfirke.github.io/janitor/).

## FAQ

**What is the difference between make_clean_names() and clean_names()?**

`make_clean_names()` operates on a character vector and returns a character vector. `clean_names()` operates on a data frame and returns a data frame with the column names rewritten. The cleaning rules and option set are identical; only the input and output types differ.

**How do I use make_clean_names() with readxl or readr?**

For data frames, prefer `clean_names()` in the pipeline: `read_csv("file.csv") |> clean_names()`. Reach for `make_clean_names()` on sheet or range labels read separately, for example `readxl::excel_sheets("workbook.xlsx") |> make_clean_names()` to build keys before iterating sheets with `purrr::map()`.

**Does make_clean_names() handle non-English or Unicode characters?**

Yes. By default, `ascii = TRUE` transliterates accented Latin characters (`é` to `e`, `ñ` to `n`) using the `Latin-ASCII` rule. Pass `ascii = FALSE` to preserve the originals. The `transliterations` argument accepts other ICU rules for non-Latin scripts.

**Why does make_clean_names() produce _2 and _3 suffixes?**

When two inputs clean to the same result (for example `"Total $"` and `"Total %"` both become `total`), the function appends a numeric suffix to keep each output unique. Set `allow_dupes = TRUE` to skip suffixes when collisions are intentional, such as a long-form key column.

**Can I chain make_clean_names() with the pipe?**

Yes. It accepts a vector as the first argument: `names(df) |> make_clean_names() |> head()`. This previews the cleaned output before you commit. Wrap the result in `setNames()` or assign back to `names(df)` once the output looks right.

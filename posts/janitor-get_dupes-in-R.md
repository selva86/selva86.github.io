---
title: "janitor get_dupes() in R: Find Duplicate Rows With Counts"
slug: "janitor-get_dupes-in-R"
description: "Use janitor get_dupes() to find every duplicate row in an R data frame by chosen columns, with a dupe_count showing how many times each combination appears."
keywords: "janitor get_dupes, get_dupes function R, janitor get_dupes examples, R find duplicate rows, dupe_count janitor, duplicates in R"
mathjax: false
webr: true
date: "2026-05-22"
post_type: "PSEO"
category_id: "function-deep"
subcategory_id: "janitor-functions"
fr_parent: "janitor-Package-in-R.html"
auto_link_terms: "get_dupes()|janitor get_dupes|janitor::get_dupes()|dupe_count|find duplicate rows"
auto_link_case_sensitive: true
target_keyword: "janitor get_dupes"
sibling_block_enabled: true
difficulty: "Beginner"
---

# janitor get_dupes() in R: Find Duplicate Rows With Counts

<p class="lead">The <code>get_dupes()</code> function in janitor returns every duplicate row in a data frame along with a <code>dupe_count</code> column showing how many times each combination appears. Unlike <code>distinct()</code>, which keeps one of each, <code>get_dupes()</code> surfaces ALL copies so you can inspect what is duplicated and why.</p>

[QUICK ANSWER]
get_dupes(df)                                  # duplicates across all columns
get_dupes(df, customer_id)                     # duplicates by one column
get_dupes(df, customer_id, order_date)         # duplicates by composite key
df |> janitor::get_dupes(email)                # pipe-friendly
get_dupes(df, starts_with("name"))             # tidyselect helpers
get_dupes(df, -id, -timestamp)                 # all columns except these
nrow(get_dupes(df, email))                     # how many duplicate rows exist

[DECISION TREE: Is get_dupes() the right tool?]
- list every duplicate row with a count: get_dupes(df, key)
- keep one row per key, drop the rest: distinct(df, key, .keep_all = TRUE)
- flag duplicates without filtering: df |> mutate(dup = duplicated(key))
- count unique combinations only: dplyr::count(df, key, sort = TRUE)
- remove rows with any NA in key: tidyr::drop_na(df, key)
- find rows matching a lookup table: dplyr::semi_join(df, lookup, by = "id")
- check primary-key uniqueness in a test: stopifnot(nrow(get_dupes(df, id)) == 0)

## What get_dupes() does in one sentence

**`get_dupes()` filters a data frame down to rows whose chosen columns appear more than once, then adds a `dupe_count` column so you can see how many copies of each combination exist.** It always returns ALL copies of every duplicate, not just the extra ones.

Reach for it when a key that is supposed to be unique might not be. Audit a customer table, check a join key before merging, or spot rows loaded twice.

## Syntax

**`get_dupes()` takes a data frame and an optional list of columns; if no columns are passed, it uses all of them.** The result is a tibble sorted so duplicates of the same key sit next to each other.

```r title="Load janitor and a sample data frame"
library(janitor)
library(dplyr)

orders <- data.frame(
  customer_id = c(1, 2, 2, 3, 3, 3, 4),
  product     = c("A", "B", "B", "C", "C", "D", "E"),
  qty         = c(1, 2, 2, 5, 5, 1, 3)
)
orders
#>   customer_id product qty
#> 1           1       A   1
#> 2           2       B   2
#> 3           2       B   2
#> 4           3       C   5
#> 5           3       C   5
#> 6           3       D   1
#> 7           4       E   3
```

The full signature is short:

```
get_dupes(dat, ...)
```

`dat` is the data frame; `...` accepts bare column names, tidyselect helpers, or negated columns. The output is always a tibble with one extra column called `dupe_count` placed first.

[TIP]
**Pipe `get_dupes()` straight after every import.** Running `read_csv("file.csv") |> get_dupes(primary_key)` immediately flags whether your supposedly unique key is actually unique. Catching duplication at the door prevents silent fan-out joins downstream that quietly double row counts and inflate every aggregation.

## Six common patterns

### 1. Find duplicates across all columns

```r title="Whole-row duplicates"
orders |>
  get_dupes()
#> # A tibble: 4 x 4
#>   customer_id product   qty dupe_count
#>         <dbl> <chr>   <dbl>      <int>
#> 1           2 B           2          2
#> 2           2 B           2          2
#> 3           3 C           5          2
#> 4           3 C           5          2
```

With no arguments, `get_dupes()` compares the entire row. Rows 2 and 3 are exact copies (`2, B, 2`), and rows 4 and 5 are exact copies (`3, C, 5`). Each group's `dupe_count` shows the size of the cluster.

### 2. Duplicates by one column

```r title="Duplicates by single key"
orders |>
  get_dupes(customer_id)
#> # A tibble: 5 x 4
#>   customer_id dupe_count product   qty
#>         <dbl>      <int> <chr>   <dbl>
#> 1           2          2 B           2
#> 2           2          2 B           2
#> 3           3          3 C           5
#> 4           3          3 C           5
#> 5           3          3 D           1
```

Passing one column finds rows that share a value there even if other columns differ. Customer 3 appears 3 times because the same id ordered both `C` and `D`.

### 3. Duplicates by composite key

```r title="Duplicates by multiple columns"
orders |>
  get_dupes(customer_id, product)
#> # A tibble: 4 x 4
#>   customer_id product dupe_count   qty
#>         <dbl> <chr>        <int> <dbl>
#> 1           2 B                2     2
#> 2           2 B                2     2
#> 3           3 C                2     5
#> 4           3 C                2     5
```

Pass multiple bare column names to define a composite key. This is the most common production use: confirming that `(customer_id, order_date)` or `(user_id, event_id)` uniquely identifies a row.

### 4. Tidyselect helpers

```r title="Choose columns by pattern"
people <- tibble(
  first_name = c("Ann", "Ann", "Bob", "Cara"),
  last_name  = c("Lee", "Lee", "Tan", "Park"),
  email      = c("a@x", "a@y", "b@x", "c@x")
)

people |>
  get_dupes(starts_with("name"))
#> Error: Can't subset columns that don't exist.
#> Hint: did you mean starts_with("first") or starts_with("last")?
```

The first-attempt above fails because no columns START with "name". Use a real prefix:

```r title="Tidyselect with valid prefix"
people |>
  get_dupes(ends_with("name"))
#> # A tibble: 2 x 4
#>   first_name last_name dupe_count email
#>   <chr>      <chr>          <int> <chr>
#> 1 Ann        Lee                2 a@x
#> 2 Ann        Lee                2 a@y
```

`get_dupes()` accepts any tidyselect helper: `starts_with()`, `ends_with()`, `contains()`, `matches()`, `where()`. Useful when your duplicate-key spans several columns sharing a naming convention.

### 5. Negate columns to ignore

```r title="All columns except some"
logs <- tibble(
  user_id   = c(1, 1, 2, 2),
  event     = c("click", "click", "view", "view"),
  timestamp = c(1, 2, 3, 4)
)

logs |>
  get_dupes(-timestamp)
#> # A tibble: 4 x 4
#>   user_id event dupe_count timestamp
#>     <dbl> <chr>      <int>     <dbl>
#> 1       1 click          2         1
#> 2       1 click          2         2
#> 3       2 view           2         3
#> 4       2 view           2         4
```

Negation excludes columns from the duplicate check while keeping them in the output. Common pattern: ignore timestamps or surrogate ids when looking for semantic duplicates (same user, same event, different time).

### 6. Use it as a test in a pipeline

```r title="Assert a primary key is unique"
n_dupes <- nrow(get_dupes(orders, customer_id, product))

if (n_dupes > 0) {
  message("Found ", n_dupes, " duplicate (customer_id, product) rows")
} else {
  message("Key is unique")
}
#> Found 4 duplicate (customer_id, product) rows
```

Because `get_dupes()` returns a tibble, you can use `nrow()` to count violations in a script. Adding this check to every ETL step beats hunting doubled metrics later.

[KEY INSIGHT]
**`get_dupes()` returns ALL copies, not just the extras.** If a value appears 3 times, you get all 3 rows back, with `dupe_count = 3` on each. This is the opposite of `duplicated()` in base R, which returns `FALSE` for the first occurrence and `TRUE` for the rest. The all-copies behavior is what makes `get_dupes()` an inspection tool rather than a filter.

## get_dupes() vs distinct() vs duplicated()

**Three tools deal with duplicate rows; pick by what answer you need.**

| Task | `get_dupes()` | `distinct()` | `duplicated()` |
|---|---|---|---|
| List every duplicate row | yes, with count | no | no |
| Keep one row per key | no | yes | manual |
| Flag rows as duplicate | no | no | yes, logical vector |
| Show the dupe_count | yes | no | no |
| Returns input class | tibble | yes | logical vector |
| Best for inspection | yes | no | no |
| Best for cleaning | no | yes | yes |

When to use which:

- Use `get_dupes()` to audit and inspect. The output answers "which rows are duplicates, and how many times?"
- Use `dplyr::distinct()` to deduplicate. The output is the cleaned data with one row per key.
- Use base R `duplicated()` when you need a logical flag to combine with other conditions, for example `df[!duplicated(df$id) & df$valid, ]`.

For a side-by-side walkthrough of the deduplication option, see [dplyr distinct() in R](dplyr-distinct-in-R.html).

[NOTE]
**Coming from Python pandas?** The closest equivalent is `df[df.duplicated(subset=['key'], keep=False)]` followed by a groupby-size to add a count column. Pandas has no single function with `get_dupes()`'s combined filter-and-count behavior, which is why janitor packs both steps into one call.

## Common pitfalls

**Pitfall 1: NA values are treated as equal.** Two rows with `NA` in the key column count as duplicates of each other. If you want NAs ignored, drop them first with `tidyr::drop_na(df, key) |> get_dupes(key)`.

**Pitfall 2: forgetting that all copies are returned.** A duplicate group of 5 rows produces 5 rows in the output, not 4 (extras only). If you want only the extras, use `get_dupes()` to identify the key then anti-join: `df |> anti_join(distinct(df, key, .keep_all = TRUE))`.

[WARNING]
**Numeric precision can cause silent false negatives.** Two floating-point values that look identical when printed (`0.1 + 0.2` and `0.3`) are NOT equal under the hood, so `get_dupes()` will miss them. For numeric keys, round to a fixed precision first: `df |> mutate(key = round(key, 4)) |> get_dupes(key)`.

**Pitfall 3: empty result is normal.** If no duplicates exist, `get_dupes()` returns a zero-row tibble plus a console message: `No duplicate combinations found of: <columns>`. Treat the message as a pass, not a warning.

## Try it yourself

**Try it:** Use `get_dupes()` on the built-in `iris` data frame to find rows where the same `Sepal.Length` and `Species` combination appears more than once. Save the result to `ex_dupes` and count them.

```r title="Your turn: iris duplicates"
# Try it: find duplicates by Sepal.Length and Species
ex_dupes <- iris |>
  get_dupes(# your code here)

nrow(ex_dupes)
#> Expected: > 100
```

<details>
<summary>Click to reveal solution</summary>

```r title="Solution"
ex_dupes <- iris |>
  get_dupes(Sepal.Length, Species)

nrow(ex_dupes)
#> [1] 134
```

**Explanation:** Passing the two bare column names defines a composite key. Iris has many repeated Sepal.Length values within each species, so most rows participate in some duplicate group. The 134 returned rows include EVERY copy of each duplicated combination, with `dupe_count` showing the group size.

</details>

## Related janitor functions

After mastering `get_dupes()`, look at:

- `clean_names()`: standardize messy column names before deduplication so keys actually match
- `remove_empty()`: drop fully empty rows or columns that can otherwise show up as duplicates
- `tabyl()`: cross-tabulate the duplicated keys to see which values cluster
- `dplyr::distinct()`: keep one row per key once you have confirmed the duplicates are real
- `dplyr::count()`: count unique values without filtering, complementary to `get_dupes()`

For a tour of the wider package, see the [janitor package guide](janitor-Package-in-R.html). The official reference is [sfirke.github.io/janitor](https://sfirke.github.io/janitor/reference/get_dupes.html).

## FAQ

**What does janitor get_dupes() do?**

`get_dupes()` returns every row in a data frame whose chosen columns appear more than once, with an added `dupe_count` column showing the size of each duplicate group. It is an inspection tool: you see all copies, not just the extras, so you can decide whether each duplicate is a data-entry mistake, a legitimate repeat event, or a join that fanned out unexpectedly. The function leaves the input unchanged and returns a new tibble.

**How is get_dupes() different from distinct()?**

`distinct()` deduplicates: it keeps one row per unique combination and discards the rest, leaving you with clean data. `get_dupes()` does the opposite: it surfaces the duplicates so you can examine them. Use `get_dupes()` to audit and understand the problem, then use `distinct()` to actually remove duplicates once you have decided which version of each row to keep.

**Does get_dupes() treat NA values as duplicates?**

Yes. Two rows whose key columns are both `NA` are treated as a duplicate pair and appear in the output with `dupe_count = 2`. If you do not want NAs to count, filter them out before calling: `df |> tidyr::drop_na(key_column) |> get_dupes(key_column)`. This matches how SQL `GROUP BY` typically treats NULLs for the purpose of duplicate detection.

**Can I use get_dupes() to test a primary key in a script?**

Yes, and it is a common pattern. Wrap the call in `nrow()`: `stopifnot(nrow(get_dupes(df, id)) == 0)`. The assertion passes silently when the key is unique and throws a hard error the moment a duplicate appears, which is exactly what you want in a data pipeline that assumes one row per id.

**Why does my numeric column miss duplicates that look identical?**

Floating-point values that print the same can differ in their underlying bits, so `get_dupes()` treats them as distinct. To avoid this, round to a fixed precision before the duplicate check: `df |> mutate(amount = round(amount, 2)) |> get_dupes(amount)`. For string or integer columns the issue does not apply; comparisons there are exact.

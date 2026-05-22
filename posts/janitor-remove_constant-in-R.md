---
title: "janitor remove_constant() in R: Drop Single-Value Columns"
slug: "janitor-remove_constant-in-R"
description: "Use janitor remove_constant() to drop columns where every row has the same value. Covers na.rm, quiet output, model preprocessing, and remove_empty()."
keywords: "janitor remove_constant, remove_constant function R, janitor remove_constant examples, R drop constant columns, zero variance columns R, remove_constant na.rm"
mathjax: false
webr: true
date: "2026-05-22"
post_type: "PSEO"
category_id: "function-deep"
subcategory_id: "janitor-functions"
fr_parent: "janitor-Package-in-R.html"
auto_link_terms: "remove_constant()|janitor remove_constant|janitor::remove_constant()|drop constant columns|zero-variance columns"
auto_link_case_sensitive: true
target_keyword: "janitor remove_constant"
sibling_block_enabled: true
difficulty: "Beginner"
---

# janitor remove_constant() in R: Drop Single-Value Columns

<p class="lead">The <code>remove_constant()</code> function in janitor drops columns of a data frame where every row holds the same value. It clears zero-variance predictors before modeling, prunes leftover flag columns after a filter, and pairs with <code>remove_empty()</code> for a complete import cleanup.</p>

[QUICK ANSWER]
remove_constant(df)                                  # drop all single-value cols
remove_constant(df, na.rm = TRUE)                    # ignore NA in the check
remove_constant(df, quiet = FALSE)                   # print removed column names
remove_constant(df, na.rm = TRUE, quiet = FALSE)     # combine ignore NA and print
df |> janitor::remove_constant()                     # pipe-friendly
df |> remove_empty() |> remove_constant()            # full import cleanup chain
sapply(df, \(x) length(unique(x))) == 1              # manual constancy check
remove_constant(df) |> ncol()                        # confirm shape after pruning

[DECISION TREE: Is remove_constant() the right tool?]
- drop columns where every value is identical: remove_constant(df)
- drop columns by exact name: select(df, -bad_col)
- drop fully blank columns of NA: remove_empty(df, which = "cols")
- drop predictors near-zero variance: caret::nearZeroVar()
- drop columns by type or pattern: select(df, where(is.numeric))
- keep only constant columns for an audit: df[, sapply(df, \(x) length(unique(x)) == 1)]
- drop near-empty columns by threshold: remove_empty(df, which = "cols", cutoff = 0.9)

## What remove_constant() does in one sentence

**`remove_constant()` deletes any column whose values are all identical, returning a data frame with the same row count but fewer columns.** It is the column-side companion to `remove_empty()`, targeting columns that carry zero information rather than columns that are blank.

The function pays off in three situations. After reading configuration-shaped data from a wide spreadsheet, you often see columns like `survey_year = 2024` repeated on every row. After a `filter()` step, columns that defined the filter (`status == "active"`) collapse to one value. Before fitting a linear model or running PCA, zero-variance predictors trigger numerical errors. One call handles all three.

## Syntax

**`remove_constant()` takes a data frame plus `na.rm` and `quiet` arguments.** Both flags default to safe values for exploratory work.

```r title="Load janitor and a constant-heavy frame"
library(janitor)
library(dplyr)

audit <- data.frame(
  id       = 1:5,
  status   = c("active", "active", "active", "active", "active"),
  region   = c("EU", "EU", "EU", "EU", "EU"),
  signups  = c(120, 87, 92, 145, 73),
  archived = c(FALSE, FALSE, FALSE, FALSE, FALSE)
)
audit
#>   id status region signups archived
#> 1  1 active     EU     120    FALSE
#> 2  2 active     EU      87    FALSE
#> 3  3 active     EU      92    FALSE
#> 4  4 active     EU     145    FALSE
#> 5  5 active     EU      73    FALSE
```

The signature is short:

```
remove_constant(dat, na.rm = FALSE, quiet = TRUE)
```

Only `dat` is required. With defaults, NAs count as a distinct value and removed columns are not announced. Flip `na.rm` to ignore missing values, and flip `quiet` to print which columns left.

[TIP]
**Run remove_constant() right after a filter step.** A `filter(df, region == "EU")` makes `region` a constant in the result, but it stays in the data frame and clutters downstream summaries. A single `remove_constant()` after the filter prunes those obvious leftovers without naming them by hand.

## Six everyday use cases

### 1. Drop columns that are entirely the same value

**The default call removes any all-same column in one pass.** It does not modify the row count.

```r title="Default constant cleanup"
audit |>
  remove_constant()
#>   id signups
#> 1  1     120
#> 2  2      87
#> 3  3      92
#> 4  4     145
#> 5  5      73
```

Three columns vanish: `status`, `region`, and `archived` each held a single value. `id` and `signups` survive because they vary.

### 2. Print which columns were dropped

**Set `quiet = FALSE` to see a one-line report.** Useful inside scripts where silent column loss is confusing.

```r title="Announce removed columns"
audit |>
  remove_constant(quiet = FALSE)
#> Removing 3 constant columns of data: status, region, archived.
#>   id signups
#> 1  1     120
#> 2  2      87
#> ...
```

### 3. Treat NA as a distinct value (default)

**Mixed-NA columns survive the default check because NA counts as its own value.** This matters when imported data has occasional missing cells.

```r title="NA breaks constancy by default"
mixed <- data.frame(
  always_one = c(1, 1, 1, 1),
  one_or_na  = c(1, NA, 1, 1),
  all_na     = c(NA, NA, NA, NA)
)
remove_constant(mixed)
#>   one_or_na all_na
#> 1         1     NA
#> 2        NA     NA
#> 3         1     NA
#> 4         1     NA
```

`always_one` is dropped (one value, no NAs). `one_or_na` survives because NA and 1 differ. `all_na` survives because all values are NA, which is one value, but the check sees a single distinct NA.

### 4. Ignore NA in the check

**`na.rm = TRUE` strips NA before measuring constancy.** Columns with one non-NA value plus NAs get dropped.

```r title="Treat NA-mixed as constant"
remove_constant(mixed, na.rm = TRUE)
#>   (none returned, all 3 collapse)
```

With `na.rm = TRUE`, `one_or_na` becomes constant (only 1 remains), and `all_na` becomes constant (no values remain, which counts as zero distinct). Use this mode when NAs are noise, not signal.

### 5. Chain with remove_empty() for a full import cleanup

**The pair handles both blank and constant pollution in one expression.** This is the import-time recipe for spreadsheet exports.

```r title="Full cleanup chain"
audit |>
  remove_empty() |>
  remove_constant(quiet = FALSE)
#> Removing 3 constant columns of data: status, region, archived.
#>   id signups
#> 1  1     120
#> ...
```

Order matters slightly: `remove_empty()` first prunes all-NA columns so `remove_constant()` does not waste a pass on them.

### 6. Strip zero-variance predictors before modeling

**`lm()`, `glm()`, and PCA reject columns with no variance.** A pre-fit cleanup avoids cryptic errors deeper in the pipeline.

```r title="Pre-model cleanup"
model_df <- iris
model_df$constant_flag <- "A"     # simulate a polluted column
clean_df <- remove_constant(model_df, quiet = FALSE)
#> Removing 1 constant columns of data: constant_flag.

fit <- lm(Sepal.Length ~ ., data = clean_df)
length(coef(fit))
#> [1] 6
```

Without `remove_constant()`, the same `lm()` call would silently coerce `constant_flag` and inflate the design matrix, or fail outright in `model.matrix()`.

[KEY INSIGHT]
**A constant column carries no signal, so models cannot learn from it and inference cannot bound it.** Linear regression hits a singular design matrix, glmnet flags it, and tree-based learners spend splits on noise. Treat `remove_constant()` as a standard preprocessing step, not an optional cleanup.

## remove_constant() vs select() vs remove_empty()

**Each function targets a different kind of column problem.** Picking the right one avoids over-pruning or leaving dirt behind.

| Function | Drops based on | Best for |
|---|---|---|
| `remove_constant(df)` | every value identical | post-filter cleanup, zero-variance pruning |
| `remove_empty(df, which = "cols")` | every value is NA | spreadsheet imports with blank padding |
| `select(df, -col)` | exact column name | you already know what to drop |
| `dplyr::select(df, where(...))` | a predicate on the column | type or pattern-based filtering |
| `caret::nearZeroVar(df)` | low variance, not just constant | model preprocessing where 95% same counts |

`remove_constant()` is the strictest of these: only fully constant columns go. Use `nearZeroVar()` when 99.5% same-value is also a problem.

## Common pitfalls

[WARNING]
**`na.rm = FALSE` is the default, so a column of mostly the same value mixed with NAs survives.** Many import pipelines hit this trap: a column you expect to be constant carries one NA and remains. If you want NA-tolerant pruning, set `na.rm = TRUE` explicitly.

A second trap is shape assumptions downstream. Code that hard-codes column indices (`df[, 5]`) breaks after `remove_constant()` shifts positions. Address columns by name to stay safe.

A third pitfall is grouped data frames. `remove_constant()` ungroups the result without warning. If you need the groups back, call `group_by()` again after the cleanup.

## Try it yourself

**Try it:** Build a data frame with two varying columns and one column where every row holds `"yes"`. Use `remove_constant()` to drop the constant, then confirm the result has 2 columns.

```r title="Your turn drop the constant"
library(janitor)
ex_df <- data.frame(
  ex_id    = 1:4,
  ex_score = c(10, 25, 13, 18),
  ex_flag  = c("yes", "yes", "yes", "yes")
)
ex_pruned <- # your code here

ncol(ex_pruned)
#> Expected: 2
```

<details>
<summary>Click to reveal solution</summary>

```r title="Solution"
ex_pruned <- remove_constant(ex_df)
names(ex_pruned)
#> [1] "ex_id"    "ex_score"
ncol(ex_pruned)
#> [1] 2
```

**Explanation:** `ex_flag` repeats "yes" in every row, so `remove_constant()` drops it. The varying columns `ex_id` and `ex_score` are preserved.

</details>

## Related janitor functions

- [`remove_empty()`](janitor-remove_empty-in-R.html) drops fully NA rows and columns.
- [`get_dupes()`](janitor-get_dupes-in-R.html) surfaces duplicate rows before pruning.
- [`clean_names()`](janitor-clean_names-in-R.html) standardizes column names at import.
- [`compare_df_cols()`](janitor-compare_df_cols-in-R.html) compares column structures across two data frames.
- For deeper background see the [janitor package overview](janitor-Package-in-R.html) and the [official tidyverse reference](https://sfirke.github.io/janitor/reference/remove_constant.html).

## FAQ

**Does remove_constant() work on character, factor, and logical columns the same way?**

Yes. The constancy check uses `length(unique(x))` on each column, which treats every type identically. A factor with one level present in the data is constant. A logical column of all `FALSE` is constant. A character column of repeated `"A"` is constant. The function does not look at factor level definitions, only the values actually present in the rows.

**Why does a column of all NAs survive the default call?**

Because `na.rm = FALSE` counts NA as a value. A column of `c(NA, NA, NA)` has one distinct value (NA), so it is technically constant. But the function's NA detection treats this as a borderline case that `remove_empty()` is better suited to handle. Use `remove_empty(df, which = "cols")` to strip all-NA columns explicitly.

**Can remove_constant() be used before training a model to avoid zero-variance errors?**

Yes, and this is one of its most common uses. `lm()`, `glm()`, and PCA all fail or warn on constant predictors because the design matrix becomes singular. Running `remove_constant(df)` before `model.matrix()` or any `~ .` formula avoids the trap. For models that tolerate near-constant predictors but penalize them, `caret::nearZeroVar()` is the stricter alternative.

**Does remove_constant() preserve tibble and data.table classes?**

For tibbles, yes: the return is a tibble. For data.tables, the function coerces to a data.frame on return, which loses data.table semantics. If you need data.table preserved, copy the relevant columns explicitly with `dt[, ..keep_cols]` after computing which columns to keep.

**Is there an option to keep certain constant columns?**

No built-in argument exists. The workaround is to set the columns aside before the call and rejoin them after: `keep <- df[, "must_keep"]; pruned <- remove_constant(df[, setdiff(names(df), "must_keep")]); bind_cols(keep, pruned)`. For a more flexible rule, write the constancy check by hand: `df[, sapply(df, \(x) length(unique(x)) > 1 | names(df) %in% "must_keep")]`.

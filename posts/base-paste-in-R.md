---
title: "paste() and paste0() in R: Concatenate Strings"
slug: "base-paste-in-R"
description: "Use base R paste() and paste0() to concatenate strings or vectors in R. Covers sep, collapse, vectorized behavior, sprintf alternative, and 5 examples."
keywords: "paste in R, paste0 R, R concatenate strings, R join strings, paste vs paste0, R sprintf alternative, str_c R"
mathjax: false
webr: true
date: "2026-05-10"
post_type: "PSEO"
category_id: "function-deep"
subcategory_id: "base-r-essentials"
fr_parent: "R-Basic-Syntax-Beginners-Guide.html"
auto_link_terms: "paste()|paste0()|R paste|concatenate strings|R string join"
auto_link_case_sensitive: false
target_keyword: "paste in R"
sibling_block_enabled: true
difficulty: "Beginner"
---

# paste() and paste0() in R: Concatenate Strings

<p class="lead">The <code>paste()</code> and <code>paste0()</code> functions in base R combine strings or vectors into a single string or character vector. <code>paste0</code> is a shortcut for <code>paste(..., sep = "")</code>.</p>

[QUICK ANSWER]
paste("Hello", "world")                       # "Hello world" (default sep = " ")
paste0("Hello", "world")                      # "Helloworld" (no separator)
paste("a", "b", sep = "-")                    # "a-b"
paste(c("a","b","c"), collapse = ",")         # "a,b,c" (one string)
paste(c("a","b"), c("1","2"), sep = "_")      # vectorized: "a_1" "b_2"
paste(c("a","b"), c("1","2"), collapse = "-") # "a 1-b 2"
sprintf("%s is %d", "Alice", 30)              # alternative for templating

[DECISION TREE: Is paste() the right tool?]
- combine 2+ strings: paste() (with sep) or paste0() (no sep)
- collapse a vector to one string: paste(x, collapse = ",")
- vectorized recycling: paste(c1, c2, ..., sep = ...)
- string template with placeholders: sprintf() or glue::glue()
- combine columns in data frame: tidyr::unite()
- format numbers with specific width: sprintf or format
- file paths: file.path() (handles separators correctly)

## What paste() does in one sentence

**`paste(...)` takes any number of strings or vectors and combines them, controlled by `sep` (between inputs) and `collapse` (between elements of the result vector).** Without `collapse`, the output is a vector; with `collapse`, the result is a single string.

This is the most-used string concatenation function in base R. Every R programmer learns it early. `paste0()` is the no-separator shortcut.

## Syntax

**`paste(..., sep = " ", collapse = NULL)`. Variadic arguments are recycled to the longest length.**

```r title="Basic paste with default separator"
paste("Hello", "world")
#> [1] "Hello world"

paste("a", "b", "c")
#> [1] "a b c"

paste0("Hello", "world")
#> [1] "Helloworld"
```

[TIP]
**`paste0()` is `paste(..., sep = "")` and is FASTER for the common no-separator case.** Reach for paste0 when you do not need a separator. Use paste with sep when you do.

## Five common patterns

### 1. Two strings into one

```r title="Combine first and last name"
paste("Alice", "Smith")
#> [1] "Alice Smith"

paste0("user_", "123")
#> [1] "user_123"
```

### 2. Custom separator

```r title="Use a dash separator"
paste("2024", "01", "15", sep = "-")
#> [1] "2024-01-15"
```

### 3. Vectorized concatenation

```r title="paste recycles inputs element-wise"
paste(c("a","b","c"), c("1","2","3"), sep = "_")
#> [1] "a_1" "b_2" "c_3"
```

Pairs of elements are joined. Recycling rules apply if the lengths differ.

### 4. Collapse vector to single string

```r title="Make one comma-separated string"
paste(c("apple","banana","cherry"), collapse = ", ")
#> [1] "apple, banana, cherry"
```

`collapse = ", "` joins all elements of the result with the specified separator into ONE string.

### 5. Combine sep and collapse

```r title="First combine pairs, then join"
paste(c("a","b"), c("1","2"), sep = "_", collapse = "-")
#> [1] "a_1-b_2"
```

`sep` joins INPUT vectors element-wise. `collapse` joins the resulting vector into one string.

[KEY INSIGHT]
**`sep` is for COMBINING multiple INPUTS. `collapse` is for COMBINING the RESULT VECTOR into one string.** They serve different purposes. Both can be used together; if neither is set (or only sep), the result is a vector.

## paste() vs sprintf() vs glue::glue() vs str_c()

**Four ways to build strings in R, each with different strengths.**

| Function | Best for | Performance | Readability |
|---|---|---|---|
| `paste()` / `paste0()` | Simple concatenation | Fast | OK |
| `sprintf()` | Format with placeholders | Fast | OK for short |
| `glue::glue()` | Templates with variable interpolation | Medium | Best for complex |
| `stringr::str_c()` | Tidyverse style | Fast | Cleaner NA behavior |

When to use which:

- Use `paste0` for simple "join these strings".
- Use `sprintf` for fixed-width / formatted output.
- Use `glue` when you embed variables in long template strings.
- Use `str_c` if you need predictable NA behavior in tidyverse pipelines.

## Common pitfalls

**Pitfall 1: paste with NA propagates.** `paste("Alice", NA)` returns "Alice NA" (the NA is converted to "NA"). Use `str_c()` or filter NAs first if this is wrong.

**Pitfall 2: forgetting collapse.** `paste(c("a","b"))` returns the SAME vector unchanged (length 2). To get a single string, add `collapse = ""`.

[WARNING]
**Numeric inputs are silently coerced to character.** `paste("x", 5)` returns "x 5", not an error. This is usually fine but sometimes hides bugs (e.g., `paste("x", NULL)` returns "x" silently because NULL has length 0).

## Try it yourself

**Try it:** Build file names like `report_2024.csv`, `report_2025.csv`, `report_2026.csv` from a years vector. Save to `ex_files`.

```r title="Your turn: build file names"
years <- c(2024, 2025, 2026)

ex_files <- # your code here

ex_files
#> Expected: c("report_2024.csv", "report_2025.csv", "report_2026.csv")
```

<details>
<summary>Click to reveal solution</summary>

```r title="Solution"
ex_files <- paste0("report_", years, ".csv")
ex_files
#> [1] "report_2024.csv" "report_2025.csv" "report_2026.csv"
```

**Explanation:** `paste0` with no separator joins "report_", each year, and ".csv" element-wise. Result is a 3-element character vector.

</details>

## Related string functions

After mastering paste, look at:

- `sprintf()`: format with %s, %d, %f, etc.
- `glue::glue()`: template-based interpolation (`{var}` syntax)
- `stringr::str_c()`: stringr's vectorized concatenation
- `format()`: format numbers with specific width and digits
- `file.path()`: build file paths with the right OS separator
- `tidyr::unite()`: data frame column-wise paste

For embedding variables in long template strings, `glue("Hello {name}, you are {age}")` is much cleaner than `paste0`.

## FAQ

**What is the difference between paste and paste0 in R?**

`paste0(...)` is `paste(..., sep = "")`: it concatenates with NO separator. `paste(...)` defaults to `sep = " "`. Use paste0 when you do not want a space (or any separator); paste with sep otherwise.

**How do I concatenate strings in R?**

`paste0("Hello", "world")` for no separator. `paste("Hello", "world", sep = "-")` for a custom separator. For collapsing a vector to one string: `paste(c("a","b"), collapse = "-")`.

**What is the difference between sep and collapse in paste?**

`sep` joins MULTIPLE INPUTS element-wise (e.g., paste(c("a","b"), c("1","2"), sep = "_") returns c("a_1","b_2")). `collapse` joins the RESULT VECTOR into a single string (e.g., paste(..., collapse = ",") returns "a,b").

**How do I paste with formatting like sprintf?**

Use `sprintf("%s is %d years old", name, age)` for formatted output. paste does not interpolate variables into a template the way sprintf does.

**Why does paste with NA produce "NA"?**

paste converts every input to character; `as.character(NA)` is "NA" (the string). To skip NAs, use `stringr::str_c()` (returns NA when any input is NA) or filter NAs before pasting.

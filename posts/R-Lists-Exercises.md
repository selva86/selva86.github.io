---
title: "R Lists Exercises: 20 Subsetting, Iteration and Nesting Problems"
slug: "R-Lists-Exercises"
description: "Twenty interactive R list exercises covering create, name, single vs double bracket subsetting, modify, lapply, vapply, Map, rapply, nested list flattening, and list to data frame conversion."
keywords: "R lists exercises, R list practice, R list subsetting, R lapply exercises, R nested list"
mathjax: false
webr: true
date: "2026-05-13"
post_type: "EX"
sidebar_title: "R Lists (20 problems)"
sidebar_order: 160
fr_parent: "R-Lists.html"
auto_link_terms: "r lists exercises|r list practice|r list subsetting|r lapply exercises|r nested list"
auto_link_case_sensitive: false
target_keyword: "R lists exercises"
sibling_block_enabled: false
difficulty: "Mixed"
---

# R Lists Exercises: 20 Subsetting, Iteration and Nesting Problems

<p class="lead">Twenty runnable practice problems on R lists: build heterogeneous and nested lists, name and rename elements, master the <code>[</code> versus <code>[[</code> distinction, modify and trim entries safely, iterate with <code>lapply</code>, <code>sapply</code>, <code>vapply</code> and <code>Map</code>, flatten with <code>unlist</code> and <code>rapply</code>, and convert between lists and data frames. Each solution is hidden behind a reveal block.</p>

A list is R's only general container, and most confusion in the language traces back to one fact: `[` returns a list, `[[` returns the element. These exercises drill that distinction, then push into iteration patterns where the choice between `sapply`, `vapply` and `Map` actually matters, and finish on the everyday task of pivoting nested model output into a flat data frame.

```r title="Run this once before any exercise"
library(tibble)
```

## Section 1. Build and inspect lists (4 problems)

### Exercise 1.1: Construct a heterogeneous profile list with four fields

**Task:** A hiring platform stores each candidate as a single record holding mixed data types. Build a list named `ex_1_1` with four elements: `name = "Ada Lovelace"`, `age = 36`, `skills = c("R", "Python", "SQL")`, and `employed = TRUE`. Confirm by printing the list, then save it to `ex_1_1`.

**Expected result:**

```
#> $name
#> [1] "Ada Lovelace"
#>
#> $age
#> [1] 36
#>
#> $skills
#> [1] "R"      "Python" "SQL"
#>
#> $employed
#> [1] TRUE
```

**Difficulty:** Beginner

[HINTS]
A list, unlike an atomic vector, can hold values of different kinds side by side, so each field keeps its own type.
Pass four named arguments to `list()` - `name`, `age`, `skills`, `employed` - and keep the three skills wrapped in `c()`.

```r title="Your turn"
ex_1_1 <- # your code here
ex_1_1
```

<details>
<summary>Click to reveal solution</summary>

```r title="Solution"
ex_1_1 <- list(
  name     = "Ada Lovelace",
  age      = 36,
  skills   = c("R", "Python", "SQL"),
  employed = TRUE
)
ex_1_1
#> $name
#> [1] "Ada Lovelace"
#>
#> $age
#> [1] 36
#>
#> $skills
#> [1] "R"      "Python" "SQL"
#>
#> $employed
#> [1] TRUE
```

**Explanation:** Unlike an atomic vector, a list does not coerce its elements to a common type, so a string, a number, a character vector and a logical can coexist as siblings. Names are optional but make `$` access possible; without them you must use positional indexing. A common mistake is wrapping the values in `c()`, which would coerce them all to character.

</details>

### Exercise 1.2: Inspect structure, length and names of a list

**Task:** Given `ex_1_1` from the previous exercise, build a small audit summary as a named list with three elements: `n` (the number of top-level elements via `length()`), `nms` (the element names via `names()`), and `types` (a character vector of `class()` for each element). Save the audit to `ex_1_2`.

**Expected result:**

```
#> $n
#> [1] 4
#>
#> $nms
#> [1] "name"     "age"      "skills"   "employed"
#>
#> $types
#>      name       age    skills  employed
#> "character" "numeric" "character" "logical"
```

**Difficulty:** Beginner

[HINTS]
You need three separate facts about the list: how many elements it has, what they are called, and what kind each one is.
Build a `list()` whose elements are `length()`, `names()`, and `sapply(ex_1_1, class)`.

```r title="Your turn"
ex_1_2 <- # your code here
ex_1_2
```

<details>
<summary>Click to reveal solution</summary>

```r title="Solution"
ex_1_2 <- list(
  n     = length(ex_1_1),
  nms   = names(ex_1_1),
  types = sapply(ex_1_1, class)
)
ex_1_2
#> $n
#> [1] 4
#>
#> $nms
#> [1] "name"     "age"      "skills"   "employed"
#>
#> $types
#>      name       age    skills  employed
#> "character" "numeric" "character" "logical"
```

**Explanation:** `length()` on a list returns the count of top-level elements only, never the total atoms inside. `names()` returns `NULL` if no names were set, which is a useful guard for defensive code. `sapply(x, class)` simplifies to a named character vector here because every element returns a length-one string. For a one-shot human-readable view, `str(ex_1_1)` is the idiomatic alternative.

</details>

### Exercise 1.3: Create an empty list and grow it by assignment

**Task:** Some workflows accumulate results inside a loop. Start with an empty list `ex_1_3 <- list()`, then assign three named elements one at a time: `ex_1_3$alpha <- 1:3`, `ex_1_3$beta <- letters[1:3]`, and `ex_1_3$gamma <- TRUE`. Print the final list and save it to `ex_1_3`.

**Expected result:**

```
#> $alpha
#> [1] 1 2 3
#>
#> $beta
#> [1] "a" "b" "c"
#>
#> $gamma
#> [1] TRUE
```

**Difficulty:** Beginner

[HINTS]
An empty container can gain elements one at a time, each assignment naming a fresh slot.
Write three lines assigning into `ex_1_3$alpha`, `ex_1_3$beta`, and `ex_1_3$gamma`.

```r title="Your turn"
ex_1_3 <- list()
# your code here
ex_1_3
```

<details>
<summary>Click to reveal solution</summary>

```r title="Solution"
ex_1_3 <- list()
ex_1_3$alpha <- 1:3
ex_1_3$beta  <- letters[1:3]
ex_1_3$gamma <- TRUE
ex_1_3
#> $alpha
#> [1] 1 2 3
#>
#> $beta
#> [1] "a" "b" "c"
#>
#> $gamma
#> [1] TRUE
```

**Explanation:** Growing a list with `$` assignment is O(n) per write in R because each assignment copies the list, so for large loops you should pre-allocate with `vector("list", n)` and write to `out[[i]]`. For small fixed structures like this one the readability is worth more than the speed. Note that `ex_1_3[["alpha"]] <- 1:3` is equivalent to `ex_1_3$alpha <- 1:3`.

</details>

### Exercise 1.4: Rename and reorder list elements

**Task:** Given `raw <- list(a = 1, b = 2, c = 3)`, produce a new list `ex_1_4` whose elements are reordered to `c, a, b` and whose names are simultaneously uppercased to `C, A, B`. Do this without recomputing the values, using indexing by name and `setNames()` or `names()<-`. Save to `ex_1_4`.

**Expected result:**

```
#> $C
#> [1] 3
#>
#> $A
#> [1] 1
#>
#> $B
#> [1] 2
```

**Difficulty:** Intermediate

[HINTS]
You can pick elements in a new order and relabel them without recomputing any of the stored values.
Index `raw` with `c("c", "a", "b")` to reorder, then wrap that in `setNames()` with `c("C", "A", "B")`.

```r title="Your turn"
raw <- list(a = 1, b = 2, c = 3)
ex_1_4 <- # your code here
ex_1_4
```

<details>
<summary>Click to reveal solution</summary>

```r title="Solution"
raw <- list(a = 1, b = 2, c = 3)
ex_1_4 <- setNames(raw[c("c", "a", "b")], c("C", "A", "B"))
ex_1_4
#> $C
#> [1] 3
#>
#> $A
#> [1] 1
#>
#> $B
#> [1] 2
```

**Explanation:** Indexing with a character vector reorders and selects in one step, which is the cleanest pattern when you want both. `setNames()` is a wrapper around `names(x) <- value` that returns the renamed object, so it composes well inside a pipeline. If you only want to rename without reordering, `names(raw) <- toupper(names(raw))` is more direct. Position-based reordering would use a numeric index instead.

</details>

## Section 2. Single bracket versus double bracket (4 problems)

### Exercise 2.1: Return a length-one sublist versus the inner element

**Task:** Given `box <- list(fruit = "apple", count = 7, fresh = TRUE)`, use single-bracket indexing to extract a sublist containing only `fruit`, and double-bracket indexing to extract the raw string value of `fruit`. Save the sublist to `ex_2_1a` and the bare string to `ex_2_1b`, then bundle both into a result list `ex_2_1 = list(sub = ex_2_1a, raw = ex_2_1b)`.

**Expected result:**

```
#> $sub
#> $sub$fruit
#> [1] "apple"
#>
#>
#> $raw
#> [1] "apple"
```

**Difficulty:** Intermediate

[HINTS]
One indexing style keeps the wrapper around the result, the other hands you the bare value held inside it.
Use `box["fruit"]` for the length-one sublist and `box[["fruit"]]` for the raw string.

```r title="Your turn"
box <- list(fruit = "apple", count = 7, fresh = TRUE)
ex_2_1a <- # your code here
ex_2_1b <- # your code here
ex_2_1 <- list(sub = ex_2_1a, raw = ex_2_1b)
ex_2_1
```

<details>
<summary>Click to reveal solution</summary>

```r title="Solution"
box <- list(fruit = "apple", count = 7, fresh = TRUE)
ex_2_1a <- box["fruit"]
ex_2_1b <- box[["fruit"]]
ex_2_1 <- list(sub = ex_2_1a, raw = ex_2_1b)
ex_2_1
#> $sub
#> $sub$fruit
#> [1] "apple"
#>
#>
#> $raw
#> [1] "apple"
```

**Explanation:** Single bracket `[` always preserves the container type, so indexing a list with `[` returns a (shorter) list. Double bracket `[[` strips one level of nesting and returns the element itself, so `box[["fruit"]]` gives the character vector. This distinction is the single most common source of bugs when reading model output: `lm_fit["coefficients"]` is a list of length one, but `lm_fit[["coefficients"]]` is the named numeric vector you actually want.

</details>

### Exercise 2.2: Select multiple list elements by name to build a subset

**Task:** Working with a results record `res <- list(model = "lm", r2 = 0.84, rmse = 1.2, n = 200, fitted_at = "2026-05-13")`, build a sublist containing only the diagnostic fields `r2`, `rmse` and `n`, in that order, using a single bracket call. Save the resulting sublist to `ex_2_2`.

**Expected result:**

```
#> $r2
#> [1] 0.84
#>
#> $rmse
#> [1] 1.2
#>
#> $n
#> [1] 200
```

**Difficulty:** Intermediate

[HINTS]
Selecting several fields at once keeps the result the same shape as the container you started from.
Pass the character vector `c("r2", "rmse", "n")` inside single brackets on `res`.

```r title="Your turn"
res <- list(model = "lm", r2 = 0.84, rmse = 1.2, n = 200, fitted_at = "2026-05-13")
ex_2_2 <- # your code here
ex_2_2
```

<details>
<summary>Click to reveal solution</summary>

```r title="Solution"
res <- list(model = "lm", r2 = 0.84, rmse = 1.2, n = 200, fitted_at = "2026-05-13")
ex_2_2 <- res[c("r2", "rmse", "n")]
ex_2_2
#> $r2
#> [1] 0.84
#>
#> $rmse
#> [1] 1.2
#>
#> $n
#> [1] 200
```

**Explanation:** A character vector inside single brackets selects multiple elements and preserves their list structure, which is the right behaviour when you want to pass a clean subset onward. `[[` cannot take a multi-element vector of names in this way, so for any selection of size two or more you must use `[`. Negative indexing by name is not supported; to exclude fields use `setdiff()` on the names first.

</details>

### Exercise 2.3: Dollar shortcut versus double bracket on dynamic names

**Task:** Suppose the name of the element to extract is stored in a variable `target <- "rmse"`. Show that `res$target` returns `NULL` because `$` does not evaluate `target`, while `res[[target]]` returns the expected scalar. Build a length-two list with elements `dollar` and `doublebracket` capturing both, save it to `ex_2_3`, and use `res` from Exercise 2.2.

**Expected result:**

```
#> $dollar
#> NULL
#>
#> $doublebracket
#> [1] 1.2
```

**Difficulty:** Intermediate

[HINTS]
One accessor treats the name you hand it literally, the other evaluates the variable to a name first.
Capture `res$target` and `res[[target]]` as the two named elements inside a `list()`.

```r title="Your turn"
target <- "rmse"
ex_2_3 <- # your code here
ex_2_3
```

<details>
<summary>Click to reveal solution</summary>

```r title="Solution"
target <- "rmse"
ex_2_3 <- list(
  dollar        = res$target,
  doublebracket = res[[target]]
)
ex_2_3
#> $dollar
#> NULL
#>
#> $doublebracket
#> [1] 1.2
```

**Explanation:** `$name` is non-standard evaluation: R looks up the literal symbol `target` as an element name, finds none, and returns `NULL` silently rather than erroring. `[[var]]` is standard evaluation, so it evaluates `target` to `"rmse"` first and then looks up that key. The silent `NULL` from `$` is a frequent source of bugs when refactoring hard-coded names into variables, which is why functions that accept user-specified column names always use `[[` internally.

</details>

### Exercise 2.4: Recursive double bracket to reach into a nested list

**Task:** Given `tree <- list(a = list(b = list(c = 42, d = 99), e = "leaf"))`, retrieve the value `42` using the recursive form of double bracket: a vector of names passed to `[[`. Do not chain `[[ ]][[ ]][[ ]]`; use a single call instead. Save the answer to `ex_2_4` and confirm with `class(ex_2_4)`.

**Expected result:**

```
#> [1] 42
#> [1] "numeric"
```

**Difficulty:** Intermediate

[HINTS]
A single descent can walk several levels deep when you hand it the whole path at once.
Pass the vector `c("a", "b", "c")` to `tree[[ ]]` in one call.

```r title="Your turn"
tree <- list(a = list(b = list(c = 42, d = 99), e = "leaf"))
ex_2_4 <- # your code here
ex_2_4
class(ex_2_4)
```

<details>
<summary>Click to reveal solution</summary>

```r title="Solution"
tree <- list(a = list(b = list(c = 42, d = 99), e = "leaf"))
ex_2_4 <- tree[[c("a", "b", "c")]]
ex_2_4
#> [1] 42
class(ex_2_4)
#> [1] "numeric"
```

**Explanation:** `[[` accepts a vector of indices or names and walks the structure level by level, so `tree[[c("a", "b", "c")]]` is shorthand for `tree[["a"]][["b"]][["c"]]`. This recursive form is concise but throws if any intermediate level is missing, unlike the explicit chain which would fail at the same point with a clearer message. The mixed form `tree[[c("a", "b")]][["c"]]` is also valid when only part of the path is known up front.

</details>

## Section 3. Modify, add and remove elements (3 problems)

### Exercise 3.1: Replace an element in place using double bracket assignment

**Task:** A configuration record `cfg <- list(host = "localhost", port = 5432L, ssl = FALSE)` needs the port updated to `6543L` for a new environment. Use `[[` assignment to mutate just that field while leaving the other two untouched, and save the result to `ex_3_1`.

**Expected result:**

```
#> $host
#> [1] "localhost"
#>
#> $port
#> [1] 6543
#>
#> $ssl
#> [1] FALSE
```

**Difficulty:** Beginner

[HINTS]
You can overwrite one field of a record while every other field stays exactly as it was.
Assign the new value `6543L` to `cfg[["port"]]`.

```r title="Your turn"
cfg <- list(host = "localhost", port = 5432L, ssl = FALSE)
# your code here
ex_3_1 <- cfg
ex_3_1
```

<details>
<summary>Click to reveal solution</summary>

```r title="Solution"
cfg <- list(host = "localhost", port = 5432L, ssl = FALSE)
cfg[["port"]] <- 6543L
ex_3_1 <- cfg
ex_3_1
#> $host
#> [1] "localhost"
#>
#> $port
#> [1] 6543
#>
#> $ssl
#> [1] FALSE
#>
```

**Explanation:** `[[<-` replaces the element identified by the index or name with the new value, preserving the rest of the list. Using `$port <- 6543L` produces the same outcome and is more idiomatic when the name is a literal. Beware: `cfg["port"] <- list(6543L)` also works but requires wrapping the value in `list()` because `[<-` expects a list on the right-hand side; this is a frequent source of confusion.

</details>

### Exercise 3.2: Remove an element from a list by setting it to NULL

**Task:** Given the configuration `cfg <- list(host = "localhost", port = 5432L, ssl = FALSE, debug = TRUE)`, drop the `debug` field entirely (not just set it to `FALSE`) by assigning `NULL` to it via `[[`. Save the trimmed list to `ex_3_2` and confirm it has three elements via `length()`.

**Expected result:**

```
#> $host
#> [1] "localhost"
#>
#> $port
#> [1] 5432
#>
#> $ssl
#> [1] FALSE
#>
#> [1] 3
```

**Difficulty:** Intermediate

[HINTS]
Dropping a field is different from blanking it - the slot itself should disappear and the length shrink.
Assign `NULL` to `cfg[["debug"]]`.

```r title="Your turn"
cfg <- list(host = "localhost", port = 5432L, ssl = FALSE, debug = TRUE)
# your code here
ex_3_2 <- cfg
ex_3_2
length(ex_3_2)
```

<details>
<summary>Click to reveal solution</summary>

```r title="Solution"
cfg <- list(host = "localhost", port = 5432L, ssl = FALSE, debug = TRUE)
cfg[["debug"]] <- NULL
ex_3_2 <- cfg
ex_3_2
#> $host
#> [1] "localhost"
#>
#> $port
#> [1] 5432
#>
#> $ssl
#> [1] FALSE
length(ex_3_2)
#> [1] 3
```

**Explanation:** Assigning `NULL` to a list element via `[[` deletes it from the structure entirely; the length drops by one. To set an element to a literal NULL value without deletion you must wrap it: `cfg["debug"] <- list(NULL)`. This asymmetry trips up users coming from Python dicts, where `cfg["debug"] = None` keeps the key. To delete multiple keys at once, use `cfg[c("debug", "ssl")] <- NULL`.

</details>

### Exercise 3.3: Merge two configuration lists with modifyList

**Task:** A base configuration `base <- list(host = "localhost", port = 5432L, ssl = FALSE)` needs to be overridden by an environment-specific patch `patch <- list(port = 6543L, ssl = TRUE, region = "eu-west-1")`. Use `modifyList()` to apply the patch onto the base, where patch keys win and brand-new keys are appended. Save the result to `ex_3_3`.

**Expected result:**

```
#> $host
#> [1] "localhost"
#>
#> $port
#> [1] 6543
#>
#> $ssl
#> [1] TRUE
#>
#> $region
#> [1] "eu-west-1"
```

**Difficulty:** Intermediate

[HINTS]
Layering a patch over defaults means matching keys are overwritten while brand-new keys are appended.
Call `modifyList()` with `base` as the first argument and `patch` as the second.

```r title="Your turn"
base  <- list(host = "localhost", port = 5432L, ssl = FALSE)
patch <- list(port = 6543L, ssl = TRUE, region = "eu-west-1")
ex_3_3 <- # your code here
ex_3_3
```

<details>
<summary>Click to reveal solution</summary>

```r title="Solution"
base  <- list(host = "localhost", port = 5432L, ssl = FALSE)
patch <- list(port = 6543L, ssl = TRUE, region = "eu-west-1")
ex_3_3 <- modifyList(base, patch)
ex_3_3
#> $host
#> [1] "localhost"
#>
#> $port
#> [1] 6543
#>
#> $ssl
#> [1] TRUE
#>
#> $region
#> [1] "eu-west-1"
```

**Explanation:** `modifyList()` is the right tool for layered defaults plus overrides, the same pattern you see in YAML or JSON config merging. It recurses into nested lists by default, so a deeply nested override only touches the inner keys you change, not the whole branch. The simpler alternative `c(base, patch)` would also work for appending but would produce duplicate names rather than overriding, which usually is not what you want.

</details>

## Section 4. Iterate over a list with apply-family functions (4 problems)

### Exercise 4.1: Apply mean to every numeric column with lapply

**Task:** The built-in `mtcars` data frame is, under the hood, a list of columns. Use `lapply()` to compute the mean of every column and return the result as a list. Save the named list of means to `ex_4_1` and print it to confirm one element per column.

**Expected result:**

```
#> $mpg
#> [1] 20.09062
#>
#> $cyl
#> [1] 6.1875
#>
#> $disp
#> [1] 230.7219
#>
#> ...
#>
#> $carb
#> [1] 2.8125
```

**Difficulty:** Beginner

[HINTS]
Applying one summary to every column gives you one result per column, gathered back into a container.
Call `lapply()` with `mtcars` as the input and `mean` as the function.

```r title="Your turn"
ex_4_1 <- # your code here
ex_4_1
```

<details>
<summary>Click to reveal solution</summary>

```r title="Solution"
ex_4_1 <- lapply(mtcars, mean)
head(ex_4_1, 3)
#> $mpg
#> [1] 20.09062
#>
#> $cyl
#> [1] 6.1875
#>
#> $disp
#> [1] 230.7219
```

**Explanation:** `lapply(X, FUN)` always returns a list of the same length as the input, one element per input element. Because every `mean()` call returns a length-one numeric, the result is a list of 11 scalars, named after the columns. The list shape is the right return type when individual results could vary in length or type; for the simpler case where they are all the same shape, `sapply()` collapses to a vector (covered next).

</details>

### Exercise 4.2: Simplify a list result to a named vector with sapply

**Task:** Repeat the `mtcars` column mean from the previous exercise, but this time use `sapply()` so the result simplifies to a named numeric vector rather than a list. Save it to `ex_4_2` and confirm with `is.numeric(ex_4_2)` and `length(ex_4_2)` afterwards.

**Expected result:**

```
#>      mpg      cyl     disp       hp     drat       wt     qsec       vs       am     gear     carb
#> 20.09062  6.18750 230.72188 146.68750  3.59656  3.21725 17.84875  0.43750  0.40625  3.68750  2.81250
#> [1] TRUE
#> [1] 11
```

**Difficulty:** Intermediate

[HINTS]
When every per-column result is a single number, the collection can collapse to a plain named vector.
Call `sapply()` with `mtcars` and `mean`.

```r title="Your turn"
ex_4_2 <- # your code here
ex_4_2
is.numeric(ex_4_2)
length(ex_4_2)
```

<details>
<summary>Click to reveal solution</summary>

```r title="Solution"
ex_4_2 <- sapply(mtcars, mean)
ex_4_2
#>      mpg      cyl     disp       hp     drat       wt     qsec       vs       am     gear     carb
#> 20.09062  6.18750 230.72188 146.68750  3.59656  3.21725 17.84875  0.43750  0.40625  3.68750  2.81250
is.numeric(ex_4_2)
#> [1] TRUE
length(ex_4_2)
#> [1] 11
```

**Explanation:** `sapply()` calls `lapply()` then attempts to simplify: if every result is length one of the same type, it returns a named vector; if every result is the same longer length, it returns a matrix; otherwise it falls back to a list. The auto-simplification is convenient but type-unstable, which is why production code prefers `vapply()` (next exercise) where the return shape is declared up front and silent surprises are eliminated.

</details>

### Exercise 4.3: Enforce return shape with vapply

**Task:** Compute the column means of `mtcars` once more, but use `vapply()` to assert that every iteration must return a length-one numeric. Use the template `vapply(X, FUN, FUN.VALUE = numeric(1))`. The result should be identical to the `sapply` version but with stronger type guarantees. Save to `ex_4_3`.

**Expected result:**

```
#>      mpg      cyl     disp       hp     drat       wt     qsec       vs       am     gear     carb
#> 20.09062  6.18750 230.72188 146.68750  3.59656  3.21725 17.84875  0.43750  0.40625  3.68750  2.81250
```

**Difficulty:** Intermediate

[HINTS]
You can demand up front that every iteration return the exact shape you expect, failing loudly otherwise.
Call `vapply()` with `mtcars`, `mean`, and `FUN.VALUE = numeric(1)`.

```r title="Your turn"
ex_4_3 <- # your code here
ex_4_3
```

<details>
<summary>Click to reveal solution</summary>

```r title="Solution"
ex_4_3 <- vapply(mtcars, mean, FUN.VALUE = numeric(1))
ex_4_3
#>      mpg      cyl     disp       hp     drat       wt     qsec       vs       am     gear     carb
#> 20.09062  6.18750 230.72188 146.68750  3.59656  3.21725 17.84875  0.43750  0.40625  3.68750  2.81250
```

**Explanation:** `vapply()` requires you to declare the expected return template, which catches at runtime any iteration that returns the wrong type or length. If a column were accidentally character, `mean()` would return `NA_real_` with a warning but the contract would still hold; if it returned a longer vector, `vapply` would error rather than reshape silently. Use `vapply()` over `sapply()` whenever the function might be applied to user data of uncertain shape.

</details>

### Exercise 4.4: Zip two lists element-wise with Map

**Task:** Given `quantities <- list(apples = 3, bananas = 5, cherries = 12)` and `prices <- list(apples = 1.50, bananas = 0.40, cherries = 0.05)`, compute the per-fruit revenue (quantity times price) as a named list using `Map()`, which walks two or more lists in parallel. Save to `ex_4_4`.

**Expected result:**

```
#> $apples
#> [1] 4.5
#>
#> $bananas
#> [1] 2
#>
#> $cherries
#> [1] 0.6
```

**Difficulty:** Intermediate

[HINTS]
Two aligned collections can be walked together, combining one element from each at every step.
Call `Map()` with the multiplication operator `` `*` `` over `quantities` and `prices`.

```r title="Your turn"
quantities <- list(apples = 3, bananas = 5, cherries = 12)
prices     <- list(apples = 1.50, bananas = 0.40, cherries = 0.05)
ex_4_4 <- # your code here
ex_4_4
```

<details>
<summary>Click to reveal solution</summary>

```r title="Solution"
quantities <- list(apples = 3, bananas = 5, cherries = 12)
prices     <- list(apples = 1.50, bananas = 0.40, cherries = 0.05)
ex_4_4 <- Map(`*`, quantities, prices)
ex_4_4
#> $apples
#> [1] 4.5
#>
#> $bananas
#> [1] 2
#>
#> $cherries
#> [1] 0.6
```

**Explanation:** `Map()` is the multi-list version of `lapply()`: it iterates over all the lists in parallel and calls the function with one element from each, always returning a list. You can pass any binary function, including infix operators wrapped in backticks like `` `*` ``. For a vector return shape instead, wrap with `mapply(..., SIMPLIFY = TRUE)` or use `mapply()` directly. Names are inherited from the first list argument.

</details>

## Section 5. Nested lists and flattening (5 problems)

### Exercise 5.1: Build a nested list representing customer orders

**Task:** Create a nested list named `ex_5_1` with two top-level elements `alice` and `bob`. Under `alice` store a sublist with `region = "north"` and `items = c("pen", "notebook")`. Under `bob` store `region = "south"` and `items = c("stapler", "tape", "marker")`. The resulting structure should be two levels deep.

**Expected result:**

```
#> $alice
#> $alice$region
#> [1] "north"
#>
#> $alice$items
#> [1] "pen"      "notebook"
#>
#>
#> $bob
#> $bob$region
#> [1] "south"
#>
#> $bob$items
#> [1] "stapler" "tape"    "marker"
```

**Difficulty:** Beginner

[HINTS]
A record can contain other records, giving you a structure that is two levels deep.
Nest an inner `list()` with `region` and `items` inside an outer `list()` under the names `alice` and `bob`.

```r title="Your turn"
ex_5_1 <- # your code here
ex_5_1
```

<details>
<summary>Click to reveal solution</summary>

```r title="Solution"
ex_5_1 <- list(
  alice = list(region = "north", items = c("pen", "notebook")),
  bob   = list(region = "south", items = c("stapler", "tape", "marker"))
)
ex_5_1
#> $alice
#> $alice$region
#> [1] "north"
#>
#> $alice$items
#> [1] "pen"      "notebook"
#>
#> $bob
#> $bob$region
#> [1] "south"
#>
#> $bob$items
#> [1] "stapler" "tape"    "marker"
```

**Explanation:** Nested lists are just lists whose elements are themselves lists, which is the natural shape for any hierarchical record like an order or a JSON object. Use `str()` to see the tree at a glance, and `tree[["alice"]][["items"]]` or `tree[[c("alice", "items")]]` to reach inner leaves. There is no limit on nesting depth, but flat structures are usually easier to query, so collapse to a data frame whenever the leaves are homogeneous.

</details>

### Exercise 5.2: Count total items across customers with sapply on a nested list

**Task:** Using `ex_5_1` from the previous exercise, compute the number of items each customer ordered by applying `length()` to each `items` sublist. Use `sapply()` and an anonymous function `\(x) length(x$items)`. Save the named integer vector to `ex_5_2`.

**Expected result:**

```
#> alice   bob
#>     2     3
```

**Difficulty:** Intermediate

[HINTS]
To summarise each sub-record you reach into one of its fields and measure that field alone.
Call `sapply()` over `ex_5_1` with the lambda `\(x) length(x$items)`.

```r title="Your turn"
ex_5_2 <- # your code here
ex_5_2
```

<details>
<summary>Click to reveal solution</summary>

```r title="Solution"
ex_5_2 <- sapply(ex_5_1, \(x) length(x$items))
ex_5_2
#> alice   bob
#>     2     3
```

**Explanation:** The anonymous lambda `\(x) length(x$items)` is the shortest way to reach into one field of each sublist. The shorthand `\(x)` for `function(x)` was added in R 4.1 and is now standard. The names are inherited from the outer list so the result is self-describing. If you needed multiple statistics per customer, replace the lambda with a function that returns a small named vector or list of summaries.

</details>

### Exercise 5.3: Flatten a list of numeric vectors into one vector with unlist

**Task:** Given `chunks <- list(a = 1:3, b = 10:12, c = 100:102)`, flatten the structure into a single integer vector of length nine using `unlist()`. The result should carry compound names like `a1, a2, a3, b1, b2, ...`. Save to `ex_5_3`.

**Expected result:**

```
#>  a1  a2  a3  b1  b2  b3  c1  c2  c3
#>   1   2   3  10  11  12 100 101 102
```

**Difficulty:** Intermediate

[HINTS]
Several separate vectors can be poured into one long vector, with names tracking where each piece came from.
Call `unlist()` on `chunks`.

```r title="Your turn"
chunks <- list(a = 1:3, b = 10:12, c = 100:102)
ex_5_3 <- # your code here
ex_5_3
```

<details>
<summary>Click to reveal solution</summary>

```r title="Solution"
chunks <- list(a = 1:3, b = 10:12, c = 100:102)
ex_5_3 <- unlist(chunks)
ex_5_3
#>  a1  a2  a3  b1  b2  b3  c1  c2  c3
#>   1   2   3  10  11  12 100 101 102
```

**Explanation:** `unlist()` recursively descends into a list and concatenates atomic leaves into one vector, coercing to the most general type as needed. The compound names come from joining the parent element name with the child index. Pass `use.names = FALSE` to drop the names, or `recursive = FALSE` to flatten only the top level. Beware that flattening a list of model objects coerces everything to character and is almost never what you want.

</details>

### Exercise 5.4: Apply a function to every leaf with rapply

**Task:** Given the deeply nested list `tree <- list(a = list(x = 1.234, y = 5.678), b = list(z = 9.012))`, round every numeric leaf to one decimal place using `rapply()` with `how = "replace"`. The structure must be preserved, only the values rounded. Save the result to `ex_5_4`.

**Expected result:**

```
#> $a
#> $a$x
#> [1] 1.2
#>
#> $a$y
#> [1] 5.7
#>
#>
#> $b
#> $b$z
#> [1] 9
```

**Difficulty:** Advanced

[HINTS]
You can transform every leaf of a tree while leaving its branching shape completely intact.
Call `rapply()` with the rounding lambda `\(v) round(v, 1)`, `classes = "numeric"`, and `how = "replace"`.

```r title="Your turn"
tree <- list(a = list(x = 1.234, y = 5.678), b = list(z = 9.012))
ex_5_4 <- # your code here
ex_5_4
```

<details>
<summary>Click to reveal solution</summary>

```r title="Solution"
tree <- list(a = list(x = 1.234, y = 5.678), b = list(z = 9.012))
ex_5_4 <- rapply(tree, \(v) round(v, 1), classes = "numeric", how = "replace")
ex_5_4
#> $a
#> $a$x
#> [1] 1.2
#>
#> $a$y
#> [1] 5.7
#>
#> $b
#> $b$z
#> [1] 9.0
```

**Explanation:** `rapply()` (recursive `apply`) walks every leaf of a nested list and applies the function. With `how = "replace"` it preserves the tree shape; with `how = "unlist"` it returns a flat vector of results. The `classes` filter limits transformation to leaves of the named classes, so you can safely run a numeric transform on a mixed-type tree without touching strings or factors. This is the cleanest base-R way to normalise nested JSON-like structures.

</details>

### Exercise 5.5: Keep only the sublists that pass a predicate with Filter

**Task:** Given a list of model results `runs <- list(m1 = list(r2 = 0.45), m2 = list(r2 = 0.81), m3 = list(r2 = 0.62), m4 = list(r2 = 0.30))`, retain only the runs whose `r2` exceeds `0.60`. Use `Filter()` with a predicate lambda and save the kept sublist to `ex_5_5`.

**Expected result:**

```
#> $m2
#> $m2$r2
#> [1] 0.81
#>
#>
#> $m3
#> $m3$r2
#> [1] 0.62
```

**Difficulty:** Advanced

[HINTS]
Keeping only the sub-records that pass a test discards the rest and preserves the structure of what remains.
Call `Filter()` with the predicate `\(x) x$r2 > 0.60` over `runs`.

```r title="Your turn"
runs <- list(
  m1 = list(r2 = 0.45),
  m2 = list(r2 = 0.81),
  m3 = list(r2 = 0.62),
  m4 = list(r2 = 0.30)
)
ex_5_5 <- # your code here
ex_5_5
```

<details>
<summary>Click to reveal solution</summary>

```r title="Solution"
runs <- list(
  m1 = list(r2 = 0.45),
  m2 = list(r2 = 0.81),
  m3 = list(r2 = 0.62),
  m4 = list(r2 = 0.30)
)
ex_5_5 <- Filter(\(x) x$r2 > 0.60, runs)
ex_5_5
#> $m2
#> $m2$r2
#> [1] 0.81
#>
#> $m3
#> $m3$r2
#> [1] 0.62
```

**Explanation:** `Filter()` is a higher-order function that keeps elements for which the predicate returns `TRUE`. The predicate must return a single logical per element, which fits perfectly with the lambda shape here. The complement is `Find()`, which returns the first matching element rather than all of them, and `Position()`, which returns the index. Together these three functions cover the common base-R subset of stream filtering vocabulary.

</details>

## Section 6. Lists and data frames (4 problems)

### Exercise 6.1: Convert a list of equal-length columns into a data frame

**Task:** Given the column-oriented list `cols <- list(id = 1:3, name = c("Ada", "Ben", "Cleo"), score = c(91, 84, 77))`, convert it to a data frame using `as.data.frame()` so each named element becomes a column. Save the resulting data frame to `ex_6_1` and print it to confirm three rows.

**Expected result:**

```
#>   id name score
#> 1  1  Ada    91
#> 2  2  Ben    84
#> 3  3 Cleo    77
```

**Difficulty:** Beginner

[HINTS]
A column-oriented collection of equal-length pieces already has the shape of a table.
Call `as.data.frame()` on `cols`.

```r title="Your turn"
cols <- list(id = 1:3, name = c("Ada", "Ben", "Cleo"), score = c(91, 84, 77))
ex_6_1 <- # your code here
ex_6_1
```

<details>
<summary>Click to reveal solution</summary>

```r title="Solution"
cols <- list(id = 1:3, name = c("Ada", "Ben", "Cleo"), score = c(91, 84, 77))
ex_6_1 <- as.data.frame(cols)
ex_6_1
#>   id name score
#> 1  1  Ada    91
#> 2  2  Ben    84
#> 3  3 Cleo    77
```

**Explanation:** A data frame is internally a list of equal-length columns with a row.names attribute, so a column-oriented list with the right shape converts almost for free. The conversion fails loudly if the lengths do not match; partial recycling does not happen here. `as_tibble(cols)` from the tibble package is the modern equivalent and avoids the legacy `stringsAsFactors` behaviour, though that default flipped to `FALSE` in R 4.0.

</details>

### Exercise 6.2: Convert a list of row records to a data frame with do.call rbind

**Task:** A scraper returned one row per record as a list: `rows <- list(list(id = 1, name = "Ada", score = 91), list(id = 2, name = "Ben", score = 84), list(id = 3, name = "Cleo", score = 77))`. Pivot this row-oriented structure to a data frame using `do.call(rbind, lapply(rows, as.data.frame))`. Save to `ex_6_2`.

**Expected result:**

```
#>   id name score
#> 1  1  Ada    91
#> 2  2  Ben    84
#> 3  3 Cleo    77
```

**Difficulty:** Advanced

[HINTS]
Each row-shaped record must first become a one-row table before they can all be stacked into one frame.
Turn each record into a frame with `lapply(rows, as.data.frame)`, then stack them with `do.call(rbind, ...)`.

```r title="Your turn"
rows <- list(
  list(id = 1, name = "Ada",  score = 91),
  list(id = 2, name = "Ben",  score = 84),
  list(id = 3, name = "Cleo", score = 77)
)
ex_6_2 <- # your code here
ex_6_2
```

<details>
<summary>Click to reveal solution</summary>

```r title="Solution"
rows <- list(
  list(id = 1, name = "Ada",  score = 91),
  list(id = 2, name = "Ben",  score = 84),
  list(id = 3, name = "Cleo", score = 77)
)
ex_6_2 <- do.call(rbind, lapply(rows, as.data.frame))
ex_6_2
#>   id name score
#> 1  1  Ada    91
#> 2  2  Ben    84
#> 3  3 Cleo    77
```

**Explanation:** Row-oriented data is the natural output of web scrapers and JSON APIs, but R prefers column-oriented frames, so you must pivot. `lapply` converts each list-record to a one-row data frame, then `do.call(rbind, .)` stacks them. The `do.call` step is needed because `rbind` is variadic and you have to splat the list of frames into separate arguments. For large inputs the data.table or dplyr `bind_rows` equivalent is much faster, but the base recipe always works.

</details>

### Exercise 6.3: Extract one column out of an lm result list

**Task:** Fit `fit <- lm(mpg ~ wt, data = mtcars)` and recall that `fit` is a list with named elements including `coefficients`, `residuals`, `fitted.values`. Extract the coefficient vector using double bracket indexing on the literal name and save it to `ex_6_3`.

**Expected result:**

```
#> (Intercept)          wt
#>   37.285126   -5.344472
```

**Difficulty:** Intermediate

[HINTS]
A fitted model is itself a container, so the part you want is just one named element of it.
Index `fit` with `[["coefficients"]]`.

```r title="Your turn"
fit <- lm(mpg ~ wt, data = mtcars)
ex_6_3 <- # your code here
ex_6_3
```

<details>
<summary>Click to reveal solution</summary>

```r title="Solution"
fit <- lm(mpg ~ wt, data = mtcars)
ex_6_3 <- fit[["coefficients"]]
ex_6_3
#> (Intercept)          wt
#>   37.285126   -5.344472
```

**Explanation:** Almost every `lm`, `glm` or `nls` model object is a structured list, which is why understanding lists pays off across the language. `fit[["coefficients"]]` returns the named numeric vector; the wrapper `coef(fit)` does the same and is the canonical accessor. Use `names(fit)` or `str(fit, max.level = 1)` to discover what is inside any new model class without reading docs.

</details>

### Exercise 6.4: Round-trip a list to a tibble with enframe

**Task:** Given the named list `counts <- list(monday = 12, tuesday = 7, wednesday = 22, thursday = 5, friday = 19)`, convert it to a two-column tibble (`name`, `value`) using `enframe()` from the tibble package. Save the resulting tibble to `ex_6_4` and confirm with `print(ex_6_4)`.

**Expected result:**

```
#> # A tibble: 5 x 2
#>   name      value
#>   <chr>     <dbl>
#> 1 monday       12
#> 2 tuesday       7
#> 3 wednesday    22
#> 4 thursday      5
#> 5 friday       19
```

**Difficulty:** Advanced

[HINTS]
A named set of values can be turned into a tidy two-column table of names beside values.
Flatten the list with `unlist()` first, then pass the result to `enframe()`.

```r title="Your turn"
counts <- list(monday = 12, tuesday = 7, wednesday = 22, thursday = 5, friday = 19)
ex_6_4 <- # your code here
ex_6_4
```

<details>
<summary>Click to reveal solution</summary>

```r title="Solution"
counts <- list(monday = 12, tuesday = 7, wednesday = 22, thursday = 5, friday = 19)
ex_6_4 <- enframe(unlist(counts))
ex_6_4
#> # A tibble: 5 x 2
#>   name      value
#>   <chr>     <dbl>
#> 1 monday       12
#> 2 tuesday       7
#> 3 wednesday    22
#> 4 thursday      5
#> 5 friday       19
```

**Explanation:** `enframe()` turns a named atomic vector into a two-column tibble (`name`, `value`), which is the cleanest format for plotting or joining named-list output. When the input is a list of scalars, `unlist()` first collapses it to a named numeric vector, then `enframe` builds the tibble. The inverse function is `deframe()`, which takes a two-column tibble back to a named vector, completing the round trip.

</details>

## What to do next

- Strengthen the underlying concepts on the [R Lists tutorial](R-Lists.html), the parent reference for these problems.
- Practice the comparison between atomic vectors and lists in [R Vectors Exercises](R-Vectors-Exercises.html).
- Drill the apply family used here in [Apply Family Exercises in R](Apply-Family-Exercises-in-R.html).
- Continue with function-level practice in [R Functions Exercises](R-Functions-Exercises.html).

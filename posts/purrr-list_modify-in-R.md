---
title: "purrr list_modify() in R: Update List Elements by Name"
slug: "purrr-list_modify-in-R"
description: "Use purrr list_modify() to replace, add, and remove named elements of a list in R. Covers recursive merging, zap(), list_merge, and modifyList comparison."
keywords: "purrr list_modify, list_modify function R, purrr list_modify examples, R modify list elements, update list by name R, list_modify vs modifyList, purrr list_merge"
mathjax: false
webr: true
date: "2026-05-15"
post_type: "PSEO"
category_id: "function-deep"
subcategory_id: "purrr-functions"
fr_parent: "Functional-Programming-in-R.html"
auto_link_terms: "purrr list_modify|list_modify()|purrr::list_modify()|list_merge()|list_assign()"
auto_link_case_sensitive: true
target_keyword: "purrr list_modify"
sibling_block_enabled: true
difficulty: "Beginner"
---

# purrr list_modify() in R: Update List Elements by Name

<p class="lead">The <code>list_modify()</code> function in purrr updates a list in R by replacing, adding, or removing elements by name, recursively merging any nested lists you pass in.</p>

[QUICK ANSWER]
list_modify(x, b = 20)               # replace element b
list_modify(x, d = 4)                # add a new element d
list_modify(x, b = zap())            # remove element b
list_modify(x, !!!updates)           # splice in a list of updates
list_modify(cfg, db = list(port = 1))# recursive merge of nested list
list_modify(list(1, 2, 3), 99)       # replace by position
list_merge(x, tags = "new")          # concatenate instead of replace

[DECISION TREE: Is list_modify() the right tool?]
- replace, add or remove list items by name: list_modify()
- transform every element with a function: modify()
- concatenate values into existing elements: list_merge()
- get or set a deeply nested element: pluck()
- drop one level of list nesting: list_flatten()
- modify without recursive merging: list_assign()

## What list_modify() does in one sentence

**`list_modify(.x, ...)` takes a list and a set of named values, then returns a copy of the list with those names replaced, added, or removed.** It is the structural editor of purrr: you describe the changes by name and get a new list back.

This is a different job from `modify()`. `modify()` runs a function over every element. `list_modify()` does not run a function at all. It merges a second set of values into an existing list, the way you would patch a configuration object.

[KEY INSIGHT]
**Read `list_modify(x, a = 1)` as "give me `x`, but with `a` set to 1".** Names that already exist are overwritten, names that are new are appended, and the merge reaches into nested lists so you can patch one deep field without retyping the rest.

## Syntax

**`list_modify(.x, ...)` takes the list to edit followed by name-value pairs describing the edits.** Each `name = value` either replaces an existing element or adds a new one.

The `...` arguments are flexible. Named arguments match list elements by name. Unnamed arguments match by position. You can also splice an entire list of changes with the `!!!` operator. The sibling `list_merge()` shares the exact same signature.

```r title="list_modify replaces a named element"
library(purrr)

x <- list(a = 1, b = 2, c = 3)

list_modify(x, b = 20)
#> $a
#> [1] 1
#>
#> $b
#> [1] 20
#>
#> $c
#> [1] 3
```

The element `b` is overwritten with `20`. Elements `a` and `c` are copied across untouched, and the result is a brand new list.

## Common patterns

### 1. Add a new element by name

If a name in `...` does not exist in the list, `list_modify()` appends it as a new element at the end.

```r title="Add a new element to a list"
list_modify(x, d = 4)
#> $a
#> [1] 1
#>
#> $b
#> [1] 2
#>
#> $c
#> [1] 3
#>
#> $d
#> [1] 4
```

The same call both updates and grows a list, so you rarely need `x[["d"]] <- 4` style assignment.

### 2. Remove an element with zap()

To delete an element, set its name to `zap()`. This is the one purrr-specific piece of syntax to remember.

```r title="Remove an element with zap"
list_modify(x, b = zap())
#> $a
#> [1] 1
#>
#> $c
#> [1] 3
```

The element `b` is dropped entirely. Note that `b = NULL` would not remove it; it would keep `b` with a `NULL` value instead.

### 3. Recursively merge a nested list

When a value is itself a list, `list_modify()` merges it into the matching nested element rather than overwriting the whole thing.

```r title="Recursive merge of a nested config"
config <- list(
  db    = list(host = "localhost", port = 5432),
  debug = FALSE
)

list_modify(config, db = list(port = 9090))
#> $db
#> $db$host
#> [1] "localhost"
#>
#> $db$port
#> [1] 9090
#>
#>
#> $debug
#> [1] FALSE
```

Only `db$port` changed. The `db$host` field survived because the merge is recursive, which is exactly what you want when patching settings.

### 4. Splice a list of updates with !!!

When the changes are already collected in a list, splice them into `...` with `!!!` instead of typing each pair by hand.

```r title="Splice updates with the bang-bang-bang operator"
updates <- list(a = 100, c = 300)

list_modify(x, !!!updates)
#> $a
#> [1] 100
#>
#> $b
#> [1] 2
#>
#> $c
#> [1] 300
```

[TIP]
**Splicing with `!!!` makes `list_modify()` programmable.** Build the update list however you like, from a loop, a function argument, or `reduce()`, then splice it in. This keeps dynamic edits out of hard-coded argument names.

## list_modify() vs modifyList() vs list_merge()

**All three combine two lists, but they differ on how they handle values and removals.** That difference decides which one fits your task.

| Function | Package | Recursive? | Removes element by | Combines values by |
|---|---|---|---|---|
| `list_modify()` | purrr | Yes | `zap()` | Replacing |
| `list_merge()` | purrr | Yes | n/a | Concatenating |
| `modifyList()` | base R | Yes | `NULL` | Replacing |

The decision rule is short. Use `list_modify()` for general patching where `NULL` is a value you want to keep. Use `base::modifyList()` if you have no purrr dependency and treat `NULL` as "delete". Use `list_merge()` when new values should extend existing ones, as the example below shows.

```r title="list_merge concatenates instead of replacing"
list_merge(list(tags = c("r", "stats")), tags = "purrr")
#> $tags
#> [1] "r"     "stats" "purrr"
```

## Common pitfalls

**Pitfall 1: `NULL` does not remove an element.** Passing `b = NULL` keeps `b` in the list with a `NULL` value. Only `b = zap()` deletes the element. This trips up anyone arriving from `modifyList()`, where `NULL` is the delete signal.

**Pitfall 2: nested lists are merged, not replaced.** `list_modify(cfg, db = list(port = 1))` keeps every other field of `cfg$db`. If you genuinely want to swap the whole nested list, the recursive merge is not what you want, and you should assign with `cfg$db <- list(port = 1)` instead.

**Pitfall 3: it does not edit in place.** R uses copy-on-modify, so `list_modify(x, ...)` returns a new list while `x` is left unchanged. Reassign with `x <- list_modify(x, ...)` to keep the result.

[WARNING]
**Unnamed arguments modify by position, which is easy to do by accident.** `list_modify(x, 99)` replaces the first element, not an element called `99`. Always name your arguments unless positional replacement is genuinely what you intend.

[NOTE]
**purrr 1.0.0 added `list_assign()` as the non-recursive sibling.** `list_assign()` replaces a nested element wholesale instead of merging into it. Reach for it when Pitfall 2 bites and you want a full swap rather than a deep merge.

## Try it yourself

**Try it:** Given the `settings` list, use `list_modify()` to change `timeout` to 60 and remove `verbose`. Save the result to `ex_settings`.

```r title="Your turn: update a settings list"
settings <- list(timeout = 30, retries = 3, verbose = TRUE)

ex_settings <- # your code here

ex_settings
#> Expected: timeout = 60, retries = 3, verbose removed
```

<details>
<summary>Click to reveal solution</summary>

```r title="Solution"
ex_settings <- list_modify(settings, timeout = 60, verbose = zap())
ex_settings
#> $timeout
#> [1] 60
#>
#> $retries
#> [1] 3
```

**Explanation:** The named argument `timeout = 60` matches an existing element and overwrites it, while `verbose = zap()` deletes that element. The untouched `retries` element is copied straight through.

</details>

## Related purrr functions

Once `list_modify()` clicks, these neighbouring functions round out list editing:

- `modify()`: transforms every element with a function, rather than replacing elements by name.
- `list_merge()`: the concatenating variant, used when new values should extend existing ones.
- `list_assign()`: the non-recursive variant that swaps nested elements wholesale.
- `pluck()`: reads or writes a single deeply nested element by a path of names or positions.
- `list_flatten()`: removes one level of nesting from a list of lists.

The official reference for the family lives at [purrr.tidyverse.org](https://purrr.tidyverse.org/reference/list_modify.html).

## FAQ

**What is the difference between list_modify() and modifyList()?**

Both recursively merge a second set of values into a list. The key difference is removal and `NULL` handling. In `base::modifyList()`, setting an element to `NULL` deletes it. In `purrr::list_modify()`, `NULL` is kept as a real value and you must use `zap()` to delete. `list_modify()` also accepts the `!!!` splice operator, which `modifyList()` does not.

**How do I remove an element with list_modify()?**

Set the element's name to `zap()`, for example `list_modify(x, b = zap())`. The function `zap()` is purrr's explicit "delete this" sentinel. Do not use `NULL` for removal: `list_modify(x, b = NULL)` keeps `b` in the list with a `NULL` value rather than dropping it.

**Does list_modify() modify the original list?**

No. R follows copy-on-modify semantics, so `list_modify()` builds and returns a new list while the original stays untouched. Despite the name, nothing is mutated in place. To keep the updated list, assign the result back, for example `x <- list_modify(x, a = 1)`.

**What is the difference between list_modify() and list_merge()?**

`list_modify()` replaces a matching element with the new value. `list_merge()` concatenates the new value onto the existing one. For an element holding `c("r", "stats")`, `list_modify(x, tags = "purrr")` leaves `"purrr"` alone as the value, while `list_merge(x, tags = "purrr")` returns `c("r", "stats", "purrr")`. Choose `list_merge()` when you are extending collections.

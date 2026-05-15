---
title: "purrr pluck() in R: Extract Nested List Elements"
slug: purrr-pluck-in-R
description: "Learn purrr pluck() in R to safely extract elements from nested lists and data frames. Covers syntax, the .default fallback, chuck(), and common pitfalls."
keywords: "purrr pluck, pluck function R, purrr pluck examples, R pluck nested list, extract list element R, pluck default value"
mathjax: false
webr: true
date: "2026-05-15"
post_type: PSEO
category_id: function-deep
subcategory_id: purrr-functions
fr_parent: Functional-Programming-in-R.html
auto_link_terms: "pluck()|purrr pluck|purrr::pluck()|extract nested list element|pluck function"
auto_link_case_sensitive: true
target_keyword: "purrr pluck"
sibling_block_enabled: true
difficulty: Beginner
---

# purrr pluck() in R: Extract Nested List Elements

<p class="lead">purrr pluck extracts a single element from a deeply nested list or data frame by following a sequence of names, positions, or accessor functions. It returns an empty value instead of an error when the path is missing, which makes nested access both safe and readable.</p>

[QUICK ANSWER]
pluck(x, "a")                     # extract by name
pluck(x, 1)                       # extract by position
pluck(x, "a", "b", 2)             # follow a nested path
pluck(x, "z", .default = NA)      # fallback when missing
pluck(x, attr_getter("class"))    # extract an attribute
chuck(x, "a", "b")                # strict: error if missing
assign_in(x, "a", 99)             # set a nested value (copy)

[DECISION TREE: Is pluck() the right tool?]
- extract one nested element: pluck(x, "a", "b")
- extract the same key from a list of lists: map(x, "key")
- error instead of NULL when missing: chuck(x, "a")
- modify a nested element in place: modify_in(x, list("a"), toupper)
- flatten one level of nesting: list_flatten(x)
- keep elements that pass a test: keep(x, is.numeric)

## What pluck does

**The pluck function is a safe nested accessor.** It walks an indexing path one step at a time, where each argument after the data is one level deeper into the structure. The call reads from left to right the way you would describe the path out loud, so the intent stays clear even to someone who has never seen the data.

This matters most when the data did not originate in R. Responses from web services, parsed JSON, and configuration files arrive as lists nested several layers deep, and reaching into them with the base double bracket operator produces unreadable chains. The other defining trait is failure behavior: a missing step makes the base operator stop with a subscript out of bounds error, while pluck simply returns an empty value or your chosen default.

[KEY INSIGHT]
**Think of pluck as a file path for data.** Each accessor is one folder in the path, and the function either reaches the target or comes back empty handed without crashing the program around it.

## pluck syntax

**The signature is `pluck(.x, ..., .default = NULL)`.** You pass the object to index into, then one or more accessors that describe the route to the value you want.

| Argument | Description |
|----------|-------------|
| `.x` | The list, vector, or data frame to index into |
| `...` | Accessors: a string name, a positive integer position, or an accessor function |
| `.default` | Value returned when the targeted element is missing or empty |

Each accessor consumes exactly one level of nesting. A string matches a named element, a positive integer matches a position counting from one, and a function lets you compute the next step. The helper `attr_getter("class")` returns an accessor that pulls an attribute rather than a list member.

```r title="Load purrr and pluck one level"
library(purrr)

scores <- list(math = 88, reading = 72)
pluck(scores, "math")
#> [1] 88
```

## Extract elements by name and position

**The pluck function shines when the structure has several layers.** The example below builds a small list of user records, then reaches in. You never have to confirm an intermediate level exists, because the function checks each step for you.

```r title="Pluck from a nested list"
users <- list(
  alice = list(age = 30, roles = c("admin", "editor")),
  bob   = list(age = 25, roles = c("viewer"))
)

pluck(users, "alice", "age")
#> [1] 30
```

Names and integer positions combine freely in one call. The next example reads as the first user, then their roles, then the second role. Switching between names and positions mid path is useful, since real data often has named levels near the top and plain vectors near the bottom.

```r title="Mix names and positions"
pluck(users, 1, "roles", 2)
#> [1] "editor"
```

Because a data frame is internally a list of columns, pluck works on data frames too. A column name returns the whole column, and an integer accessor drills down to a single value.

```r title="Pluck a data frame value"
pluck(mtcars, "mpg", 1)
#> [1] 21
```

## Supply a fallback with .default

**Use the default argument to control what a missing path returns.** Without it, an absent element yields an empty value, which often breaks code further down that expects a real number or string. A default substitutes a sensible placeholder right at the point of extraction.

```r title="Fallback for a missing element"
pluck(users, "carol", "age")
#> NULL

pluck(users, "carol", "age", .default = NA)
#> [1] NA
```

A common pattern is to give every optional field the same default, so the results of many calls assemble into a tidy data frame without ragged gaps. Match the default type to the column you are building.

[WARNING]
**The default does not distinguish a missing key from a stored empty value.** If an element genuinely exists but holds an empty value, the function still returns your default. When that difference matters, check membership with `has_element()` before plucking.

## pluck vs the double bracket operator and map

**Pick the accessor that matches your task and your tolerance for errors.** All three tools reach into structures, but they differ in how they fail and whether they touch one object or many.

| Tool | Missing path | Best for |
|------|--------------|----------|
| `pluck(x, ...)` | Returns empty value or `.default` | Safe single element access |
| `x[["a"]][["b"]]` | Throws an error | Quick access when the path is guaranteed |
| `map(x, "key")` | Empty value per element | The same key from a list of lists |

The rule is short. Reach into one object safely, use pluck. Reach into one object and want a loud failure on a typo, use the strict variant or the base operator. Reach into many objects at once, use map with a string or integer shortcut, since map accepts the same accessor style that pluck understands.

[TIP]
**The map function accepts pluck style accessors.** Writing `map(users, "age")` extracts the age field from every user in one call, so you rarely need a manual loop over records.

## Common pitfalls

**A wrong path fails silently.** Because the function returns an empty value for any missing accessor, a typo produces no error and no warning, and the bug can travel far before anyone notices. When a missing element should stop execution, reach for the strict twin called chuck, which raises a clear error instead.

```r title="chuck() errors on a bad path"
chuck(users, "carol", "age")
#> Error in `chuck()`:
#> ! Can't find name `carol` in vector.
```

**Positions are one based and positive.** Asking for position zero is invalid, and negative indices are not supported as accessors the way they are with base subsetting. Always pass the actual position, starting the count at one.

**Each accessor must be a separate argument.** Passing a single character vector that bundles two names treats the whole vector as one accessor and fails to descend. Spell the path out so each level is its own argument.

## Try it yourself

**Try it:** From the `users` list, extract Bob's first role and save it to `ex_role`.

```r title="Your turn: pluck a nested value"
# Try it: reach bob -> roles -> position 1
ex_role <- # your code here

ex_role
#> Expected: "viewer"
```

<details>
<summary>Click to reveal solution</summary>

```r title="Solution"
ex_role <- pluck(users, "bob", "roles", 1)
ex_role
#> [1] "viewer"
```

**Explanation:** Each accessor descends one level: the name for Bob selects the record, roles selects the character vector inside it, and the number one selects that vector's first position.

</details>

## Related purrr functions

These functions pair naturally with pluck when you work with nested data:

- The chuck function plucks but errors instead of returning an empty value on a missing path.
- The map function applies a pluck style accessor across every element of a list.
- The modify_in function updates a nested element identified by a pluck style location.
- The list_flatten function removes one level of nesting before you index.

See the [purrr reference](https://purrr.tidyverse.org/reference/pluck.html) for the full accessor specification.

## FAQ

**What is the difference between pluck and chuck?**
Both functions follow the same accessor path, but they differ on missing elements. The pluck function returns an empty value or your default when a step does not exist, so it never raises an error. The chuck function is the strict version and throws an informative error the moment an accessor fails to match. Use pluck for optional fields where absence is expected, and chuck when a missing element signals a real bug you want surfaced immediately.

**Does pluck work on data frames?**
Yes. A data frame is internally a list of columns, so passing a column name returns that column as a vector. Adding an integer accessor drills into a single cell. This makes the function a tidy alternative to the dollar sign or double bracket operators inside pipelines, with the benefit that a misspelled column name returns an empty value instead of crashing the pipeline partway through.

**How is pluck different from the double bracket operator?**
The double bracket operator extracts one level and throws a subscript out of bounds error when the index is invalid. The pluck function chains many accessors in a single flat call and degrades gracefully to an empty value instead. For a guaranteed path the base operator is fine and slightly faster, but for deep or uncertain structures pluck is shorter to read and safer to run.

**Can pluck modify a list element?**
Yes. The function has an assignment form that writes into a nested location and creates intermediate levels if they do not exist. For a version that returns a modified copy rather than changing the object in place, use the assign_in or modify_in helpers, both of which fit cleanly into a pipeline and leave the original untouched.

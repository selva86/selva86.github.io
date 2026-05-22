---
title: "glue glue_collapse() in R: Collapse Vectors to a String"
slug: "glue-glue_collapse-in-R"
description: "Use glue glue_collapse() in R to join a character vector into one string with separator and a final last item. Five examples, paste comparison, three pitfalls."
keywords: "glue glue_collapse, glue_collapse function R, glue_collapse examples, R collapse vector to string, glue_collapse vs paste collapse, glue_collapse last argument, glue_collapse width"
mathjax: false
webr: true
date: "2026-05-22"
post_type: "PSEO"
category_id: "function-deep"
subcategory_id: "glue-functions"
fr_parent: "stringr-in-R.html"
auto_link_terms: "glue_collapse()|glue::glue_collapse()|glue glue_collapse|glue_collapse function|collapse glue vector"
auto_link_case_sensitive: true
target_keyword: "glue glue_collapse"
sibling_block_enabled: true
difficulty: "Beginner"
---

# glue glue_collapse() in R: Collapse Vectors to a String

<p class="lead">glue glue_collapse() joins a character vector into a single string. You pass the vector, a separator, and optionally a different separator for the last element or a width cap. It is the glue equivalent of <code>paste(x, collapse = ...)</code>, with two upgrades: a human-friendly <code>last</code> argument and a width limit.</p>

[QUICK ANSWER]
glue_collapse(x, sep = ", ")                        # basic comma join
glue_collapse(x, sep = ", ", last = ", and ")      # Oxford-style last item
glue_collapse(x, sep = " ", width = 20)             # truncate at 20 chars
glue_collapse(glue("Hi {names}"), sep = "; ")      # collapse glue output
glue_collapse(glue_data(df, "{x}"), sep = " | ")   # collapse a per-row glue
paste(x, collapse = ", ")                           # base R equivalent
toString(x)                                         # base R one-liner

[DECISION TREE: Is glue_collapse() the right tool?]
- join a character vector to one string: glue_collapse(x, sep = ", ")
- need an "and" before the last item: glue_collapse(x, last = " and ")
- cap the total width with an ellipsis: glue_collapse(x, width = 60)
- interpolate values into a template: glue("Hi {name}")
- one string per data frame row: glue_data(df, "{col1}-{col2}")
- compose a safe SQL statement: glue_sql("SELECT {col}", .con = con)

## What glue_collapse() does in one sentence

**glue_collapse() takes a character vector and returns one scalar string with the elements joined.** You hand it a vector of any length, choose what goes between elements, and get back a single glue value that you can print, pass to a report, or paste into a log line.

This is collapse, not interpolation. There are no `{braces}` to evaluate; the input is already a finished vector of strings. glue_collapse() is what you reach for after glue() or glue_data() has produced a per-row vector and you want one summary line out the other side.

```r title="Load glue and collapse a character vector"
library(glue)

fruits <- c("apple", "banana", "cherry")
glue_collapse(fruits, sep = ", ")
#> apple, banana, cherry
```

The three vector elements become one comma-separated string, with `length()` of 1.

## Syntax

**glue_collapse(x, sep = "", width = Inf, last = "") joins a character vector into one string.** The `x` argument is the vector to collapse, `sep` is the separator placed between elements, `width` caps the total character length (truncating with `...`), and `last` overrides the separator inserted before the final element.

```r title="Function signature and defaults"
# glue_collapse(x, sep = "", width = Inf, last = "")
#
# x      : character vector to join
# sep    : separator placed between elements, default ""
# width  : integer; truncate the final string at this many chars
# last   : separator placed before the LAST element (Oxford-style joins)
```

The default `sep = ""` simply concatenates with nothing between elements, which matches the behaviour of `paste0(x, collapse = "")`. In practice you almost always pass a real separator.

[TIP]
**Use `last = " and "` for human-readable lists.** Reports and email subjects read more naturally with "apple, banana, and cherry" than "apple, banana, cherry". `last` is the only collapse-style joiner in base or tidyverse R that handles this in one call.

## Common use cases

### 1. Basic comma-separated collapse

```r title="Collapse with a comma separator"
parts <- c("data", "wrangling", "in", "R")
glue_collapse(parts, sep = " ")
#> data wrangling in R
```

This is the everyday usage: pass a vector, pass a separator, get one string back. Output type is `glue` (a thin subclass of character), so it prints without quotes and concatenates cleanly into other glue templates.

### 2. Add a final "and" for Oxford-style lists

```r title="Use last for natural-language joins"
authors <- c("Wickham", "Bryan", "Hester")
glue_collapse(authors, sep = ", ", last = ", and ")
#> Wickham, Bryan, and Hester
```

The `last` argument replaces `sep` between the next-to-last and last element. For two-element vectors, only `last` is used, so `glue_collapse(c("a", "b"), sep = ", ", last = " and ")` returns `"a and b"`.

### 3. Truncate to a maximum width

```r title="Cap output length with width"
words <- letters[1:15]
glue_collapse(words, sep = " ", width = 20)
#> a b c d e f g h i...
```

When the joined string exceeds `width` characters, glue_collapse() trims it and appends `...`. This is handy for log lines or table cells where overflow would break formatting.

[NOTE]
**Width truncation is silent.** glue_collapse() returns the truncated string without warning. If you need to know whether truncation occurred, compare `nchar()` of the joined result against your width before relying on the output downstream.

### 4. Combine with glue() and glue_data()

```r title="The glue then glue_collapse pattern"
names <- c("Ada", "Bob", "Cee")
greetings <- glue("Hi {names}")
glue_collapse(greetings, sep = "; ")
#> Hi Ada; Hi Bob; Hi Cee
```

glue() returns a length-3 vector here because `names` is length 3. glue_collapse() then flattens that vector into one summary string. This two-step pattern (template each row, then collapse) is the canonical way to build a single sentence from a vector of values.

```r title="Same pattern starting from a data frame"
df <- data.frame(name = c("Ada", "Bob", "Cee"), score = c(91, 82, 76))
labels <- glue_data(df, "{name}: {score}")
glue_collapse(labels, sep = " | ", last = " | and finally ")
#> Ada: 91 | Bob: 82 | and finally Cee: 76
```

glue_data() builds one label per row; glue_collapse() joins them into a one-line summary suitable for a report header or commit message.

[KEY INSIGHT]
**glue() interpolates, glue_collapse() flattens.** The two functions sit at different stages of the same pipeline. glue() (or glue_data()) turns inputs into a vector of strings; glue_collapse() turns that vector into one string. Mixing them up is the most common glue mistake.

## glue_collapse() vs paste() and str_flatten()

**Three other functions cover the same ground; the right pick depends on whether you need `last` or `width`.** glue_collapse() is the only one in this group that supports both. paste() is base R and zero-dependency; str_flatten() is the stringr counterpart with similar ergonomics.

| Function | Package | Has `last`? | Has `width`? | Best for |
|---|---|---|---|---|
| `glue_collapse(x, ", ")` | glue | Yes | Yes | Glue pipelines; Oxford joins; truncation |
| `paste(x, collapse = ", ")` | base | No | No | Zero dependency; quick scripts |
| `paste0(x, collapse = ", ")` | base | No | No | Same as paste() with no default sep |
| `toString(x)` | base | No | No | Default ", " separator; pretty-printing |
| `stringr::str_flatten(x, ", ", last = " and ")` | stringr | Yes | No | tidyverse-only projects (stringr 1.5+) |

The decision rule: if your project already loads glue, prefer glue_collapse() for collapse so you do not mix paste() and glue() conventions in one pipeline. If you only need a plain comma join with no `last` or `width`, `paste(x, collapse = ", ")` is two characters shorter and avoids the dependency.

## Common pitfalls

1. **Confusing `sep` with `collapse`.** `paste(x, sep = ", ")` joins parallel vectors element-wise; `paste(x, collapse = ", ")` joins one vector into a scalar. glue_collapse() removes this trap: `sep` always means the join character, and the function always collapses. If you want element-wise joining, use glue() or paste0() with vectors.

2. **Expecting a vector back.** glue_collapse() always returns a length-1 string. If you call `length()` on it, you get `1`, not `length(x)`. To keep a per-element vector, use glue() or paste0() instead and skip the collapse step.

3. **Empty input returns empty glue.** `glue_collapse(character(0))` returns a zero-length glue object, not `NA` and not `""`. Test for `length() == 0` if you build collapse strings from filtered inputs, or use the `if` shortcut before calling.

## Try it yourself

**Try it:** Use `glue_collapse()` to turn the vector `c("R", "Python", "SQL")` into the sentence `"R, Python, and SQL"`. Save the result to `ex_collapsed`.

```r title="Your turn: build an Oxford-style join"
# Try it: collapse with an Oxford and
ex_tools <- c("R", "Python", "SQL")
ex_collapsed <- # your code here

ex_collapsed
#> Expected: R, Python, and SQL
```

<details>
<summary>Click to reveal solution</summary>

```r title="Solution"
ex_collapsed <- glue_collapse(ex_tools, sep = ", ", last = ", and ")
ex_collapsed
#> R, Python, and SQL
```

**Explanation:** `sep = ", "` puts a comma between the first elements; `last = ", and "` replaces the final separator with the Oxford-comma "and" form. For two-element inputs, only `last` is used.

</details>

## Related glue functions

- `glue()` builds a template by interpolating `{expressions}` into a string. Use it when the input is variables, not a vector to join.
- `glue_data()` interpolates a template across the rows of a data frame. Pair it with `glue_collapse()` for one-line summaries.
- `glue_sql()` interpolates safely into a SQL statement, with proper quoting and identifier escaping for a live DBI connection.
- `paste()` and `paste0()` are the base R joiners. Drop down to these when you do not need the `last` or `width` arguments.
- See the [glue package reference](https://glue.tidyverse.org/reference/glue_collapse.html) for the full argument list and edge-case behaviour.

## FAQ

**How is glue_collapse() different from paste(x, collapse = ", ")?**

For a plain comma join the two are equivalent. glue_collapse() adds two arguments that base paste() lacks: `last`, which lets you write "a, b, and c" in one call, and `width`, which truncates the joined string at a maximum character count. If you do not need either, paste() is the smaller-dependency option.

**What does the `last` argument do?**

`last` overrides the separator placed before the final element of the vector. With `sep = ", "` and `last = ", and "`, a three-element vector becomes `"a, b, and c"` instead of `"a, b, c"`. It is the simplest way to produce natural-language lists without manual string surgery.

**Can I limit the output length of glue_collapse()?**

Yes. The `width` argument caps the joined string at the given character count; anything past that is replaced with `...`. For example, `glue_collapse(letters, sep = " ", width = 10)` returns `"a b c d..."`. The truncation is silent, so check `nchar()` of the result if downstream code depends on the exact length.

**Why does glue_collapse() return a single string instead of a vector?**

Collapsing IS the function's job: it reduces a length-N character vector down to a length-1 string. If you want a per-element vector, use `glue("Hi {names}")` (which returns one string per element of `names`) and skip the `glue_collapse()` step entirely.

**Can I use glue_collapse() on the result of glue() or glue_data()?**

Yes, and that is the canonical pipeline. `glue()` and `glue_data()` produce a vector of interpolated strings, one per input element or data frame row. `glue_collapse()` then joins that vector into one summary line. The two-step pattern is the glue idiom for "build per-row, summarise to one line".

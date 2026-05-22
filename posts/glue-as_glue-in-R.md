---
title: "glue as_glue() in R: Promote Strings to a glue Object"
slug: "glue-as_glue-in-R"
description: "Use glue as_glue() in R to promote a plain character vector into a glue object so it prints each element on its own line without quotes. See five examples."
keywords: "glue as_glue, as_glue function R, glue as_glue examples, R promote string to glue, as_glue character vector, glue class object, as.character glue"
mathjax: false
webr: true
date: "2026-05-22"
post_type: "PSEO"
category_id: "function-deep"
subcategory_id: "glue-functions"
fr_parent: "stringr-in-R.html"
auto_link_terms: "as_glue()|glue::as_glue()|glue as_glue|promote to glue|coerce to glue"
auto_link_case_sensitive: true
target_keyword: "glue as_glue"
sibling_block_enabled: true
difficulty: "Beginner"
---

# glue as_glue() in R: Promote Strings to a glue Object

<p class="lead">glue as_glue() takes a plain character vector and tags it with the <code>glue</code> S3 class, so it prints each element on its own line without surrounding quotes. The underlying string data is unchanged: only the class attribute is added. Reach for it whenever you receive a character vector from <code>sprintf()</code>, <code>paste()</code>, or a database and want it to print and dispatch like the output of <code>glue()</code>.</p>

[QUICK ANSWER]
as_glue("Hello world")                       # promote a single string
as_glue(c("line one", "line two"))           # promote a multi-element vector
as_glue(sprintf("%.2f%%", x * 100))          # tag sprintf output as glue
as_glue(as.character(glue("Hi {name}")))     # restore glue class after coercion
inherits(as_glue("x"), "glue")               # TRUE: class check
class(as_glue("x"))                          # "glue" "character"
identical(as.character(as_glue("a")), "a")   # TRUE: data is untouched

[DECISION TREE: Is as_glue() the right tool?]
- promote an existing character vector to glue: as_glue(x)
- build a new string with interpolation: glue("Hi {name}")
- interpolate across data frame rows: glue_data(df, "{a} - {b}")
- collapse a vector into one string: glue_collapse(x, sep = ", ")
- strip the glue class back to plain character: as.character(g)
- check if something is already glue: inherits(x, "glue")

## What as_glue() does in one sentence

**as_glue() adds the `glue` S3 class to a character vector so it gets glue's print method, format method, and combine method.** The function does no interpolation, no parsing of braces, and no string manipulation. It is a pure coercion: input character, output the same character bytes wrapped in a `c("glue", "character")` class attribute.

The practical effect is visible only when you print. A plain character vector prints with quotes and a `[1]` index prefix. A glue object prints each element on its own line, no quotes, no index. This is the same display you get from `glue()` itself, which is helpful when a value will eventually flow into a glue pipeline or a report.

```r title="Promote a string and see the print difference"
library(glue)

plain <- "Hello world"
tagged <- as_glue("Hello world")

plain
#> [1] "Hello world"

tagged
#> Hello world
```

The two values hold identical bytes; only the class differs, so the print method dispatches to `print.glue()` instead of `print.character()`.

## Syntax

**`as_glue(x)` accepts any character vector (or anything coercible to character) and returns a glue object.** There are no other arguments. The function is intentionally minimal: it exists to flip an S3 class, not to transform data.

```r title="Function signature and return value"
# as_glue(x)
#
# x : a character vector, or an object coercible via as.character()
#
# Returns: x with class set to c("glue", "character")
```

If `x` is not already character, glue calls `as.character()` on it first. Factors, numerics, and dates therefore work, but the conversion follows R's standard `as.character()` rules, which may not be what you expect (factors return levels, not codes). Convert explicitly when the semantics matter.

[KEY INSIGHT]
**as_glue() flips a class; it does not interpolate.** If you pass `as_glue("Hi {name}")` hoping it will resolve `name`, you will get the literal string `Hi {name}`. Interpolation is a `glue()` job. Use `as_glue()` when you already have the finished text and only want glue's display and S3 dispatch.

## Common use cases

### 1. Promote a plain string to print without quotes

```r title="Promote a single string"
msg <- as_glue("Run complete: 1,204 rows written")
msg
#> Run complete: 1,204 rows written
```

The same string passed to `print()` directly would show `[1] "Run complete: 1,204 rows written"`. Wrapping it in `as_glue()` is the lightest possible way to get the cleaner display in scripts, log files, and knitr output.

### 2. Tag sprintf or paste output as glue

```r title="Tag sprintf output as glue"
rates <- c(0.12, 0.085, 0.041)
labels <- as_glue(sprintf("%.1f%%", rates * 100))
labels
#> 12.0%
#> 8.5%
#> 4.1%
```

`sprintf()` returns a plain character vector. Wrapping it in `as_glue()` keeps the numeric formatting but lets the vector flow into glue-aware code (a `glue_collapse()` call, a `cat()` in a knitr chunk, or a custom print path) as if it had been produced by `glue()` itself.

### 3. Restore the glue class after coercion strips it

```r title="Round-trip from character back to glue"
g <- glue("Hi {name}", name = "Ada")
class(g)
#> [1] "glue"      "character"

plain <- as.character(g)
class(plain)
#> [1] "character"

restored <- as_glue(plain)
class(restored)
#> [1] "glue"      "character"
```

Many base R functions silently drop S3 attributes. Stuffing a glue object into a data frame column, paste()-ing it, or unlist()-ing a list of glue values all return plain character. `as_glue()` is the round-trip back, so downstream code that branches on `inherits(x, "glue")` continues to work.

[WARNING]
**Coercing a factor returns levels, not codes.** `as_glue(factor(c("a","b")))` calls `as.character()` on the factor, which returns the level strings. If you wanted the integer codes, run `as_glue(as.character(as.integer(f)))` instead. The trap is silent and only bites when the factor has a level order that differs from its appearance order.

### 4. Combine multiple glue values without losing the class

```r title="Concatenate glue values element-wise"
greetings <- as_glue(c("Hi Ada", "Hi Bob", "Hi Cee"))
roles <- as_glue(c("editor", "viewer", "admin"))

combined <- as_glue(paste(greetings, "-", roles))
combined
#> Hi Ada - editor
#> Hi Bob - viewer
#> Hi Cee - admin
```

`paste()` is the standard element-wise combiner, but it drops the glue class. Wrapping the result in `as_glue()` keeps the printed form (one line per element, no quotes) for the rest of your pipeline.

### 5. Return glue from a custom helper

```r title="Helper that always returns glue"
format_money <- function(x, currency = "USD") {
  txt <- sprintf("%s %.2f", currency, x)
  as_glue(txt)
}

format_money(c(12.5, 9.99, 0.5))
#> USD 12.50
#> USD 9.99
#> USD 0.50
```

Returning a glue object from a helper signals intent: callers can treat the value as text but also get glue's clean print, glue's `format()` method, and the ability to chain through `glue_collapse()`. This pattern keeps formatting helpers consistent across a package or analysis project.

## as_glue() vs glue() and base R alternatives

**Pick as_glue() when you already have the finished string and only want glue's class behaviour.** Use `glue()` when you still need to interpolate. Use plain character when downstream code does not care about S3 dispatch and you want maximum compatibility with base R idioms.

| Function | What it does | When to reach for it |
|---|---|---|
| `as_glue(x)` | Adds glue class to existing character vector | Already-built strings from sprintf, paste, DB results |
| `glue(template)` | Parses `{}` and interpolates values | Building a new string with R values inside |
| `glue_data(df, t)` | Interpolates across rows of a data frame | Per-row labels from tabular input |
| `as.character(g)` | Strips glue class, returns plain character | Sending into base R code that breaks on classes |
| `format(x)` | Calls the format method for x | Custom display logic; pairs with as_glue for prints |

The decision rule: if you need brace interpolation, use `glue()`. If you already have the text and only want it to print like glue output, use `as_glue()`. The two are not substitutes; they handle adjacent steps in the same pipeline.

[NOTE]
**Coming from Python f-strings?** Python has no class-flipping equivalent because f-strings are evaluated eagerly and return plain `str`. The closest analogue is wrapping a result in a custom class to override `__repr__`. In R, S3 dispatch is the standard way to give an existing value a richer print method, and `as_glue()` is glue's purpose-built constructor for that move.

## Common pitfalls

1. **Expecting interpolation.** `as_glue("Hi {name}")` returns the literal string with braces intact, because the function does no parsing. If you wanted interpolation, call `glue("Hi {name}")` first; `glue()` already returns a glue object.

2. **Losing the class after `c()` or `paste()`.** `paste(g, "x")` always drops the glue class; `c()` may, depending on the glue and R version. Wrap the combined result in `as_glue()` again, or use `glue_collapse()` when collapsing to a single string.

3. **Assuming the data has been validated.** `as_glue()` accepts whatever character bytes you hand it. A literal `{` in the input stays as `{` in the output, which may confuse readers who assume the string passed through `glue()`.

## Try it yourself

**Try it:** Take the vector `c("Alpha", "Bravo", "Charlie")`, promote it to glue with as_glue(), and confirm both that it prints one element per line without quotes and that `inherits(result, "glue")` returns TRUE. Save the promoted vector to `ex_g`.

```r title="Your turn: promote to glue and check class"
# Try it: as_glue() on a multi-element vector
ex_input <- c("Alpha", "Bravo", "Charlie")
ex_g <- # your code here

ex_g
#> Expected: Alpha / Bravo / Charlie on separate lines

inherits(ex_g, "glue")
#> Expected: [1] TRUE
```

<details>
<summary>Click to reveal solution</summary>

```r title="Solution"
ex_g <- as_glue(ex_input)
ex_g
#> Alpha
#> Bravo
#> Charlie

inherits(ex_g, "glue")
#> [1] TRUE
```

**Explanation:** `as_glue()` adds the glue class while leaving the character data untouched. The print method then dispatches to `print.glue()`, which renders one element per line without quotes or index prefixes.

</details>

## Related glue functions

- `glue()` builds a glue object from a template with `{expression}` interpolation. Use it when you need to evaluate R code inside the string, not just tag an existing string.
- `glue_data()` interpolates a template across the rows of a data frame or list. Pass the result through `as_glue()` only if a step in between has stripped the class.
- `glue_collapse()` flattens a multi-element glue or character vector into a single glue string with a separator. Pair it with `as_glue()` when collapsing pre-formatted character vectors.
- `as.character()` is the inverse: it drops the glue class and returns plain character. Use it before handing a glue value to base R code that does not handle attributes well.
- See the [glue package reference for as_glue()](https://glue.tidyverse.org/reference/as_glue.html) for the formal argument definition and version history.

## FAQ

**What is the difference between as_glue() and glue()?**

`glue()` parses braces and evaluates R expressions inside them, returning a glue object with the interpolated values filled in. `as_glue()` does no parsing or evaluation: it adds the `glue` S3 class to a character vector you already have. Use `glue()` to build a string; use `as_glue()` to retrofit the class onto something you built another way.

**Does as_glue() change the underlying string?**

No. The byte content is unchanged; only the class attribute is set to `c("glue", "character")`. You can verify with `identical(as.character(as_glue(x)), x)`, which returns `TRUE` for any character input. The visible difference appears only when R picks a method based on class, such as during printing.

**Why does my glue object print with quotes after a c() call?**

`c()` and several other base R combiners drop S3 attributes from the result. When the glue class is gone, the print method falls back to `print.character()` and adds quotes. Wrap the combined value in `as_glue()` again to restore the class.

**Can as_glue() accept a numeric or factor input?**

Yes, indirectly. as_glue() calls `as.character()` on non-character input, so numerics, factors, and dates are coerced first. Factors return their level strings, not their integer codes. Convert explicitly with `format()` or `sprintf()` when you need control over the display.

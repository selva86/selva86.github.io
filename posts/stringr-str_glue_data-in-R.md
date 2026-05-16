---
title: "stringr str_glue_data() in R: Interpolate From a Data Frame"
slug: "stringr-str_glue_data-in-R"
description: "Use stringr str_glue_data() in R to interpolate strings from a data frame or named list. 5 examples, a str_glue comparison, and common pitfalls explained."
keywords: "stringr str_glue_data, str_glue_data function R, stringr str_glue_data examples, R string interpolation data frame, glue data frame R, str_glue_data vs str_glue"
mathjax: false
webr: true
date: "2026-05-16"
post_type: "PSEO"
category_id: "function-deep"
subcategory_id: "stringr-functions"
fr_parent: "stringr-in-R.html"
auto_link_terms: "str_glue_data()|stringr str_glue_data|stringr::str_glue_data()|str_glue_data function|str_glue_data"
auto_link_case_sensitive: true
target_keyword: "stringr str_glue_data"
sibling_block_enabled: true
difficulty: "Beginner"
---

# stringr str_glue_data() in R: Interpolate From a Data Frame

<p class="lead">stringr str_glue_data() interpolates a string template using a data frame or list as the lookup source: every <code>{expression}</code> inside the template is evaluated against that object's columns or elements. It is str_glue() with the data passed in explicitly, which makes it the natural fit for pipelines.</p>

[QUICK ANSWER]
str_glue_data(df, "{col}")                  # interpolate a data frame column
str_glue_data(lst, "{name}")                # interpolate a named list element
str_glue_data(df, "{a} and {b}")            # combine two columns
df |> str_glue_data("{x}")                  # pipe the data straight in
str_glue_data(df, "{round(price, 1)}")      # run code on a column
str_glue_data(df, "{toupper(name)}")        # call a function per row
str_glue_data(mtcars, "{mpg} mpg")          # works on any data frame

[DECISION TREE: Is str_glue_data() the right tool?]
- interpolate from a data frame or list: str_glue_data(df, "{col}")
- interpolate from loose variables: str_glue("Hi {name}")
- build a column inside a pipeline: mutate(df, lab = str_glue("{a}"))
- join fixed pieces with no template: str_c("a", "b", "c")
- collapse a vector to one string: str_flatten(x, ", ")
- C-style numeric formatting: sprintf("%.2f", x)

## What str_glue_data() does in one sentence

**str_glue_data() fills a {brace} template by evaluating each expression against a supplied data frame, list, or environment.** You hand it the data as the first argument, `.x`, and every name inside the braces is looked up there before anywhere else.

This is the difference from str_glue(): str_glue() reads variables from wherever the call happens, while str_glue_data() reads them from the object you pass. When that object is a data frame, the function is vectorised over its rows and returns one string per row.

```r title="Load stringr and interpolate from a data frame"
library(stringr)

people <- data.frame(name = c("Ada", "Grace"))
str_glue_data(people, "Hello, {name}!")
#> Hello, Ada!
#> Hello, Grace!
```

The `{name}` slot resolves to the `name` column, so a two-row data frame produces two finished strings.

## Syntax

**str_glue_data(.x, ..., .sep = "", .envir = parent.frame()) builds strings from a data source and templates.** The `.x` argument is the lookup object, `...` holds the template strings, `.sep` joins them when you pass more than one, and `.envir` is the fallback environment for any name not found in `.x`.

```r title="Function signature and defaults"
# str_glue_data(.x, ..., .sep = "", .envir = parent.frame())
#
# .x      : data frame, list, or environment supplying the {} names
# ...     : template strings; {expr} is evaluated and inserted
# .sep    : separator placed between multiple ... templates
# .envir  : fallback environment for names absent from .x
```

Anything inside `{}` is treated as R code, not just a bare column name. Arithmetic, function calls, and comparisons all run before the string is assembled.

[NOTE]
**str_glue_data() is stringr's re-export of glue::glue_data().** stringr exposes it so you can interpolate from data without attaching the glue package separately. Every option documented for `glue_data()`, including custom delimiters and the transformer hook, works through str_glue_data() as well.

## Five ways to use str_glue_data()

**Five patterns cover almost every real use of str_glue_data().** Each block stands alone, so you can paste it straight into the live console.

### Interpolate columns from a data frame

**The core job is reading several columns into one sentence per row.** Each `{}` slot names the column that belongs there.

```r title="Interpolate two columns from a data frame"
products <- data.frame(
  item  = c("keyboard", "mouse", "monitor"),
  price = c(49, 19, 199)
)
str_glue_data(products, "The {item} costs ${price}.")
#> The keyboard costs $49.
#> The mouse costs $19.
#> The monitor costs $199.
```

The `$` is a literal character; only the `{item}` and `{price}` slots are interpolated, once per row.

### Interpolate from a named list

**A named list works the same way as a data frame.** Each element name becomes available inside the braces.

```r title="Interpolate from a named list"
person <- list(name = "Ada", role = "Engineer")
str_glue_data(person, "{name} works as an {role}.")
#> Ada works as an Engineer.
```

Because the list elements are scalars, the result is a single string rather than a vector.

### Pipe the data straight in

**str_glue_data() takes the data as its first argument, so it slots into a pipe.** You never have to repeat the data frame name inside the template.

```r title="Pipe a data frame into str_glue_data"
library(dplyr)

mtcars |>
  head(3) |>
  str_glue_data("{mpg} mpg from {cyl} cylinders, {hp} hp")
#> 21 mpg from 6 cylinders, 110 hp
#> 21 mpg from 6 cylinders, 110 hp
#> 22.8 mpg from 4 cylinders, 93 hp
```

The data frame flows in through the pipe, and each column name is read directly from it.

[KEY INSIGHT]
**The first argument is what separates str_glue_data() from str_glue().** With str_glue() you would write `{df$mpg}` and repeat `df` for every column. str_glue_data() takes the data once, so the template stays clean: bare column names, no `df$` prefix. That single design choice is the entire reason the function exists.

### Run expressions against the data

**Braces hold any R expression, so you can transform a column inline.** The expression is evaluated with the data as its scope.

```r title="Evaluate expressions against the data"
stats <- list(values = c(3, 7, 11, 5))
str_glue_data(stats, "Mean {mean(values)}, range {max(values) - min(values)}.")
#> Mean 6.5, range 8.
```

`mean(values)` and `max(values) - min(values)` both run before the template is filled.

### Build a label for every row

**Combining several columns into a label column is the most common pipeline use.** Pass the columns to str_glue_data() and you get a vector ready to assign.

```r title="Build a row label from three columns"
sales <- data.frame(
  rep   = c("Mona", "Raj"),
  units = c(120, 95),
  month = c("Jan", "Feb")
)
str_glue_data(sales, "{rep} sold {units} units in {month}.")
#> Mona sold 120 units in Jan.
#> Raj sold 95 units in Feb.
```

The template fills once per row, producing a label string aligned with the data frame.

## str_glue_data() vs str_glue()

**Both functions interpolate {brace} templates; they differ in where the names come from.** str_glue() reads from the calling environment, while str_glue_data() reads from the object you pass as `.x`.

```r title="Compare str_glue_data and str_glue"
df <- data.frame(name = c("Ada", "Alan"), score = c(91, 88))

# str_glue_data: df is the lookup source
str_glue_data(df, "{name}: {score}")
#> Ada: 91
#> Alan: 88

# str_glue: the columns must be reached explicitly
str_glue("{df$name}: {df$score}")
#> Ada: 91
#> Alan: 88
```

Both return the same text. str_glue_data() keeps the template free of the `df$` prefix, which matters most when a template references many columns.

| Function | Name lookup | Best for |
|---|---|---|
| `str_glue_data()` | from the `.x` object | data frames and lists, pipelines |
| `str_glue()` | from the calling environment | loose variables in scope |
| `mutate(... str_glue())` | column vectors in scope | building a column in a dplyr chain |

[TIP]
**Inside a mutate() call, plain str_glue() is fine.** dplyr already puts the column names in scope as vectors, so `mutate(df, label = str_glue("{name}"))` works without str_glue_data(). Reach for str_glue_data() when the data is not already in a tidyverse verb, for example at the start of a pipe or in a plain script.

## Common pitfalls

**Three pitfalls cause most str_glue_data() surprises.** Each has a one-line fix.

### A name missing from .x raises an error

**Every name inside the braces must resolve, or str_glue_data() stops.** If the name is not a column of `.x` and not found in `.envir`, you get the familiar "object not found" error.

```r title="A name absent from .x errors"
df <- data.frame(name = c("Ada", "Alan"))
str_glue_data(df, "{name} scored {score}")
#> Error in `str_glue_data()`:
#> ! object 'score' not found
```

Add the missing column to the data, or correct the name in the template.

### str_glue_data() returns a glue object

**The result has class glue, not a bare character vector.** Most code treats it as a string, but strict type checks can trip on the extra class attribute.

```r title="Check and convert the result type"
out <- str_glue_data(list(x = 2), "value {x}")
class(out)
#> [1] "glue"      "character"
as.character(out)
#> [1] "value 2"
```

Wrap the result in `as.character()` whenever a function or test demands a plain character vector.

### Unmatched names fall back to the environment

**A name not in `.x` is looked up in `.envir` instead of failing immediately.** This is useful for mixing a constant into the template, but it can also pick up a stale variable silently.

```r title="Names not in .x come from the environment"
threshold <- 50
df <- data.frame(item = c("pen", "desk"), price = c(3, 120))
str_glue_data(df, "{item}: over budget? {price > threshold}")
#> pen: over budget? FALSE
#> desk: over budget? TRUE
```

Here `price` is a column and `threshold` is an outside variable, both resolved in one template.

[WARNING]
**The .envir fallback can hide a typo.** If you mistype a column name but a variable of that name exists in the surrounding scope, str_glue_data() uses it without complaint and the output looks plausible. When a result is wrong but raises no error, check that every brace name is really a column of `.x`.

## Try it yourself

**Try it:** Use str_glue_data() to turn the `cities` data frame into the lines "Tokyo has 14 million people." and "Paris has 2 million people." Save the result to `ex_lines`.

```r title="Your turn: interpolate from a data frame"
cities <- data.frame(
  city = c("Tokyo", "Paris"),
  pop  = c(14, 2)
)
# Try it: build the sentence with str_glue_data
ex_lines <- # your code here

ex_lines
#> Expected: Tokyo has 14 million people. / Paris has 2 million people.
```

<details>
<summary>Click to reveal solution</summary>

```r title="Solution"
cities <- data.frame(
  city = c("Tokyo", "Paris"),
  pop  = c(14, 2)
)
ex_lines <- str_glue_data(cities, "{city} has {pop} million people.")
ex_lines
#> Tokyo has 14 million people.
#> Paris has 2 million people.
```

**Explanation:** str_glue_data() evaluates each `{}` slot against the `cities` data frame, so `{city}` reads the city column and `{pop}` reads the pop column. The template fills once per row, returning one string per city.

</details>

## Related stringr functions

When str_glue_data() is not quite the fit, these are the next stops:

- [str_glue()](stringr-str_glue-in-R.html) interpolates from loose variables in scope rather than a data object.
- [str_c()](stringr-str_c-in-R.html) joins fixed pieces element-wise when there is no template to fill.
- [str_flatten()](stringr-str_flatten-in-R.html) collapses a vector into a single string with a separator.
- [str_pad()](stringr-str_pad-in-R.html) grows a string to a fixed width by adding a pad character.
- [str_replace()](stringr-str_replace-in-R.html) swaps a matched pattern for new text, a different kind of edit.
- The full [stringr reference](https://stringr.tidyverse.org/reference/str_glue.html) documents str_glue_data() and its arguments.

## FAQ

**What is the difference between str_glue_data() and str_glue() in R?**

They differ in where brace names are resolved. `str_glue()` looks up each `{}` name in the calling environment, so you write `{df$score}` to reach a column. `str_glue_data()` takes a data frame or list as its first argument, `.x`, and resolves names against that object, so the template stays clean with bare names like `{score}`. Use str_glue_data() when the names live in a data object, and str_glue() when they are loose variables.

**How do I use str_glue_data() with a data frame?**

Pass the data frame as the first argument and write column names inside braces: `str_glue_data(df, "{name}: {score}")`. The function is vectorised over rows, so it returns one finished string per row. Because the data frame goes in first, str_glue_data() also works at the start of a pipe, such as `df |> str_glue_data("{name}")`, with no need to repeat the data frame name in the template.

**Can str_glue_data() interpolate from a list?**

Yes. A named list works exactly like a data frame: each element name becomes available inside the braces. `str_glue_data(list(name = "Ada"), "{name}")` returns `"Ada"`. If the list elements are scalars the result is a single string, and if they are vectors of equal length the template is recycled to produce one string per element.

**Why does str_glue_data() return a glue object instead of a string?**

str_glue_data() returns an object of class `glue`, which also inherits `character`. Most R code treats it as an ordinary string, so printing, concatenation, and column assignment all behave normally. The extra class only matters for strict type checks: `identical()` against a plain string returns FALSE. Wrap the result in `as.character()` when a function or unit test requires a bare character vector.

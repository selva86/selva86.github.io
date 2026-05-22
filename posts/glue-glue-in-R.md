---
title: "glue glue() in R: Interpolate Variables Into Strings"
slug: "glue-glue-in-R"
description: "Use glue glue() in R to interpolate variables and expressions into strings with {braces}. Five examples, a paste comparison, and common pitfalls explained."
keywords: "glue glue, glue function R, glue glue examples, R glue interpolation, glue vs paste, glue package R, string interpolation R"
mathjax: false
webr: true
date: "2026-05-22"
post_type: "PSEO"
category_id: "function-deep"
subcategory_id: "glue-functions"
fr_parent: "stringr-in-R.html"
auto_link_terms: "glue()|glue::glue()|glue package|glue function|glue glue"
auto_link_case_sensitive: true
target_keyword: "glue glue"
sibling_block_enabled: true
difficulty: "Beginner"
---

# glue glue() in R: Interpolate Variables Into Strings

<p class="lead">glue glue() builds a string by interpolation: you write the finished sentence as a template and mark each variable slot with <code>{braces}</code>. Every expression inside the braces is evaluated as real R code and its result is inserted in place. It is the readable alternative to stacking many paste() or sprintf() arguments.</p>

[QUICK ANSWER]
glue("Hi {x}", x = "Ada")              # "Hi Ada" interpolate a value
glue("2 + 2 = {2 + 2}")                # "2 + 2 = 4" evaluate an expression
glue("Upper: {toupper('ada')}")        # "Upper: ADA" call a function
glue("a", "b", "c")                    # "abc" join plain strings
glue("Show {{x}} literally")           # "Show {x} literally" escape braces
glue("user_{1:3}")                     # length-3 glue vector, vectorised
glue("{a} of {b}", a = 3, b = 10)      # "3 of 10" multiple named values

[DECISION TREE: Is glue() the right tool?]
- insert values into a template: glue("Hi {name}")
- interpolate from a data frame: glue_data(df, "{col}")
- join a few fixed pieces: paste0("a", "b", "c")
- C-style numeric formatting: sprintf("%.2f", x)
- collapse a vector to one string: glue_collapse(x, ", ")
- write a SQL statement safely: glue_sql("SELECT * FROM {t}", t = "users", .con = con)

## What glue() does in one sentence

**glue() evaluates R expressions wrapped in {braces} and inserts the results into a template string.** You write the sentence exactly as it should read, leave a brace-marked hole wherever a value belongs, and glue() fills each hole by running the code inside it.

This is string interpolation: the template and the output have the same shape, so what you write is what you get. It is the readable counterpart to paste(), which joins separate pieces rather than filling a template.

```r title="Load glue and interpolate a value"
library(glue)

name <- "Ada"
glue("Hello, {name}!")
#> Hello, Ada!
```

The `{name}` slot is replaced with the value of `name`, producing one finished sentence.

## Syntax

**glue(..., .sep = "", .envir = parent.frame(), .open = "{", .close = "}") builds a string from templates and values.** The `...` arguments are the template strings, `.sep` joins them when you pass more than one, `.envir` is the environment where each `{expr}` is evaluated, and `.open` / `.close` change the delimiter pair.

```r title="Function signature and defaults"
# glue(..., .sep = "", .envir = parent.frame(),
#      .open = "{", .close = "}", .na = "NA", .null = character())
#
# ...     : template strings; {expr} is evaluated and inserted
# .sep    : separator placed between the ... arguments
# .envir  : environment where each {expr} is evaluated
# .open   : opening delimiter, default "{"
# .close  : closing delimiter, default "}"
```

Anything inside `{}` is treated as R code, not just a variable name. That means you can call functions and run arithmetic directly in the template.

```r title="Interpolate an expression, not just a variable"
x <- 5
glue("{x} squared is {x^2}")
#> 5 squared is 25
```

Both `{x}` and `{x^2}` are evaluated, so the second slot computes `25` on the fly.

[NOTE]
**glue() is the core function of the glue package.** Tidyverse packages re-export it under different names: stringr exposes it as str_glue(), and glue_sql() wraps it for safe SQL. They share the same brace syntax and arguments, so anything you learn here transfers to every variant.

## Five common glue() scenarios

**Five scenarios cover almost every real use of glue().** Each block stands alone, so you can paste it straight into the live console.

### Interpolate variables into a sentence

**The core job of glue() is dropping variables into a readable sentence.** Each `{}` slot names the variable that belongs there.

```r title="Build a sentence from variables"
product <- "keyboard"
price   <- 49
glue("The {product} costs ${price}.")
#> The keyboard costs $49.
```

The `$` is a literal character; only the `{price}` slot is interpolated.

### Evaluate expressions inside braces

**Braces hold any R expression, not just bare names.** You can call functions and the result is inserted directly.

```r title="Run code inside the braces"
values <- c(3, 7, 11)
glue("Mean is {mean(values)}, max is {max(values)}.")
#> Mean is 7, max is 11.
```

`mean(values)` and `max(values)` both run before the string is assembled.

### Interpolate a vector to get many strings

**When a brace holds a vector, glue() returns one string per element.** The template is recycled across every value.

```r title="Vectorised interpolation"
ids <- 1:3
glue("user_{ids}")
#> user_1
#> user_2
#> user_3
```

The single template produces a length-three result, one string for each id.

### Pass values as named arguments

**Named arguments become variables for the template.** This keeps a value local to the call instead of relying on the surrounding environment.

```r title="Supply values as named arguments"
glue("{city} is in {country}.", city = "Tokyo", country = "Japan")
#> Tokyo is in Japan.
```

`city` and `country` exist only inside this glue() call.

### Use glue inside a mutate pipeline

**Most interpolation in real code happens inside a tidyverse pipeline.** Pass columns to glue() inside `mutate()` to build a label column.

```r title="Build a label column with mutate"
library(dplyr)
df <- tibble(name = c("Ada", "Alan"), score = c(91, 88))
df |> mutate(label = glue("{name}: {score} pts"))
#> # A tibble: 2 x 3
#>   name  score label
#>   <chr> <dbl> <glue>
#> 1 Ada      91 Ada: 91 pts
#> 2 Alan     88 Alan: 88 pts
```

glue() is vectorised, so it fills the template once per row.

[KEY INSIGHT]
**glue() reads in the same order you write the sentence.** A nested paste() call forces the reader to mentally interleave literal pieces and variables. With glue(), the template is the final sentence with holes in it, so the code looks like the output. That left-to-right readability is the entire reason the function exists.

## glue() vs paste() vs sprintf()

**Three functions assemble strings from values, and they differ in template style.** The choice comes down to how much formatting control you need.

```r title="Compare glue, paste0, and sprintf"
n <- 42
glue("Count: {n}")
#> Count: 42
paste0("Count: ", n)
#> [1] "Count: 42"
sprintf("Count: %d", n)
#> [1] "Count: 42"
```

All three produce the same text. glue() keeps the value inline with the words, paste0() alternates literal and variable pieces, and sprintf() uses `%` placeholder codes.

| Function | Template style | Best for |
|---|---|---|
| `glue()` | `{expr}` inline | readable sentences with variables |
| `paste0()` | alternating pieces | quick joins of a few values |
| `sprintf()` | `%d`, `%.2f` codes | precise numeric formatting |

Reach for glue() when the output is a sentence a human reads, and sprintf() when a number needs an exact width or decimal count.

[TIP]
**Format numbers before they enter the template.** glue() inserts a number exactly as R prints it, so `{1/3}` becomes a long decimal. To control decimal places, format inside the braces with `{round(x, 2)}` or `{format(x, nsmall = 2)}`. For strict numeric formatting, switch to `sprintf("%.2f", x)` and wrap that result in the glue template if needed.

## Common pitfalls

**Three pitfalls cause most glue() surprises.** Each has a one-line fix.

### A missing variable raises an error

**Any name inside braces must exist, or glue() stops.** Because the braces hold real code, an undefined name is the same "object not found" error you see anywhere else.

```r title="An undefined name errors"
glue("Hello, {first_name}!")
#> Error in `glue()`:
#> ! object 'first_name' not found
```

Define the variable first, or pass it as a named argument to the call.

```r title="Pass the value as a named argument"
glue("Hello, {first_name}!", first_name = "Sam")
#> Hello, Sam!
```

Now the name resolves inside the call and the template fills cleanly.

### Literal braces need doubling

**A single brace is always treated as code, never as text.** To print a real `{` or `}`, double it.

```r title="Double the braces to print them"
glue("A set is written {{1, 2, 3}}")
#> A set is written {1, 2, 3}
```

`{{` collapses to one literal `{`, and `}}` to one literal `}`, so the braces survive into the output. If your template already uses braces (for example in LaTeX), switch the delimiters with `.open = "<<"` and `.close = ">>"`.

### glue returns a glue object, not a plain string

**glue() returns an object of class glue, not a bare character vector.** Most code treats it like a string, but strict type checks can trip on the extra class.

```r title="Check and convert the result type"
result <- glue("value: {1 + 1}")
class(result)
#> [1] "glue"      "character"
as.character(result)
#> [1] "value: 2"
```

Wrap the result in `as.character()` whenever a function or test demands a plain character vector.

[WARNING]
**A glue object is not identical to a character vector.** `identical(glue("ab"), "ab")` returns FALSE because the class attribute differs, even though the text matches. When a comparison or unit test fails unexpectedly, convert with `as.character()` before checking equality.

## Try it yourself

**Try it:** Use glue() to build the sentence "Tokyo has 14 wards." from the variables `city` and `wards`. Save the result to `ex_sentence`.

```r title="Your turn: interpolate two variables"
city  <- "Tokyo"
wards <- 14
# Try it: build the sentence with glue
ex_sentence <- # your code here

ex_sentence
#> Expected: Tokyo has 14 wards.
```

<details>
<summary>Click to reveal solution</summary>

```r title="Solution"
city  <- "Tokyo"
wards <- 14
ex_sentence <- glue("{city} has {wards} wards.")
ex_sentence
#> Tokyo has 14 wards.
```

**Explanation:** glue() evaluates each `{}` expression against the current environment, so `{city}` becomes `"Tokyo"` and `{wards}` becomes `14`. Both results are inserted into the template in the order they appear.

</details>

## Related glue functions

When glue() is not quite what you need, these are the next stops:

- [glue_data()](glue-glue_data-in-R.html) interpolates from a data frame or list, which is cleaner inside a pipeline.
- [glue_collapse()](glue-glue_collapse-in-R.html) collapses a vector into a single string with a separator.
- [glue_sql()](glue-glue_sql-in-R.html) quotes values safely for SQL statements sent through DBI.
- [str_c()](stringr-str_c-in-R.html) joins fixed pieces element-wise when there is no template to fill.
- [str_glue()](stringr-str_glue-in-R.html) is the stringr re-export of glue() with the same syntax.
- The full [glue package reference](https://glue.tidyverse.org/reference/glue.html) documents glue() and its arguments.

## FAQ

**What is the difference between glue() and paste() in R?**

They differ in template style. `paste()` alternates literal strings and variables as separate arguments, while glue() takes one template string with `{}` slots where values belong. `glue("Hi {name}")` reads like the finished sentence, whereas `paste0("Hi ", name)` splits it into pieces. glue() also evaluates real R code inside the braces, so `{x^2}` or `{toupper(x)}` works directly in the template, and the result is vectorised across any vector you reference.

**How do I use a variable inside glue()?**

Wrap the variable name in curly braces inside the template: `glue("Hello, {name}")` inserts the value of `name`. The variable must exist in the calling environment, or you can supply it as a named argument, such as `glue("Hello, {name}", name = "Sam")`. Anything inside the braces is run as R code, so you can also call functions, like `glue("{toupper(name)}")`.

**How do I print literal curly braces with glue()?**

Double the brace. `{{` produces one literal `{` and `}}` produces one literal `}` in the output. For example, `glue("A set {{1, 2}}")` returns `A set {1, 2}`. For templates with many braces (LaTeX, JSON), switch delimiters with `.open = "<<"` and `.close = ">>"`.

**Is glue() the same as str_glue()?**

Almost. `str_glue()` is a thin wrapper around `glue()` re-exported by stringr. The arguments and brace syntax are identical, and both return a glue object. Pick whichever package is already loaded.

**Can glue() interpolate data frame columns?**

Yes, but `glue_data()` is the cleaner choice for that job. It takes a data frame or list as its first argument and evaluates `{}` slots against its columns, so `glue_data(df, "{name}: {score}")` reads each column by name. Inside a `mutate()` call, plain glue() also works because the column names are already in scope as vectors.

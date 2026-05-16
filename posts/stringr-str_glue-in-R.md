---
title: "stringr str_glue() in R: Interpolate Variables Into Strings"
slug: "stringr-str_glue-in-R"
description: "Use stringr str_glue() in R to interpolate variables and expressions into strings with {braces}. With 5 examples, a paste comparison, and common pitfalls."
keywords: "stringr str_glue, str_glue function R, stringr str_glue examples, R str_glue interpolation, str_glue vs paste, string interpolation R"
mathjax: false
webr: true
date: "2026-05-16"
post_type: "PSEO"
category_id: "function-deep"
subcategory_id: "stringr-functions"
fr_parent: "stringr-in-R.html"
auto_link_terms: "str_glue()|stringr str_glue|stringr::str_glue()|string interpolation|str_glue function"
auto_link_case_sensitive: true
target_keyword: "stringr str_glue"
sibling_block_enabled: true
difficulty: "Beginner"
---

# stringr str_glue() in R: Interpolate Variables Into Strings

<p class="lead">stringr str_glue() builds a string by interpolation: you write the finished sentence as a template and mark each variable slot with <code>{braces}</code>. Every expression inside the braces is evaluated as real R code and its result is inserted in place. It is the readable alternative to stacking many str_c() or paste() arguments.</p>

[QUICK ANSWER]
str_glue("Hi {x}", x = "Ada")            # "Hi Ada" interpolate a value
str_glue("2 + 2 = {2 + 2}")              # "2 + 2 = 4" evaluate an expression
str_glue("Upper: {toupper('ada')}")      # "Upper: ADA" call a function
str_glue("a", "b", "c")                  # "abc" join plain strings
str_glue("Show {{x}} literally")         # "Show {x} literally" escape braces
str_glue("user_{1:3}")                   # "user_1" "user_2" "user_3" vectorised
str_glue("{a} of {b}", a = 3, b = 10)    # "3 of 10" multiple named values

[DECISION TREE: Is str_glue() the right tool?]
- insert values into a template: str_glue("Hi {name}")
- join a few fixed pieces: str_c("a", "b", "c")
- interpolate from data frame columns: str_glue_data(df, "{col}")
- C-style numeric formatting: sprintf("%.2f", x)
- collapse a whole vector to one string: str_flatten(x, ", ")
- repeat one string n times: str_dup("-", 20)

## What str_glue() does in one sentence

**str_glue() evaluates R expressions wrapped in {braces} and inserts the results into a template string.** You write the sentence exactly as it should read, leave a brace-marked hole wherever a value belongs, and str_glue() fills each hole by running the code inside it.

This is string interpolation: the template and the output have the same shape, so what you write is what you get. It is the readable counterpart to str_c(), which joins separate pieces rather than filling a template.

```r title="Load stringr and interpolate a value"
library(stringr)

name <- "Ada"
str_glue("Hello, {name}!")
#> Hello, Ada!
```

The `{name}` slot is replaced with the value of `name`, producing one finished sentence.

## Syntax

**str_glue(..., .sep = "", .envir = parent.frame()) builds a string from templates and values.** The `...` arguments are the template strings, `.sep` joins them if you pass more than one, and `.envir` is the environment where each `{expr}` is evaluated.

```r title="Function signature and defaults"
# str_glue(..., .sep = "", .envir = parent.frame())
#
# ...     : template strings; {expr} is evaluated and inserted
# .sep    : separator placed between the ... arguments
# .envir  : environment where each {expr} is evaluated
```

Anything inside `{}` is treated as R code, not just a variable name. That means you can call functions and run arithmetic directly in the template.

```r title="Interpolate an expression, not just a variable"
x <- 5
str_glue("{x} squared is {x^2}")
#> 5 squared is 25
```

Both `{x}` and `{x^2}` are evaluated, so the second slot computes `25` on the fly.

[NOTE]
**str_glue() is stringr's gateway to the glue package.** It is a thin wrapper around `glue::glue()`, exposed so you do not need to attach a second package. Anything documented for `glue()`, such as custom delimiters or the transformer hook, works through str_glue() as well.

## Five common str_glue() scenarios

**Five scenarios cover almost every real use of str_glue().** Each block stands alone, so you can paste it straight into the live console.

### Interpolate variables into a sentence

**The core job of str_glue() is dropping variables into a readable sentence.** Each `{}` slot names the variable that belongs there.

```r title="Build a sentence from variables"
product <- "keyboard"
price   <- 49
str_glue("The {product} costs ${price}.")
#> The keyboard costs $49.
```

The `$` is a literal character; only the `{price}` slot is interpolated.

### Evaluate expressions inside braces

**Braces hold any R expression, not just bare names.** You can call functions and the result is inserted directly.

```r title="Run code inside the braces"
values <- c(3, 7, 11)
str_glue("Mean is {mean(values)}, max is {max(values)}.")
#> Mean is 7, max is 11.
```

`mean(values)` and `max(values)` both run before the string is assembled.

### Interpolate a vector to get many strings

**When a brace holds a vector, str_glue() returns one string per element.** The template is recycled across every value.

```r title="Vectorised interpolation"
ids <- 1:3
str_glue("user_{ids}")
#> user_1
#> user_2
#> user_3
```

The single template produces a length-three result, one string for each id.

### Pass values as named arguments

**Named arguments become variables for the template.** This keeps a value local to the call instead of relying on the surrounding environment.

```r title="Supply values as named arguments"
str_glue("{city} is in {country}.", city = "Tokyo", country = "Japan")
#> Tokyo is in Japan.
```

`city` and `country` exist only inside this str_glue() call.

### Use str_glue inside a mutate pipeline

**Most interpolation happens inside a tidyverse pipeline.** Pass columns to str_glue() inside `mutate()` to build a label column.

```r title="Build a label column with mutate"
library(dplyr)
df <- tibble(name = c("Ada", "Alan"), score = c(91, 88))
df |> mutate(label = str_glue("{name}: {score} pts"))
#> # A tibble: 2 x 3
#>   name  score label
#>   <chr> <dbl> <glue>
#> 1 Ada      91 Ada: 91 pts
#> 2 Alan     88 Alan: 88 pts
```

str_glue() is vectorised, so it fills the template once per row.

[KEY INSIGHT]
**str_glue() reads in the same order you write the sentence.** A nested str_c() call forces the reader to mentally interleave literal pieces and variables. With str_glue(), the template is the final sentence with holes in it, so the code looks like the output. That left-to-right readability is the entire reason the function exists.

## str_glue() vs paste() vs sprintf()

**Three functions assemble strings from values, and they differ in template style.** The choice comes down to how much formatting control you need.

```r title="Compare str_glue, paste0, and sprintf"
n <- 42
str_glue("Count: {n}")
#> Count: 42
paste0("Count: ", n)
#> [1] "Count: 42"
sprintf("Count: %d", n)
#> [1] "Count: 42"
```

All three produce the same text. str_glue() keeps the value inline with the words, paste0() alternates literal and variable pieces, and sprintf() uses `%` placeholder codes.

| Function | Template style | Best for |
|---|---|---|
| `str_glue()` | `{expr}` inline | readable sentences with variables |
| `paste0()` | alternating pieces | quick joins of a few values |
| `sprintf()` | `%d`, `%.2f` codes | precise numeric formatting |

Use str_glue() when the output is a sentence a human reads, and sprintf() when a number needs an exact width or decimal count.

[TIP]
**Reach for sprintf() when you need numeric formatting.** str_glue() inserts a number exactly as R prints it, so `{1/3}` becomes a long decimal. To control decimal places, format inside the braces with `{round(x, 2)}`, or switch to `sprintf("%.2f", x)` for strict formatting.

## Common pitfalls

**Three pitfalls cause most str_glue() surprises.** Each has a one-line fix.

### A missing variable raises an error

**Any name inside braces must exist, or str_glue() stops.** Because the braces hold real code, an undefined name is the same "object not found" error you see anywhere else.

```r title="An undefined name errors"
str_glue("Hello, {first_name}!")
#> Error in `str_glue()`:
#> ! object 'first_name' not found
```

Define the variable first, or pass it as a named argument to the call.

```r title="Pass the value as a named argument"
str_glue("Hello, {first_name}!", first_name = "Sam")
#> Hello, Sam!
```

Now the name resolves inside the call and the template fills cleanly.

### Literal braces need doubling

**A single brace is always treated as code, never as text.** To print a real `{` or `}`, double it.

```r title="Double the braces to print them"
str_glue("A set is written {{1, 2, 3}}")
#> A set is written {1, 2, 3}
```

`{{` collapses to one literal `{`, and `}}` to one literal `}`, so the braces survive into the output.

### str_glue returns a glue object, not a plain string

**str_glue() returns an object of class glue, not a bare character vector.** Most code treats it like a string, but strict type checks can trip on the extra class.

```r title="Check and convert the result type"
result <- str_glue("value: {1 + 1}")
class(result)
#> [1] "glue"      "character"
as.character(result)
#> [1] "value: 2"
```

Wrap the result in `as.character()` whenever a function or test demands a plain character vector.

[WARNING]
**A glue object is not identical to a character vector.** `identical(str_glue("ab"), "ab")` returns FALSE because the class attribute differs, even though the text matches. When a comparison or unit test fails unexpectedly, convert with `as.character()` before checking equality.

## Try it yourself

**Try it:** Use str_glue() to build the sentence "Tokyo has 14 wards." from the variables `city` and `wards`. Save the result to `ex_sentence`.

```r title="Your turn: interpolate two variables"
city  <- "Tokyo"
wards <- 14
# Try it: build the sentence with str_glue
ex_sentence <- # your code here

ex_sentence
#> Expected: Tokyo has 14 wards.
```

<details>
<summary>Click to reveal solution</summary>

```r title="Solution"
city  <- "Tokyo"
wards <- 14
ex_sentence <- str_glue("{city} has {wards} wards.")
ex_sentence
#> Tokyo has 14 wards.
```

**Explanation:** str_glue() evaluates each `{}` expression against the current environment, so `{city}` becomes `"Tokyo"` and `{wards}` becomes `14`. Both results are inserted into the template in the order they appear.

</details>

## Related stringr functions

When str_glue() is not quite what you need, these are the next stops:

- [str_glue_data()](stringr-str_glue_data-in-R.html) interpolates from a data frame or list, which is cleaner inside a pipeline.
- [str_c()](stringr-str_c-in-R.html) joins fixed pieces element-wise when there is no template to fill.
- [str_flatten()](stringr-str_flatten-in-R.html) collapses a vector into a single string with a separator.
- [str_pad()](stringr-str_pad-in-R.html) grows a string to a fixed width by adding a pad character.
- [str_replace()](stringr-str_replace-in-R.html) swaps a matched pattern for new text, a different kind of edit.
- The full [stringr reference](https://stringr.tidyverse.org/reference/str_glue.html) documents str_glue() and its arguments.

## FAQ

**What is the difference between str_glue() and paste() in R?**

They differ in template style. `paste()` alternates literal strings and variables as separate arguments, while str_glue() takes one template string with `{}` slots where values belong. `str_glue("Hi {name}")` reads like the finished sentence, whereas `paste0("Hi ", name)` splits it into pieces. str_glue() also evaluates real R code inside the braces, so `{x^2}` or `{toupper(x)}` works directly in the template.

**How do I use a variable inside str_glue()?**

Wrap the variable name in curly braces inside the template: `str_glue("Hello, {name}")` inserts the value of `name`. The variable must exist in the calling environment, or you can supply it as a named argument, such as `str_glue("Hello, {name}", name = "Sam")`. Anything inside the braces is run as R code, so you can also call functions, like `str_glue("{toupper(name)}")`.

**How do I print literal curly braces with str_glue()?**

Double the brace. `{{` produces one literal `{` and `}}` produces one literal `}` in the output. For example, `str_glue("A set {{1, 2}}")` returns `A set {1, 2}`. Single braces are always interpreted as code slots, so doubling is the only way to keep a brace as text in the finished string.

**Is str_glue() the same as glue()?**

Almost. `str_glue()` is a thin wrapper around `glue::glue()` from the glue package, re-exported by stringr so you can interpolate without attaching a second package. The behaviour, arguments, and brace syntax are identical. If you already load glue directly, `glue()` and `str_glue()` are interchangeable for everyday interpolation.

**Can str_glue() interpolate data frame columns?**

Yes, but `str_glue_data()` is the cleaner choice for that job. It takes a data frame or list as its first argument and evaluates `{}` slots against its columns, so `str_glue_data(df, "{name}: {score}")` reads each column by name. Inside a `mutate()` call, plain str_glue() also works because the column names are already in scope as vectors.

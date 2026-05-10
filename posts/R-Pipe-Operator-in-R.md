---
title: "R Pipe Operator: %>% vs |> (Complete Guide)"
slug: "R-Pipe-Operator-in-R"
description: "Compare R's pipe operators: magrittr %>% and native |>. Covers syntax, dot placeholder, when to use each, performance, lambdas, and 6 worked examples in R."
keywords: "R pipe operator, %>% in R, R native pipe, |> in R, magrittr pipe, dplyr pipe, R chaining functions"
mathjax: false
webr: true
date: "2026-05-10"
post_type: "PSEO"
category_id: "function-deep"
subcategory_id: "base-r-essentials"
fr_parent: "R-Basic-Syntax-Beginners-Guide.html"
auto_link_terms: "pipe operator|%>%|native pipe|R pipe|magrittr pipe"
auto_link_case_sensitive: false
target_keyword: "R pipe operator"
sibling_block_enabled: true
difficulty: "Beginner"
---

# R Pipe Operator: %>% vs |> (Complete Guide)

<p class="lead">R has two pipe operators: <code>%&gt;%</code> from magrittr (the original) and <code>|&gt;</code> built into base R 4.1+. Both forward the left-hand value into the first argument of the right-hand function, enabling readable left-to-right code chains.</p>

[QUICK ANSWER]
mtcars |> head()                          # native pipe (base R 4.1+)
mtcars %>% head()                         # magrittr pipe (needs library)
mtcars |> filter(mpg > 20) |> nrow()      # chained
mtcars %>% .$mpg %>% mean()               # %>% supports . placeholder
mtcars |> (\(x) x$mpg)() |> mean()        # |> needs lambda for placeholder
df |> head(n = 3)                         # extra args after pipe
mtcars %>% {head(., n = 3)}               # %>% with curly-brace expression

[DECISION TREE: Which pipe should I use?]
- modern code, R 4.1+, no magrittr loaded: |>
- need to pipe to non-first argument: %>% with . placeholder
- inside dplyr/tidyverse: either works; |> increasingly preferred
- R < 4.1: %>% (only option)
- compound expression after pipe: %>% with { } block
- assign result back to LHS: %<>% (magrittr only, niche)
- functional programming: |> with lambda \(x) x

## What R's pipe operators do in one sentence

**Both `|>` and `%>%` take the value on the left and pass it as the FIRST ARGUMENT to the function on the right.** `mtcars |> head()` is identical to `head(mtcars)`. The pipe form reads left-to-right; the function-call form reads right-to-left.

The `|>` operator is built into base R from version 4.1 (May 2021). The `%>%` operator comes from the magrittr package (also re-exported by dplyr and the tidyverse). For 95% of use cases they are interchangeable.

## Syntax

**The pipe goes between the value and the function, with the function written as if its first argument were already filled.**

```r title="Three equivalent forms"
library(dplyr)

# Function call form
head(filter(mtcars, mpg > 20), n = 3)

# Native pipe
mtcars |> filter(mpg > 20) |> head(n = 3)

# magrittr pipe
mtcars %>% filter(mpg > 20) %>% head(n = 3)
```

All three return the same 3-row data frame. The pipe forms are easier to read for chains; the function call form is fine for one or two operations.

[TIP]
**Use `|>` for new code unless you specifically need `%>%` features.** The native pipe has no package dependency, parses faster, and is the modern default. Reach for `%>%` only when you need the `.` placeholder, `%T>%`, `%<>%`, or compound `{ }` expressions.

## Six common patterns

### 1. Single-step pipe

```r title="Same as head(mtcars)"
mtcars |> head()
#>                    mpg cyl  disp  hp drat    wt  qsec vs am gear carb
#> Mazda RX4         21.0   6 160.0 110 3.90 2.620 16.46  0  1    4    4
```

The simplest case: replace `head(mtcars)` with `mtcars |> head()`. Useful at the START of any pipeline so the data flows naturally.

### 2. Chained pipe

```r title="Filter then select then top 3"
mtcars |>
  filter(cyl == 4) |>
  select(mpg, hp) |>
  head(n = 3)
#>                  mpg  hp
#> Datsun 710      22.8  93
#> Merc 240D       24.4  62
#> Merc 230        22.8  95
```

Multiple pipes chain function calls. Each step's output becomes the next step's first argument. Reads top-to-bottom: take mtcars, filter, select, take first 3.

### 3. Pipe with extra arguments

```r title="Pipe to first arg; pass others normally"
mtcars |> head(n = 5)
```

`head()` accepts `n` as a named argument. The pipe puts `mtcars` as the first positional argument; named args after it work as usual.

### 4. magrittr `.` placeholder

```r title="When you need to pipe to a non-first argument"
library(magrittr)

mtcars %>% lm(mpg ~ hp, data = .) %>% summary()
```

`%>%` supports `.` to indicate the pipe value's position. Native `|>` does not (in base R 4.1; partial support added in 4.2 via `_` placeholder).

### 5. Native pipe with a lambda for non-first arg

```r title="Native pipe equivalent using anonymous function"
mtcars |>
  (\(d) lm(mpg ~ hp, data = d))() |>
  summary()
```

Without `.`, native pipe needs a lambda `\(d) ...` to redirect the input. More verbose than `%>%`, but no package dependency.

### 6. Pipe to assignment

```r title="Send result back into a variable"
result <- mtcars |>
  filter(mpg > 20) |>
  pull(mpg) |>
  mean()

result
#> [1] 24.025
```

Standard pattern: pipe through transformations, finish with `mean()` or similar, assign the final scalar to a variable.

[KEY INSIGHT]
**The pipe operator only changes the SHAPE of code, not its meaning.** `mtcars |> head()` and `head(mtcars)` are exactly the same operation. The pipe is purely syntactic sugar to read function chains left-to-right. Performance is identical (or microseconds different); choose based on readability.

## Native pipe (|>) vs magrittr pipe (%>%)

**Both forward LHS to the first argument. Differences are at the edges.**

| Feature | `|>` (native) | `%>%` (magrittr) |
|---|---|---|
| Available | R 4.1+ | Any version, needs magrittr |
| Dependency | None (base R) | magrittr (or dplyr re-export) |
| `.` placeholder | No (use `_` in 4.2+) | Yes |
| Lambda needed for non-first arg | Yes | No (use `.`) |
| `{ }` expression after pipe | Limited | Yes |
| `%T>%` (tee) | No | Yes |
| `%<>%` (compound assign) | No | Yes |
| Parse speed | Faster | Slower (operator overload) |
| Idiomatic in 2026+ | Increasingly | Legacy |

When to use which:

- Use `|>` in new code targeting R 4.1 or later.
- Use `%>%` when you need the `.` placeholder, `%T>%`, or compound assignment.
- Mixing both in one file is fine; both work in tidyverse pipelines.

## Common pitfalls

**Pitfall 1: forgetting parentheses on `|>`.** `mtcars |> head` (no parens) errors. Native pipe always requires `()` after the function name. magrittr `%>%` allows omitting parens if no other args: `mtcars %>% head` works.

**Pitfall 2: piping to a non-first argument with native pipe.** `1:5 |> mean(na.rm = TRUE)` works because `mean()` takes the vector as first arg. But `1:5 |> sum(2:3)` adds 1:5 + 2:3 (unexpected). To pipe to a specific position, use a lambda: `1:5 |> (\(x) sum(2:3, x))()`.

[WARNING]
**The `_` placeholder in `|>` (R 4.2+) only works with NAMED arguments.** `mtcars |> lm(mpg ~ hp, data = _)` works. `mtcars |> lm(_, mpg ~ hp)` errors because `_` cannot be a positional argument. Use lambdas if you need positional flexibility.

**Pitfall 3: confusing `|>` with `>>` or other operators in other languages.** R's pipe is `|>` (vertical bar + greater-than). It is NOT `->`, `>>`, or `=>`. Some languages use `|>` differently; in R it is strictly "value into first argument".

## Try it yourself

**Try it:** Use the native pipe `|>` to compute the mean `mpg` of `mtcars` cars with `hp > 100`. Save to `ex_mean`.

```r title="Your turn: piped mean"
# Try it: filter then pull then mean
ex_mean <- mtcars |>
  # your code here

ex_mean
#> Expected: ~16.65 (mean mpg of high-hp cars)
```

<details>
<summary>Click to reveal solution</summary>

```r title="Solution"
ex_mean <- mtcars |>
  filter(hp > 100) |>
  pull(mpg) |>
  mean()

ex_mean
#> [1] 16.6478
```

**Explanation:** Each step's result becomes the next step's first argument. `filter(hp > 100)` keeps high-hp rows; `pull(mpg)` extracts mpg as a vector; `mean()` averages it. Reads top-to-bottom.

</details>

## Related R operators

After mastering the pipe, look at:

- `%T>%` (magrittr tee operator): pipes value to a function but keeps the original
- `%<>%` (compound assignment): updates LHS in place
- `%$%` (exposition pipe): exposes column names
- `\(x) ...` (R 4.1+ lambda): anonymous function syntax often used with pipes
- `_` placeholder (R 4.2+): pipe to a named argument

The pipe pairs naturally with all dplyr verbs and most tidyverse functions because they are designed to take data as the first argument.

## FAQ

**What is the difference between %>% and |> in R?**

`%>%` is from the magrittr package (also exported by dplyr); `|>` is built into base R 4.1+. Both forward the LHS value to the first argument of the RHS function. Differences: `%>%` supports the `.` placeholder, `%T>%`, `%<>%`. `|>` is faster, has no package dependency, and is the modern default.

**Should I use the native pipe |> or magrittr %>%?**

For new code, `|>` is preferred unless you need `%>%`-specific features like the `.` placeholder. Both work in tidyverse pipelines. The choice rarely affects performance; pick based on readability and target R version.

**How do I pipe to a non-first argument in R?**

With `%>%`, use the `.` placeholder: `df %>% lm(y ~ x, data = .)`. With `|>` (R 4.2+), use the `_` placeholder for named args only: `df |> lm(y ~ x, data = _)`. For R 4.1 native pipe, use a lambda: `df |> (\(d) lm(y ~ x, data = d))()`.

**Does the pipe operator slow down R code?**

Negligibly. Native `|>` adds no measurable overhead. `%>%` adds microseconds per call due to its operator overload. For any real workload, the pipe's cost is invisible.

**Can I use the pipe operator outside the tidyverse?**

Yes. Both pipes work with any function that takes data as its first argument. `c(3, 1, 2) |> sort() |> head(2)` uses base R only. The pipe is independent of the tidyverse, though tidyverse functions are designed to work especially well with it.

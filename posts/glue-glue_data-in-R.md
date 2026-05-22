---
title: "glue glue_data() in R: String Templates for Data Frames"
slug: "glue-glue_data-in-R"
description: "Use glue glue_data() in R to interpolate data frame columns into one string per row. Five examples, comparison with glue(), and three common pitfalls."
keywords: "glue glue_data, glue_data function R, glue glue_data examples, R glue_data data frame, glue_data tidyverse, glue_data vs glue, string interpolation data frame R"
mathjax: false
webr: true
date: "2026-05-22"
post_type: "PSEO"
category_id: "function-deep"
subcategory_id: "glue-functions"
fr_parent: "stringr-in-R.html"
auto_link_terms: "glue_data()|glue::glue_data()|glue glue_data|glue_data function|glue_data tidyverse"
auto_link_case_sensitive: true
target_keyword: "glue glue_data"
sibling_block_enabled: true
difficulty: "Beginner"
---

# glue glue_data() in R: String Templates for Data Frames

<p class="lead">glue glue_data() interpolates a template across every row of a data frame, returning one string per row. You name each column inside <code>{braces}</code> and glue_data() looks up the column by name and substitutes the value. It is the row-wise counterpart to glue(), built for mutate(), reports, and bulk message generation.</p>

[QUICK ANSWER]
glue_data(mtcars, "{rownames(mtcars)}: {mpg} mpg")  # one string per row
mtcars |> glue_data("{mpg} mpg, {cyl} cyl")         # pipe friendly
glue_data(df, "Hi {name}, age {age}")               # named columns
glue_data(df, "{name}-{format(date, '%Y')}.csv")    # expressions on columns
df |> mutate(label = glue_data(cur_data(), "{x}"))  # inside mutate
glue_data(df, "{x}", .na = "missing")               # custom NA handling
glue_collapse(glue_data(df, "{x}"), sep = ", ")     # one final string

[DECISION TREE: Is glue_data() the right tool?]
- interpolate columns across rows: glue_data(df, "{col1}-{col2}")
- interpolate plain variables: glue("Hi {name}")
- collapse the result to one string: glue_collapse(g, sep = ", ")
- build a SQL statement from a row: glue_sql("SELECT {x}", .con = con)
- add a row label column in a pipe: mutate(label = glue("{a}-{b}"))
- join a few fixed pieces: paste0("a", "b", "c")

## What glue_data() does in one sentence

**glue_data() evaluates a template inside the scope of a data frame, returning one interpolated string per row.** Every `{column}` slot is looked up in the data frame first, then in the calling environment, and the result is a glue vector with `nrow(df)` elements.

This is row-wise string interpolation. You write the sentence once and glue_data() loops it across rows, so what you get back lines up with the data frame perfectly. It is the natural fit for labels, file names, and any per-row message.

```r title="Load glue and interpolate from a data frame"
library(glue)

df <- data.frame(name = c("Ada", "Bob", "Cee"), age = c(36, 27, 41))
glue_data(df, "{name} is {age} years old.")
#> Ada is 36 years old.
#> Bob is 27 years old.
#> Cee is 41 years old.
```

Each row of `df` produces one finished sentence, and the result keeps the row order of the input.

## Syntax

**glue_data(.x, ..., .sep = "", .envir = parent.frame(), .na = "NA", .null = character()) interpolates a template across rows.** The `.x` argument is the data frame (or list), `...` are the template strings, `.sep` joins multiple templates, `.envir` is the fallback scope when a `{name}` is not a column, and `.na` controls how missing values render.

```r title="Function signature and defaults"
# glue_data(.x, ..., .sep = "", .envir = parent.frame(),
#          .na = "NA", .null = character(), .comment = "#",
#          .literal = FALSE, .transformer = identity_transformer,
#          .trim = TRUE)
#
# .x     : data frame, list, or environment to look up names in
# ...    : template strings; {col} or {expr} is evaluated and inserted
# .sep   : separator placed between the ... arguments
# .envir : fallback environment when {name} is not a column of .x
# .na    : how to render NA values, defaults to "NA"
```

Anything inside `{}` is treated as R code evaluated against the data frame, not just a column name. That means you can compute on columns directly in the template.

```r title="Compute on columns inside the braces"
df <- data.frame(price = c(10, 20), qty = c(3, 2))
glue_data(df, "{qty} @ ${price} = ${qty * price}")
#> 3 @ $10 = $30
#> 2 @ $20 = $40
```

Both `{qty}`, `{price}`, and `{qty * price}` are evaluated row by row, with each column treated as a vector of length 1 inside the template scope.

[NOTE]
**glue_data() is the data-frame-aware sibling of glue().** They share every argument, but glue_data() takes a data frame as its first argument and looks up names there before checking the calling environment. If you find yourself writing `glue("{df$col}")`, switch to `glue_data(df, "{col}")` for cleaner code.

## Five common glue_data() scenarios

**Five patterns cover almost every real use of glue_data().** Each block runs on its own, so you can paste it straight into the live console.

### Build a row label or message per record

**The core job of glue_data() is producing one string per row of a data frame.** It is ideal for labels, log lines, and email-style messages.

```r title="One status line per row"
orders <- data.frame(
  id     = c(101, 102, 103),
  item   = c("keyboard", "mouse", "monitor"),
  total  = c(49.00, 19.50, 219.00)
)
glue_data(orders, "Order {id}: {item} for ${total}")
#> Order 101: keyboard for $49
#> Order 102: mouse for $19.5
#> Order 103: monitor for $219
```

The result is a length-3 glue vector aligned with the rows of `orders`, ready to print, write to a file, or feed into another function.

### Use inside a dplyr mutate to add a label column

**glue_data() pairs with mutate() to create derived text columns.** Inside a dplyr pipeline you usually use `glue()` directly because mutate already evaluates expressions in the data scope, but `glue_data()` is the explicit form when you have a stand-alone data frame.

```r title="Add a label column via mutate"
suppressPackageStartupMessages(library(dplyr))
mtcars |>
  head(3) |>
  mutate(label = glue::glue("{rownames(head(mtcars, 3))}: {mpg} mpg, {cyl} cyl")) |>
  select(label)
#>                            label
#> Mazda RX4     Mazda RX4: 21 mpg, 6 cyl
#> Mazda RX4 Wag Mazda RX4 Wag: 21 mpg, 6 cyl
#> Datsun 710    Datsun 710: 22.8 mpg, 4 cyl
```

Inside `mutate()`, columns are already in scope, so `glue()` does the same job. Reach for `glue_data()` when the data frame is not the active context, like when you pass it explicitly to a helper.

### Generate file names or paths from rows

**Row-driven file naming is a classic glue_data() use case.** Combine column values into a slug-style name and write each row to its own file.

```r title="Build per-row file paths"
runs <- data.frame(
  model = c("rf", "gbm", "lr"),
  fold  = c(1, 1, 1),
  date  = as.Date(c("2026-05-01", "2026-05-01", "2026-05-01"))
)
glue_data(runs, "results/{model}_fold{fold}_{format(date, '%Y%m%d')}.rds")
#> results/rf_fold1_20260501.rds
#> results/gbm_fold1_20260501.rds
#> results/lr_fold1_20260501.rds
```

The `format()` call runs row by row, producing a consistent date stamp for every output path.

### Handle missing values explicitly

**The `.na` argument controls how NA values render.** Without it, NAs print as the literal string `"NA"`, which can look messy in user-facing output.

```r title="Render NA as a friendly placeholder"
df <- data.frame(name = c("Ada", NA, "Cee"), score = c(91, 87, NA))
glue_data(df, "{name} scored {score}", .na = "unknown")
#> Ada scored 91
#> unknown scored 87
#> Cee scored unknown
```

Pick a placeholder that fits the context: `"unknown"` for reports, `"-"` for tables, or `""` to drop the slot.

### Collapse the per-row vector to one string

**Pair glue_data() with glue_collapse() to fold the per-row vector into a single string.** Useful for summaries, bullet lists, and prompts.

```r title="One bullet list from many rows"
top <- data.frame(name = c("Ada", "Bob", "Cee"), score = c(91, 87, 79))
bullets <- glue_data(top, "- {name}: {score}")
glue_collapse(bullets, sep = "\n")
#> - Ada: 91
#> - Bob: 87
#> - Cee: 79
```

The intermediate `bullets` vector is one row per element. `glue_collapse()` joins them with newlines into a single multi-line string ready for `cat()`.

## glue_data() vs glue()

**Use glue_data() when the values live in a data frame; use glue() when they live as separate objects.** Both functions share the same brace syntax, but their lookup rule is different.

| Question | glue() | glue_data() |
|---|---|---|
| First argument | template string | data frame or list |
| Lookup order | `.envir` only | `.x` first, then `.envir` |
| Result length | length of longest brace value | `nrow(.x)` (always row count) |
| Best for | one-off messages | row labels, reports, file names |
| Inside dplyr mutate | preferred | rarely needed (mutate already scopes the data) |

If a template references columns of a data frame, `glue_data()` is the explicit, readable choice. If it references plain variables, `glue()` is shorter.

[TIP]
**Reach for glue_data() the moment you write `df$col` inside a glue() template.** Replacing `glue("{df$col}-{df$x}")` with `glue_data(df, "{col}-{x}")` is shorter, faster, and reads like the template you would write by hand on paper.

## Common pitfalls

**Three pitfalls account for almost every glue_data() error.** Each has a one-line fix.

**Passing a non-tabular object.** glue_data() expects a data frame, list, or environment. Atomic vectors fail because the function tries to look up names inside them.

```r title="Wrong: atomic vector lookup"
x <- c(a = 1, b = 2)
try(glue_data(x, "{a}+{b}"))
#> Error in eval(parse(text = ...)): object 'a' not found
```

Convert to a list (or one-row data frame) and the same template works.

```r title="Fix: pass a list or data frame"
glue_data(as.list(x), "{a}+{b}")
#> 1+2
```

**Forgetting that result length equals row count.** The output is always a vector of length `nrow(.x)`, even when the template ignores some columns. If you wanted one summary string, follow up with `glue_collapse()`.

**Column name shadowed by a same-named variable in scope.** When `.x` has a column called `name` and the calling environment also has a variable `name`, glue_data() uses the column. That is usually the intent, but it can surprise you if you meant the outer variable. Rename one of them to remove the ambiguity.

## Try it yourself

**Try it:** Use glue_data() to build a one-line label per row of mtcars containing the row name and miles per gallon, for the first 3 rows. Save the result to ex_labels.

```r title="Your turn: label the first 3 rows of mtcars"
# Try it: label mtcars rows
ex_labels <- # your code here

ex_labels
#> Expected: 3 strings like "Mazda RX4: 21 mpg"
```

<details>
<summary>Click to reveal solution</summary>

```r title="Solution"
top3 <- head(mtcars, 3)
top3$car <- rownames(top3)
ex_labels <- glue_data(top3, "{car}: {mpg} mpg")
ex_labels
#> Mazda RX4: 21 mpg
#> Mazda RX4 Wag: 21 mpg
#> Datsun 710: 22.8 mpg
```

**Explanation:** Row names are not a column of mtcars, so we copy them into a `car` column first. glue_data() then looks up `car` and `mpg` in the data frame and returns one string per row.

</details>

## Related glue functions

- glue(): interpolate variables that live as separate objects in scope.
- glue_collapse(): fold a glue vector into a single string with a separator.
- glue_sql(): row-wise interpolation that quotes values safely for SQL.
- glue_safe(): like glue() but errors clearly when a `{name}` is missing.
- str_glue_data(): the stringr alias for glue_data() with identical behaviour.

For the full reference, see the [glue package documentation](https://glue.tidyverse.org/reference/glue.html).

## FAQ

**What is the difference between glue() and glue_data() in R?**

glue() looks up brace names in the calling environment only, while glue_data() looks them up in a data frame (or list) first and falls back to the environment. Use glue_data() when your values live as columns of a data frame; use glue() when they live as separate variables. They share every other argument, including `.sep`, `.na`, and the brace delimiters.

**How do I use glue_data() inside a dplyr pipeline?**

You can pipe a data frame straight into glue_data() with `df |> glue_data("{col}")`, which returns a character vector. Inside `mutate()`, columns are already in scope, so a plain `glue()` call works there too: `mutate(label = glue("{col1}-{col2}"))`. Reach for glue_data() when the pipeline returns a data frame you want to label outside of mutate().

**Why does glue_data() return multiple strings instead of one?**

glue_data() returns one string per row of the input data frame, so the result length always equals `nrow(.x)`. That is the function's job: produce a row-aligned vector. If you want a single combined string, pass the result to `glue_collapse()` with a separator like `", "` or `"\n"`.

**Can I use expressions like sum() or paste0() inside glue_data() braces?**

Yes. Anything inside `{}` is treated as R code evaluated against the data frame, so `{toupper(name)}`, `{round(score, 1)}`, and `{format(date, '%Y')}` all work. The columns become vectors of length 1 inside each row's evaluation, so column-wise functions like `sum()` collapse correctly.

**How do I handle NA values when interpolating with glue_data()?**

Pass the `.na` argument to control the placeholder for missing values. The default is the literal `"NA"`, which prints in the template; setting `.na = "unknown"` or `.na = "-"` replaces every NA with that text. Set `.na = NULL` to keep the NA propagation behaviour where any NA in a slot returns NA for the whole string.

---
title: "glue identity_transformer() in R: Default Transformer"
slug: "glue-identity_transformer-in-R"
description: "Use glue identity_transformer() in R to parse and evaluate the text inside any glue() placeholder. Four custom-transformer examples plus three pitfalls."
keywords: "glue identity_transformer, identity_transformer R, glue custom transformer, glue::identity_transformer, glue transformer function, R parse eval transformer, glue default transformer"
mathjax: false
webr: true
date: "2026-05-23"
post_type: "PSEO"
category_id: "function-deep"
subcategory_id: "glue-functions"
fr_parent: "stringr-in-R.html"
auto_link_terms: "glue::identity_transformer()|glue identity_transformer|identity_transformer function|glue default transformer|custom glue transformer"
auto_link_case_sensitive: true
target_keyword: "glue identity_transformer"
sibling_block_enabled: true
difficulty: "Beginner"
---

# glue identity_transformer() in R: Default Transformer

<p class="lead">glue identity_transformer() is the default transformer that glue() uses to turn the text inside each {placeholder} into a value. It parses the placeholder text as R code, evaluates it in the calling environment, and returns the result unchanged, which is what makes glue() behave like plain string interpolation out of the box.</p>

[QUICK ANSWER]
identity_transformer("x + 1", envir)            # parse and evaluate one expression
glue("{x}", .transformer = identity_transformer) # explicit default transformer
glue::identity_transformer(text, envir)          # namespaced call
function(text, envir) identity_transformer(text, envir) # bare passthrough wrapper
function(text, envir) format(identity_transformer(text, envir), big.mark = ",") # decorate output
function(text, envir) tryCatch(identity_transformer(text, envir), error = function(e) NA) # NA-on-error
function(text, envir) toupper(identity_transformer(text, envir)) # transform every value

[DECISION TREE: Is identity_transformer() the right tool?]
- parse + eval a glue placeholder yourself: identity_transformer(text, envir)
- write a custom transformer that decorates default output: wrap identity_transformer()
- pass values straight in without parsing: glue() with no .transformer
- safe-quote SQL identifiers: glue_sql() with its own transformer
- block code injection in user input: glue_safe() (whitelist-checked names only)
- format numbers inline: scales::label_*() inside the placeholder, no transformer needed

## What identity_transformer() does in one sentence

**identity_transformer() takes the raw text of a glue placeholder, parses it as R, evaluates the result in a supplied environment, and returns whatever that evaluation produced.** It is the function that glue() calls once per `{...}` block when no custom `.transformer` is supplied.

The function does not do any formatting, escaping, or type coercion. Its job is the parse-and-evaluate half of "string interpolation". Decorating the result, quoting it, or guarding it against errors is left to the caller, which is why custom transformers almost always start by delegating to identity_transformer() and then add their own behavior on top.

```r title="Load glue and call the default transformer"
library(glue)

x <- 42
identity_transformer("x + 1", environment())
#> [1] 43
```

The string `"x + 1"` is parsed, then evaluated in the current environment where `x` is bound to 42. The return value is the numeric result, ready for glue() to coerce to a string and splice into the template.

## Syntax

**identity_transformer(text, envir) takes two arguments and returns the evaluated value.** There are no optional parameters, no `.trim` flag, and no separator. The function is deliberately minimal so that custom transformers can compose it.

```r title="Function signature and behaviour"
# identity_transformer(text, envir)
#
# text  : a single character string containing R code, exactly as it
#         appeared inside a {...} placeholder
# envir : an environment in which to evaluate the parsed code; for
#         glue() this is normally the calling frame
#
# Returns: the value produced by eval(parse(text = text), envir)
```

The implementation is essentially `eval(parse(text = text, keep.source = FALSE), envir)`. That is the contract worth remembering: anything that works as a one-line R expression works inside a glue placeholder, because identity_transformer() runs the exact same parse-and-eval path R itself uses.

[TIP]
**Reach for identity_transformer() only when writing a custom .transformer.** Plain glue() already calls it for you; you never need to call it directly in user code unless you are composing a transformer that wraps the default behavior.

## Common use cases

### 1. Explicit default transformer

```r title="Pass identity_transformer to glue explicitly"
name <- "Selva"
count <- 7
glue("Hi {name}, you have {count} messages.",
     .transformer = identity_transformer)
#> Hi Selva, you have 7 messages.
```

This is functionally identical to omitting `.transformer` entirely. The explicit form is useful when teaching the API or when a function takes a transformer parameter and you want to document "use the default".

### 2. Decorate every interpolated value

```r title="Format numbers with a comma separator"
fmt_transformer <- function(text, envir) {
  value <- identity_transformer(text, envir)
  if (is.numeric(value)) format(value, big.mark = ",") else value
}

revenue <- 1250000
glue("Revenue: {revenue}", .transformer = fmt_transformer)
#> Revenue: 1,250,000
```

Every placeholder still goes through parse-and-evaluate, but the result passes through `format()` before glue() builds the final string. The pattern (delegate to identity_transformer, then post-process) is the canonical shape of a custom transformer.

### 3. Fall back to NA when an expression errors

```r title="Wrap identity_transformer in tryCatch"
safe_transformer <- function(text, envir) {
  tryCatch(
    identity_transformer(text, envir),
    error = function(e) NA_character_
  )
}

x <- 10
glue("x = {x}; y = {y_that_does_not_exist}",
     .transformer = safe_transformer)
#> x = 10; y = NA
```

Plain glue() throws an error when a placeholder references an undefined variable. Wrapping identity_transformer() in tryCatch() turns the error into a sentinel value, which is handy for templated reports where some fields may legitimately be missing.

### 4. Add a uniform string transform

```r title="Upper-case every interpolated value"
upper_transformer <- function(text, envir) {
  value <- identity_transformer(text, envir)
  toupper(as.character(value))
}

city <- "bengaluru"
state <- "karnataka"
glue("{city}, {state}", .transformer = upper_transformer)
#> BENGALURU, KARNATAKA
```

The transformer pipeline parses the placeholder, evaluates it, coerces to character, then upper-cases the result. Notice the same identity_transformer() call sits inside an otherwise unrelated wrapper, which is the whole point of exposing it as part of the public API.

[NOTE]
**Custom transformers always receive the placeholder text as a string.** Even `{1 + 1}` arrives as `text = "1 + 1"`, not as a parsed expression. That is why identity_transformer() has to parse it before evaluating; if you forget the parse step in a hand-rolled transformer, R will try to eval a literal string and you will get back the string itself.

## identity_transformer() vs other transformers

**The glue package ships four transformers, each with a different job, and identity_transformer() is the simplest of the four.** Use it as the default, or as the inner call inside a custom transformer that adds formatting or safety.

| Transformer | Package call | What it does | Typical use |
|---|---|---|---|
| `identity_transformer(text, envir)` | `glue::identity_transformer()` | Parses + evaluates, returns value as-is | Default for `glue()`; building block for custom transformers |
| `sql_quote_transformer(...)` | `glue::glue_sql()` | Quotes identifiers and values per a DB connection | Safe SQL composition |
| `safely_transformer(...)` | `glue::glue_safe()` | Looks up bare names only, refuses arbitrary R code | Untrusted templates |
| Your own `function(text, envir)` | passed via `.transformer` | Anything you write | Custom formatting, logging, or escaping |

The decision rule: stick with identity_transformer() (or no `.transformer` at all) when the template is author-controlled and you trust every placeholder. Switch to glue_safe() when the template comes from user input. Switch to glue_sql() when you are building a query.

[KEY INSIGHT]
**A glue transformer is a function from (text, envir) to value.** Once you internalize that signature, every custom transformer in the wild becomes readable: it parses, evaluates, then either formats the result or short-circuits with an alternative. identity_transformer() is the half that does parsing and evaluation, and your code supplies the other half.

## Common pitfalls

1. **Forgetting to call identity_transformer() inside a custom transformer.** If your transformer just returns `text`, glue() will splice the raw placeholder text (`"x + 1"`) into the output instead of the value. The first line of almost every custom transformer should be `value <- identity_transformer(text, envir)`.

2. **Passing the wrong environment to a direct call.** When invoking identity_transformer() outside of glue(), the second argument must be an environment where the referenced variables exist. Using `globalenv()` from inside a function will not see the function's local bindings; pass `environment()` or `parent.frame()` instead.

3. **Expecting identity_transformer() to coerce to character.** It returns whatever the expression evaluates to, integer, list, data frame, anything. glue() does the character coercion afterwards via `as.character()`. If your custom transformer needs a string, coerce explicitly with `as.character(identity_transformer(text, envir))`.

## Try it yourself

**Try it:** Write a transformer called `ex_round_transformer` that rounds numeric placeholder values to 1 decimal place, leaves non-numeric values untouched, and uses identity_transformer() for the parse-and-eval step. Pass it to glue() with the template `"pi = {pi}; name = {'pi'}"`.

```r title="Your turn: build a rounding transformer"
# Try it: round numeric values, pass strings through
ex_round_transformer <- function(text, envir) {
  # your code here
}

glue("pi = {pi}; name = {'pi'}", .transformer = ex_round_transformer)
#> Expected: pi = 3.1; name = pi
```

<details>
<summary>Click to reveal solution</summary>

```r title="Solution"
ex_round_transformer <- function(text, envir) {
  value <- identity_transformer(text, envir)
  if (is.numeric(value)) round(value, 1) else value
}

glue("pi = {pi}; name = {'pi'}", .transformer = ex_round_transformer)
#> pi = 3.1; name = pi
```

**Explanation:** The transformer delegates to identity_transformer() so that `{pi}` becomes the numeric constant and `{'pi'}` becomes the character literal. The `is.numeric()` branch rounds the first; the fall-through returns the second unchanged. glue() then coerces both to strings.

</details>

## Related glue functions

- `glue()` is the entry point that calls identity_transformer() (or your `.transformer`) once per placeholder; reach for it first whenever you need string interpolation.
- `glue_data()` runs the same transformer pipeline but over each row of a data frame, which lets you template tabular output.
- `glue_sql()` swaps in a SQL-quoting transformer; use it when the result will go to a database.
- `glue_safe()` swaps in a transformer that only accepts bare variable names, blocking arbitrary code execution from untrusted templates.
- See the [glue::identity_transformer reference](https://glue.tidyverse.org/reference/identity_transformer.html) for the source and the full transformer contract.

## FAQ

**What is identity_transformer() in the glue package?**

identity_transformer() is the default transformer function that glue() applies to each `{placeholder}` it encounters. It parses the placeholder text as R code, evaluates it in the supplied environment, and returns the resulting value unchanged. Custom transformers almost always delegate to identity_transformer() first and then layer formatting or safety checks on top of its return value.

**When should I call identity_transformer() directly?**

In day-to-day glue() usage, you do not call it directly because glue() does so internally. The function becomes useful when you write a custom `.transformer`: the standard pattern is `function(text, envir) { value <- identity_transformer(text, envir); ... }`. Calling it explicitly tells the next reader that your transformer is built on the default parse-and-eval semantics rather than reinventing them.

**How is identity_transformer() different from glue_safe()?**

identity_transformer() parses and evaluates any R expression, so `{1 + 1}` or `{system('ls')}` both work. glue_safe() uses a transformer that only looks up bare variable names; expressions with operators or function calls raise an error. Use glue_safe() when the template string comes from user input or any other untrusted source.

**Can I chain multiple transformers?**

There is no built-in chain operator, but composition works the natural way: write one transformer whose body calls another. For example, a "format then upper-case" transformer would call identity_transformer() to get the raw value, pass it through format(), then through toupper(). The transformer contract is just a function, so any composition technique you would use for regular R functions applies.

**Why does my transformer print the literal placeholder text?**

Almost always because the transformer returned `text` instead of evaluating it. glue() takes whatever the transformer returns and coerces it to character; if you skip the parse-and-eval step, you get the raw string back. Add `identity_transformer(text, envir)` as the first line of the transformer and the placeholders will resolve to values.

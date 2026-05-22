---
title: "glue glue_safe() in R: Secure Interpolation Without eval()"
slug: "glue-glue_safe-in-R"
description: "Use glue glue_safe() in R for secure string interpolation using get() instead of eval(). Compare it with glue(), see five examples and common pitfalls."
keywords: "glue glue_safe, glue_safe function R, glue glue_safe examples, R glue_safe vs glue, glue_safe untrusted input, glue safe interpolation, glue_safe envir"
mathjax: false
webr: true
date: "2026-05-22"
post_type: "PSEO"
category_id: "function-deep"
subcategory_id: "glue-functions"
fr_parent: "stringr-in-R.html"
auto_link_terms: "glue_safe()|glue::glue_safe()|glue glue_safe|glue_safe function|safe string interpolation"
auto_link_case_sensitive: true
target_keyword: "glue glue_safe"
sibling_block_enabled: true
difficulty: "Beginner"
---

# glue glue_safe() in R: Secure Interpolation Without eval()

<p class="lead">glue glue_safe() interpolates values into a template using only variable lookup, never expression evaluation. It is the security-conscious twin of <code>glue()</code>: braces resolve to the value of a bare name, but <code>{Sys.getenv("HOME")}</code> or any other arbitrary R code is left as a lookup that fails. Reach for it whenever the template itself comes from untrusted input.</p>

[QUICK ANSWER]
glue_safe("Hi {name}", name = "Ada")             # interpolate a named value
glue_safe("Hi {x}")                               # lookup x from caller env
glue_safe("{a} of {b}", a = 3, b = 10)            # multiple named values
glue_safe("{Sys.time()}")                         # ERROR: not a bare name
glue_safe("Hi {who}", .envir = safe_env)          # restrict to allow-list env
glue_safe("Show {{x}} literally")                 # escape braces
glue("Hi {toupper(name)}")                        # use glue() for expressions

[DECISION TREE: Is glue_safe() the right tool?]
- interpolate untrusted templates without eval(): glue_safe("Hi {name}")
- interpolate trusted templates with expressions: glue("Hi {toupper(name)}")
- one safe row per data frame row: glue_data() with vetted columns only
- build a SQL statement with quoting: glue_sql("SELECT {col}", .con = con)
- collapse a vector to one string: glue_collapse(x, sep = ", ")
- write your own restricted transformer: glue(template, .transformer = my_t)

## What glue_safe() does in one sentence

**glue_safe() interpolates a template where every {brace} resolves to the value of a bare variable name, never to the result of an R expression.** You write the template once with `{name}` placeholders, hand glue_safe() the values, and it fills each placeholder by looking up that exact name in an environment.

The word "safe" refers to security. glue() runs `eval()` on whatever code sits inside `{}`, which is fine when the template is yours but dangerous when the template comes from a user, a config file, or any other input you do not fully control. glue_safe() removes eval() from the loop and uses `get()` instead, so only bare names work and arbitrary code does not run.

```r title="Load glue and interpolate a single value"
library(glue)

name <- "Ada"
glue_safe("Hi {name}")
#> Hi Ada
```

The function reads `name` from the calling environment and returns the filled template as a glue-class string. The result behaves like a length-1 character vector.

## Syntax

**glue_safe(..., .envir = parent.frame()) interpolates a template by looking up each {brace} as a bare variable name.** The dots collect template strings and optional named values to interpolate from. The `.envir` argument is the environment used for name resolution; remaining glue arguments (`.sep`, `.open`, `.close`, `.na`, `.null`, `.trim`) behave identically to `glue()`.

```r title="Function signature and key arguments"
# glue_safe(..., .envir = parent.frame())
#
# ...     : template string(s); also named values to interpolate from
# .envir  : environment to look up names in, default = caller frame
# .sep    : string placed between template parts, default ""
# .open   : opening delimiter, default "{"
# .close  : closing delimiter, default "}"
```

The default `.envir = parent.frame()` matches `glue()`. If you are interpolating untrusted templates, pass an explicit allow-list environment so leaked variables in the caller cannot be referenced by a malicious template.

[KEY INSIGHT]
**Security comes from `.envir`, not from glue_safe() alone.** glue_safe() blocks arbitrary code, but it still lets the template name any variable visible in `.envir`. Build a fresh `list2env()` containing only the values the template is allowed to see, and pass that as `.envir`.

## Common use cases

### 1. Basic interpolation of a named value

```r title="Interpolate a named value"
greet <- function(name) glue_safe("Hello, {name}")
greet("Ada")
#> Hello, Ada
```

`name` is the function's argument, so it lives in the calling frame and glue_safe() resolves it. This is the everyday usage: bare names mapped one-to-one to values, no expressions in the braces.

### 2. Block code injection from a user template

```r title="Compare glue vs glue_safe on hostile input"
template <- "Hi {Sys.getenv('HOME')}"

glue(template)
#> Hi C:/Users/you   <- glue evaluates the expression

result <- try(glue_safe(template), silent = TRUE)
inherits(result, "try-error")
#> [1] TRUE       <- glue_safe refuses; the expression is not a bare name
```

`glue()` executes `Sys.getenv("HOME")` because `eval()` runs whatever sits in braces. `glue_safe()` throws an error because `Sys.getenv('HOME')` is not a bare variable name. With user-supplied templates, that difference is the line between safe and exploited.

### 3. Restrict lookup to an allow-list environment

```r title="Pass a fresh envir to restrict allowed names"
allowed <- list2env(list(name = "Bob", role = "admin"))
template <- "User {name} has role {role}"
glue_safe(template, .envir = allowed)
#> User Bob has role admin

template2 <- "Secret: {api_key}"
try(glue_safe(template2, .envir = allowed), silent = TRUE)[1]
#> Error: object 'api_key' not found
```

`allowed` is a tiny environment containing only `name` and `role`. Any template that references another name fails, even if that name exists in the caller frame. This is the pattern for production-safe interpolation against templates supplied by users.

[WARNING]
**The default `.envir` leaks the caller frame.** If you call `glue_safe(user_template)` without `.envir`, every variable in the surrounding function is visible to the template. A user could write `{db_password}` and pull it out. Always pass an explicit `.envir` when the template is untrusted.

### 4. Pass values via dots instead of an envir

```r title="Use the dots for one-off named values"
glue_safe("{a} of {b}", a = 7, b = 12)
#> 7 of 12
```

Named arguments in `...` are visible to the template as if they were in the lookup environment. This is convenient for short calls, though for untrusted templates an explicit `.envir = list2env(...)` is clearer about what is on the allow-list.

### 5. Vectorise over a column of inputs

```r title="Vectorise over a vector of names"
users <- c("Ada", "Bob", "Cee")
glue_safe("User: {users}")
#> User: Ada
#> User: Bob
#> User: Cee
```

glue_safe() vectorises over its inputs the same way `glue()` does: a length-3 `users` vector produces a length-3 glue result. Pass the result to `glue_collapse()` if you want to flatten it into one summary line.

## glue_safe() vs glue() and base R alternatives

**Pick glue_safe() whenever the template string is not authored by you.** glue() is faster and supports R expressions, which makes it the default for application code where you write the templates. glue_safe() trades expression power for security; base R's `sprintf()` is even narrower and only handles positional format codes.

| Function | Evaluates code in `{}`? | Vector input | Best for |
|---|---|---|---|
| `glue_safe(t, .envir = e)` | No | Yes | Untrusted templates; allow-list interpolation |
| `glue(t)` | Yes | Yes | Your own templates with `{expression}` slots |
| `sprintf("Hi %s", x)` | No | Yes | Positional formatting; numeric precision |
| `paste0("Hi ", x)` | No | Yes | Plain concatenation, no template syntax |
| `whisker::whisker.render(t, e)` | No | No | Logic-less Mustache-style templates |

The decision rule: if the template literal lives in your source file, use `glue()`. If it comes from a user, an environment variable, a database row, or any input outside the file, use `glue_safe()` with an explicit allow-list environment.

[NOTE]
**glue_safe() is in glue 1.5.0 and later.** Older versions of glue do not export it. If you ship code that may run against pinned older versions, fall back to a hand-written `gsub()` template or upgrade the dependency before relying on glue_safe().

## Common pitfalls

1. **Expecting expressions to work.** `glue_safe("{toupper(name)}")` fails because `toupper(name)` is not a bare name. If you need an expression, evaluate it BEFORE the glue_safe() call: `up <- toupper(name); glue_safe("{up}")`. Mixing the two patterns is a frequent source of confusion when migrating from glue().

2. **Forgetting `.envir` with user input.** Calling `glue_safe(user_template)` without `.envir` leaves the caller frame as the lookup environment. If your function holds sensitive locals like API keys or database passwords, a hostile template can name them directly. Always pass `list2env(...)` for untrusted input.

3. **Treating glue_safe() as a sanitiser for SQL or HTML.** glue_safe() blocks R-code injection, not SQL or HTML injection. For SQL, use `glue_sql()` with `.con = con`; the connection drives proper identifier and string quoting. For HTML, use `htmltools::htmlEscape()` or an explicit template library.

## Try it yourself

**Try it:** Build a glue_safe() call that interpolates `name` and `role` from a restricted allow-list environment. The template should be `"User {name}: {role}"` and the env should expose only those two names. Save the result to `ex_safe`.

```r title="Your turn: safe interpolation with allow-list"
# Try it: glue_safe with a restricted envir
ex_env <- list2env(list(name = "Ada", role = "editor"))
ex_template <- "User {name}: {role}"
ex_safe <- # your code here

ex_safe
#> Expected: User Ada: editor
```

<details>
<summary>Click to reveal solution</summary>

```r title="Solution"
ex_safe <- glue_safe(ex_template, .envir = ex_env)
ex_safe
#> User Ada: editor
```

**Explanation:** `list2env()` packages a list of allowed values into a fresh environment. Passing it as `.envir` ensures glue_safe() can resolve `name` and `role` but nothing else, even if other names exist in the calling frame.

</details>

## Related glue functions

- `glue()` is the standard interpolation function. Use it for trusted templates that need to evaluate R expressions in braces.
- `glue_data()` interpolates a template across the rows of a data frame. There is no `glue_data_safe()`, so vet column values when the template itself is user-supplied.
- `glue_sql()` builds parameterised SQL with proper identifier and string quoting. Use it for any user-influenced SQL query against a DBI connection.
- `glue_collapse()` flattens a vector of glue strings into one. Pair it with glue_safe() to summarise per-row interpolations into a single line.
- See the [glue package reference for glue_safe()](https://glue.tidyverse.org/reference/glue_safe.html) for the full argument list and edge-case behaviour.

## FAQ

**What is the difference between glue() and glue_safe()?**

`glue()` uses `eval()` to interpret braces, so `{1 + 1}` returns 2 and `{Sys.time()}` runs the function call. `glue_safe()` uses `get()` and only resolves bare variable names; the same expressions throw an error. Use glue() in code where you control the template string, and glue_safe() when the template comes from any kind of external input.

**When should I prefer glue_safe() over glue()?**

Any time the template string is influenced by user input, environment variables, configuration files, or a database row. The rule of thumb: if you cannot point to the literal template string in your source file, treat it as untrusted and use glue_safe() with an explicit `.envir` argument that lists exactly which names are allowed.

**Can glue_safe() return NA for missing variables?**

Not by default. glue_safe() throws an error when a name in `{braces}` cannot be found in `.envir`, the same way `get()` does. Wrap calls in `tryCatch()` if you want a quiet fallback, or pre-populate the allow-list environment with `NA` values for every optional name you want the template to tolerate.

**Is glue_safe() enough to prevent SQL injection?**

No. glue_safe() blocks R-code injection inside templates; it does not quote SQL identifiers or string literals. For database queries, use `glue_sql()` with a DBI `.con` argument so the connection handles quoting and escaping. glue_safe() and glue_sql() solve different injection problems and are commonly used together.

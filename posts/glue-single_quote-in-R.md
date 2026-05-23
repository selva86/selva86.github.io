---
title: "glue single_quote() in R: Wrap Strings for SQL Literals"
slug: "glue-single_quote-in-R"
description: "Use glue single_quote() in R to wrap strings and escape embedded apostrophes. Five SQL-literal examples, shQuote() comparison, three common pitfalls, FAQ."
keywords: "glue single_quote, single_quote function R, glue single_quote examples, R escape single quotes, glue::single_quote, sql string literal R, quote apostrophe R"
mathjax: false
webr: true
date: "2026-05-23"
post_type: "PSEO"
category_id: "function-deep"
subcategory_id: "glue-functions"
fr_parent: "stringr-in-R.html"
auto_link_terms: "single_quote()|glue::single_quote()|glue single_quote|single_quote function|escape single quotes in glue"
auto_link_case_sensitive: true
target_keyword: "glue single_quote"
sibling_block_enabled: true
difficulty: "Beginner"
---

# glue single_quote() in R: Wrap Strings for SQL Literals

<p class="lead">glue single_quote() wraps each element of a character vector in single quotes and escapes any embedded single quote (apostrophe) with a backslash. It is the SQL-92 standard way to quote a string literal, and it is the helper to reach for when you build SQL WHERE clauses, parsed R expressions, or any text that must contain a quoted literal alongside an apostrophe.</p>

[QUICK ANSWER]
single_quote("hi")                            # 'hi'  with surrounding quotes
single_quote(c("a", "b"))                     # vectorised over input
single_quote("O'Brien")                       # escapes inner apostrophe
single_quote(NA)                              # NA passes through unchanged
single_quote("")                              # empty string becomes ''
single_quote(as.character(c(1, 2)))           # coerce numbers first
paste0("name = ", single_quote(nm))           # build a SQL fragment

[DECISION TREE: Is single_quote() the right tool?]
- wrap a string in escaped single quotes: single_quote(x)
- wrap in escaped double quotes instead: double_quote(x)
- wrap a SQL identifier (column or table): backtick(x)
- safely interpolate values into SQL: glue_sql("WHERE n = {x}", .con = con)
- build a portable shell argument: shQuote(x, type = "sh")
- escape HTML entities, not quotes: htmltools::htmlEscape(x)
- format an R object as deparsed code: deparse(x)

## What single_quote() does in one sentence

**single_quote() takes a character vector and returns it with each element wrapped in single quotes and any internal apostrophe escaped with a backslash.** It is a one-line helper exported by the glue package and is the underlying machinery behind glue_sql() when it quotes string literals against a database connection.

The function is vectorised over its input, NA-safe, and changes nothing about the string apart from adding the surrounding `'` characters and escaping any inner `'`. There is no template syntax, no formatter logic, no connection awareness. Once you reach for `paste0("'", x, "'")` to build SQL or generated R code, single_quote() is the safer replacement because it handles the awkward apostrophe-inside-string case for free.

```r title="Load glue and wrap a simple string"
library(glue)

single_quote("New York")
#> [1] "'New York'"
```

The result is a character vector of the same length as the input, with each element padded by single quotes. The outer R-level double quotes you see in the printed output are how R displays a character string; the value itself contains the literal single quotes.

[KEY INSIGHT]
**Use single_quote() for VALUES, backtick() for IDENTIFIERS.** SQL uses single quotes to delimit string literals (`WHERE name = 'Selva'`) and backticks or double quotes to delimit identifiers like column and table names. Pick the wrapper based on which side of the comparison the text sits on.

## Syntax

**The signature is minimal because the job is small.**

```r title="Function signature"
# single_quote(x)
#
# Arguments
#   x: character vector. NULL, NA, and zero-length input are handled.
#
# Returns
#   character vector the same length as x. Each non-NA element
#   has '...' added; any internal ' is escaped with \\'.
```

One argument, no options, output length always matches input length. NA inputs return NA, not the string `'NA'`, which matters when you assemble SQL because the literal text `'NA'` is almost never what you want.

[NOTE]
**single_quote() is exported by glue but is independent of glue() itself.** You do not need a template to call it. The function lives alongside double_quote() and backtick() as a small family of string-wrapping primitives.

## Common use cases

### 1. Build a SQL WHERE clause for a string column

The most frequent reason to call single_quote() is to wrap a string value before it slots into a SQL fragment. Single quotes are the SQL-92 standard for string literals, so a portable WHERE clause uses them regardless of database engine.

```r title="Quote a value for a SQL WHERE clause"
library(glue)

city <- "Chennai"
clause <- glue("WHERE city = {single_quote(city)}")
clause
#> WHERE city = 'Chennai'
```

The output is a glue object that prints without R-level escaping, so it pastes straight into a SQL string and the database sees a properly quoted literal.

### 2. Escape an embedded apostrophe in a name

Names like `O'Brien`, `D'Souza`, and `Cote d'Ivoire` contain an apostrophe that doubles as the SQL string-literal delimiter. single_quote() escapes that internal apostrophe automatically so you never construct broken SQL.

```r title="Escape an apostrophe inside a name"
single_quote("O'Brien")
#> [1] "'O\\'Brien'"

single_quote(c("Tom", "O'Brien", "D'Souza"))
#> [1] "'Tom'"      "'O\\'Brien'" "'D\\'Souza'"
```

The doubled backslash is R's print form for a single backslash plus apostrophe; the on-the-wire SQL receives `'O\'Brien'`, which most engines accept. For strict SQL-92 doubling (`'O''Brien'`) use glue_sql() with a connection.

### 3. Vectorise over a column to build an IN clause

Because single_quote() is vectorised, you can wrap every element of a column in one call and then collapse the result into a comma-separated IN clause.

```r title="Build a SQL IN clause from a character vector"
cities <- c("Chennai", "Mumbai", "Bengaluru")
quoted <- single_quote(cities)
quoted
#> [1] "'Chennai'"   "'Mumbai'"    "'Bengaluru'"

in_clause <- glue("city IN ({paste(quoted, collapse = ', ')})")
in_clause
#> city IN ('Chennai', 'Mumbai', 'Bengaluru')
```

The two-step approach (wrap, then collapse) reads more clearly than a nested expression and keeps the quoted vector reusable.

### 4. Quote values inside a generated R expression

**Generated R code needs quoted string literals too.** R, like SQL, accepts single quotes around character strings, so single_quote() output drops into a parseable expression unchanged.

```r title="Build an R expression as a character string"
group <- "treatment"
expr_text <- glue("subset(df, condition == {single_quote(group)})")
expr_text
#> subset(df, condition == 'treatment')
```

Pass `expr_text` to `parse(text = expr_text)` followed by `eval()`, or write it into a generated script. The single quotes around `treatment` make the literal valid R syntax.

### 5. Pair with glue_sql() for connection-aware quoting

**For production SQL, prefer glue_sql() because it knows the database engine.** single_quote() still shines for offline tests, fixtures, and fragments you splice into a larger template later.

```r title="Manual quoting for an offline test fixture"
fake_value <- single_quote("Test'value")
fragment <- glue("name = {fake_value}")
fragment
#> name = 'Test\\'value'
```

The offline fragment is deterministic and never reaches the database, so it works for assertion tests. Against a live connection, swap to glue_sql() so the engine's preferred escape style takes over.

## single_quote() vs shQuote() and paste0()

**Three R functions can put single quotes around a string, and they are not interchangeable.** Pick the one that matches the consumer of the output.

| Function | Best for | NA handling | Vectorised | Escape style |
|---|---|---|---|---|
| `glue::single_quote()` | SQL string literals, generated R code | NA in, NA out | yes | backslash apostrophe |
| `shQuote(x, type = "sh")` | POSIX shell arguments | errors on NA | yes | POSIX `'\''` close-reopen |
| `paste0("'", x, "'")` | quick demo, no apostrophes ever | NA becomes `'NA'` | yes | none, will break on `'` |

```r title="Compare the three quoting helpers"
x <- "O'Brien"

glue::single_quote(x)
#> [1] "'O\\'Brien'"

shQuote(x, type = "sh")
#> [1] "'O'\\''Brien'"

paste0("'", x, "'")
#> [1] "'O'Brien'"   # broken: unbalanced quotes
```

The shell variant uses the POSIX close-escape-reopen trick: right for `system2()` arguments, wrong for SQL. The paste0() variant looks fine until the data contains an apostrophe, when it silently produces malformed output.

[TIP]
**For SQL, prefer glue_sql() to manual single_quote() once a DBI connection is in scope.** glue_sql() routes the escape through the driver, which matches the engine's exact rules (Postgres doubles apostrophes; SQLite uses backslash; SQL Server uses doubling). single_quote() picks one style and lets the engine sort it out, which works for most engines but not for stricter SQL-92 ones.

## Common pitfalls

**NA flows through as NA, not as the string `'NA'`.** Splice that NA into SQL with `paste()` and you get the literal text `NA` instead of the keyword `NULL`. Convert NA explicitly with `ifelse(is.na(x), "NULL", single_quote(x))` before assembly.

**Numeric input errors.** `single_quote(123)` fails because the input is not character. Coerce with `as.character()` first, or skip quoting entirely; SQL accepts numeric literals unquoted and quoting them can defeat numeric indexes.

**Backslash escaping is not universal.** Strict SQL-92 engines (PostgreSQL with `standard_conforming_strings = on`) reject `\\'` and require apostrophe doubling. Route through glue_sql() with a live connection on those engines.

## Try it yourself

**Try it:** Wrap each element of `c("Tom", "Pat's", "Sam")` in single quotes, then collapse the result into a single comma-separated string suitable for a SQL IN list. Save the final string to `ex_in_list`.

```r title="Your turn: build a SQL IN list"
library(glue)
ex_names <- c("Tom", "Pat's", "Sam")

ex_in_list <- # your code here

ex_in_list
#> Expected: "'Tom', 'Pat\\'s', 'Sam'"
```

<details>
<summary>Click to reveal solution</summary>

```r title="Solution"
ex_in_list <- paste(single_quote(ex_names), collapse = ", ")
ex_in_list
#> [1] "'Tom', 'Pat\\'s', 'Sam'"
```

**Explanation:** single_quote() handles the apostrophe inside `Pat's` automatically, then paste(..., collapse = ", ") joins the quoted vector into the comma-separated form a SQL IN clause expects.

</details>

## Related glue functions

- `double_quote(x)` wraps in escaped double quotes; pair with this when you need identifier quoting on engines that accept doubles.
- `backtick(x)` wraps in backticks; the right choice for SQL identifiers on MySQL and SQLite.
- `glue_sql(.con = con, ...)` is the connection-aware template that routes both literal and identifier quoting through the database driver.
- `glue()` is the underlying template engine; single_quote() output drops into a glue template without further escaping.
- `as_glue()` promotes a plain character to a glue object so print methods render without R-level quoting.

## FAQ

**What does glue single_quote() do?**

It takes a character vector and returns the same vector with each element wrapped in single quotes and any internal apostrophe escaped with a backslash. The function is exported by the glue package and powers glue_sql() string-literal quoting. It is vectorised, NA-safe, and has no options.

**When should I use single_quote() instead of glue_sql()?**

Use single_quote() when no live database connection is available (offline tests, fixtures, code generation) or when you assemble a fragment to splice into a larger glue_sql() template later. With a DBI connection in scope, prefer glue_sql() because it routes the escape through the driver.

**Why does single_quote("O'Brien") show two backslashes?**

The double backslash is R's print representation of a single backslash. The character vector actually holds one backslash followed by one apostrophe inside the surrounding single quotes. Write the value to a file or pass it to cat() and you will see the on-the-wire form, `'O\'Brien'`, with a single backslash.

**Is single_quote() safe against SQL injection?**

Not on its own. It handles apostrophe-in-string for many engines but strict SQL-92 engines reject backslash escaping. For untrusted input, route through glue_sql() with a live connection or use parameterised queries via DBI directly.

**Does single_quote() work on numeric vectors?**

No. It errors on non-character input. Coerce with `as.character()` first if you really need to quote a number, but usually you should leave numeric columns unquoted because SQL accepts them as numeric literals.

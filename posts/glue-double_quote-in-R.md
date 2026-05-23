---
title: "glue double_quote() in R: Wrap and Escape Strings Safely"
slug: "glue-double_quote-in-R"
description: "Use glue double_quote() in R to wrap strings in escaped double quotes. Five examples, comparison with single_quote() and shQuote(), three pitfalls, FAQ."
keywords: "glue double_quote, double_quote function R, glue double_quote examples, R escape double quotes, glue::double_quote, single_quote glue, shQuote alternative R"
mathjax: false
webr: true
date: "2026-05-23"
post_type: "PSEO"
category_id: "function-deep"
subcategory_id: "glue-functions"
fr_parent: "stringr-in-R.html"
auto_link_terms: "double_quote()|glue::double_quote()|glue double_quote|double_quote function|escape double quotes in glue"
auto_link_case_sensitive: true
target_keyword: "glue double_quote"
sibling_block_enabled: true
difficulty: "Beginner"
---

# glue double_quote() in R: Wrap and Escape Strings Safely

<p class="lead">glue double_quote() wraps each element of a character vector in double quotes and escapes any embedded double quotes with a backslash. It is the helper used by glue_sql() to quote string literals, and it is the function to reach for when you build SQL fragments, R code, or shell commands that must contain quoted strings.</p>

[QUICK ANSWER]
double_quote("hi")                            # "hi"  with surrounding quotes
double_quote(c("a", "b"))                     # vectorised over input
double_quote("she said \"go\"")               # escapes inner double quotes
double_quote(NA)                              # NA passes through unchanged
double_quote("")                              # empty string becomes ""
double_quote(as.character(c(1, 2)))           # coerce numbers first
paste0("name = ", double_quote(nm))           # build a SQL fragment

[DECISION TREE: Is double_quote() the right tool?]
- wrap a string in escaped double quotes: double_quote(x)
- wrap in single quotes for SQL literals: single_quote(x)
- wrap in backticks for SQL identifiers: backtick(x)
- safely interpolate into SQL: glue_sql("WHERE n = {x}", .con = con)
- build a shell argument: shQuote(x)
- escape HTML special characters: htmltools::htmlEscape(x)
- format an R object as deparsed code: deparse(x)

## What double_quote() does in one sentence

**double_quote() takes a character vector and returns it with each element wrapped in double quotes and any internal double quotes escaped with a backslash.** It is a tiny helper, exported by the glue package, that powers the SQL quoting machinery and is also useful any time you need to embed a string inside generated code.

The function is vectorised, NA-safe, and never modifies the input apart from adding the surrounding quotes and escaping internal ones. There is no formatter logic and no template syntax. If you have ever written `paste0('"', x, '"')` and then realised you also need to escape inner quotes, double_quote() is the one-line replacement.

```r title="Load glue and wrap a simple string"
library(glue)

double_quote("hello")
#> [1] "\"hello\""

cat(double_quote("hello"), "\n")
#> "hello"
```

The first line shows the raw R representation: the backslashes are how R prints an embedded double quote inside a string literal. cat() shows what the value actually contains: the seven characters `"hello"`. That distinction matters when you later print or paste the result into a query.

## Syntax

**double_quote(x) accepts a single argument and returns a character vector of the same length.** The function has no additional options because its job is intentionally narrow: surround and escape.

```r title="Function signature and the one argument that matters"
# double_quote(x)
#
# x : a character vector (or any object coercible to character).
#     NA elements pass through unchanged.
#
# returns: a character vector of the same length as x with each
#          element wrapped in " and any inner " replaced by \"
```

Three rules govern the return value:

- Each non-NA element is wrapped in a leading and trailing `"` character.
- Any `"` already inside the element is replaced with `\"` so the resulting string is a valid double-quoted literal in SQL, R, JSON-style contexts.
- NA inputs return NA without warning, which keeps the function safe to drop into a pipeline that already carries missing values.

[TIP]
**Coerce numbers explicitly before calling double_quote().** The function calls as.character() internally, so `double_quote(1)` returns `"1"`. If you want numbers unquoted, exclude them from the call rather than relying on a separate code path; explicit coercion is easier to read than implicit.

## Common use cases

### 1. Quote a single value for a SQL fragment

```r title="Wrap a string for a generated WHERE clause"
library(glue)

target <- "Ada"
paste0("SELECT * FROM users WHERE name = ", double_quote(target))
#> [1] "SELECT * FROM users WHERE name = \"Ada\""
```

The `target` value is wrapped in double quotes, which is the literal-string convention for PostgreSQL, BigQuery, and SQLite when configured with `PRAGMA quote = '"'`. For MySQL, prefer `single_quote()` because MySQL treats `"..."` as an identifier by default.

### 2. Escape an embedded quote without manual gsub

```r title="Handle a string that already contains a quote"
phrase <- 'she said "go now"'
double_quote(phrase)
#> [1] "\"she said \\\"go now\\\"\""

cat(double_quote(phrase), "\n")
#> "she said \"go now\""
```

The cat() output shows what gets written: the original string with each internal `"` replaced by `\"`. This is the correct escape sequence for JSON values and for most SQL dialects, and it removes the need to write `gsub('"', '\\"', x, fixed = TRUE)` by hand.

### 3. Vectorise over a column of strings

```r title="Apply double_quote to a vector"
names <- c("Ada", "Bob", 'O"Brien')
double_quote(names)
#> [1] "\"Ada\""      "\"Bob\""      "\"O\\\"Brien\""

cat(double_quote(names), sep = ", ")
#> "Ada", "Bob", "O\"Brien"
```

A length-3 vector returns a length-3 result, and the awkward `O"Brien` is escaped automatically. Pair the result with paste(collapse = ", ") or `glue_collapse()` to assemble a comma-separated list ready for an IN clause or a CSV header.

### 4. Build a fragment of R code at runtime

```r title="Generate an R source line that references a string"
col <- "country"
glue("df${col} == {q}", q = double_quote("USA"))
#> df$country == "USA"
```

Code-generation workflows (parser test fixtures, RMarkdown chunk builders) frequently need a quoted literal inside an otherwise unquoted snippet. double_quote() produces output that can be deparse()-roundtripped and parsed back without surprises, because the escape rules match R's own literal grammar.

[KEY INSIGHT]
**double_quote() returns a string, not raw SQL or executable code.** Treat it as one component, not a sanitiser. If you build queries from user input, wrap the entire fragment in glue_sql() with a real DBI connection so identifiers and NA values get handled too. double_quote() is the right tool for assembly, the wrong tool for security.

### 5. Combine with single_quote() and backtick() for a complete SQL builder

```r title="Quote literals, identifiers, and reserved names together"
col   <- "user.name"
val   <- "Ada"
table <- "select"

paste0(
  "SELECT ", backtick(col),
  " FROM ", backtick(table),
  " WHERE ", backtick(col), " = ", single_quote(val)
)
#> [1] "SELECT `user.name` FROM `select` WHERE `user.name` = 'Ada'"
```

The three helpers cover the three quoting roles in SQL: backtick() for identifiers that contain dots or reserved words, single_quote() for string literals, and double_quote() for the dialects where literals use `"..."`. Together they form a tiny but complete quoting toolkit that does not require a live database connection.

## double_quote() vs single_quote(), shQuote(), and base R alternatives

**Pick double_quote() when the surrounding context expects `"..."` literals and you want NA-safe vectorisation.** single_quote() is the same function but with single-quote wrapping, useful for MySQL string literals. shQuote() targets shell escaping rules and is not interchangeable with either.

| Function | Wraps in | Escapes inner quote? | NA-safe | Best for |
|---|---|---|---|---|
| `double_quote(x)` | `"..."` | Yes, to `\"` | Yes | Postgres literals, R code, JSON values |
| `single_quote(x)` | `'...'` | Yes, to `\'` | Yes | MySQL string literals, shell-friendly |
| `backtick(x)` | `` `...` `` | Yes, to `` \` `` | Yes | SQL identifiers with dots or keywords |
| `shQuote(x)` | varies by OS | Shell rules | No | Building command-line arguments |
| `dQuote(x)` | typographic " " | No | No | Display only, not for code generation |

The rule of thumb: use the glue helpers (`double_quote()`, `single_quote()`, `backtick()`) when you are assembling SQL, R, or JSON-shaped strings; use `shQuote()` for the system shell; and avoid `dQuote()` for anything that will be parsed by code, because it returns Unicode smart quotes by default.

## Common pitfalls

1. **Confusing the printed form with the value.** `double_quote("a")` prints as `"\"a\""` in the console because R displays embedded quotes with backslashes. The actual value is three characters: `"a"`. Use `cat()` or `writeLines()` to see the real content when debugging.

2. **Using double_quote() as a SQL injection guard.** double_quote() escapes the quote character but does nothing about backslashes, percent signs, semicolons, or comment delimiters. For untrusted user input bound for SQL, always go through `glue_sql()` with `.con = con`, which delegates to the DBI driver and handles all dialect-specific escape rules.

3. **Calling double_quote() on a typographic quote.** If your input contains the Unicode curly quote `“` rather than the ASCII `"`, double_quote() does not detect it and the resulting string may break downstream parsers that normalise quote styles. Normalise input with `gsub("[“”]", "\"", x)` before calling double_quote() when the source is copy-pasted text.

## Try it yourself

**Try it:** Take the vector `c('Ada', 'O"Brien', NA)`, wrap each non-missing element in escaped double quotes, then collapse the result into a single comma-separated string. Save the final string to `ex_quoted`.

```r title="Your turn: quote a small vector"
# Try it: quote a mix of plain, quote-containing, and NA values
ex_names <- c("Ada", 'O"Brien', NA)
ex_quoted <- # your code here

ex_quoted
#> Expected: "Ada", "O\"Brien", NA
```

<details>
<summary>Click to reveal solution</summary>

```r title="Solution"
ex_quoted <- paste(double_quote(ex_names), collapse = ", ")
ex_quoted
#> [1] "\"Ada\", \"O\\\"Brien\", NA"

cat(ex_quoted, "\n")
#> "Ada", "O\"Brien", NA
```

**Explanation:** double_quote() vectorises across the input, so each element is wrapped and the embedded quote in `O"Brien` is escaped. NA passes through unchanged, and paste(collapse = ", ") flattens the length-3 vector into one string ready to drop into a generated query or CSV row.

</details>

## Related glue functions

- `single_quote()` is the same helper but wraps in `'...'` and escapes inner single quotes; pick it for MySQL and shell-friendly contexts.
- `backtick()` wraps in `` `...` `` and is the SQL-identifier counterpart used by `glue_sql()` for column and table names.
- `glue_sql()` is the full SQL builder; it calls the three quote helpers internally based on the connection driver.
- `glue()` interpolates R expressions into a template and is the right tool when you need expression evaluation rather than just string wrapping.
- See the [glue package reference for double_quote()](https://glue.tidyverse.org/reference/quoting.html) for the source and the companion quoting helpers.

## FAQ

**What is the difference between double_quote() and dQuote() in base R?**

`double_quote()` always uses straight ASCII quotes (`"`) and escapes any internal quotes with a backslash, which is what SQL parsers, JSON readers, and R's own deparse() expect. base R's `dQuote()` returns typographic curly quotes (`“` and `”`) by default, which look nice in printed prose but break any system that parses the result as code or data.

**Can double_quote() handle non-character input?**

Yes. The function calls `as.character()` on its input, so `double_quote(42)` returns `"42"` and `double_quote(TRUE)` returns `"TRUE"`. If you want numeric values left unquoted in a SQL fragment, exclude them from the call and concatenate them separately rather than depending on conditional quoting inside one call.

**Does double_quote() escape backslashes?**

No. It only escapes the double-quote character itself. If your input is `path\\to\\file`, the output remains `"path\\to\\file"`. For SQL dialects that interpret backslash as an escape character (older MySQL), you must run `gsub("\\\\", "\\\\\\\\", x)` before or after double_quote() depending on whether you want the literal or escaped form.

**When should I use glue_sql() instead of double_quote()?**

Use `glue_sql()` whenever a DBI connection is available and the surrounding context is a real SQL query that will hit a database. glue_sql() handles vector splicing, NULL values, identifier quoting, and dialect differences automatically. double_quote() is the right primitive for offline string assembly, code generation, and tests where no connection exists.

---
title: "glue glue_sql() in R: Safely Interpolate Values Into SQL"
slug: "glue-glue_sql-in-R"
description: "Use glue glue_sql() in R to build SQL queries with auto-quoted values and identifiers. Five examples, vector splicing, three pitfalls, paste comparison."
keywords: "glue glue_sql, glue_sql function R, glue_sql examples, R SQL interpolation, glue_sql parameterized query, glue_sql DBI, glue_sql identifier quoting"
mathjax: false
webr: true
date: "2026-05-22"
post_type: "PSEO"
category_id: "function-deep"
subcategory_id: "glue-functions"
fr_parent: "stringr-in-R.html"
auto_link_terms: "glue_sql()|glue::glue_sql()|glue glue_sql|glue_sql function|SQL interpolation in glue"
auto_link_case_sensitive: true
target_keyword: "glue glue_sql"
sibling_block_enabled: true
difficulty: "Beginner"
---

# glue glue_sql() in R: Safely Interpolate Values Into SQL

<p class="lead">glue glue_sql() builds a SQL query by interpolating R values into a template, with each value auto-quoted for the connected database. It is the safe alternative to paste0() or sprintf() for SQL because the connection object decides how literals, identifiers, and vectors are escaped. Use it whenever the query depends on user input or runtime data.</p>

[QUICK ANSWER]
glue_sql("SELECT * FROM x WHERE id = {id}", id = 7, .con = con)        # literal
glue_sql("SELECT * FROM x WHERE name = {nm}", nm = "Ada", .con = con)  # string auto-quoted
glue_sql("SELECT * FROM x WHERE id IN ({ids*})", ids = 1:3, .con = con) # vector splice
glue_sql("SELECT {`col`} FROM x", col = "name", .con = con)            # identifier
glue_sql("SELECT * FROM {tbl}", tbl = SQL("users"), .con = con)         # raw SQL
glue_sql("UPDATE x SET v = {v} WHERE id = {id}", v = NA, id = 5, .con = con) # NULL safe
q <- glue_sql("SELECT * FROM x WHERE age > {a}", a = 30, .con = con)   # then dbGetQuery(con, q)

[DECISION TREE: Is glue_sql() the right tool?]
- build a safe SQL string with R values: glue_sql("WHERE x = {v}", .con = con)
- interpolate into plain text, not SQL: glue("Hi {name}")
- splice a vector into an IN clause: glue_sql("IN ({ids*})", .con = con)
- pass a column or table name: glue_sql("FROM {`col`}", col = "x", .con = con)
- collapse a vector into one string: glue_collapse(x, sep = ", ")
- write rows from a data frame: glue_data(df, "{col1}-{col2}")

## What glue_sql() does in one sentence

**glue_sql() interpolates R values into a SQL template and quotes each value according to the rules of the connected database.** You pass a `.con` argument (a DBI connection), and the function uses that connection to decide how strings, numbers, vectors, identifiers, and `NA` appear inside the final query.

The result is a `SQL` object that you can hand to `DBI::dbGetQuery()` or `DBI::dbExecute()`. Because the connection drives the quoting, the same template works against SQLite, Postgres, MySQL, or any other DBI backend. The `{name}` syntax is identical to glue(), but every interpolated value is sanitised before insertion.

```r title="Load glue and DBI and build a safe query"
library(glue)
library(DBI)

con <- dbConnect(RSQLite::SQLite(), ":memory:")
name <- "Ada"
glue_sql("SELECT * FROM users WHERE name = {name}", .con = con)
#> <SQL> SELECT * FROM users WHERE name = 'Ada'
```

The `{name}` slot is replaced by the string `Ada` wrapped in single quotes, the way SQLite expects literal strings. No manual escaping was needed.

## Syntax

**glue_sql(..., .con, .envir = parent.frame(), .na = DBI::SQL("NULL")) builds a parameterized SQL statement.** The `...` arguments are the template strings, `.con` is the live DBI connection that drives quoting, and `.na` sets the SQL token used for missing values.

```r title="Function signature and the four arguments that matter"
# glue_sql(..., .con, .envir = parent.frame(), .na = DBI::SQL("NULL"))
#
# ...    : SQL template strings; values go inside {braces}
# .con   : a DBI connection; required, drives all quoting
# .envir : evaluation environment for {expr}, default caller
# .na    : how to render NA; default is DBI::SQL("NULL")
```

Interpolation rules inside the template:

- `{value}` is treated as a literal and quoted by `DBI::dbQuoteLiteral()`. Strings become quoted strings, numbers stay unquoted, and `NA` becomes the `.na` token.
- Wrapping the brace contents in backticks (as shown in example 3) flips the slot to identifier mode, with quoting handled by `DBI::dbQuoteIdentifier()`.
- `{vec*}` (the `*` suffix) splices a vector into a comma-separated list, useful for `IN (...)` clauses and `VALUES (...)` tuples.
- A value wrapped in `DBI::SQL()` is treated as raw SQL and is NOT quoted, which is how you inject already-trusted fragments.

[TIP]
**Pass the real connection, not a placeholder.** The same template produces different SQL across SQLite, Postgres, and MySQL because each backend has its own quoting rules. Use the `.con` you will execute against, not a different driver chosen for convenience.

## Common use cases

### 1. Literal value interpolation

```r title="Quote a string value safely"
library(glue)
library(DBI)

con <- dbConnect(RSQLite::SQLite(), ":memory:")
dbWriteTable(con, "users",
  data.frame(id = 1:3, name = c("Ada", "Bob", "Cee"), age = c(30, 25, 40)))

target <- "Ada"
q <- glue_sql("SELECT * FROM users WHERE name = {target}", .con = con)
q
#> <SQL> SELECT * FROM users WHERE name = 'Ada'
```

The string `Ada` is wrapped in single quotes. If `target` contained an apostrophe (`O'Brien`), glue_sql() would double the quote (`'O''Brien'`) automatically, which is what stops naive concatenation from breaking on weird names. Numeric values are not quoted, and dates render in the dialect's preferred format.

### 2. Splice a vector into an IN clause

```r title="Use the star suffix for vector splicing"
ids <- c(1, 3)
q <- glue_sql("SELECT * FROM users WHERE id IN ({ids*})", .con = con)
q
#> <SQL> SELECT * FROM users WHERE id IN (1, 3)
```

The `*` suffix tells glue_sql() to expand `ids` into a comma-separated list, with each element quoted individually. Without `*`, a length-2 vector would produce a length-2 SQL vector (two separate queries), which is almost never what you want for `IN`.

### 3. Treat a value as an identifier

```r title="Backticks inside the brace mark an identifier"
col <- "name"
q <- glue_sql("SELECT {`col`} FROM users WHERE id = {id}", id = 1, .con = con)
q
#> <SQL> SELECT `name` FROM users WHERE id = 1
```

The backticks around the brace contents flip glue_sql() from "quote as literal" to "quote as identifier". Identifier quoting uses the database-specific quote character (backticks in SQLite, double quotes in Postgres), so the same template works on either backend.

### 4. Inject raw SQL with DBI::SQL()

```r title="Wrap pre-trusted fragments in DBI::SQL"
order_clause <- DBI::SQL("ORDER BY age DESC")
q <- glue_sql("SELECT * FROM users {order_clause}", .con = con)
q
#> <SQL> SELECT * FROM users ORDER BY age DESC
```

`DBI::SQL()` marks a string as already-safe SQL, so glue_sql() drops it in unchanged. Use this for fixed fragments you control (column lists, ORDER BY direction). Never wrap user input in `DBI::SQL()`, that disables the safety the rest of the function provides.

[KEY INSIGHT]
**Everything passes through DBI's quoter except DBI::SQL().** glue_sql() never trusts a value by default. The only way to skip quoting is to wrap a string in `DBI::SQL()`, which is the explicit opt-out. User input should never go through that wrapper.

### 5. End-to-end: build and execute

```r title="Build the query then run it with dbGetQuery"
min_age <- 27
q <- glue_sql("SELECT name, age FROM users WHERE age > {min_age}", .con = con)
dbGetQuery(con, q)
#>   name age
#> 1  Ada  30
#> 2  Cee  40
```

Build with glue_sql(), execute with `dbGetQuery()` or `dbExecute()`. Splitting the steps lets you inspect the assembled SQL before running it, which is much easier to debug than a `paste0()` buried inside the executor call.

[WARNING]
**Never concatenate user input with paste0() for SQL.** A single quote in the input becomes a query-breaking syntax error in the best case and a SQL injection vector in the worst. The whole reason glue_sql() exists is to remove that risk from the codebase.

## glue_sql() vs paste0() and sprintf()

**Three approaches build SQL strings; only glue_sql() escapes correctly.** paste0() and sprintf() are general-purpose string builders unaware of SQL, so they do not quote, do not handle vectors, and silently produce injection bugs.

| Function | Auto-quotes? | Handles `NA`? | Vector splice? | Identifier safe? |
|---|---|---|---|---|
| `glue_sql(..., .con = con)` | Yes (DBI rules) | Yes (`NULL`) | Yes (`{x*}`) | Yes (backticks) |
| `paste0("WHERE x = '", v, "'")` | No (manual) | No | No | No |
| `sprintf("WHERE x = '%s'", v)` | No (manual) | No | No | No |
| `DBI::sqlInterpolate(con, "?x", x = v)` | Yes | Yes | Limited | Limited |

The decision rule: any query whose values come from outside the script (user input, file rows, API responses) belongs in glue_sql(). Hard-coded queries with no interpolation are fine as plain literals.

## Common pitfalls

1. **Forgetting `.con` argument.** glue_sql() throws "Connection required" because it cannot quote without knowing the database. Pass a real DBI connection, not `NULL` or a string. For testing without a live driver, use `DBI::ANSI()`.

2. **Using `{x}` instead of `{x*}` for vectors.** A length-N vector inside plain `{x}` produces a length-N SQL object, one query per element. That breaks `IN` clauses and most other multi-value patterns. Add the `*` suffix any time the value is a vector and you want it spliced into one query.

3. **Wrapping user input in `DBI::SQL()`.** The `SQL()` wrapper marks a string as already-safe and skips quoting. If user-supplied data flows through that wrapper, glue_sql()'s safety is gone. Reserve `DBI::SQL()` for fragments authored in code, never for runtime values.

## Try it yourself

**Try it:** Use `glue_sql()` to build a query that selects all `users` whose `id` is in the vector `c(2, 3)`. Save the result to `ex_query`, then run it through `dbGetQuery(con, ex_query)`.

```r title="Your turn: build an IN clause with glue_sql"
# Try it: filter by a set of ids
ex_ids <- c(2, 3)
ex_query <- # your code here

dbGetQuery(con, ex_query)
#> Expected: 2 rows (Bob and Cee)
```

<details>
<summary>Click to reveal solution</summary>

```r title="Solution"
ex_query <- glue_sql(
  "SELECT * FROM users WHERE id IN ({ex_ids*})",
  .con = con
)
ex_query
#> <SQL> SELECT * FROM users WHERE id IN (2, 3)
dbGetQuery(con, ex_query)
#>   id name age
#> 1  2  Bob  25
#> 2  3  Cee  40
```

**Explanation:** The `*` suffix splices `ex_ids` into the parenthesised list. Each element is quoted by DBI before insertion, so the resulting query is safe even if the vector held strings or NAs.

</details>

## Related glue functions

- `glue()` interpolates `{expressions}` into plain text strings. Use it whenever the output is not SQL.
- `glue_data()` interpolates a template across the rows of a data frame, returning one string per row.
- `glue_collapse()` joins a character vector into one string, useful for building summary lines after a glue() pipeline.
- `DBI::sqlInterpolate()` is the lower-level DBI primitive that glue_sql() wraps. Reach for it directly only when you need full control over the placeholder syntax.
- See the [glue_sql reference](https://glue.tidyverse.org/reference/glue_sql.html) for the complete argument list and backend-specific examples.

## FAQ

**Why use glue_sql() instead of paste0() for SQL?**

paste0() concatenates strings with no awareness of SQL syntax. A value like `O'Brien` breaks the query; `1 OR 1=1` runs as code. glue_sql() routes every value through `DBI::dbQuoteLiteral()`, which escapes quotes and handles NAs.

**What does the `*` suffix do in a glue_sql() template?**

The `*` after a name (`{ids*}`) splices the vector into a comma-separated list rather than producing one query per element. It is the standard pattern for `IN ()` clauses and `VALUES ()` lists. Each element of the spliced vector is quoted individually by DBI.

**How do I pass a column or table name through glue_sql()?**

Wrap the brace contents in backticks inside the template (as in example 3). This switches glue_sql() to `DBI::dbQuoteIdentifier()`, which uses the right identifier quote for the backend (backticks in SQLite, double quotes in Postgres). For a known-safe fragment, wrap the value in `DBI::SQL()` to skip quoting.

**How does glue_sql() handle NA values?**

By default, any `NA` in an interpolated value becomes `NULL` in the SQL output. Override the token via the `.na` argument, for example `.na = DBI::SQL("'missing'")` to use a sentinel string.

**Can I use glue_sql() without a database connection for testing?**

Yes, pass `DBI::ANSI()` as the `.con`. It is a synthetic connection that applies standard ANSI SQL quoting rules, so glue_sql() can build a representative query without a live driver. Switch back to the real connection before executing, since dialects diverge on identifier quoting and date formats.

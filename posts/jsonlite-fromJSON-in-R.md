---
title: "jsonlite fromJSON() in R: Parse JSON Into R Objects"
slug: jsonlite-fromJSON-in-R
description: "Learn jsonlite fromJSON() in R to parse JSON strings, files, and URLs into lists and data frames. Covers syntax, simplifyVector, flatten, and common errors."
keywords: "jsonlite fromJSON, fromJSON function R, jsonlite fromJSON examples, read JSON in R, parse JSON R, fromJSON data frame, R JSON to data frame"
mathjax: false
webr: true
date: 2026-05-16
post_type: PSEO
category_id: function-deep
subcategory_id: readr--readxl--haven
fr_parent: Importing-Data-in-R.html
auto_link_terms: "fromJSON()|jsonlite fromJSON|jsonlite::fromJSON()|parse JSON in R|read JSON in R"
auto_link_case_sensitive: true
target_keyword: "jsonlite fromJSON"
sibling_block_enabled: true
difficulty: Beginner
---

# jsonlite fromJSON() in R: Parse JSON Into R Objects

<p class="lead">The jsonlite fromJSON() function parses JSON into native R objects. It reads a JSON string, file path, or URL and returns a list, vector, or data frame, automatically simplifying the structure where it can.</p>

[QUICK ANSWER]
fromJSON('{"a":1,"b":2}')                     # JSON object to a named list
fromJSON('[1,2,3]')                           # JSON array to an atomic vector
fromJSON('[{"x":1},{"x":2}]')                 # array of objects to a data frame
fromJSON(txt, simplifyVector = FALSE)         # keep everything as nested lists
fromJSON(txt, flatten = TRUE)                 # flatten nested data frame columns
fromJSON("data.json")                         # parse a JSON file by path
fromJSON("https://api.example.com/data")      # parse JSON straight from a URL

[DECISION TREE: Is fromJSON() the right tool?]
- parse a JSON string or file into R: fromJSON(txt)
- keep JSON literal, never simplify: parse_json(txt)
- read a JSON file with explicit path semantics: read_json("data.json")
- write an R object back to JSON: toJSON(x)
- stream large line-delimited JSON: stream_in(file("big.ndjson"))
- the file is actually CSV, not JSON: read_csv("data.csv")

## What fromJSON() does

**fromJSON() converts JSON text into the closest matching R object.** You pass it JSON and it returns a list, an atomic vector, or a data frame, depending on the shape of the input. The argument can be a literal JSON string, a path to a `.json` file, or an `http://` URL, and fromJSON() detects which one it received.

The function does more than a literal translation. By default it runs a simplification step that turns JSON arrays into vectors and arrays of flat objects into data frames. That mapping makes jsonlite practical: API responses arrive as nested JSON, and fromJSON() lands them as a tidy data frame.

## Syntax and key arguments

**Most calls pass only the JSON itself; the remaining arguments control how aggressively fromJSON() simplifies the result.** Web APIs return predictable shapes, so once you know the structure you can tune these flags to get exactly the object you want.

```r title="The fromJSON signature"
fromJSON(
  txt,                       # JSON string, file path, or URL
  simplifyVector = TRUE,     # collapse primitive arrays into vectors
  simplifyDataFrame = TRUE,  # collapse arrays of objects into data frames
  simplifyMatrix = TRUE,     # collapse nested arrays into matrices
  flatten = FALSE            # pull nested object columns up to the top level
)
```

The three `simplify*` arguments all default to the value of `simplifyVector`, so setting `simplifyVector = FALSE` turns off simplification entirely and returns raw nested lists. The `flatten` argument is separate: it leaves simplification on but unpacks nested data frame columns into dotted column names like `loc.lat`.

[NOTE]
**Coming from Python pandas?** The closest equivalent is `pandas.read_json()`, which also maps a JSON array of objects to a tabular structure. fromJSON() differs by returning either a base R data frame or a plain list, and you choose the shape with the `simplify*` flags rather than an `orient` argument.

## fromJSON() examples

**Every example below uses a literal JSON string, so each block runs on its own with no file or network access.** Start by loading jsonlite, then parse a simple JSON object.

```r title="Parse a JSON object into a list"
library(jsonlite)

person <- fromJSON('{"name": "Ada", "age": 36, "active": true}')
person
#> $name
#> [1] "Ada"
#>
#> $age
#> [1] 36
#>
#> $active
#> [1] TRUE
```

A JSON object has named keys but no tabular shape, so fromJSON() returns a named list. JSON `true` becomes R `TRUE`, and the numeric value stays numeric.

**An array of flat objects is the case fromJSON() simplifies into a data frame.** This is the typical shape of an API result: a list of records that all share the same keys.

```r title="Parse an array of objects into a data frame"
records <- fromJSON('[
  {"city": "Paris", "pop": 2.1},
  {"city": "Oslo",  "pop": 0.7},
  {"city": "Lima",  "pop": 9.7}
]')
records
#>    city pop
#> 1 Paris 2.1
#> 2  Oslo 0.7
#> 3  Lima 9.7
class(records)
#> [1] "data.frame"
```

**Turn simplification off with `simplifyVector = FALSE` when you want the raw structure.** This is useful for ragged JSON where records do not share the same keys, since forcing a data frame would misalign the columns.

```r title="Keep the result as nested lists"
raw <- fromJSON(
  '[{"city": "Paris", "pop": 2.1}, {"city": "Oslo", "pop": 0.7}]',
  simplifyVector = FALSE
)
length(raw)
#> [1] 2
raw[[1]]$city
#> [1] "Paris"
```

**Use `flatten = TRUE` when records contain nested objects.** Without it, a nested object becomes a data frame column that holds another data frame, which is awkward to index.

```r title="Flatten nested object columns"
nested <- fromJSON('[
  {"id": 1, "loc": {"lat": 48.8, "lon": 2.3}},
  {"id": 2, "loc": {"lat": 59.9, "lon": 10.7}}
]', flatten = TRUE)
nested
#>   id loc.lat loc.lon
#> 1  1    48.8     2.3
#> 2  2    59.9    10.7
```

[TIP]
**Pretty-print before you debug.** When an API response is hard to read, wrap the raw string in `prettify()` to see the indented structure, or call `toJSON(x, pretty = TRUE)` on a parsed object. Seeing the nesting makes it obvious whether you need `flatten = TRUE`.

## fromJSON() vs read_json(), parse_json() and toJSON()

**fromJSON() is one of several jsonlite functions, and the right choice depends on your input and how much simplification you want.** They share an engine, so the difference is mostly behaviour at the edges.

| Function | Direction | Simplifies? | Best for |
|----------|-----------|-------------|----------|
| `fromJSON()` | JSON to R | Yes, by default | Strings, files, or URLs you want as data frames |
| `read_json()` | JSON file to R | No, by default | A file path, kept as nested lists |
| `parse_json()` | JSON string to R | No | A literal string, kept exactly as written |
| `toJSON()` | R to JSON | n/a | Writing an R object back out as JSON |
| `stream_in()` | NDJSON to R | Yes | Large line-delimited JSON files |

Use `fromJSON()` when you want JSON converted into the most convenient R object with the least code. Reach for `read_json()` or `parse_json()` when you need the literal structure preserved, for example when keys vary between records. Use `toJSON()` for the reverse trip.

[KEY INSIGHT]
**Simplification is the whole point of fromJSON().** The same JSON can land as a list or a data frame depending on one flag. If a result is not the shape you expected, the fix is almost always a `simplifyVector` or `flatten` argument, not a manual loop to reshape the output.

## Common pitfalls

**Passing malformed JSON.** fromJSON() validates the text before parsing, so a missing value, an extra comma, or an unclosed brace stops it with a lexical error that names the position.

```r title="Pitfall: malformed JSON"
# fromJSON('{"name": "Ada", "age":}')
#> Error: lexical error: invalid char in json text.
fromJSON('{"name": "Ada", "age": 36}')   # correct: every key has a value
#> $name
#> [1] "Ada"
#>
#> $age
#> [1] 36
```

**Using single quotes inside the JSON.** The JSON standard requires double quotes around every key and string. A string like `"{'a': 1}"` is valid R but invalid JSON, and fromJSON() rejects it. Keep the outer R quotes single and the inner JSON quotes double.

**Expecting a data frame from ragged records.** fromJSON() builds a data frame only when the objects in an array share their keys. If some records miss a key, simplification fills the gaps with `NA`, hiding the fact that the source data is inconsistent.

[WARNING]
**Reading from a URL needs a live connection.** When `txt` looks like a URL, fromJSON() fetches it over the network. In a restricted environment that call fails or hangs. Download the file first, or parse a literal string, when you need a result that does not depend on connectivity.

## Try it yourself

**Try it:** Parse the JSON array below into a data frame, then compute the mean of the `score` column. Save the result to `ex_mean`.

```r title="Your turn: parse JSON and summarise"
# Try it: parse JSON, mean of the score column
ex_json <- '[{"name":"A","score":80},{"name":"B","score":92},{"name":"C","score":71}]'
ex_df <- # your code here

ex_mean <- # your code here
ex_mean
#> Expected: about 81
```

<details>
<summary>Click to reveal solution</summary>

```r title="Solution"
ex_json <- '[{"name":"A","score":80},{"name":"B","score":92},{"name":"C","score":71}]'
ex_df <- fromJSON(ex_json)
ex_mean <- mean(ex_df$score)
ex_mean
#> [1] 81
```

**Explanation:** The JSON array of flat objects simplifies to a data frame, so `ex_df$score` is an ordinary numeric column that `mean()` summarises directly.

</details>

## Related jsonlite functions

**fromJSON() sits in a small family of jsonlite functions for moving data between JSON and R.** Pick the one that matches the direction you need and how much structure you want preserved.

- `toJSON()`: serialize an R object back into a JSON string, the inverse of fromJSON().
- `read_json()`: read a JSON file by path, without simplification by default.
- `write_json()`: write an R object straight to a `.json` file on disk.
- `parse_json()`: parse a literal JSON string while keeping the exact nested structure.
- `stream_in()`: read large newline-delimited JSON (NDJSON) one record at a time.
- `prettify()`: re-indent a JSON string so you can read its structure.
- `validate()`: check whether a string is well-formed JSON before parsing.

For the full argument reference, see the [jsonlite fromJSON() documentation](https://cran.r-project.org/web/packages/jsonlite/jsonlite.pdf) on CRAN.

## FAQ

**How do I read a JSON file in R?**

Install jsonlite with `install.packages("jsonlite")`, load it with `library(jsonlite)`, then call `fromJSON("path/to/file.json")`. The function detects that the argument is a file path, reads the file, and returns the parsed object. The path can be absolute or relative to your working directory.

**What is the difference between fromJSON and read_json?**

Both parse JSON, but they differ in defaults. `fromJSON()` accepts a string, file path, or URL and simplifies the result into vectors and data frames by default. `read_json()` is meant for file paths and returns the literal nested-list structure with no simplification. Use `fromJSON()` when you want a tidy data frame with minimal code, and `read_json()` when the exact structure matters or records have varying keys.

**How do I convert JSON to a data frame in R?**

Pass a JSON array of flat objects to `fromJSON()`. When every object in the array shares the same keys, the default `simplifyDataFrame = TRUE` collapses the array into a data frame with one row per object and one column per key. If the JSON contains nested objects, add `flatten = TRUE` so the nested fields become dotted columns instead of list-columns.

**Why does fromJSON return a list instead of a data frame?**

fromJSON() returns a data frame only for a JSON array of objects that share their keys. A single JSON object becomes a named list, and an array whose elements have different shapes stays a list because no consistent table exists. Check the JSON shape, and if you expected a table, confirm the input is an array `[ ... ]` of objects rather than one object `{ ... }`.

**Can fromJSON read JSON directly from a URL?**

Yes. When the `txt` argument starts with `http://` or `https://`, fromJSON() fetches the content over the network and parses the response in one step. This needs a live internet connection, so in an offline environment, download the file first and parse it locally.

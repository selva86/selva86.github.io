---
title: "jsonlite toJSON() in R: Convert R Objects to JSON"
slug: jsonlite-toJSON-in-R
description: "jsonlite toJSON() converts R data frames, lists, and vectors into JSON strings. Learn syntax, auto_unbox, pretty printing, and common pitfalls with examples."
keywords: "jsonlite toJSON, toJSON function R, jsonlite toJSON examples, R convert to JSON, toJSON data frame R, R object to JSON, toJSON pretty"
mathjax: false
webr: true
date: "2026-05-16"
post_type: PSEO
category_id: function-deep
subcategory_id: readr--readxl--haven
fr_parent: Importing-Data-in-R.html
auto_link_terms: "toJSON()|jsonlite toJSON|jsonlite::toJSON()|convert R to JSON|serialize R to JSON"
auto_link_case_sensitive: true
target_keyword: "jsonlite toJSON"
sibling_block_enabled: true
difficulty: Beginner
---

# jsonlite toJSON() in R: Convert R Objects to JSON

<p class="lead">The jsonlite <code>toJSON()</code> function converts R objects, data frames, lists, and vectors, into a JSON-formatted character string ready to send to an API or write to a file.</p>

[QUICK ANSWER]
toJSON(df)                          # data frame to JSON array
toJSON(mylist, auto_unbox = TRUE)   # unwrap length-1 scalars
toJSON(x, pretty = TRUE)            # indented, human-readable
toJSON(df, dataframe = "columns")   # column-oriented output
toJSON(x, na = "null")              # NA becomes JSON null
toJSON(x, digits = 10)              # control numeric precision
write_json(df, "out.json")          # write JSON straight to file

[DECISION TREE: Is toJSON() the right tool?]
- serialize an R object to JSON text: toJSON(x)
- parse JSON text back into R: fromJSON(txt)
- write JSON directly to a file: write_json(x, path)
- pretty-print an existing JSON string: prettify(json)
- minify JSON to shrink payload size: minify(json)
- stream large data row by row: stream_out(df, con)

## What toJSON() does

**toJSON() serializes R data into JSON.** You pass an R object and get back a single character string in JavaScript Object Notation, the format almost every web API speaks. It is the export half of the [jsonlite](https://cran.r-project.org/package=jsonlite) package; `fromJSON()` is the import half that reads JSON back into R.

The function maps R types to JSON types automatically. Data frames become arrays of objects, named lists become objects, and atomic vectors become arrays. This means most real-world R data converts in one call with no manual string building.

```r title="Load jsonlite and convert a data frame"
library(jsonlite)

toJSON(head(iris, 2))
#> [{"Sepal.Length":5.1,"Sepal.Width":3.5,"Petal.Length":1.4,"Petal.Width":0.2,"Species":"setosa"},{"Sepal.Length":4.9,"Sepal.Width":3,"Petal.Length":1.4,"Petal.Width":0.2,"Species":"setosa"}]
```

Each row of `iris` becomes one JSON object, and the whole data frame becomes an array. That row-oriented shape is what most REST APIs expect.

## Syntax and key arguments

**toJSON() takes one object plus formatting controls.** The signature looks intimidating, but you only ever touch three or four arguments in practice.

```r title="The toJSON function signature"
toJSON(x, dataframe = "rows", null = "list", na = "null",
       auto_unbox = FALSE, digits = 4, pretty = FALSE, ...)
```

The arguments you will reach for most often:

- `x`: the R object to serialize (data frame, list, vector, or matrix).
- `dataframe`: how to lay out a data frame, `"rows"`, `"columns"`, or `"values"`.
- `auto_unbox`: if `TRUE`, length-1 vectors render as scalars instead of arrays.
- `na`: how to encode `NA`, as `"null"`, `"string"`, or `NA` (invalid JSON).
- `digits`: maximum decimal places for numeric values, default 4.
- `pretty`: if `TRUE`, add indentation and newlines for readability.

[NOTE]
**toJSON() returns a special class, not plain text.** The result has class `json`, which prints without quotes. Wrap it in `as.character()` if a downstream function expects an ordinary string.

## toJSON() examples by use case

**Most conversions differ only in one argument.** These four examples cover the cases that come up daily.

The default treats every value as a vector, so a named list of single values produces arrays. Set `auto_unbox = TRUE` to get clean scalars.

```r title="Unbox length-one values into scalars"
person <- list(name = "Ada", age = 36, active = TRUE)

toJSON(person)
#> {"name":["Ada"],"age":[36],"active":[true]}

toJSON(person, auto_unbox = TRUE)
#> {"name":"Ada","age":36,"active":true}
```

For configuration files or logs, pretty printing makes the output human-readable.

```r title="Pretty-print JSON with indentation"
toJSON(person, auto_unbox = TRUE, pretty = TRUE)
#> {
#>   "name": "Ada",
#>   "age": 36,
#>   "active": true
#> }
```

The `dataframe` argument changes the whole layout of tabular data. Column orientation is compact; value orientation drops the keys entirely.

```r title="Switch data frame orientation"
df <- data.frame(x = 1:2, y = c("a", "b"))

toJSON(df, dataframe = "columns")
#> {"x":[1,2],"y":["a","b"]}

toJSON(df, dataframe = "values")
#> [[1,"a"],[2,"b"]]
```

To save JSON straight to disk, skip `toJSON()` and use its file-writing companion.

```r title="Write JSON to a file"
write_json(df, "people.json", pretty = TRUE)
# creates people.json on disk; no return value
```

## toJSON() vs write_json() and alternatives

**Pick the function that matches your destination.** `toJSON()` builds a string in memory; the alternatives target files or preserve R-specific attributes.

| Function | Returns | Use when |
|---|---|---|
| `toJSON()` | JSON string | Sending to an API or further string work |
| `write_json()` | Nothing (writes file) | Saving JSON directly to disk |
| `serializeJSON()` | JSON string | You must restore exact R attributes later |
| `prettify()` | Formatted string | Reformatting JSON you already have |

The decision rule is simple. Need text to manipulate or POST? Use `toJSON()`. Need a file? Use `write_json()`. Need a perfect round trip that keeps factors, classes, and attributes? Use `serializeJSON()` with `unserializeJSON()`.

[KEY INSIGHT]
**toJSON() is lossy by design.** It produces clean, idiomatic JSON that other languages can read, but it discards R attributes like factor levels and custom classes. `serializeJSON()` keeps everything at the cost of JSON that only R understands.

## Common pitfalls

**Three mistakes account for most toJSON() surprises.** Each has a one-argument fix.

**Scalars wrapped in arrays.** Without `auto_unbox = TRUE`, a single value like `age = 36` becomes `[36]`. APIs expecting a scalar will reject it. Always set `auto_unbox = TRUE` for object payloads.

**Factors silently become strings.** A factor column converts to its character labels, not its integer codes. If you need codes, convert with `as.integer()` before calling `toJSON()`, or pass `factor = "integer"`.

```r title="Control how NA values encode"
toJSON(c(1, NA, 3))
#> [1,null,3]

toJSON(c(1, NA, 3), na = "string")
#> [1,"NA",3]
```

[WARNING]
**NA becomes null without warning.** The default `na = "null"` turns missing values into JSON `null`. If the receiving system treats `null` and a real zero differently, that silent conversion can corrupt downstream logic. Choose the `na` setting deliberately.

## Try it yourself

**Try it:** Convert the first 3 rows of `mtcars` to pretty-printed, column-oriented JSON. Save the result to `ex_json`.

```r title="Your turn: convert mtcars to JSON"
# Try it: convert mtcars to JSON
ex_json <- # your code here

ex_json
#> Expected: column-oriented JSON with mpg, cyl, disp keys
```

<details>
<summary>Click to reveal solution</summary>

```r title="Solution"
ex_json <- toJSON(head(mtcars, 3), dataframe = "columns", pretty = TRUE)
ex_json
#> {
#>   "mpg": [21, 21, 22.8],
#>   "cyl": [6, 6, 4],
#>   ...
#> }
```

**Explanation:** `dataframe = "columns"` groups values by variable instead of by row, and `pretty = TRUE` adds the indentation. The result is still a `json`-class string.

</details>

## Related jsonlite functions

**toJSON() sits in a small family of JSON tools.** These functions cover parsing, file I/O, and reformatting.

- `fromJSON()`: parse a JSON string back into an R object.
- `write_json()`: serialize and write to a file in one step.
- `read_json()`: read a JSON file directly into R.
- `prettify()`: add indentation to an existing JSON string.
- `minify()`: strip whitespace to shrink a JSON payload.

## FAQ

**What is the difference between toJSON() and fromJSON()?**

`toJSON()` and `fromJSON()` are inverses. `toJSON()` serializes an R object into a JSON string, the direction you use when sending data to an API or writing a file. `fromJSON()` parses a JSON string back into an R list or data frame, the direction you use when reading an API response. A value passed through both should return roughly unchanged, though attributes like factor levels may not survive the round trip.

**Why does toJSON() wrap my values in square brackets?**

R has no scalar type; a single number is a length-1 vector. By default `toJSON()` represents every vector as a JSON array, so `age = 36` becomes `[36]`. Set `auto_unbox = TRUE` to render length-1 vectors as bare scalars. This is the single most common adjustment people make to `toJSON()` output.

**How do I make toJSON() output readable?**

Pass `pretty = TRUE`. This adds newlines and two-space indentation so the JSON is easy to inspect or store in a config file. You can also reformat an existing JSON string with `prettify()`, or compress one with `minify()`. Pretty printing adds whitespace, so use `minify()` or the default compact form for network payloads.

**Does toJSON() write to a file?**

No. `toJSON()` only returns a string in memory. To write JSON to disk, use `write_json(x, path)`, which serializes and saves in one call and accepts the same formatting arguments such as `pretty` and `auto_unbox`. Using `write_json()` avoids the extra step of capturing the string and calling `writeLines()` yourself.

**How does toJSON() handle NA values?**

By default `na = "null"` converts `NA` to JSON `null`. You can pass `na = "string"` to encode it as the literal text `"NA"`, or `na = NA` to emit a bare `NA` token, though that produces invalid JSON. Choose the option that matches what the receiving system expects, since the conversion happens silently.

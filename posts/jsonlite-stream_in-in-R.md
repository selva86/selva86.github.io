---
title: "jsonlite stream_in() in R: Read Newline-Delimited JSON"
slug: jsonlite-stream_in-in-R
description: "Learn jsonlite stream_in() in R to read newline-delimited JSON (NDJSON) line by line. Covers syntax, the handler callback, pagesize, and the most common errors."
keywords: "jsonlite stream_in, stream_in function R, jsonlite stream_in examples, read NDJSON in R, read newline-delimited JSON R, jsonlite read json lines, stream_in vs fromJSON"
mathjax: false
webr: true
date: 2026-05-16
post_type: PSEO
category_id: function-deep
subcategory_id: readr--readxl--haven
fr_parent: Importing-Data-in-R.html
auto_link_terms: "stream_in()|jsonlite stream_in|jsonlite::stream_in()|newline-delimited JSON|NDJSON"
auto_link_case_sensitive: true
target_keyword: "jsonlite stream_in"
sibling_block_enabled: true
difficulty: Beginner
---

# jsonlite stream_in() in R: Read Newline-Delimited JSON

<p class="lead">The jsonlite stream_in() function reads newline-delimited JSON (NDJSON) one record per line. It pulls JSON from a connection (a file, URL, or pipe), parses each line, and returns a single data frame, processing the stream page by page so large files never have to fit in memory at once.</p>

[QUICK ANSWER]
stream_in(file("data.ndjson"))               # read NDJSON into a data frame
stream_in(con, verbose = FALSE)               # silence the progress messages
stream_in(con, pagesize = 1000)               # records read per page
stream_in(con, handler = fun)                 # process each page, low memory
stream_in(textConnection(txt))                # read NDJSON from a string
stream_in(gzfile("data.ndjson.gz"))           # read gzip-compressed NDJSON
stream_in(url("https://host/data.ndjson"))    # stream NDJSON from a URL

[DECISION TREE: Is stream_in() the right tool?]
- read line-delimited JSON (NDJSON): stream_in(file("data.ndjson"))
- parse one JSON string or array: fromJSON(txt)
- read a .json file as nested lists: read_json("data.json")
- write a data frame as NDJSON: stream_out(df, file("out.json"))
- the file is one big JSON array: fromJSON("data.json")
- the file is plain CSV, not JSON: read_csv("data.csv")

## What stream_in() does

**stream_in() reads JSON that is stored one record per line.** This format is called newline-delimited JSON, or NDJSON, and it is the standard way to ship large JSON datasets: log streams, API exports, and machine-learning datasets all use it. Each line is a complete, minified JSON object, and the line break is the only separator between records.

Because the records are independent lines, stream_in() never has to load the whole file before it can start parsing. It reads a fixed number of lines at a time (a *page*), parses that page into a data frame, and moves on. When no handler is supplied, it stacks every page into one combined data frame and returns it. That makes stream_in() the right tool for files too big to read with `fromJSON()` in a single pass.

## Syntax and key arguments

**Most calls pass only a connection; the other arguments tune paging, logging, and memory behaviour.** The connection is mandatory because stream_in() works on a stream, not a path string.

```r title="The stream_in signature"
stream_in(
  con,                  # an open or unopened connection (file, url, gzfile)
  handler = NULL,       # optional function called once per page of records
  pagesize = 500,       # number of lines (records) read per page
  verbose = TRUE,       # print progress messages while reading
  ...                   # extra arguments passed on to fromJSON()
)
```

The `con` argument is a connection object such as `file()`, `url()`, `gzfile()`, or `textConnection()`. If you pass an unopened connection, stream_in() opens it and closes it again for you. The `handler` argument decides the return shape: leave it `NULL` to get one bound data frame, or supply a function to process each page yourself. The `pagesize` argument controls how many records are read between handler calls, and `verbose` toggles the progress log.

[NOTE]
**Coming from Python pandas?** The equivalent is `pandas.read_json(path, lines=True)`, where `lines=True` switches on NDJSON mode. stream_in() differs by exposing the page boundary through the `handler` callback, so you can process a stream larger than memory without a third-party chunking helper.

## stream_in() examples

**Every example builds its own NDJSON in the session, so each block runs without an external file or network call.** Start by writing three minified JSON objects to a temporary file, then stream them back in.

```r title="Read an NDJSON file into a data frame"
library(jsonlite)

ndjson_path <- tempfile(fileext = ".json")
writeLines(c(
  '{"city":"Paris","pop":2.1}',
  '{"city":"Oslo","pop":0.7}',
  '{"city":"Lima","pop":9.7}'
), ndjson_path)

cities <- stream_in(file(ndjson_path), verbose = FALSE)
cities
#>    city pop
#> 1 Paris 2.1
#> 2  Oslo 0.7
#> 3  Lima 9.7
```

Each line was parsed into one row, and stream_in() bound the three pages into a single data frame. Setting `verbose = FALSE` suppressed the progress messages that stream_in() prints by default.

**You can stream NDJSON straight from a string with `textConnection()`.** This is handy for tests and quick demos where you have the JSON in a variable rather than a file.

```r title="Stream NDJSON from a string"
records <- '{"id":1,"ok":true}
{"id":2,"ok":false}
{"id":3,"ok":true}'

df <- stream_in(textConnection(records), verbose = FALSE)
df
#>   id    ok
#> 1  1  TRUE
#> 2  2 FALSE
#> 3  3  TRUE
```

The JSON `true` and `false` values became logical `TRUE` and `FALSE`, and the numeric `id` stayed an integer column.

**Supply a `handler` function to process each page without keeping the full result in memory.** The handler receives one page (a data frame) at a time, and stream_in() returns invisibly instead of binding everything.

```r title="Process pages with a handler callback"
total <- 0
count_rows <- function(page) {
  total <<- total + nrow(page)
}
stream_in(file(ndjson_path), handler = count_rows,
          pagesize = 2, verbose = FALSE)
total
#> [1] 3
```

With `pagesize = 2`, stream_in() called `count_rows` twice (a page of 2, then a page of 1). The handler only ever held one page, which is what lets stream_in() scale to files larger than RAM.

[TIP]
**Pair stream_in() with stream_out() for a memory-safe round trip.** `stream_out()` writes a data frame to NDJSON one record per line, the exact format stream_in() expects. Together they let you filter or reshape a huge dataset page by page and write the result without ever materialising the whole thing.

```r title="Round-trip a data frame through NDJSON"
out_path <- tempfile(fileext = ".json")
stream_out(iris[1:3, ], file(out_path), verbose = FALSE)

back <- stream_in(file(out_path), verbose = FALSE)
nrow(back)
#> [1] 3
```

## stream_in() vs fromJSON() and read_json()

**stream_in() and fromJSON() both turn JSON into R objects, but they expect different file shapes.** Choosing the wrong one is the most common source of confusion, so match the function to your input format.

| Function | Expects | Reads in pages? | Best for |
|----------|---------|-----------------|----------|
| `stream_in()` | NDJSON, one record per line | Yes | Large line-delimited JSON, logs, exports |
| `fromJSON()` | One JSON value or array | No | API responses, small `.json` files |
| `read_json()` | A `.json` file path | No | Files kept as literal nested lists |

Use `stream_in()` when each line of the file is its own JSON object. Use `fromJSON()` when the whole file is a single JSON array `[ ... ]` or one object `{ ... }`. The two formats look similar but are not interchangeable: an NDJSON file has no enclosing brackets and no commas between records.

[KEY INSIGHT]
**The line break is the contract.** stream_in() treats every newline as a record boundary, so the JSON on each line must be minified onto that single line. If you understand that one rule, every stream_in() error and every format mismatch with `fromJSON()` becomes predictable.

## Common pitfalls

**Passing a file path instead of a connection.** stream_in() needs a connection object, so a bare string fails immediately. Wrap the path in `file()`.

```r title="Pitfall: a path string is not a connection"
# stream_in(ndjson_path)
#> Error: Argument 'con' must be a connection.
stream_in(file(ndjson_path), verbose = FALSE)   # correct: wrap in file()
#>    city pop
#> 1 Paris 2.1
#> 2  Oslo 0.7
#> 3  Lima 9.7
```

**Feeding it prettified JSON.** stream_in() reads line by line, so a JSON object spread across several indented lines is read as several broken records. The input must be minified, with each complete record on exactly one line.

**Feeding it a JSON array.** A file that holds one array `[{...},{...}]` is valid JSON but not NDJSON. stream_in() will not split it into rows the way you expect; that file belongs to `fromJSON()` instead.

[WARNING]
**Streaming from a URL needs a live connection.** When `con` is a `url()` connection, stream_in() fetches data over the network as it reads. In a restricted or offline environment that call hangs or fails partway. Download the NDJSON file first, then stream it from a local `file()` connection.

## Try it yourself

**Try it:** Read the NDJSON string below with stream_in() and count how many rows have a score above 80. Save the count to ex_high.

```r title="Your turn: stream NDJSON and filter"
# Try it: stream NDJSON, count rows with score > 80
ex_nd <- '{"name":"A","score":80}
{"name":"B","score":92}
{"name":"C","score":71}
{"name":"D","score":88}'

ex_df <- # your code here
ex_high <- # your code here
ex_high
#> Expected: 2
```

<details>
<summary>Click to reveal solution</summary>

```r title="Solution"
ex_nd <- '{"name":"A","score":80}
{"name":"B","score":92}
{"name":"C","score":71}
{"name":"D","score":88}'
ex_df <- stream_in(textConnection(ex_nd), verbose = FALSE)
ex_high <- sum(ex_df$score > 80)
ex_high
#> [1] 2
```

**Explanation:** Each line is one record, so stream_in() binds the four objects into a data frame. Comparing `ex_df$score > 80` gives a logical vector, and `sum()` counts the `TRUE` values.

</details>

## Related jsonlite functions

**stream_in() belongs to a small family of jsonlite functions for moving data between JSON and R.** Pick the one that matches your file format and direction.

- `stream_out()`: the inverse of stream_in(), writes a data frame to NDJSON one record per line.
- `fromJSON()`: parse a single JSON string, file, or array into an R object.
- `toJSON()`: serialize an R object into a JSON string.
- `read_json()`: read a regular `.json` file by path as a nested list.
- `write_json()`: write an R object straight to a `.json` file.
- `prettify()` and `minify()`: re-indent or compact a JSON string.

For the full argument reference, see the [jsonlite stream_in() documentation](https://search.r-project.org/CRAN/refmans/jsonlite/help/stream_in.html) on CRAN.

## FAQ

**What is stream_in() in R?**

`stream_in()` is a jsonlite function that reads newline-delimited JSON (NDJSON), where every line of the input is a complete, minified JSON record. It reads the stream in pages rather than all at once, parses each page into a data frame, and by default binds every page into one combined data frame. Because it processes the input page by page, it can handle files far larger than available memory.

**How do I read an NDJSON file in R?**

Load jsonlite with `library(jsonlite)`, then call `stream_in(file("data.ndjson"))`. The `file()` wrapper turns the path into a connection, which stream_in() requires. Add `verbose = FALSE` to silence the progress messages. The call returns a data frame with one row per line of the file, with columns inferred from the JSON keys.

**What is the difference between stream_in and fromJSON?**

They expect different formats. `stream_in()` reads NDJSON, where each line is a separate JSON object and there are no enclosing brackets. `fromJSON()` reads a single JSON value, usually one object or one array. Use `stream_in()` for line-delimited exports and logs, and `fromJSON()` for an API response or a small `.json` file that holds one array.

**How does the handler argument work?**

The `handler` argument takes a function that stream_in() calls once for each page of records. Each call receives one page as a data frame, sized by `pagesize`. When you supply a handler, stream_in() does not bind or return the data; it relies on your function for side effects such as writing to disk or updating a running total. This is how you process a stream larger than memory.

**Can stream_in() read a compressed or remote file?**

Yes. Because stream_in() works on any connection, you can pass `gzfile("data.ndjson.gz")` to read gzip-compressed NDJSON, or `url("https://host/data.ndjson")` to stream it over the network. The remote case needs a live internet connection, so for reliability in offline or restricted environments, download the file first and stream it from a local `file()` connection.

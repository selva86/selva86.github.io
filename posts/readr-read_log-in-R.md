---
title: "readr read_log() in R: Read Web Server Log Files"
slug: readr-read_log-in-R
description: "readr read_log() in R reads Common Log Format web server logs into a tibble. Learn the syntax, column types, how to name fields, and parse the log date."
keywords: "readr read_log, read_log function R, readr read_log examples, R read log file, read Apache log R, parse web server log R, Common Log Format R"
mathjax: false
webr: true
date: 2026-05-16
post_type: PSEO
category_id: function-deep
subcategory_id: readr--readxl--haven
fr_parent: Importing-Data-in-R.html
auto_link_terms: "read_log()|readr read_log|readr::read_log()|Common Log Format|web server log"
auto_link_case_sensitive: true
target_keyword: "readr read_log"
sibling_block_enabled: true
difficulty: Beginner
---

# readr read_log() in R: Read Web Server Log Files

<p class="lead">The readr read_log() function reads a web server log written in the Common Log Format into a tibble. It tokenizes each line so that bracketed timestamps and quoted request strings stay in one piece, giving you one column per log field instead of one messy string.</p>

[QUICK ANSWER]
read_log("access.log")                       # parse a Common Log Format file
read_log("https://site.com/access.log")      # read a log straight from a URL
read_log(I(one_line))                        # parse literal log text
read_log("access.log", skip = 2)             # skip comment lines at the top
read_log("access.log", n_max = 1000)         # read only the first 1000 requests
read_log("access.log", col_names = my_names) # supply your own column names

[DECISION TREE: Is read_log() the right tool?]
- web server log in Common Log Format: read_log("access.log")
- plain log, one message per line: read_lines("app.log")
- comma-separated export: read_csv("data.csv")
- custom single-character delimiter: read_delim("d.txt", delim = "|")
- columns fixed by character position: read_fwf("d.txt", fwf_widths(w))
- ragged whitespace-separated columns: read_table("d.txt")

## What read_log() does

**read_log() reads a Common Log Format file into a tibble.** Web servers such as Apache and nginx record every request as one line of text. That line packs together the client IP, the user, a bracketed timestamp, the quoted request, the status code, and the response size. read_log() splits each line into those fields and returns a tidy data frame.

The clever part is the tokenizer. A naive whitespace split would shatter `[10/Oct/2000:13:55:36 -0700]` and `"GET /index.html HTTP/1.0"` into pieces. read_log() instead treats anything inside `[ ]` or `" "` as a single token, strips the delimiters, and keeps the field whole.

## Syntax and key arguments

**read_log() takes a file plus a handful of optional controls.** Only the `file` argument is required; the rest tune naming, type guessing, and how much of the file to read.

```r title="The read_log signature"
read_log(
  file,                 # path, URL, or I() literal text
  col_names = FALSE,    # FALSE gives X1, X2...; pass a character vector to name
  col_types = NULL,     # NULL guesses; cols() sets types explicitly
  trim_ws = TRUE,       # strip surrounding whitespace from each field
  skip = 0,             # number of lines to skip before the data
  n_max = Inf           # maximum number of lines to read
)
```

Unlike `read_csv()`, a log file has no header row, so `col_names` defaults to `FALSE` and every column comes back as `X1`, `X2`, and so on. Pass a character vector to `col_names` to label the fields yourself. The `skip`, `n_max`, and `col_types` arguments behave exactly as they do in the delimited readers.

[NOTE]
**No separate combined-format reader.** The same `read_log()` handles both the Common Log Format (7 fields) and the Combined Log Format (9 fields, adding referer and user agent). The tokenizer simply returns as many columns as the line contains, so a combined log yields `X1` through `X9`.

## read_log() examples

**Start with a small log you can see in full.** Wrapping the text in `I()` tells read_log() the value is data, not a file path. This three-line sample is standard Common Log Format.

```r title="Parse a Common Log Format string"
library(readr)

log_text <- '127.0.0.1 - frank [10/Oct/2000:13:55:36 -0700] "GET /index.html HTTP/1.0" 200 2326
192.168.1.5 - - [10/Oct/2000:13:56:12 -0700] "GET /style.css HTTP/1.0" 200 891
10.0.0.8 - mary [10/Oct/2000:13:57:01 -0700] "POST /login HTTP/1.0" 302 0'

read_log(I(log_text))
#> Rows: 3 Columns: 7
#> -- Column specification ----------------------------------
#> chr (5): X1, X2, X3, X4, X5
#> dbl (2): X6, X7
#> # A tibble: 3 x 7
#>   X1          X2    X3    X4                         X5                       X6    X7
#>   <chr>       <chr> <chr> <chr>                      <chr>                 <dbl> <dbl>
#> 1 127.0.0.1   -     frank 10/Oct/2000:13:55:36 -0700 GET /index.html HTTP~   200  2326
#> 2 192.168.1.5 -     -     10/Oct/2000:13:56:12 -0700 GET /style.css HTTP/~   200   891
#> 3 10.0.0.8    -     mary  10/Oct/2000:13:57:01 -0700 POST /login HTTP/1.0    302     0
```

The brackets and quotes are gone, the timestamp survived as one column, and the status and size parsed as numbers.

**Name the columns so the tibble is readable.** Pass a character vector to `col_names` with one label per field. This is the single most useful argument, because `X1` through `X7` tell you nothing.

```r title="Give the log columns meaningful names"
fields <- c("ip", "ident", "user", "time", "request", "status", "size")
logs <- read_log(I(log_text), col_names = fields)
logs
#> # A tibble: 3 x 7
#>   ip          ident user  time                       request               status  size
#>   <chr>       <chr> <chr> <chr>                      <chr>                  <dbl> <dbl>
#> 1 127.0.0.1   -     frank 10/Oct/2000:13:55:36 -0700 GET /index.html HTTP~    200  2326
#> 2 192.168.1.5 -     -     10/Oct/2000:13:56:12 -0700 GET /style.css HTTP/~    200   891
#> 3 10.0.0.8    -     mary  10/Oct/2000:13:57:01 -0700 POST /login HTTP/1.0     302     0
```

**Read only the start of a huge log.** Production access logs run to millions of lines. Use `n_max` to sample the first few while you work out the column layout.

```r title="Read just the first rows of a log"
read_log(I(log_text), col_names = fields, n_max = 2)
#> # A tibble: 2 x 7
#>   ip          ident user  time                       request              status  size
#>   <chr>       <chr> <chr> <chr>                      <chr>                 <dbl> <dbl>
#> 1 127.0.0.1   -     frank 10/Oct/2000:13:55:36 -0700 GET /index.html HTTP~   200  2326
#> 2 192.168.1.5 -     -     10/Oct/2000:13:56:12 -0700 GET /style.css HTTP/~   200   891
```

**Summarise traffic once the log is a tibble.** With named columns the log behaves like any other data frame, so a status-code count is one `dplyr` call.

```r title="Count requests by status code"
library(dplyr)

logs |> count(status)
#> # A tibble: 2 x 2
#>   status     n
#>    <dbl> <int>
#> 1    200     2
#> 2    302     1
```

## read_log() vs other readers

**read_log() is the only readr function that understands the Common Log Format.** The delimited readers would mangle the bracketed date and quoted request. Reach for a sibling only when the file is not a web server log.

| Function | Reads | Output |
|----------|-------|--------|
| `read_log()` | Common or Combined Log Format | tibble, one column per log field |
| `read_lines()` | any text file | character vector, one element per line |
| `read_delim()` | delimited text | tibble, columns split by a delimiter |
| `read_table()` | whitespace-separated text | tibble, columns split by runs of spaces |

The decision rule is simple. If the file is an Apache or nginx access log, use `read_log()`. If it is an application log with one free-form message per line, use `read_lines()` and parse with regular expressions afterwards.

[KEY INSIGHT]
**The tokenizer is the whole point.** read_log() is not a fixed seven-column parser. It is a whitespace tokenizer that protects `[ ]` and `" "` groups. That is why it copes with both the 7-field common format and the 9-field combined format without any extra arguments.

## Common pitfalls

**The timestamp comes back as text.** read_log() never parses the date; the `time` column is a plain string like `10/Oct/2000:13:55:36 -0700`. Convert it with `parse_datetime()` and the Apache date format.

```r title="Parse the log timestamp into a datetime"
parse_datetime(logs$time, format = "%d/%b/%Y:%H:%M:%S %z")
#> [1] "2000-10-10 20:55:36 UTC" "2000-10-10 20:56:12 UTC"
#> [3] "2000-10-10 20:57:01 UTC"
```

**Mixed formats produce ragged columns.** If a file mixes common and combined lines, or a request string itself contains an unescaped quote, the column count varies row to row. readr fills the gaps with `NA` and records the trouble. Call `problems()` on the result to inspect every flagged row.

**Any whitespace text will tokenize.** read_log() does not validate that the input is really a log. Hand it an unrelated text file and it returns nonsense columns with no error. Confirm the file is Common Log Format before trusting the output.

## Try it yourself

**Try it:** Read the four-line Common Log Format string below with `read_log()`, name the seven columns, then save to `ex_n` the number of requests that returned status `200`.

```r title="Your turn: count successful requests"
traffic <- '10.0.0.1 - - [12/Jan/2024:08:01:00 +0000] "GET /home HTTP/1.1" 200 540
10.0.0.2 - - [12/Jan/2024:08:01:05 +0000] "GET /about HTTP/1.1" 200 310
10.0.0.3 - - [12/Jan/2024:08:01:09 +0000] "GET /missing HTTP/1.1" 404 0
10.0.0.4 - - [12/Jan/2024:08:01:12 +0000] "GET /home HTTP/1.1" 200 540'

ex_n <- # your code here
ex_n
#> Expected: 3
```

<details>
<summary>Click to reveal solution</summary>

```r title="Solution"
fields <- c("ip", "ident", "user", "time", "request", "status", "size")
ex_log <- read_log(I(traffic), col_names = fields)
ex_n <- sum(ex_log$status == 200)
ex_n
#> [1] 3
```

**Explanation:** Naming the columns turns the sixth field into `status`, a numeric column. `sum(ex_log$status == 200)` counts the `TRUE` values, which is the number of successful requests.

</details>

## Related readr functions

**read_log() handles the structured web server log; reach for a sibling when the text has a different shape.**

- `read_lines()`: read a file as a character vector, one string per line.
- `read_delim()`: read text split by any single-character delimiter.
- `read_table()`: read whitespace-separated files with ragged columns.
- `read_fwf()`: read files where columns sit at fixed character positions.
- `parse_datetime()`: convert the log timestamp string into a real datetime.

For the full argument reference, see the [readr read_log documentation](https://readr.tidyverse.org/reference/read_log.html) on tidyverse.org.

## FAQ

**What is the Common Log Format?**

The Common Log Format is a standardized text layout that web servers use to record requests. Each line holds the client IP, an identity field, the user, a bracketed timestamp, the quoted request line, the HTTP status code, and the response size in bytes. Apache and nginx both write it by default. read_log() knows this layout, so it can split each line into the correct columns.

**How do I read an Apache access log in R?**

Call `read_log()` with the path to the access log: `read_log("access.log")`. The function tokenizes every line and returns a tibble with one column per field. Because access logs have no header, pass a character vector to `col_names` to label the columns, then convert the timestamp column with `parse_datetime()`.

**Does read_log() work with the Combined Log Format?**

Yes. The Combined Log Format adds two quoted fields, the referer and the user agent, to the standard seven. read_log() uses the same tokenizer for both, so a combined log simply returns nine columns instead of seven. You do not need a different function or any extra argument.

**Why are my log columns named X1, X2, X3?**

Log files have no header row, so read_log() cannot guess field names and defaults to `X1`, `X2`, and onward. Supply your own names by passing a character vector to `col_names`, for example `read_log(file, col_names = c("ip", "ident", "user", "time", "request", "status", "size"))`.

**How do I parse the date in a web server log?**

read_log() leaves the timestamp as text. Convert it with `parse_datetime()` and the Apache date format string: `parse_datetime(logs$time, format = "%d/%b/%Y:%H:%M:%S %z")`. The `%z` token reads the timezone offset, so the result is a proper POSIXct column you can filter and aggregate by time.
</content>
</invoke>

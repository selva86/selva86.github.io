---
title: "readr read_lines() in R: Read a File Into Lines"
slug: readr-read_lines-in-R
description: "readr read_lines() in R reads a text file into a character vector, one line per item. Learn the syntax, skip and n_max arguments, and read_lines vs readLines."
keywords: "readr read_lines, read_lines function R, readr read_lines examples, R read lines from file, read text file lines R, read_lines vs readLines"
mathjax: false
webr: true
date: 2026-05-16
post_type: PSEO
category_id: function-deep
subcategory_id: readr--readxl--haven
fr_parent: Importing-Data-in-R.html
auto_link_terms: "read_lines()|readr read_lines|readr::read_lines()|read lines from file|read text file in R"
auto_link_case_sensitive: true
target_keyword: "readr read_lines"
sibling_block_enabled: true
difficulty: Beginner
---

# readr read_lines() in R: Read a File Into Lines

<p class="lead">The readr read_lines() function reads a text file into a character vector, with one element per line. It does no column splitting and no type guessing, so it is the tool to reach for whenever you want the raw lines of a file exactly as written.</p>

[QUICK ANSWER]
read_lines("notes.txt")                          # read every line into a character vector
read_lines("https://site.com/notes.txt")         # read lines straight from a URL
read_lines(I("line one\nline two"))              # parse literal text, not a path
read_lines("big.txt", n_max = 100)               # read only the first 100 lines
read_lines("notes.txt", skip = 2)                # skip the first 2 lines
read_lines("notes.txt", skip_empty_rows = TRUE)  # drop blank lines
length(read_lines("notes.txt"))                  # count the lines in a file

[DECISION TREE: Is read_lines() the right tool?]
- plain text, one line per element: read_lines("notes.txt")
- whole file as a single string: read_file("notes.txt")
- comma-separated columns: read_csv("data.csv")
- whitespace-separated columns: read_table("data.txt")
- web server access log: read_log("access.log")
- raw bytes, encoding unknown: read_lines_raw("notes.txt")

## What read_lines() does

**read_lines() reads a text file into a character vector.** Each line of the file becomes one string in the result, in the order it appeared. There is no delimiter to set, no header row, and no column types to guess. You hand it a file and you get back a flat `chr` vector you can index, filter, and search like any other vector.

That makes read_lines() the simplest reader in the readr package. The delimited readers such as `read_csv()` and `read_table()` exist to turn text into a tibble with typed columns. read_lines() deliberately skips all of that. It is the right starting point for log files, configuration files, free-form notes, or any text whose structure you plan to parse yourself afterwards.

## Syntax and key arguments

**read_lines() takes a file plus a few optional controls.** Only the `file` argument is required. The rest decide how much of the file to read and how blank lines and encoding are handled.

```r title="The read_lines signature"
read_lines(
  file,                      # path, URL, connection, or I() literal text
  skip = 0,                  # number of lines to skip before reading
  skip_empty_rows = FALSE,   # drop blank lines when TRUE
  n_max = Inf,               # maximum number of lines to read
  locale = default_locale(), # encoding and other locale settings
  na = character()           # strings to convert to NA
)
```

The `file` argument is flexible. It accepts a local path, a URL, an open connection, or literal text wrapped in `I()`. The `skip` and `n_max` arguments work together to read a window of a file: skip the header, then cap the row count. Set `skip_empty_rows = TRUE` when blank lines are noise rather than data.

[NOTE]
**Coming from base R?** read_lines() is the readr counterpart of `readLines()`. Both return a character vector, but read_lines() is faster on large files, reads directly from a URL, and respects the `locale` encoding setting instead of relying on the session default.

## read_lines() examples

**Start with a small block of text you can see in full.** Wrapping the value in `I()` tells read_lines() that the string is data, not a path to a file. Each line of the string comes back as one element.

```r title="Read literal text into a character vector"
library(readr)

notes <- "Build the model
Check the residuals
Report the metrics"

lines <- read_lines(I(notes))
lines
#> [1] "Build the model"     "Check the residuals" "Report the metrics"

length(lines)
#> [1] 3
```

**Read a window of the file with skip and n_max.** Production files can run to millions of lines. Use `skip` to step past leading rows and `n_max` to cap how many you pull, so you can preview a file without loading all of it.

```r title="Skip lines and limit how many you read"
read_lines(I(notes), skip = 1, n_max = 1)
#> [1] "Check the residuals"
```

**Drop blank lines as you read.** By default read_lines() keeps empty lines as `""` elements, which preserves the exact file layout. Set `skip_empty_rows = TRUE` when the blank lines are just spacing you do not need.

```r title="Drop blank lines while reading"
gappy <- "alpha

beta
"

read_lines(I(gappy))
#> [1] "alpha" ""      "beta"

read_lines(I(gappy), skip_empty_rows = TRUE)
#> [1] "alpha" "beta"
```

**Filter the lines once you have the vector.** Because the result is an ordinary character vector, base R pattern matching does the rest. Here `grepl()` keeps only the warning lines from a small log.

```r title="Filter lines that match a pattern"
log_text <- "INFO  service started
WARN  cache miss
ERROR timeout
WARN  retry scheduled
INFO  request served"

log_lines <- read_lines(I(log_text))
log_lines[grepl("^WARN", log_lines)]
#> [1] "WARN  cache miss"      "WARN  retry scheduled"
```

[TIP]
**read_lines() is lazy by default.** Since readr 2.0 it reads lines on demand rather than all at once, so a `n_max` preview of a huge file is near instant. Pass `lazy = FALSE` when you need the whole file pulled into memory immediately.

## read_lines() vs readLines() and other readers

**read_lines() is for unstructured text; the delimited readers are for tables.** Pick read_lines() when you want raw lines and pick a different function when the text already has columns or a known format.

| Function | Reads into | Use when |
|----------|-----------|----------|
| `read_lines()` | character vector, one line per element | text has no column structure |
| `read_file()` | a single string holding the whole file | you need the file as one block of text |
| `readLines()` | character vector (base R) | you want to avoid a package dependency |
| `read_csv()` | tibble with typed columns | the file is comma-separated data |
| `read_table()` | tibble, whitespace-separated | columns are split by runs of spaces |

The decision rule is short. If the file is a table, use a delimited reader so you get typed columns straight away. If the file is free text, or a format readr does not understand, use read_lines() and parse the strings yourself. Prefer read_lines() over `readLines()` in tidyverse code for the speed gain and the consistent `locale` handling.

[KEY INSIGHT]
**read_lines() does no parsing, and that is the feature.** Every other readr reader makes structural decisions for you: where columns split, what type each one is, which row is the header. read_lines() makes none. It gives you the file verbatim, which means you stay in full control of how the text is interpreted.

## Common pitfalls

**A single-line string is treated as a file path.** read_lines() reads a string as literal data only when it contains a newline. Pass a one-line string and readr looks for a file with that name and errors when it cannot find one.

```r title="A single-line string is treated as a path"
read_lines("Build the model")
#> Error: 'Build the model' does not exist in current working directory
```

The fix is to wrap genuine literal text in `I()`, as in `read_lines(I("Build the model"))`. Use `I()` whenever the value is data rather than a path.

**A trailing newline does not add an empty element.** A file that ends with a line break has the same number of lines as one that does not. read_lines() does not return an extra `""` at the end, so do not write code that expects an off-by-one final element.

**Non-UTF-8 files can come back garbled.** read_lines() assumes UTF-8 encoding. A file saved as Latin-1 or another encoding may return mojibake. Set the encoding through the locale, for example `read_lines(file, locale = locale(encoding = "latin1"))`, so the bytes decode correctly.

## Try it yourself

**Try it:** Read the five-line text block below with `read_lines()`, then save to `ex_count` the number of lines that begin with `FAIL`.

```r title="Your turn: count failure lines"
events <- "OK   login
FAIL bad password
OK   logout
FAIL session expired
OK   login"

ex_count <- # your code here
ex_count
#> Expected: 2
```

<details>
<summary>Click to reveal solution</summary>

```r title="Solution"
ev_lines <- read_lines(I(events))
ex_count <- sum(grepl("^FAIL", ev_lines))
ex_count
#> [1] 2
```

**Explanation:** `read_lines(I(events))` returns the five lines as a character vector. `grepl("^FAIL", ev_lines)` flags the lines that start with `FAIL`, and `sum()` counts the `TRUE` values, giving 2.

</details>

## Related readr functions

**read_lines() gives you raw lines; reach for a sibling when the text has a known shape.**

- `read_file()`: read the entire file into one string instead of a vector of lines.
- `read_lines_raw()`: read lines as a list of raw vectors when the encoding is unknown.
- `write_lines()`: write a character vector back out, one element per line.
- `read_csv()`: read comma-separated data into a typed tibble.
- `read_log()`: read a web server access log into one column per field.

For the full argument reference, see the [readr read_lines documentation](https://readr.tidyverse.org/reference/read_lines.html) on tidyverse.org.

## FAQ

**What is the difference between read_lines() and readLines()?**

Both return a character vector with one element per line, so the output is interchangeable. read_lines() comes from the readr package and is faster on large files, reads lazily by default, accepts a URL directly, and uses the `locale` argument for encoding. `readLines()` is base R, needs no package, and is fine for small files. In tidyverse code, prefer read_lines() for the speed and consistency.

**How do I read a text file into R line by line?**

Call `read_lines()` with the path: `read_lines("notes.txt")`. The result is a character vector where each element is one line of the file, in order. You can then loop over it, index it, or filter it with `grepl()`. To process a very large file without loading it whole, read it in chunks with the `skip` and `n_max` arguments.

**How do I count the number of lines in a file in R?**

Wrap read_lines() in `length()`: `length(read_lines("notes.txt"))`. read_lines() returns one element per line, so the length of the vector is the line count. By default blank lines are included; pass `skip_empty_rows = TRUE` to count only non-empty lines.

**How do I read only the first few lines of a file in R?**

Use the `n_max` argument: `read_lines("big.txt", n_max = 10)` reads just the first 10 lines. Because read_lines() reads lazily, it stops after `n_max` lines instead of scanning the whole file, so previewing a large file is fast. Combine it with `skip` to read a window from the middle of a file.

**Does read_lines() work with a URL?**

Yes. Pass a URL as the `file` argument, for example `read_lines("https://example.com/data.txt")`, and readr downloads the content and returns its lines. This works for plain text served over HTTP or HTTPS. For a file behind authentication or on a slow connection, download it first, then read the local copy.

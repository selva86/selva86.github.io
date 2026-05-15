---
title: "readr write_lines() in R: Write Text Lines to a File"
slug: readr-write_lines-in-R
description: "Learn readr write_lines() in R to write a character vector to a file, one line per element. Covers syntax, append mode, separators, and common pitfalls."
keywords: "readr write_lines, write_lines function R, readr write_lines examples, R write lines to file, write character vector to file R, write_lines vs writeLines"
mathjax: false
webr: true
date: "2026-05-16"
post_type: PSEO
category_id: function-deep
subcategory_id: readr--readxl--haven
fr_parent: Importing-Data-in-R.html
auto_link_terms: "write_lines()|readr write_lines|readr::write_lines()|write lines to file|write_lines in R"
auto_link_case_sensitive: true
target_keyword: "readr write_lines"
sibling_block_enabled: true
difficulty: Beginner
---

# readr write_lines() in R: Write Text Lines to a File

<p class="lead">The readr write_lines() function writes a character vector to a file, placing one element on each line. It is the fast, pipe-friendly way to save plain text such as logs, IDs, or generated code from R.</p>

[QUICK ANSWER]
write_lines(x, "out.txt")                  # write a character vector
write_lines(x, "out.txt", append = TRUE)   # append instead of overwrite
write_lines(as.character(1:5), "n.txt")    # coerce non-character input
write_lines(x, "out.txt", sep = "\r\n")    # Windows line endings
write_lines(x, "out.txt", na = "")         # blank string for NA values
write_lines(x, stdout())                   # write straight to the console

[DECISION TREE: Is write_lines() the right tool?]
- write a character vector, one line each: write_lines(x, "out.txt")
- write a data frame as CSV: write_csv(df, "out.csv")
- write a data frame as TSV: write_tsv(df, "out.tsv")
- save an R object exactly: write_rds(obj, "out.rds")
- write one unbroken string: write_file(txt, "out.txt")
- read the lines back into R: read_lines("out.txt")

## What write_lines() does

**write_lines() saves a character vector as plain text, one element per line.** It belongs to the readr package and is the counterpart of `read_lines()`, which pulls the same file back into R as a character vector. Unlike `write_csv()`, it has no notion of rows and columns: it treats your input as a flat sequence of strings and appends a line separator after each one.

The function is built for non-rectangular text. Reach for it when you have a vector of file paths, gene IDs, URLs, or generated SQL statements and want each value on its own line. Because it returns its input invisibly, `write_lines()` slots cleanly into a pipe without breaking the chain.

## Syntax and arguments

**write_lines() takes a vector plus a destination and a few formatting controls.** The full signature is short, and every argument after `file` has a sensible default.

```r title="The write_lines signature"
write_lines(
  x,                  # character vector or list of raw vectors
  file,               # path or connection to write to
  sep = "\n",         # separator appended after each element
  na = "NA",          # string used in place of missing values
  append = FALSE,     # FALSE overwrites the file, TRUE adds to it
  num_threads = readr_threads()
)
```

The arguments you will actually touch:

- **x**: the character vector to write. Non-character input is coerced with `as.character()`.
- **file**: the output path. A connection such as `stdout()` or `gzfile()` also works.
- **sep**: the string placed after every element. Keep the default `"\n"` for normal text files.
- **na**: how `NA` values are rendered on disk. Defaults to the literal text `"NA"`.
- **append**: set `TRUE` to add lines to an existing file instead of replacing it.

[NOTE]
**The argument used to be named `path`.** readr 1.4.0 renamed `path` to `file` across all write functions. Code written for older readr that passes `path =` will fail on current versions, so update it to `file =`.

## Four ways to use write_lines()

### Write a character vector to a file

**The simplest call passes a vector and a path.** Here a three-element vector is written to a temporary file, then read straight back to confirm the round trip.

```r title="Write and read a character vector"
library(readr)

fruits <- c("apple", "banana", "cherry")
out <- tempfile(fileext = ".txt")
write_lines(fruits, out)

read_lines(out)
#> [1] "apple"  "banana" "cherry"
```

Each element landed on its own line. `read_lines()` reverses the operation exactly, returning the original vector.

### Append lines to an existing file

**Set `append = TRUE` to extend a file rather than overwrite it.** This is how you build up a log file across several calls.

```r title="Append more lines to the file"
write_lines(c("date", "elderberry"), out, append = TRUE)

read_lines(out)
#> [1] "apple"      "banana"     "cherry"     "date"       "elderberry"
```

The two new values were added after the original three. With `append = FALSE` (the default) the file would have been replaced.

### Control how missing values are written

**The `na` argument decides what `NA` looks like on disk.** By default a missing value becomes the text `"NA"`, but you can substitute an empty string or any placeholder.

```r title="Write NA as an empty string"
vals <- c("alpha", NA, "gamma")
write_lines(vals, out, na = "")

read_lines(out)
#> [1] "alpha" ""      "gamma"
```

The middle line is now blank instead of reading `NA`, which is often what downstream tools expect.

### Change the line separator

**The `sep` argument lets you write CRLF endings or pack values onto one line.** Pass `"\r\n"` for Windows-style endings, or a tab to keep everything on a single row.

```r title="Use a tab as the separator"
write_lines(c("row1", "row2", "row3"), out, sep = "\t")

read_file(out)
#> [1] "row1\trow2\trow3\t"
```

Note that `sep` is appended after *every* element, including the last, so the file ends with a trailing separator.

[KEY INSIGHT]
**write_lines() is a vector-to-text bridge, not a table writer.** It maps one vector element to one line and nothing more. The moment your data has columns, switch to `write_csv()` or `write_tsv()`, which preserve that structure.

## write_lines() vs writeLines() and other writers

**base R already has `writeLines()`, so why use the readr version?** `write_lines()` is faster on large vectors, returns its input invisibly so it works in pipes, and supports `append` and `na` directly. The table below shows where each writer fits.

| Function | Writes | Output shape | Returns |
|---|---|---|---|
| `write_lines()` | character vector | one element per line | `x` (invisibly) |
| `writeLines()` | character vector | one element per line | `NULL` |
| `write_csv()` | data frame | rectangular CSV | `x` (invisibly) |
| `write_file()` | single string | one unbroken blob | `x` (invisibly) |

The decision rule is simple. Use `write_lines()` for a vector of strings, `write_csv()` or `write_tsv()` for a data frame, and `write_file()` when you have one long string that should not be split by newlines.

[NOTE]
**Coming from Python?** `write_lines(x, "out.txt")` is the rough equivalent of `open("out.txt", "w").writelines(line + "\n" for line in x)`. readr appends the separator for you, so you never add `"\n"` to the values yourself.

## Common pitfalls

**A few small mistakes account for most write_lines() surprises.** Watch for these.

**Silent overwrite.** With the default `append = FALSE`, calling `write_lines()` on an existing path replaces the whole file with no warning. If you meant to add lines, pass `append = TRUE` explicitly.

**The old `path` argument.** On readr 1.4.0 and later, naming the destination `path` raises an error.

```r title="The old path argument fails"
# write_lines(fruits, path = out)
#> Error in write_lines(fruits, path = out): unused argument (path = out)

# Fix: use the current argument name
write_lines(fruits, file = out)
```

**Factors write their labels, not codes.** Passing a factor coerces it with `as.character()`, so you get the labels. If you actually wanted the integer codes, convert with `as.integer()` first.

## Try it yourself

**Try it:** Write the three strings `"red"`, `"green"`, `"blue"` to a temporary file, then append `"yellow"` to it. Read the file back and save the result to `ex_colors`.

```r title="Your turn: write and append lines"
# Try it: write three lines, then append one
ex_file <- tempfile(fileext = ".txt")
ex_colors <- # your code here

ex_colors
#> Expected: 4 values ending in "yellow"
```

<details>
<summary>Click to reveal solution</summary>

```r title="Solution"
ex_file <- tempfile(fileext = ".txt")
write_lines(c("red", "green", "blue"), ex_file)
write_lines("yellow", ex_file, append = TRUE)
ex_colors <- read_lines(ex_file)
ex_colors
#> [1] "red"    "green"  "blue"   "yellow"
```

**Explanation:** The first `write_lines()` creates the file with three lines. The second call uses `append = TRUE` to add a fourth line instead of overwriting. `read_lines()` returns all four values.

</details>

## Related readr functions

**write_lines() sits in a family of readr input and output functions.** These are the ones you will pair with it most often:

- [read_lines()](readr-read_lines-in-R.html) reads a text file back into a character vector.
- [write_csv()](readr-write_csv-in-R.html) writes a data frame as comma-separated values.
- [write_tsv()](readr-write_tsv-in-R.html) writes a data frame with tab separators.
- [write_delim()](readr-write_delim-in-R.html) writes a data frame with any delimiter you choose.
- [write_rds()](readr-write_rds-in-R.html) saves an R object in binary form, preserving its exact structure.

For the complete argument reference, see the official [readr write_lines documentation](https://readr.tidyverse.org/reference/read_lines.html).

## FAQ

**What is the difference between write_lines() and writeLines()?**

Both write a character vector with one element per line. `write_lines()` from readr is faster on large vectors, returns its input invisibly so it can be used inside a pipe, and exposes `append` and `na` arguments directly. Base R's `writeLines()` returns `NULL` and has no `append` argument, so adding to a file means opening a connection yourself. For tidyverse code, prefer `write_lines()`.

**Does write_lines() add a newline at the end of the file?**

Yes. The `sep` string, `"\n"` by default, is appended after every element including the last one. The file therefore ends with a trailing newline, which is the standard convention for text files on Unix systems. When you read it back with `read_lines()`, that trailing newline does not produce an extra empty element.

**How do I append lines to an existing file with write_lines()?**

Pass `append = TRUE`. With this set, `write_lines()` adds your new values after the existing content instead of replacing the file. If the file does not exist yet, it is created. This makes it straightforward to build a log file incrementally across multiple calls without reading and rewriting the whole file each time.

**Can write_lines() write a numeric vector?**

Yes. Non-character input is coerced with `as.character()` before writing, so `write_lines(1:5, "n.txt")` produces five lines of digits. To be explicit and avoid surprises with factors or dates, wrap the input in `as.character()` yourself. For numbers needing specific formatting, call `format()` or `sprintf()` first.

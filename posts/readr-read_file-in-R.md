---
title: "readr read_file() in R: Read a Whole File Into a String"
slug: readr-read_file-in-R
description: "Learn how readr's read_file() in R loads an entire file into a single character string. Syntax, examples, read_file vs read_lines, and common pitfalls."
keywords: "readr read_file, read_file function R, readr read_file examples, R read file into string, read whole file R, read_file vs read_lines, readr read text file"
mathjax: false
webr: true
date: "2026-05-16"
post_type: PSEO
category_id: function-deep
subcategory_id: readr--readxl--haven
fr_parent: Importing-Data-in-R.html
auto_link_terms: "read_file()|readr read_file|readr::read_file()|read whole file into a string|read_file in R"
auto_link_case_sensitive: true
target_keyword: "readr read_file"
sibling_block_enabled: true
difficulty: Beginner
---

# readr read_file() in R: Read a Whole File Into a String

<p class="lead">The readr <code>read_file()</code> function in R reads an entire file into a single character string, keeping every line break and space intact. It is the fastest way to pull a whole text file into one object you can search, parse, or print.</p>

[QUICK ANSWER]
read_file("notes.txt")              # whole file as one string
read_file_raw("notes.txt")          # whole file as a raw vector
read_file("data.csv.gz")            # auto-decompresses .gz/.zip/.bz2
read_file("https://site.com/x.txt") # auto-downloads from a URL
read_lines("notes.txt")             # one element per line instead
write_file(txt, "out.txt")          # write a string back to disk
nchar(read_file("notes.txt"))       # length of file contents in chars

[DECISION TREE: Is read_file() the right tool?]
- read a whole file as one string: read_file("notes.txt")
- read a file line by line: read_lines("notes.txt")
- read binary or unknown encoding: read_file_raw("notes.txt")
- read tabular CSV data: read_csv("data.csv")
- read a saved R object: read_rds("model.rds")
- write a string to a file: write_file(txt, "out.txt")

## What read_file() does in one sentence

**read_file() collapses a whole file into one string.** Unlike functions that return a row per record, it hands back a length-one character vector containing every byte of the file, newlines and all. That makes it the right choice when the file is not tabular: a log you want to grep, an HTML page, a template, or free-form text you plan to parse yourself.

The example below writes a small file into the session, then reads it back. Every later block reuses these files, so run them in order.

```r title="Create a sample text file"
library(readr)

# Write a three-line file into the session
write_file("Line one\nLine two\nLine three\n", "notes.txt")

list.files(pattern = "notes")
#> [1] "notes.txt"
```

## read_file() syntax and arguments

**The signature is short.** `read_file()` takes just two arguments, and you will rarely touch the second one.

```r title="The read_file function signature"
# read_file(file, locale = default_locale())
```

| Argument | What it controls |
|----------|------------------|
| `file` | Path, connection, URL, or literal data to read. Compressed files (`.gz`, `.bz2`, `.xz`, `.zip`) are decompressed automatically. |
| `locale` | Controls encoding, decimal marks, and time zone. Pass `locale(encoding = "latin1")` for non-UTF-8 files. |

A path is the common case, but `file` also accepts an `http://` or `https://` URL, which `read_file()` downloads before reading. The companion `read_file_raw()` takes only `file` and returns a raw vector instead of a string.

[NOTE]
**Coming from Python pandas?** The equivalent of `read_file()` is plain `open(path).read()`. There is no pandas call because the result is not a DataFrame, just text.

## read_file() examples by use case

**Reading the file is one line.** Pass the path and store the result. The return value is always a character vector of length one.

```r title="Read the whole file into a string"
contents <- read_file("notes.txt")

contents
#> [1] "Line one\nLine two\nLine three\n"

length(contents)
#> [1] 1
nchar(contents)
#> [1] 29
```

**Use read_file_raw() for binary or unknown encoding.** It returns a raw vector of bytes, which is safe for images, PDFs, or text whose encoding you have not confirmed.

```r title="Read a file as a raw vector"
raw_bytes <- read_file_raw("notes.txt")

head(raw_bytes, 8)
#> [1] 4c 69 6e 65 20 6f 6e 65
class(raw_bytes)
#> [1] "raw"
```

**Once you have the string, ordinary string tools take over.** Because the file is now a single value, you can split it, search it, or pull pieces out with base R or stringr.

```r title="Process the string after reading"
contents <- read_file("notes.txt")

# Split back into lines on the newline character
strsplit(contents, "\n")[[1]]
#> [1] "Line one"   "Line two"   "Line three"

# Does the file mention a word?
grepl("two", contents)
#> [1] TRUE
```

**write_file() is the round trip.** It writes a string straight to disk, so `read_file()` and `write_file()` form a matched pair for whole-file work.

```r title="Write a string back to a file"
report <- "Title\n\nSummary text goes here.\n"
write_file(report, "report.txt")

read_file("report.txt")
#> [1] "Title\n\nSummary text goes here.\n"
```

## read_file() vs read_lines() vs read_csv()

**The three readr readers differ only in shape.** They all open the same file; they hand it back structured differently. Picking the wrong one means extra cleanup later.

```r title="Compare read_file with read_lines"
one_string  <- read_file("notes.txt")
line_vector <- read_lines("notes.txt")

length(one_string)
#> [1] 1
length(line_vector)
#> [1] 3
```

| Function | Returns | Best for |
|----------|---------|----------|
| `read_file()` | One string, length 1 | Templates, logs, HTML, free text to parse yourself |
| `read_lines()` | Character vector, one element per line | Line-oriented files where each line is a record |
| `read_csv()` | A tibble (data frame) | Rectangular comma-separated data |

[TIP]
**Reach for read_file() only when the file is not tabular.** If the data has rows and columns, `read_csv()` or `read_delim()` will parse types and headers for you, saving a manual cleanup step.

## Common pitfalls

**read_file() keeps the trailing newline.** Most text files end with a final `\n`, and `read_file()` preserves it. A string comparison that ignores this will fail unexpectedly.

```r title="Trailing newline is preserved"
txt <- read_file("notes.txt")
endsWith(txt, "\n")
#> [1] TRUE

# Trim it when you need an exact match
trimws(txt)
#> [1] "Line one\nLine two\nLine three"
```

[WARNING]
**read_file() loads the whole file into memory at once.** For a multi-gigabyte log this can exhaust RAM. When the file is large and line-oriented, stream it with `read_lines_chunked()` instead of reading it all in one call.

A second trap is encoding. If non-ASCII characters come back garbled, the file is probably not UTF-8. Pass an explicit locale, for example `read_file("data.txt", locale = locale(encoding = "latin1"))`, or fall back to `read_file_raw()` and decode the bytes yourself.

## Try it yourself

**Try it:** Read `notes.txt` into a string, then count how many characters it holds after the trailing newline is removed. Save the count to `ex_count`.

```r title="Your turn: count file characters"
# Try it: read notes.txt and count trimmed characters
ex_count <- # your code here

ex_count
#> Expected: 28
```

<details>
<summary>Click to reveal solution</summary>

```r title="Solution"
ex_count <- nchar(trimws(read_file("notes.txt")))
ex_count
#> [1] 28
```

**Explanation:** `read_file()` returns the 29-character string including the final newline. `trimws()` strips that newline, leaving 28 characters, and `nchar()` measures the result.

</details>

## Related readr functions

These functions cover the file-reading jobs that `read_file()` does not:

- `read_lines()` reads a file into a vector with one element per line.
- `read_file_raw()` reads a file into a raw vector of bytes.
- `read_csv()` reads comma-separated tabular data into a tibble.
- `read_rds()` restores a saved R object from an `.rds` file.
- `write_file()` writes a single string back to disk.

For the bigger picture of getting data into R, see the [Importing Data in R](Importing-Data-in-R.html) guide. The official reference is the [readr read_file() documentation](https://readr.tidyverse.org/reference/read_file.html).

## FAQ

**What is the difference between read_file() and read_lines()?**

`read_file()` returns the entire file as one character string with newlines embedded inside it. `read_lines()` splits the file on newline characters and returns a character vector with one element per line. Use `read_file()` when you want to treat the file as a single block of text, and `read_lines()` when each line is a separate record you want to loop over or filter.

**Can read_file() read a file from a URL?**

Yes. If the `file` argument starts with `http://`, `https://`, `ftp://`, or `ftps://`, `read_file()` downloads the file first and then reads it. Remote files that are also gzip compressed are downloaded and decompressed in one step, so `read_file("https://site.com/data.txt.gz")` works without any manual handling.

**How is read_file() different from base R readLines()?**

Base `readLines()` returns a character vector of lines, similar to `read_lines()`, not a single string. `read_file()` has no base R equivalent that returns one string directly; the closest base approach is `paste(readLines(path), collapse = "\n")`. `read_file()` is also faster and handles compression and encoding through the `locale` argument.

**Does read_file() work on large files?**

It works, but it reads the whole file into memory at once. For files of a few megabytes that is fine. For very large logs, reading everything into one string can exhaust RAM, so prefer `read_lines_chunked()` or a streaming approach when files run into the gigabytes.

**How do I read a file with a non-UTF-8 encoding?**

Pass a `locale` that names the encoding. For a Latin-1 file, call `read_file("data.txt", locale = locale(encoding = "latin1"))`. If you do not know the encoding, read the raw bytes with `read_file_raw()` and decode them once you have identified the character set.

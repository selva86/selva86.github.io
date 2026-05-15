---
title: "readr write_tsv() in R: Export Data to TSV Files"
slug: readr-write_tsv-in-R
description: "Use readr write_tsv() in R to export data frames to tab-separated TSV files. Covers syntax, the na and append arguments, write_tsv vs write.table, and pitfalls."
keywords: "readr write_tsv, write_tsv function R, readr write_tsv examples, R write tsv file, write tab separated file R, export data frame to tsv R, write_tsv vs write_delim"
mathjax: false
webr: true
date: 2026-05-16
post_type: PSEO
category_id: function-deep
subcategory_id: readr--readxl--haven
fr_parent: Importing-Data-in-R.html
auto_link_terms: "write_tsv()|readr write_tsv|readr::write_tsv()|write a TSV file|write_tsv function"
auto_link_case_sensitive: true
target_keyword: readr write_tsv
sibling_block_enabled: true
difficulty: Beginner
---

# readr write_tsv() in R: Export Data to TSV Files

<p class="lead">The readr <code>write_tsv()</code> function in R exports a data frame to a tab-separated values (TSV) file. It is fast, never writes row names, and encodes text as UTF-8 so the file reloads cleanly.</p>

[QUICK ANSWER]
write_tsv(df, "out.tsv")                    # basic export
write_tsv(df, "out.tsv", na = "NA")         # set missing-value string
write_tsv(df, "out.tsv", append = TRUE)     # add rows, no header
write_tsv(df, "out.tsv", col_names = FALSE) # omit the header row
write_tsv(df, "out.tsv.gz")                 # gzip-compressed output
write_tsv(df, "out.tsv", quote = "needed")  # quote only when required
write_tsv(df, "out.tsv", eol = "\r\n")      # Windows line endings

[DECISION TREE: Is write_tsv() the right tool?]
- export a data frame as tab-separated: write_tsv(df, "out.tsv")
- export as comma-separated instead: write_csv(df, "out.csv")
- pick a custom delimiter (pipe, semicolon): write_delim(df, "f.txt", delim = "|")
- save for fast R-only reload: write_rds(df, "out.rds")
- write to an Excel .xlsx workbook: writexl::write_xlsx(df, "out.xlsx")
- write plain text lines, not a table: write_lines(x, "out.txt")

## What write_tsv() does

**write_tsv() saves a data frame as a tab-delimited text file.** You pass a data frame and a file path, and readr writes one row per record with columns separated by tab characters. It is the tab-separated cousin of `write_csv()`, built for tools and pipelines that expect TSV rather than CSV.

TSV is a popular interchange format because tab delimiters rarely collide with the data itself. Commas appear inside addresses and free text constantly, but literal tabs almost never do. That makes TSV a safer choice when your columns hold messy strings.

```r title="Write a data frame to TSV"
library(readr)

# Export the built-in mtcars data to a tab-separated file
write_tsv(mtcars, "cars.tsv")

# Confirm the file was created
file.exists("cars.tsv")
#> [1] TRUE
```

The call returns the data frame invisibly, so it works inside a pipe without breaking the chain. The file lands in the working directory unless you give an absolute path.

[KEY INSIGHT]
**A TSV file is just a text file with tab separators.** Once you internalize that, every argument below (na, append, quote, eol) is simply a rule for how each cell becomes text. `write_tsv()` is `write_delim()` with the delimiter pre-set to `"\t"`.

## Syntax and key arguments

**write_tsv() shares its full argument list with write_csv() and write_delim().** Only the delimiter is fixed. The signature is:

```r title="write_tsv function signature"
write_tsv(
  x,
  file,
  na = "NA",
  append = FALSE,
  col_names = !append,
  quote = c("needed", "all", "none"),
  escape = c("double", "backslash", "none"),
  eol = "\n",
  num_threads = readr_threads(),
  progress = show_progress()
)
```

The arguments you will actually reach for:

- **x** the data frame or tibble to write. Required.
- **file** the output path. Required. An `.gz`, `.bz2`, `.xz`, or `.zip` extension triggers automatic compression.
- **na** the string written for `NA` values. Defaults to `"NA"`.
- **append** if `TRUE`, rows are added to an existing file instead of overwriting it.
- **col_names** whether to write the header row. Defaults to `!append`, so a fresh file gets headers and an appended write does not.
- **quote** when to wrap values in double quotes. `"needed"` (the default) quotes only cells that contain a tab, quote, or newline.

[NOTE]
**`path` was renamed to `file` in readr 1.4.0.** Old tutorials still show `write_tsv(df, path = "out.tsv")`. That still works but prints a deprecation warning. Use `file =` in new code.

## write_tsv() examples

**Each example below changes one argument so you can see its effect.** All of them use built-in datasets, and you can run and edit every block on this page.

Read the raw lines back to confirm the tab delimiters are really there:

```r title="Inspect the tab-separated output"
# Show the first three lines of the file
cat(readLines("cars.tsv", n = 3), sep = "\n")
#> mpg	cyl	disp	hp	drat	wt	qsec	vs	am	gear	carb
#> 21	6	160	110	3.9	2.62	16.46	0	1	4	4
#> 21	6	160	110	3.9	2.875	17.02	0	1	4	4
```

Control how missing values appear with the `na` argument. Some downstream tools expect an empty cell, others a sentinel word:

```r title="Set the missing-value string"
df <- data.frame(id = 1:3, score = c(95, NA, 88))

write_tsv(df, "scores.tsv", na = "MISSING")
cat(readLines("scores.tsv"), sep = "\n")
#> id	score
#> 1	95
#> 2	MISSING
#> 3	88
```

Add new rows to a file that already exists by setting `append = TRUE`. Because `col_names` defaults to `!append`, the header is not repeated:

```r title="Append rows to an existing file"
more <- data.frame(id = 4:5, score = c(70, 81))

write_tsv(more, "scores.tsv", append = TRUE)
cat(readLines("scores.tsv"), sep = "\n")
#> id	score
#> 1	95
#> 2	MISSING
#> 3	88
#> 4	70
#> 5	81
```

Compress the output on the fly by ending the file name with `.gz`. readr detects the extension and gzips the file, which can shrink a wide numeric table dramatically:

```r title="Write a compressed TSV file"
write_tsv(iris, "iris.tsv.gz")

file.exists("iris.tsv.gz")
#> [1] TRUE
```

No extra package or unzip step is needed. `read_tsv("iris.tsv.gz")` reads it straight back.

## write_tsv() vs write.table() and alternatives

**write_tsv() is the readr way to write TSV; base R offers write.table().** The table below shows when each tool fits.

| Function | Package | Best for | Watch out for |
|---|---|---|---|
| `write_tsv()` | readr | Standard TSV export | No row names by design |
| `write.table()` | base R | No-dependency scripts | Needs `sep`, `row.names`, `quote` set by hand |
| `write_delim()` | readr | Any custom delimiter | Must pass `delim` explicitly |
| `fwrite()` | data.table | Very large tables, top speed | `sep = "\t"` required |
| `vroom_write()` | vroom | Huge files, lazy writing | Extra dependency |

The decision rule is short. Use `write_tsv()` for everyday tab-separated output. Reach for `fwrite(sep = "\t")` only when files are large enough that write speed matters. Use `write.table()` only when you cannot add a package dependency.

```r title="The base R equivalent of write_tsv()"
# These two produce a comparable TSV file
write_tsv(mtcars, "readr_way.tsv")
write.table(mtcars, "base_way.tsv",
            sep = "\t", row.names = FALSE, quote = FALSE)
```

[TIP]
**`write_tsv()` always drops row names; `write.table()` keeps them unless told not to.** That single difference causes most TSV column-misalignment bugs. With base R, always pass `row.names = FALSE` for a clean export.

## Common pitfalls

**Most write_tsv() problems trace back to three mistakes.** Each has a quick fix.

**Appending a data frame with a different column order.** `append = TRUE` writes rows positionally, not by name. If `more` has its columns in a different order than the original file, values land in the wrong columns silently. Always reorder columns to match before appending.

**Expecting Excel to open a .tsv file directly.** Double-clicking a `.tsv` file often opens it in a text editor, not Excel. Rename the file to `.txt` and use Excel's text import, or write an actual workbook with `writexl::write_xlsx()`.

**Assuming the file extension changes the format.** `write_tsv(df, "data.csv")` still writes tab-separated content; the `.csv` name is misleading but the delimiter stays a tab. Match the extension to the real format to avoid confusing collaborators.

## Try it yourself

**Try it:** Export only the setosa rows of `iris` to a tab-separated file called `setosa.tsv`, then count the lines written. Save the row count to `ex_lines`.

```r title="Your turn: write a filtered TSV"
# Try it: write the setosa subset to TSV
setosa <- subset(iris, Species == "setosa")
# write setosa to "setosa.tsv" here

ex_lines <- length(readLines("setosa.tsv"))
ex_lines
#> Expected: 51
```

<details>
<summary>Click to reveal solution</summary>

```r title="Solution"
setosa <- subset(iris, Species == "setosa")
write_tsv(setosa, "setosa.tsv")

ex_lines <- length(readLines("setosa.tsv"))
ex_lines
#> [1] 51
```

**Explanation:** `iris` has 50 setosa rows. `write_tsv()` adds one header line, so the file holds 51 lines in total.

</details>

## Related readr functions

**write_tsv() belongs to a family of readr writers.** These functions cover the rest of the export surface:

- [write_csv()](readr-write_csv-in-R.html) writes comma-separated files.
- [write_delim()](readr-write_delim-in-R.html) writes any delimiter you choose.
- [write_rds()](readr-write_rds-in-R.html) saves an R object in native binary form.
- [write_lines()](readr-write_lines-in-R.html) writes a character vector, one line per element.
- [read_tsv()](readr-read_tsv-in-R.html) reads a TSV file back into a tibble.

For the full readr reference, see the [official write_delim documentation](https://readr.tidyverse.org/reference/write_delim.html).

## FAQ

**What is the difference between write_tsv() and write_csv()?**

They are the same function with a different delimiter. `write_tsv()` separates columns with a tab character, while `write_csv()` uses a comma. Choose TSV when your text columns contain commas, since tabs almost never appear inside data values. Both functions share every other argument, drop row names, and encode output as UTF-8, so switching between them is just a matter of which separator your downstream tool expects.

**How do I write a TSV file without the header row?**

Set `col_names = FALSE` in the call: `write_tsv(df, "out.tsv", col_names = FALSE)`. This writes only the data rows. Note that when you use `append = TRUE`, `col_names` already defaults to `FALSE`, so appended writes skip the header automatically. You only need to set it explicitly when writing a fresh headerless file.

**Does write_tsv() add a .tsv extension automatically?**

No. `write_tsv()` writes to the exact path you supply and never changes the extension. If you call `write_tsv(df, "data")`, the file is named `data` with no extension. Always include `.tsv` in the file name yourself so collaborators and other programs recognize the format correctly.

**How do I write a compressed TSV file?**

End the file name with a compression extension and readr handles it. `write_tsv(df, "out.tsv.gz")` produces a gzip-compressed file, and `.bz2`, `.xz`, and `.zip` work the same way. No separate compression step is needed, and `read_tsv()` decompresses the file automatically when you read it back.

**Can write_tsv() append to an existing file?**

Yes. Pass `append = TRUE` and the new rows are added to the end of the file without rewriting the header. Make sure the appended data frame has the same columns in the same order as the original file, because `write_tsv()` matches columns by position, not by name, when appending.

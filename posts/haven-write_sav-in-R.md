---
title: "haven write_sav() in R: Export Data Frames to SPSS Files"
slug: haven-write_sav-in-R
description: "Use haven write_sav() in R to export a data frame to an SPSS .sav file. See the syntax, the compress argument, runnable examples, and common pitfalls."
keywords: "haven write_sav, write_sav function R, haven write_sav examples, write SPSS file R, export data frame to SPSS R, save sav file R, write_sav R"
mathjax: false
webr: true
date: 2026-05-16
post_type: PSEO
category_id: function-deep
subcategory_id: readr--readxl--haven
fr_parent: Importing-Data-in-R.html
auto_link_terms: "write_sav()|haven write_sav|haven::write_sav()|write SPSS file|write_sav|export to SPSS file"
auto_link_case_sensitive: true
target_keyword: "haven write_sav"
sibling_block_enabled: true
difficulty: Beginner
---

# haven write_sav() in R: Export Data Frames to SPSS Files

<p class="lead">The haven write_sav() function exports an R data frame to an SPSS .sav file in one line of code, carrying variable labels and value labels across with it. Because the SPSS format is openly understood, files written this way open reliably in SPSS itself.</p>

[QUICK ANSWER]
library(haven)                               # load the package
write_sav(df, "data.sav")                    # write a .sav file
write_sav(df, "data.sav", compress = "zsav") # smaller ZSAV file
write_sav(df, "data.sav", compress = "none") # uncompressed file
read_sav("data.sav")                         # read the file back in
write_dta(df, "data.dta")                    # Stata instead of SPSS
write_sas(df, "data.sas7bdat")               # SAS instead of SPSS

[DECISION TREE: Is write_sav() the right tool?]
- write a .sav file from R: write_sav(df, "data.sav")
- need a smaller compressed file: write_sav(df, p, compress = "zsav")
- export to Stata instead: write_dta(df, "data.dta")
- export to SAS instead: write_sas(df, "data.sas7bdat")
- read an existing SPSS file: read_sav("data.sav")
- plain text for any tool: write.csv(df, "data.csv")

## What write_sav() does

**write_sav() writes an R data frame to an SPSS data file.** It belongs to the haven package, which bridges R and the binary formats used by SPSS, SAS, and Stata. You pass a data frame and a destination path ending in `.sav`, and haven serializes the data, the column types, and any variable or value labels into one SPSS-native file. Unlike the proprietary SAS format, the SPSS `.sav` layout is well understood, so files that write_sav() produces open dependably in SPSS, PSPP, and other SPSS-compatible tools.

## write_sav() syntax

**The function takes three arguments, two of them required.** The signature is `write_sav(data, path, compress = c("byte", "none", "zsav"))`. The `data` argument is the data frame or tibble you want to export, `path` is the file path where the `.sav` file is written, and `compress` controls how the bytes are packed on disk. write_sav() returns the input data invisibly, so it slots into a pipe without breaking the chain.

Column types map to SPSS predictably. Numeric and integer columns become SPSS numeric variables, character columns become SPSS string variables, and `labelled` columns carry both their variable label and value labels across. Factors are converted to labelled numeric vectors, so the level text survives as value labels rather than as an R factor.

## Export a data frame to an SPSS file

**A single call writes the file to disk.** Start by loading haven and building a small data frame to export.

```r title="Load haven and inspect data"
library(haven)

df <- data.frame(
  id    = 1:5,
  group = c("A", "B", "A", "B", "A"),
  score = c(91, 84, 78, 88, 95)
)
df
#>   id group score
#> 1  1     A    91
#> 2  2     B    84
#> 3  3     A    78
#> 4  4     B    88
#> 5  5     A    95
```

Pass that data frame and a path to write_sav(). Writing to `tempdir()` keeps the example self-contained and avoids cluttering your working directory.

```r title="Export a data frame to sav"
path <- file.path(tempdir(), "scores.sav")
write_sav(df, path)

file.exists(path)
#> [1] TRUE
```

Read it back with `read_sav()` to confirm the round trip preserved every column.

```r title="Read the SPSS file back in"
back <- read_sav(path)
back
#> # A tibble: 5 x 3
#>      id group score
#>   <dbl> <chr> <dbl>
#> 1     1 A        91
#> 2     2 B        84
#> 3     3 A        78
#> 4     4 B        88
#> 5     5 A        95
```

The real strength of `.sav` is metadata. Attach a variable label with `attr()` and a value-label map with `labelled()`, and write_sav() stores both inside the file.

```r title="Export columns with variable labels"
labeled <- data.frame(age = c(34, 52, 29), region = c(1, 2, 1))
attr(labeled$age, "label") <- "Age in years"
labeled$region <- labelled(labeled$region, c(North = 1, South = 2))

write_sav(labeled, file.path(tempdir(), "labeled.sav"))
attr(read_sav(file.path(tempdir(), "labeled.sav"))$age, "label")
#> [1] "Age in years"
```

[TIP]
**Always round-trip test your export.** Read the file back with read_sav() right after writing it. If the columns, types, and labels all match, haven serialized the data correctly, and you caught any problem before handing the file to an SPSS user.

## Choosing a compression mode

**The compress argument trades file size against compatibility.** It accepts three values. `"byte"` is the default and applies the standard SAV byte compression that every SPSS version reads. `"none"` writes an uncompressed file, the largest option, useful only when a downstream tool struggles with compressed input. `"zsav"` writes a ZSAV file that is far smaller, but it requires SPSS 21 or newer to open.

```r title="Compare compression modes"
big <- data.frame(
  group = rep(c("A", "B", "C", "D"), 2500),
  value = rep(1:5, 2000)
)
byte_path <- file.path(tempdir(), "byte.sav")
zsav_path <- file.path(tempdir(), "zsav.sav")
write_sav(big, byte_path)
write_sav(big, zsav_path, compress = "zsav")

file.size(zsav_path) < file.size(byte_path)
#> [1] TRUE
```

The table below summarizes when to reach for each mode.

| compress value | File written | SPSS support | Use when |
|---|---|---|---|
| `"byte"` | Compressed `.sav` | All versions | The default, safe for any recipient |
| `"none"` | Uncompressed `.sav` | All versions | A tool rejects compressed SAV input |
| `"zsav"` | Compressed `.zsav` | SPSS 21 and newer | File size matters and the recipient is current |

[KEY INSIGHT]
**Pick compression by who opens the file, not by how small it is.** ZSAV can shrink a large data set dramatically, but a recipient on SPSS 20 or earlier cannot open it at all. When you do not know the recipient's version, the default `"byte"` mode is the only choice that never fails.

## Common pitfalls

**Three mistakes account for most surprising write_sav() results.**

1. **Factors do not return as factors.** A factor column is exported as a labelled numeric variable, so `read_sav()` reads it back as `haven_labelled`, not `factor`. Use `as_factor()` after reading if you need an R factor.
2. **ZSAV files fail on old SPSS.** A `compress = "zsav"` file silently excludes anyone running SPSS 20 or earlier. Default to `"byte"` unless every recipient is current.
3. **Invalid variable names get rewritten.** SPSS names cannot contain spaces and must start with a letter. haven sanitizes offending names on export, so clean them with `make.names()` first if you want predictable results.

The factor pitfall is the one that catches most users.

```r title="Factors return as labelled vectors"
df2 <- data.frame(grade = factor(c("low", "high", "low")))
sav <- file.path(tempdir(), "grades.sav")
write_sav(df2, sav)

class(read_sav(sav)$grade)
#> [1] "haven_labelled" "vctrs_vctr"     "double"
```

[WARNING]
**Round-tripping a factor changes its class.** write_sav() stores a factor as numeric codes plus value labels, the SPSS-native representation. read_sav() returns those as a labelled double, so code that expects `is.factor()` to be TRUE will break. Convert with `as_factor()` immediately after reading.

## Try it yourself

**Try it:** Export the built-in `mtcars` data frame to a `.sav` file inside `tempdir()`. Save the file path to `ex_path` first, then write the file.

```r title="Your turn: export mtcars"
# Try it: export mtcars to a .sav file
ex_path <- # your code here
write_sav(mtcars, ex_path)

file.exists(ex_path)
#> Expected: TRUE
```

<details>
<summary>Click to reveal solution</summary>

```r title="Solution"
ex_path <- file.path(tempdir(), "mtcars.sav")
write_sav(mtcars, ex_path)
file.exists(ex_path)
#> [1] TRUE
```

**Explanation:** `file.path(tempdir(), ...)` builds a writable path inside the session's temporary directory. write_sav() serializes mtcars to that path, and file.exists() confirms the write succeeded.

</details>

## Related haven functions

**haven exports to every major statistical format.** Once write_sav() is familiar, these siblings cover the rest of the workflow.

- `read_sav()` reads `.sav` files back into R as a tibble.
- `write_dta()` exports a data frame to a Stata `.dta` file.
- `write_sas()` exports a data frame to a SAS `.sas7bdat` file.
- `write_xpt()` writes a SAS transport file that SAS reads reliably.
- `as_factor()` converts labelled columns from a read-back file into R factors.

For the full argument reference, see the [official write_sav() documentation](https://haven.tidyverse.org/reference/read_spss.html).

## FAQ

**How do I export an R data frame to SPSS?**

Load haven, then call `write_sav(df, "path.sav")`. The function takes a data frame and a destination path ending in `.sav`, and writes one SPSS-native file. For a smaller file targeting current SPSS, add `compress = "zsav"`. write_sav() creates the file on disk and returns the data frame invisibly, so it can sit inside a pipe without interrupting the chain.

**Can SPSS open files created by write_sav()?**

Yes. Unlike the SAS `.sas7bdat` format, the SPSS `.sav` specification is well understood, so haven writes files that SPSS, PSPP, and other compatible tools open reliably. The one exception is `compress = "zsav"`: that ZSAV variant needs SPSS 21 or newer. The default `"byte"` mode opens in every SPSS release.

**What is the difference between .sav and .zsav?**

Both are SPSS data files written by write_sav(). A `.sav` file uses standard byte compression and opens in any SPSS version. A `.zsav` file, produced with `compress = "zsav"`, uses stronger ZLIB compression and is much smaller, but it requires SPSS 21 or later. Choose `.zsav` only when file size matters and you know the recipient's version.

**Does write_sav() preserve variable and value labels?**

Yes. Columns with a `label` attribute keep their variable label, and columns built with haven's `labelled()` keep their value labels. Both are written into the `.sav` file and reappear when you call `read_sav()`. This is the main reason to choose `.sav` over a plain CSV: the metadata travels with the data instead of being lost.

**How is write_sav() different from write_dta()?**

Both come from haven and both export a data frame to a binary statistical format. `write_sav()` writes an SPSS `.sav` file, while `write_dta()` writes a Stata `.dta` file. They share label-preservation behavior, but Stata enforces stricter variable-name and string-length rules, so a data frame that exports cleanly with write_sav() may need cleanup before write_dta() accepts it.

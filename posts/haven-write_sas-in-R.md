---
title: "haven write_sas() in R: Export Data Frames to SAS Files"
slug: haven-write_sas-in-R
description: "Use haven write_sas() in R to export a data frame to a SAS .sas7bdat file. See the syntax, runnable examples, common pitfalls, and when to pick write_xpt()."
keywords: "haven write_sas, write_sas function R, haven write_sas examples, write sas7bdat R, export data frame to SAS R, save R data as SAS, write_sas R"
mathjax: false
webr: true
date: 2026-05-16
post_type: PSEO
category_id: function-deep
subcategory_id: readr--readxl--haven
fr_parent: Importing-Data-in-R.html
auto_link_terms: "write_sas()|haven write_sas|haven::write_sas()|write SAS file|write_sas|export to SAS file"
auto_link_case_sensitive: true
target_keyword: "haven write_sas"
sibling_block_enabled: true
difficulty: Beginner
---

# haven write_sas() in R: Export Data Frames to SAS Files

<p class="lead">The haven write_sas() function exports an R data frame to a SAS .sas7bdat file in a single line. Because the SAS format is proprietary, write_xpt() is the more reliable choice when SAS itself must open the file.</p>

[QUICK ANSWER]
library(haven)                           # load the package
write_sas(df, "data.sas7bdat")           # write a .sas7bdat file
write_xpt(df, "data.xpt")                # SAS transport file (reliable)
write_xpt(df, "data.xpt", version = 5)   # legacy SAS 5 transport
read_sas("data.sas7bdat")                # read the file back in
write_dta(df, "data.dta")                # Stata instead of SAS

[DECISION TREE: Is write_sas() the right tool?]
- write .sas7bdat from R: write_sas(df, "data.sas7bdat")
- need SAS to open it reliably: write_xpt(df, "data.xpt")
- export to Stata instead: write_dta(df, "data.dta")
- export to SPSS instead: write_sav(df, "data.sav")
- read an existing SAS file: read_sas("data.sas7bdat")
- plain text for any tool: write.csv(df, "data.csv")

## What write_sas() does

**write_sas() writes an R data frame to a SAS data file.** It belongs to the haven package, which connects R to the binary formats used by SAS, Stata, and SPSS. You pass a data frame and a destination path ending in `.sas7bdat`, and haven serializes the data, column types, and any variable labels into one SAS-native file. Haven builds on the ReadStat C library, so the conversion runs without a SAS installation on your machine.

## write_sas() syntax

**The function takes just two arguments.** The signature is `write_sas(data, path)`. The `data` argument is the data frame or tibble you want to export, and `path` is the file path where the `.sas7bdat` file is written. write_sas() returns the input data invisibly, so you can drop it into a pipe without breaking the chain.

Column types map to SAS predictably. Numeric and integer columns become SAS numeric variables, character columns become SAS character variables, and `labelled` columns carry their value labels across. Factors are converted to character on export, so the levels survive as text but the ordering attribute is lost.

## Export a data frame to a SAS file

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

Pass that data frame and a path to write_sas(). Writing to `tempdir()` keeps the example self-contained and avoids cluttering your working directory.

```r title="Export a data frame to sas7bdat"
path <- file.path(tempdir(), "scores.sas7bdat")
write_sas(df, path)

file.exists(path)
#> [1] TRUE
```

The file now exists on disk. Read it back with `read_sas()` to confirm the round trip preserved every column.

```r title="Read the SAS file back in"
back <- read_sas(path)
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

[TIP]
**Always round-trip test your export.** Read the file back with read_sas() right after writing it. If the columns and types match, haven serialized the data correctly. If they do not, you caught the problem before handing the file to a colleague.

## Why SAS may not open your file

**This is the most important caveat with write_sas().** The `.sas7bdat` format is proprietary and undocumented, so haven reverse-engineers it. Files that write_sas() produces are frequently rejected by SAS itself, even though R and haven read them back without trouble. If the file only travels between R sessions or other ReadStat-based tools, `.sas7bdat` is fine. If a SAS user must open it, use `write_xpt()` instead.

`write_xpt()` writes a SAS transport file (`.xpt`), a format that SAS publicly documents and supports through PROC CIMPORT and the XPORT engine.

```r title="Export with write_xpt for SAS"
xpt_path <- file.path(tempdir(), "scores.xpt")
write_xpt(df, xpt_path, version = 8)

file.exists(xpt_path)
#> [1] TRUE
```

The `version` argument controls compatibility. Setting `version = 8` (the default) allows 32-character variable names, while `version = 5` matches older SAS releases but truncates names to 8 characters.

| Function | Output format | SAS can open it? | Use when |
|---|---|---|---|
| `write_sas()` | `.sas7bdat` | Often not | The consumer is R or another ReadStat-based tool |
| `write_xpt()` | `.xpt` transport | Yes, reliably | SAS itself must read the file |
| `write.csv()` | `.csv` text | Yes, via PROC IMPORT | You want a universal, label-free format |

[KEY INSIGHT]
**The .xpt transport format is the documented interchange standard, not .sas7bdat.** SAS never published the `.sas7bdat` specification, so any third-party writer is guessing. The transport format exists precisely so non-SAS tools can hand data to SAS, which is why write_xpt() succeeds where write_sas() fails.

## Common pitfalls

**Three mistakes account for most failed SAS exports.**

1. **SAS rejects the .sas7bdat file.** The native format is unreliable from R. Switch to `write_xpt()` whenever the file leaves the R ecosystem.
2. **Variable names get truncated.** SAS variable names cap at 32 characters, and `version = 5` transport files cap at 8. Long, descriptive R names are silently shortened.
3. **Unsupported types do not survive.** R `NA` becomes a SAS missing value correctly, but list columns and some date-time classes coerce unexpectedly. Convert them to plain `Date` or numeric columns first.

The truncation pitfall is easy to trigger and easy to miss.

```r title="Variable names get truncated"
wide <- data.frame(a_really_long_descriptive_name = 1:3)
write_xpt(wide, file.path(tempdir(), "wide.xpt"), version = 5)

names(read_xpt(file.path(tempdir(), "wide.xpt")))
#> [1] "A_REALLY"
```

[WARNING]
**Check variable names before exporting to legacy SAS.** A `version = 5` transport file silently clips every name to 8 characters and uppercases it. Two columns that differ only after the eighth character collide into one, and you lose data with no error message.

## Try it yourself

**Try it:** Export the built-in `mtcars` data frame to a `.sas7bdat` file inside `tempdir()`. Save the file path to `ex_path` first, then write the file.

```r title="Your turn: export mtcars"
# Try it: export mtcars to a .sas7bdat file
ex_path <- # your code here
write_sas(mtcars, ex_path)

file.exists(ex_path)
#> Expected: TRUE
```

<details>
<summary>Click to reveal solution</summary>

```r title="Solution"
ex_path <- file.path(tempdir(), "mtcars.sas7bdat")
write_sas(mtcars, ex_path)
file.exists(ex_path)
#> [1] TRUE
```

**Explanation:** `file.path(tempdir(), ...)` builds a writable path inside the session's temporary directory. write_sas() serializes mtcars to that path, and file.exists() confirms the write succeeded.

</details>

## Related haven functions

**haven exports to every major statistical format.** Once write_sas() is familiar, these siblings cover the rest of the workflow.

- `write_xpt()` writes SAS transport (`.xpt`) files that SAS reads reliably.
- `read_sas()` reads `.sas7bdat` files back into R as a tibble.
- `write_dta()` exports a data frame to a Stata `.dta` file.
- `write_sav()` exports a data frame to an SPSS `.sav` file.
- `read_xpt()` reads SAS transport files into R.

For the full argument reference, see the [official write_sas() documentation](https://haven.tidyverse.org/reference/write_sas.html).

## FAQ

**Can SAS open files created by write_sas()?**

Often it cannot. The `.sas7bdat` format is proprietary and undocumented, so haven reverse-engineers the layout. SAS frequently rejects files written this way, even though R reads them back fine. When a SAS user must open your data, export with `write_xpt()` instead, which produces a documented transport file that SAS reads reliably through its XPORT engine.

**What is the difference between write_sas() and write_xpt()?**

`write_sas()` writes a native `.sas7bdat` file, while `write_xpt()` writes a `.xpt` transport file. The transport format is publicly documented, so SAS opens it consistently. The native format is not documented, so haven's best-effort writer often produces files SAS cannot read. Use write_xpt() for handoff to SAS and write_sas() only when the consumer is R.

**How do I export an R data frame to SAS?**

Load haven, then call `write_sas(df, "path.sas7bdat")` for a native file or `write_xpt(df, "path.xpt")` for a transport file. Both take a data frame and a path. For real SAS compatibility, prefer write_xpt(). The function creates the file on disk and returns the data frame invisibly so it can be used inside a pipe.

**Does write_sas() preserve variable labels?**

Yes. Columns created with haven's `labelled` class carry both their variable labels and value labels into the SAS file. Plain numeric and character columns export without labels. Factors are converted to character, so the level text survives but the ordered attribute does not. Round-trip the file with read_sas() to confirm the metadata you expect came through.

**What file extension does write_sas() use?**

write_sas() expects a path ending in `.sas7bdat`, the extension for native SAS data sets. write_xpt() uses `.xpt` for transport files. Using the correct extension matters because downstream tools and SAS engines select their reader based on it. A mismatched extension can leave a file that no program recognizes.

---
title: "haven write_dta() in R: Export Data Frames to Stata"
slug: haven-write_dta-in-R
description: "Use haven write_dta() in R to export a data frame to a Stata .dta file. Covers the syntax, the version argument, runnable examples, and common pitfalls."
keywords: "haven write_dta, write_dta function R, haven write_dta examples, R write Stata file, export data frame to Stata, write dta file R, write_dta version"
mathjax: false
webr: true
date: 2026-05-16
post_type: PSEO
category_id: function-deep
subcategory_id: readr--readxl--haven
fr_parent: Importing-Data-in-R.html
auto_link_terms: "write_dta()|haven write_dta|haven::write_dta()|write Stata file|write_dta|export to Stata file"
auto_link_case_sensitive: true
target_keyword: "haven write_dta"
sibling_block_enabled: true
difficulty: Beginner
---

# haven write_dta() in R: Export Data Frames to Stata

<p class="lead">The haven write_dta() function exports an R data frame to a Stata .dta file in a single line of code, carrying variable labels and value labels into the file with it. The .dta format is openly documented, so files written this way open reliably in Stata 8 and every release after it.</p>

[QUICK ANSWER]
library(haven)                                # load the package
write_dta(df, "data.dta")                     # write a .dta file
write_dta(df, "data.dta", version = 12)       # target an older Stata
write_dta(df, "data.dta", label = "Survey")   # set a data set label
read_dta("data.dta")                          # read the file back in
write_sav(df, "data.sav")                     # SPSS instead of Stata
write_sas(df, "data.sas7bdat")                # SAS instead of Stata

[DECISION TREE: Is write_dta() the right tool?]
- write a .dta file from R: write_dta(df, "data.dta")
- target an older Stata release: write_dta(df, p, version = 12)
- export to SPSS instead: write_sav(df, "data.sav")
- export to SAS instead: write_sas(df, "data.sas7bdat")
- read an existing Stata file: read_dta("data.dta")
- plain text for any tool: write.csv(df, "data.csv")

## What write_dta() does

**write_dta() writes an R data frame to a Stata data file.** It belongs to the haven package, which bridges R and the binary formats used by Stata, SPSS, and SAS. You pass a data frame and a destination path ending in `.dta`, and haven serializes the data, the column types, and any variable or value labels into one Stata-native file. No Stata installation or license is needed on the machine.

Unlike a plain CSV export, a `.dta` file carries a full codebook. Variable labels, value labels such as `1 = "Male"`, and the data set label all live inside the single file. write_dta() stores that metadata in the same call, so the documentation travels with the data instead of being lost.

## write_dta() syntax

**The function takes a data frame, a path, and an optional Stata version.** The signature is `write_dta(data, path, version = 14, label = attr(data, "label"))`. The `data` argument is the data frame or tibble you want to export, `path` is the file path where the `.dta` file is written, `version` sets which Stata release format is used, and `label` is an optional data set label string. write_dta() returns the input data invisibly, so it slots into a pipe without breaking the chain.

Column types map to Stata predictably. Numeric and integer columns become Stata numeric variables, character columns become Stata string variables, and `labelled` columns carry their variable label and value labels across. Factors are converted to labelled numeric vectors, so the level text survives as Stata value labels rather than as an R factor.

[NOTE]
**Coming from Python pandas?** The equivalent of `write_dta(df, "data.dta")` is `df.to_stata("data.dta")`. Both write a Stata-native file, but haven preserves R `labelled` columns as Stata value labels, while pandas maps a categorical column to those labels instead.

## Export a data frame to a Stata file

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

Pass that data frame and a path to write_dta(). Writing to `tempdir()` keeps the example self-contained and avoids cluttering your working directory.

```r title="Export a data frame to dta"
path <- file.path(tempdir(), "scores.dta")
write_dta(df, path)

file.exists(path)
#> [1] TRUE
```

Read it back with `read_dta()` to confirm the round trip preserved every column.

```r title="Read the Stata file back in"
back <- read_dta(path)
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

The real strength of `.dta` is metadata. Attach a variable label with `attr()` and a value-label map with `labelled()`, and write_dta() stores both inside the file.

```r title="Export columns with variable labels"
labeled <- data.frame(age = c(34, 52, 29), region = c(1, 2, 1))
attr(labeled$age, "label") <- "Age in years"
labeled$region <- labelled(labeled$region, c(North = 1, South = 2))

write_dta(labeled, file.path(tempdir(), "labeled.dta"))
attr(read_dta(file.path(tempdir(), "labeled.dta"))$age, "label")
#> [1] "Age in years"
```

[TIP]
**Always round-trip test your export.** Read the file back with read_dta() right after writing it. If the columns, types, and labels all match, haven serialized the data correctly, and you caught any problem before handing the file to a Stata user.

## Choosing a Stata version

**The version argument sets which Stata release can open the file.** It accepts an integer from 8 to 15, and the default of 14 produces a file that Stata 14 and every newer release reads. Lower the number when a colleague runs an older Stata, and the data still round-trips without loss.

```r title="Write for an older Stata version"
old_path <- file.path(tempdir(), "scores_v12.dta")
write_dta(df, old_path, version = 12)

read_dta(old_path)
#> # A tibble: 5 x 3
#>      id group score
#>   <dbl> <chr> <dbl>
#> 1     1 A        91
#> 2     2 B        84
#> 3     3 A        78
#> 4     4 B        88
#> 5     5 A        95
```

The table below shows when to reach for each version.

| `version` value | Stata release | Use when |
|---|---|---|
| `8` to `12` | Stata 8 through 12 | The recipient runs an older Stata release |
| `13` | Stata 13 | Long strings are needed but the reader predates Unicode |
| `14` | Stata 14 and newer | The default, safe for any current Stata |
| `15` | Stata 15 and newer | The data set has more than 32,767 variables |

[KEY INSIGHT]
**Pick the version by who opens the file, not by how new it is.** A lower version number widens compatibility at no cost to the data itself, since write_dta() round-trips the same values either way. When you do not know the recipient's Stata release, drop to `version = 12` and the file opens almost anywhere.

## Common pitfalls

**Three mistakes account for most surprising write_dta() results.**

1. **Factors do not return as factors.** A factor column is exported as a labelled numeric variable, so `read_dta()` reads it back as `haven_labelled`, not `factor`. Use `as_factor()` after reading if you need an R factor.
2. **Variable names must obey Stata rules.** Stata names allow only letters, digits, and underscores, must start with a letter or underscore, and cap at 32 characters. A name with a dot or a space triggers an error, so clean column names with `make.names()` before exporting.
3. **Long strings need a recent version.** Character columns longer than 244 bytes require `version = 13` or newer. Writing them to an older version raises an error rather than truncating silently.

The factor pitfall is the one that catches most users.

```r title="Factors return as labelled vectors"
df2 <- data.frame(grade = factor(c("low", "high", "low")))
dta <- file.path(tempdir(), "grades.dta")
write_dta(df2, dta)

class(read_dta(dta)$grade)
#> [1] "haven_labelled" "vctrs_vctr"     "double"
```

[WARNING]
**Round-tripping a factor changes its class.** write_dta() stores a factor as numeric codes plus value labels, the Stata-native representation. read_dta() returns those as a labelled double, so code that expects `is.factor()` to be TRUE will break. Convert with `as_factor()` immediately after reading.

## Try it yourself

**Try it:** Export the built-in `mtcars` data frame to a `.dta` file inside `tempdir()`. Save the file path to `ex_path` first, then write the file.

```r title="Your turn: export mtcars"
# Try it: export mtcars to a .dta file
ex_path <- # your code here
write_dta(mtcars, ex_path)

file.exists(ex_path)
#> Expected: TRUE
```

<details>
<summary>Click to reveal solution</summary>

```r title="Solution"
ex_path <- file.path(tempdir(), "mtcars.dta")
write_dta(mtcars, ex_path)
file.exists(ex_path)
#> [1] TRUE
```

**Explanation:** `file.path(tempdir(), ...)` builds a writable path inside the session's temporary directory. write_dta() serializes mtcars to that path, and file.exists() confirms the write succeeded.

</details>

## Related haven functions

**haven exports to every major statistical format.** Once write_dta() is familiar, these siblings cover the rest of the workflow.

- `read_dta()` reads a `.dta` file back into R as a tibble.
- `write_sav()` exports a data frame to an SPSS `.sav` file.
- `write_sas()` exports a data frame to a SAS `.sas7bdat` file.
- `write_xpt()` writes a SAS transport file that SAS reads reliably.
- `as_factor()` converts labelled columns from a read-back file into R factors.

For the full argument reference, see the [official write_dta() documentation](https://haven.tidyverse.org/reference/read_dta.html).

## FAQ

**How do I export an R data frame to Stata?**

Load haven, then call `write_dta(df, "path.dta")`. The function takes a data frame and a destination path ending in `.dta`, and writes one Stata-native file. To target an older Stata release, add a `version` argument such as `version = 12`. write_dta() creates the file on disk and returns the data frame invisibly, so it can sit inside a pipe without interrupting the chain.

**Can Stata open files created by write_dta()?**

Yes. The Stata `.dta` specification is openly documented, so haven writes files that Stata opens reliably. By default write_dta() uses `version = 14`, which Stata 14 and every newer release read. If the recipient runs an older Stata, set a lower version number, for example `version = 12`, and the file opens there too.

**What does the version argument in write_dta() do?**

The `version` argument selects which Stata file format is written, using an integer from 8 to 15. A higher number unlocks newer features such as Unicode text and long strings, while a lower number widens compatibility with older Stata installations. The data values themselves round-trip identically regardless of version, so choose the number based on the recipient's Stata release.

**Does write_dta() preserve variable and value labels?**

Yes. Columns with a `label` attribute keep their variable label, and columns built with haven's `labelled()` keep their value labels. Both are written into the `.dta` file and reappear when you call `read_dta()`. This is the main reason to choose `.dta` over a plain CSV: the metadata travels with the data instead of being discarded.

**How is write_dta() different from write_sav()?**

Both come from haven and both export a data frame to a binary statistical format. `write_dta()` writes a Stata `.dta` file with a `version` argument, while `write_sav()` writes an SPSS `.sav` file with a `compress` argument. They share label-preservation behavior, but Stata enforces stricter variable-name rules, so a data frame that exports cleanly with write_sav() may need name cleanup before write_dta() accepts it.
</content>
</invoke>

---
title: "haven read_dta() in R: Import Stata .dta Files"
slug: haven-read_dta-in-R
description: "Learn haven read_dta() in R to import Stata .dta files into tibbles. Covers syntax, the encoding argument, value labels, column selection, and common errors."
keywords: "haven read_dta, read_dta function R, haven read_dta examples, R read Stata file, import .dta file in R, read Stata data into R, read_dta tibble"
mathjax: false
webr: true
date: 2026-05-16
post_type: PSEO
category_id: function-deep
subcategory_id: readr--readxl--haven
fr_parent: Importing-Data-in-R.html
auto_link_terms: "read_dta()|haven read_dta|haven::read_dta()|read Stata files in R|import Stata data into R"
auto_link_case_sensitive: true
target_keyword: "haven read_dta"
sibling_block_enabled: true
difficulty: Beginner
---

# haven read_dta() in R: Import Stata .dta Files

<p class="lead">The haven read_dta() function imports a Stata .dta file into an R tibble. It reads every Stata version directly, needs no Stata installation, and keeps the variable and value labels stored inside the file.</p>

[QUICK ANSWER]
read_dta("data.dta")                            # read a Stata .dta file
read_stata("data.dta")                          # identical alias of read_dta()
read_dta("data.dta", col_select = c(id, age))   # read only some columns
read_dta("data.dta", n_max = 1000)              # read the first 1000 rows
read_dta("data.dta", skip = 5)                  # skip the first 5 data rows
read_dta("old.dta", encoding = "latin1")        # force encoding for old files
write_dta(df, "data.dta")                       # write a tibble back to Stata

[DECISION TREE: Is read_dta() the right tool?]
- read a Stata .dta file: read_dta("data.dta")
- file is SPSS .sav: read_sav("data.sav")
- file is SAS .sas7bdat: read_sas("data.sas7bdat")
- file is a plain CSV export: read_csv("data.csv")
- file is an Excel workbook: read_excel("data.xlsx")
- write a tibble back to Stata: write_dta(df, "data.dta")
- turn Stata coded columns into factors: as_factor(df)

## What read_dta() does

**read_dta() turns a Stata .dta file into a tibble.** You pass it a file path and it returns a tidy data frame with one column per Stata variable. The function reads the binary Stata format directly through the bundled ReadStat C library, so no Stata license or software is needed on the machine. It handles every Stata file version, from Stata 8 through the current release, with no version argument from you.

Unlike a CSV export, a Stata file carries a full codebook. Variable labels, value labels such as `1 = "Male"`, and date display formats all live inside the single `.dta` file. read_dta() reads that metadata in the same call and attaches it to the tibble, so the analysis context travels with the data.

## Syntax and key arguments

**Most calls need only the `file` path; the remaining arguments control which rows and columns you read and how text is decoded.** Stata files from research projects can be both wide and long, so these arguments let you pull a slice instead of the whole table.

```r title="The read_dta signature"
read_dta(
  file,                    # path to the .dta file
  encoding = NULL,         # text encoding; NULL reads it from the file
  col_select = NULL,       # columns to keep, tidyselect style
  skip = 0,                # data rows to skip before reading
  n_max = Inf,             # maximum number of rows to read
  .name_repair = "unique"  # how to fix duplicate or invalid column names
)
```

The arguments you reach for most are `col_select` (keep only the variables you need), `n_max` (preview a large file fast), and `encoding`. The `encoding` argument matters for files written by Stata 13 or earlier, which stored text as Latin-1 rather than UTF-8. read_dta() reads the encoding from modern files on its own; only an old file with garbled accented characters needs an explicit `encoding = "latin1"`.

[NOTE]
**Coming from Python pandas?** The equivalent of `read_dta("data.dta")` is `pandas.read_stata("data.dta")`. Both return a tabular object, but haven gives you a tibble and keeps Stata value labels as a `haven_labelled` class that pandas converts to plain categories.

## read_dta() examples

**haven ships an example `iris.dta` file, so every example below runs without a Stata file of your own.** Build the path with `system.file()` and pass it to read_dta().

```r title="Read a Stata file into a tibble"
library(haven)

path <- system.file("examples", "iris.dta", package = "haven")
read_dta(path)
#> # A tibble: 150 x 5
#>   Sepal_Length Sepal_Width Petal_Length Petal_Width Species
#>          <dbl>       <dbl>        <dbl>       <dbl> <chr>
#> 1          5.1         3.5          1.4         0.2 setosa
#> 2          4.9         3            1.4         0.2 setosa
#> 3          4.7         3.2          1.3         0.2 setosa
#> # i 147 more rows
```

The result is a tibble. Stata variable names cannot contain dots, so `Sepal.Length` from base R is stored as `Sepal_Length` here.

**Read only the columns you need with `col_select`.** It uses tidyselect syntax, so you name columns without quotes. This trims a wide Stata export down to the variables your analysis touches.

```r title="Read selected columns only"
read_dta(path, col_select = c(Species, Petal_Width))
#> # A tibble: 150 x 2
#>   Species Petal_Width
#>   <chr>         <dbl>
#> 1 setosa          0.2
#> 2 setosa          0.2
#> 3 setosa          0.2
#> # i 147 more rows
```

**Preview a large file with `n_max`.** Reading a capped number of rows returns a sample in milliseconds, even when the full file holds hundreds of thousands of observations.

```r title="Preview the first rows"
read_dta(path, n_max = 4)
#> # A tibble: 4 x 5
#>   Sepal_Length Sepal_Width Petal_Length Petal_Width Species
#>          <dbl>       <dbl>        <dbl>       <dbl> <chr>
#> 1          5.1         3.5          1.4         0.2 setosa
#> 2          4.9         3            1.4         0.2 setosa
#> 3          4.7         3.2          1.3         0.2 setosa
#> 4          4.6         3.1          1.5         0.2 setosa
```

**Confirm the object once the file is in memory.** read_dta() always returns a tibble, which prints cleanly and works with every tidyverse function.

```r title="Check the result class and size"
iris_stata <- read_dta(path)
class(iris_stata)
#> [1] "tbl_df"     "tbl"        "data.frame"
dim(iris_stata)
#> [1] 150   5
```

[TIP]
**read_stata() is the same function.** haven exports `read_stata()` as an identical alias of `read_dta()`, so you can use whichever name reads more clearly in your script. Both call the same underlying reader and return the same tibble.

## read_dta() vs read_stata(), read_sav() and other readers

**read_dta() is one of several haven readers, each tied to a statistical file format.** They share the same return type and most arguments, so picking the right one is mostly a matter of matching the file extension.

| Function | Reads | Source software |
|----------|-------|-----------------|
| `read_dta()` | `.dta` | Stata |
| `read_stata()` | `.dta` | Stata, identical alias |
| `read_sav()` | `.sav`, `.zsav` | SPSS |
| `read_sas()` | `.sas7bdat` | SAS |
| `read_csv()` | `.csv` | Plain text export |

Use `read_dta()` or `read_stata()` for Stata data files, which end in `.dta`. Use `read_sav()` for SPSS files and `read_sas()` for SAS files. If the data reached you as a plain `.csv` export from Stata, use readr's `read_csv()` instead, since that file no longer holds the Stata metadata.

[KEY INSIGHT]
**A Stata file embeds its own codebook.** read_dta() preserves variable labels, value labels, and date formats as tibble attributes, so the documentation that a CSV export would discard stays attached to the data and is ready for `as_factor()` to decode.

## Common pitfalls

**Pointing read_dta() at a path that does not exist.** The function cannot guess where the file is. A typo in the path or the wrong working directory triggers an immediate error.

```r title="Pitfall: a path that does not exist"
# read_dta("missing.dta")
#> Error: Failed to open missing.dta: No such file or directory
read_dta(path)   # correct: pass a real, existing file path
#> # A tibble: 150 x 5
```

**Garbled text from an old Stata file.** Files written by Stata 13 or earlier store text as Latin-1. read_dta() assumes UTF-8 unless told otherwise, so accented names can arrive as mojibake. Re-read the file with `encoding = "latin1"` to fix the characters.

**Coded columns arriving as labelled values.** When a `.dta` file stores value labels, read_dta() returns those columns with class `haven_labelled`. They look like numbers but carry hidden labels, which breaks some functions. Convert them with `as_factor()` for readable factors or `zap_labels()` to keep the raw values.

[WARNING]
**Stata dates need their date format to read as dates.** Stata stores dates as a number of days since 1960. read_dta() converts variables that carry a Stata `%td` date format into R `Date` values, but a date column saved without that format reads as a large raw number. Check any suspicious column and convert it with `as.Date(x, origin = "1960-01-01")`.

## Try it yourself

**Try it:** Read the bundled `iris.dta` file, then compute the mean of the `Petal_Width` column. Save the result to `ex_mean`.

```r title="Your turn: read a dta file and summarise"
# Try it: read iris.dta, mean of Petal_Width
ex_path <- system.file("examples", "iris.dta", package = "haven")
ex_data <- # your code here

ex_mean <- # your code here
ex_mean
#> Expected: about 1.199
```

<details>
<summary>Click to reveal solution</summary>

```r title="Solution"
ex_path <- system.file("examples", "iris.dta", package = "haven")
ex_data <- read_dta(ex_path)
ex_mean <- mean(ex_data$Petal_Width)
ex_mean
#> [1] 1.199333
```

**Explanation:** read_dta() returns the Stata file as a tibble, so `ex_data$Petal_Width` is an ordinary numeric column that `mean()` summarises directly.

</details>

## Related haven functions

**read_dta() works alongside a small set of haven readers, writers, and label helpers.** Reach for the one that matches your file or your cleanup task.

- `read_stata()`: identical alias of `read_dta()` for reading a Stata `.dta` file.
- `write_dta()`: write a tibble back out as a Stata `.dta` file, with an optional `version` argument.
- `read_sav()`: read an SPSS `.sav` or `.zsav` file into a tibble.
- `read_sas()`: read a SAS `.sas7bdat` data file into a tibble.
- `as_factor()`: turn Stata labelled columns into readable factors.
- `zap_labels()`: strip value labels and keep the raw underlying values.

For the full argument reference, see the [haven read_dta() documentation](https://haven.tidyverse.org/reference/read_dta.html) on tidyverse.org.

## FAQ

**How do I import a Stata file into R?**

Install the haven package with `install.packages("haven")`, load it with `library(haven)`, then call `read_dta("path/to/file.dta")`. The function reads the binary Stata format directly and returns the data as a tibble. You do not need Stata itself, a license, or any StataCorp software on the machine. The path can be absolute or relative to your current working directory.

**What package reads .dta files in R?**

The haven package is the standard choice. It reads Stata `.dta` files with `read_dta()` or its alias `read_stata()`, and it is part of the tidyverse. The older `foreign::read.dta()` still works for files up to Stata 12, but haven is faster, actively maintained, reads every modern Stata version, and returns a tidy tibble with value labels preserved.

**What is the difference between read_dta() and read.dta()?**

`read_dta()` comes from haven and reads every Stata version, returning a tibble with labels kept as a `haven_labelled` class. `read.dta()` comes from the older foreign package and only reads files up to Stata 12, returning a base data frame. For any recent Stata file, use haven's `read_dta()`. The dotted name is the legacy reader.

**Why are my Stata columns showing as labelled in R?**

The `.dta` file stored value labels, so read_dta() returns those columns with class `haven_labelled`. They display as numbers with attached labels. Call `as_factor()` on the data to convert labelled columns into factors, or `zap_labels()` to drop the labels and keep the raw values. This is common when importing coded survey or panel data.

**Can read_dta() read all Stata versions?**

Yes. read_dta() reads every Stata file format from Stata 8 through the current release, and it detects the version automatically, so you never pass a version argument when reading. The `version` argument exists only on the writing side, in `write_dta()`, where it controls which Stata release can open the file you create.

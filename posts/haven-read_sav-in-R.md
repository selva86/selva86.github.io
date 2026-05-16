---
title: "haven read_sav() in R: Import SPSS .sav Files"
slug: haven-read_sav-in-R
description: "Learn haven read_sav() in R to import SPSS .sav files into tibbles. Covers syntax, the user_na argument, value labels, column selection, and common errors."
keywords: "haven read_sav, read_sav function R, haven read_sav examples, R read SPSS file, import .sav file in R, read SPSS data into R, read_sav tibble"
mathjax: false
webr: true
date: 2026-05-16
post_type: PSEO
category_id: function-deep
subcategory_id: readr--readxl--haven
fr_parent: Importing-Data-in-R.html
auto_link_terms: "read_sav()|haven read_sav|haven::read_sav()|read SPSS files in R|import SPSS data into R"
auto_link_case_sensitive: true
target_keyword: "haven read_sav"
sibling_block_enabled: true
difficulty: Beginner
---

# haven read_sav() in R: Import SPSS .sav Files

<p class="lead">The haven read_sav() function imports an SPSS .sav file into an R tibble. It needs no SPSS installation and pulls in the variable labels and value labels stored inside the file.</p>

[QUICK ANSWER]
read_sav("data.sav")                            # read an SPSS .sav file
read_sav("data.zsav")                           # read a compressed .zsav file
read_sav("data.sav", col_select = c(id, age))   # read only some columns
read_sav("data.sav", n_max = 1000)              # read the first 1000 rows
read_sav("data.sav", user_na = TRUE)            # keep SPSS user missing values
read_spss("data.por")                           # read an older SPSS portable file
write_sav(df, "data.sav")                       # write a tibble back to SPSS

[DECISION TREE: Is read_sav() the right tool?]
- read an SPSS .sav or .zsav file: read_sav("data.sav")
- read an older SPSS portable file: read_por("data.por")
- file is SAS .sas7bdat: read_sas("data.sas7bdat")
- file is Stata .dta: read_dta("data.dta")
- file is a plain CSV export: read_csv("data.csv")
- file is an Excel workbook: read_excel("data.xlsx")
- write a tibble back to SPSS: write_sav(df, "data.sav")

## What read_sav() does

**read_sav() turns an SPSS .sav file into a tibble.** You pass it a file path and it returns a tidy data frame with one column per SPSS variable. The function reads the binary SPSS format directly through the bundled ReadStat C library, so no SPSS license or software is needed on the machine.

Unlike a CSV export, an SPSS file carries a full codebook. Variable labels, value labels such as `1 = "Male"`, and user-defined missing values all live inside the single `.sav` file. read_sav() reads that metadata in the same call and attaches it to the tibble, so the survey context travels with the data.

## Syntax and key arguments

**Most calls need only the `file` path; the other arguments control which rows and columns you read and how missing values arrive.** SPSS survey files can be both wide and long, so these arguments let you pull a slice instead of the whole table.

```r title="The read_sav signature"
read_sav(
  file,                    # path to the .sav or .zsav file
  encoding = NULL,         # text encoding; NULL reads it from the file
  user_na = FALSE,         # FALSE converts user missing values to NA
  col_select = NULL,       # columns to keep, tidyselect style
  skip = 0L,               # data rows to skip before reading
  n_max = Inf,             # maximum number of rows to read
  .name_repair = "unique"  # how to fix duplicate or invalid column names
)
```

The arguments you reach for most are `col_select` (keep only the variables you need), `n_max` (preview a large file fast), and `user_na`. The `user_na` argument is SPSS specific: leave it `FALSE` and read_sav() converts SPSS user-defined missing values to plain `NA`, while `TRUE` keeps them as tagged missing values you can tell apart later.

[NOTE]
**Coming from Python pandas?** pandas has no built-in `.sav` reader. The closest equivalent is `pyreadstat.read_sav()`, which, like haven, is built on the ReadStat C library, so both return the same values and labels from a given file.

## read_sav() examples

**haven ships an example `iris.sav` file, so every example below runs without an SPSS file of your own.** Build the path with `system.file()` and pass it to read_sav().

```r title="Read an SPSS file into a tibble"
library(haven)

path <- system.file("examples", "iris.sav", package = "haven")
read_sav(path)
#> # A tibble: 150 x 5
#>   Sepal_Length Sepal_Width Petal_Length Petal_Width Species
#>          <dbl>       <dbl>        <dbl>       <dbl> <chr>
#> 1          5.1         3.5          1.4         0.2 setosa
#> 2          4.9         3            1.4         0.2 setosa
#> 3          4.7         3.2          1.3         0.2 setosa
#> # i 147 more rows
```

The result is a tibble. SPSS variable names cannot contain dots, so `Sepal.Length` from base R is stored as `Sepal_Length` here.

**Read only the columns you need with `col_select`.** It uses tidyselect syntax, so you name columns without quotes. This trims a wide SPSS export down to the variables your analysis touches.

```r title="Read selected columns only"
read_sav(path, col_select = c(Species, Petal_Width))
#> # A tibble: 150 x 2
#>   Species Petal_Width
#>   <chr>         <dbl>
#> 1 setosa          0.2
#> 2 setosa          0.2
#> 3 setosa          0.2
#> # i 147 more rows
```

**Preview a large file with `n_max`.** Reading a capped number of rows returns a sample in milliseconds, even when the full file holds hundreds of thousands of cases.

```r title="Preview the first rows"
read_sav(path, n_max = 4)
#> # A tibble: 4 x 5
#>   Sepal_Length Sepal_Width Petal_Length Petal_Width Species
#>          <dbl>       <dbl>        <dbl>       <dbl> <chr>
#> 1          5.1         3.5          1.4         0.2 setosa
#> 2          4.9         3            1.4         0.2 setosa
#> 3          4.7         3.2          1.3         0.2 setosa
#> 4          4.6         3.1          1.5         0.2 setosa
```

**Confirm the object once the file is in memory.** read_sav() always returns a tibble, which prints cleanly and works with every tidyverse function.

```r title="Check the result class and size"
iris_spss <- read_sav(path)
class(iris_spss)
#> [1] "tbl_df"     "tbl"        "data.frame"
dim(iris_spss)
#> [1] 150   5
```

[TIP]
**Save space with `.zsav`.** read_sav() reads SPSS's compressed `.zsav` format with no extra arguments, and `write_sav(df, "data.zsav", compress = TRUE)` produces one. A `.zsav` file is often a third the size of the same data stored as plain `.sav`.

## read_sav() vs read_spss(), read_por() and other readers

**read_sav() is one of several haven readers, each tied to a statistical file format.** They share the same return type and most arguments, so picking the right one is mostly a matter of matching the file extension.

| Function | Reads | Source software |
|----------|-------|-----------------|
| `read_sav()` | `.sav`, `.zsav` | SPSS |
| `read_por()` | `.por` | SPSS legacy portable |
| `read_spss()` | `.sav`, `.zsav`, `.por` | SPSS, auto-dispatch |
| `read_sas()` | `.sas7bdat` | SAS |
| `read_dta()` | `.dta` | Stata |

Use `read_sav()` for modern SPSS data files, which end in `.sav` or the compressed `.zsav`. Use `read_por()` for the older SPSS portable format, which ends in `.por`. If you would rather not think about the extension at all, `read_spss()` inspects the file and dispatches to the correct reader for you.

[KEY INSIGHT]
**An SPSS file embeds its own codebook.** read_sav() preserves variable labels, value labels, and missing-value rules as tibble attributes, so the survey documentation that a CSV export would discard stays attached to the data.

## Common pitfalls

**Pointing read_sav() at a path that does not exist.** The function cannot guess where the file is. A typo in the path or the wrong working directory triggers an immediate error.

```r title="Pitfall: a path that does not exist"
# read_sav("missing.sav")
#> Error: Failed to open missing.sav: No such file or directory
read_sav(path)   # correct: pass a real, existing file path
#> # A tibble: 150 x 5
```

**Letting user-defined missing values vanish silently.** SPSS lets analysts flag codes such as `99` as missing. With the default `user_na = FALSE`, read_sav() turns every such value into `NA`, and you lose the reason a value was missing. Read with `user_na = TRUE` whenever that distinction matters.

**Coded columns arriving as labelled values.** When a `.sav` file stores value labels, read_sav() returns those columns with class `haven_labelled`. They look like numbers but carry hidden labels, which breaks some functions. Convert them with `as_factor()` for readable factors or `zap_labels()` to keep the raw values.

[WARNING]
**SPSS dates need a date format to read as dates.** SPSS stores dates as a number of seconds since 1582. read_sav() converts variables that carry an SPSS date format into R `Date` or `POSIXct` values, but a date column saved without that format reads as a large raw number. Check any suspicious column and convert it with `as.Date()`.

## Try it yourself

**Try it:** Read the bundled `iris.sav` file, then compute the mean of the `Petal_Width` column. Save the result to `ex_mean`.

```r title="Your turn: read a sav file and summarise"
# Try it: read iris.sav, mean of Petal_Width
ex_path <- system.file("examples", "iris.sav", package = "haven")
ex_data <- # your code here

ex_mean <- # your code here
ex_mean
#> Expected: about 1.199
```

<details>
<summary>Click to reveal solution</summary>

```r title="Solution"
ex_path <- system.file("examples", "iris.sav", package = "haven")
ex_data <- read_sav(ex_path)
ex_mean <- mean(ex_data$Petal_Width)
ex_mean
#> [1] 1.199333
```

**Explanation:** read_sav() returns the SPSS file as a tibble, so `ex_data$Petal_Width` is an ordinary numeric column that `mean()` summarises directly.

</details>

## Related haven functions

**read_sav() works alongside a small set of haven readers, writers, and label helpers.** Reach for the one that matches your file or your cleanup task.

- `read_por()`: read a legacy SPSS portable `.por` file into a tibble.
- `read_spss()`: read any SPSS file and auto-detect whether it is `.sav` or `.por`.
- `write_sav()`: write a tibble back out as an SPSS `.sav` or `.zsav` file.
- `read_sas()`: read a SAS `.sas7bdat` data file into a tibble.
- `read_dta()`: read a Stata `.dta` file into a tibble.
- `as_factor()`: turn SPSS labelled columns into readable factors.
- `zap_labels()`: strip value labels and keep the raw underlying values.

For the full argument reference, see the [haven read_sav() documentation](https://haven.tidyverse.org/reference/read_spss.html) on tidyverse.org.

## FAQ

**How do I import an SPSS file into R?**

Install the haven package with `install.packages("haven")`, load it with `library(haven)`, then call `read_sav("path/to/file.sav")`. The function reads the binary SPSS format directly and returns the data as a tibble. You do not need SPSS itself, a license, or any IBM software on the machine. The path can be absolute or relative to your current working directory.

**What package reads .sav files in R?**

The haven package is the standard choice. It reads SPSS `.sav` and compressed `.zsav` files with `read_sav()`, and it is part of the tidyverse. The older `foreign::read.spss()` still works, but haven is faster, actively maintained, returns a tidy tibble, and preserves value labels and user-defined missing values that `foreign` handles less cleanly.

**What is the difference between read_sav() and read_spss()?**

`read_sav()` reads modern SPSS data files with the `.sav` or `.zsav` extension. `read_spss()` is a wrapper that inspects the file and dispatches to `read_sav()` for `.sav` files or `read_por()` for older `.por` portable files. If you know your extension, call the specific reader. If you want one function for any SPSS file, use `read_spss()`.

**Why are my SPSS columns showing as labelled in R?**

The `.sav` file stored value labels, so read_sav() returns those columns with class `haven_labelled`. They display as numbers with attached labels. Call `as_factor()` on the data to convert labelled columns into factors, or `zap_labels()` to drop the labels and keep the raw values. This is common when importing coded survey responses.

**How do I handle SPSS missing values in R?**

SPSS supports user-defined missing values, where specific codes are flagged as missing. By default read_sav() uses `user_na = FALSE` and converts them all to plain `NA`. Set `user_na = TRUE` to keep them as tagged missing values, then inspect them later or strip them when ready. Use `TRUE` whenever the reason a value is missing matters to your analysis.

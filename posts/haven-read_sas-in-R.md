---
title: "haven read_sas() in R: Import SAS Data Files"
slug: haven-read_sas-in-R
description: "Learn haven read_sas() in R to import SAS .sas7bdat files into tibbles. Covers syntax, column selection, value labels, transport files, and common errors."
keywords: "haven read_sas, read_sas function R, haven read_sas examples, R read SAS file, import sas7bdat in R, read SAS data into R, read_sas tibble"
mathjax: false
webr: true
date: 2026-05-16
post_type: PSEO
category_id: function-deep
subcategory_id: readr--readxl--haven
fr_parent: Importing-Data-in-R.html
auto_link_terms: "read_sas()|haven read_sas|haven::read_sas()|read SAS files in R|import SAS data into R"
auto_link_case_sensitive: true
target_keyword: "haven read_sas"
sibling_block_enabled: true
difficulty: Beginner
---

# haven read_sas() in R: Import SAS Data Files

<p class="lead">The haven read_sas() function imports a SAS .sas7bdat data file into an R tibble. It needs no SAS installation and can attach a value-label catalog when you supply one.</p>

[QUICK ANSWER]
read_sas("data.sas7bdat")                            # read a SAS data file
read_sas("data.sas7bdat", "formats.sas7bcat")        # attach a value-label catalog
read_sas("data.sas7bdat", col_select = c(id, age))   # read only some columns
read_sas("data.sas7bdat", n_max = 1000)              # read the first 1000 rows
read_sas("data.sas7bdat", skip = 5)                  # skip the first 5 rows
read_sas("data.sas7bdat", encoding = "latin1")       # set the text encoding
read_xpt("data.xpt")                                 # read a SAS transport file

[DECISION TREE: Is read_sas() the right tool?]
- read a .sas7bdat data file: read_sas("data.sas7bdat")
- read a SAS transport .xpt file: read_xpt("data.xpt")
- file is SPSS .sav or .zsav: read_sav("data.sav")
- file is Stata .dta: read_dta("data.dta")
- file is a plain CSV export: read_csv("data.csv")
- file is an Excel workbook: read_excel("data.xlsx")
- write a tibble back to SAS: write_xpt(df, "data.xpt")

## What read_sas() does

**read_sas() turns a SAS .sas7bdat file into a tibble.** You pass it a file path and it returns a tidy data frame with one column per SAS variable. The function reads the binary SAS format directly, so you do not need a SAS license or any SAS software on the machine.

A SAS export often ships with a second file, a `.sas7bcat` catalog, that stores value labels such as `1 = "Male"`. Pass that catalog as the second argument and read_sas() attaches the labels to the matching columns. Without it, coded columns arrive as plain numbers.

## Syntax and key arguments

**Most calls need only the `data_file` path; the rest control which rows and columns you read.** SAS files can be large, so these arguments let you pull a slice instead of the whole table.

```r title="The read_sas signature"
read_sas(
  data_file,              # path to the .sas7bdat file
  catalog_file = NULL,    # optional .sas7bcat file with value labels
  encoding = NULL,        # text encoding; NULL reads it from the file
  col_select = NULL,      # columns to keep, tidyselect style
  skip = 0L,              # data rows to skip before reading
  n_max = Inf,            # maximum number of rows to read
  .name_repair = "unique" # how to fix duplicate or invalid column names
)
```

The arguments you reach for most are `col_select` (keep only the variables you need), `n_max` (preview a huge file fast), and `catalog_file` (decode value labels). The `encoding` argument matters only when a file carries non-ASCII text and the embedded encoding is wrong.

[NOTE]
**Coming from Python pandas?** The equivalent of `read_sas("data.sas7bdat")` is `pandas.read_sas("data.sas7bdat")`. Both return a data frame, but haven gives you a tibble and keeps SAS value labels as a `haven_labelled` class that pandas does not preserve.

## read_sas() examples

**haven ships an example `iris.sas7bdat` file, so every example below runs without a SAS file of your own.** Build the path with `system.file()` and pass it to read_sas().

```r title="Read a SAS file into a tibble"
library(haven)

path <- system.file("examples", "iris.sas7bdat", package = "haven")
read_sas(path)
#> # A tibble: 150 x 5
#>   Sepal_Length Sepal_Width Petal_Length Petal_Width Species
#>          <dbl>       <dbl>        <dbl>       <dbl> <chr>
#> 1          5.1         3.5          1.4         0.2 setosa
#> 2          4.9         3            1.4         0.2 setosa
#> 3          4.7         3.2          1.3         0.2 setosa
#> # i 147 more rows
```

The result is a tibble. SAS variable names use underscores, so `Sepal.Length` from base R becomes `Sepal_Length` here.

**Read only the columns you need with `col_select`.** It uses tidyselect syntax, so you name columns without quotes. This is the fastest way to trim a wide SAS export.

```r title="Read selected columns only"
read_sas(path, col_select = c(Species, Sepal_Length))
#> # A tibble: 150 x 2
#>   Species Sepal_Length
#>   <chr>          <dbl>
#> 1 setosa           5.1
#> 2 setosa           4.9
#> 3 setosa           4.7
#> # i 147 more rows
```

[TIP]
**Combine col_select with n_max to scout an unfamiliar file.** Reading `col_select = c(1:3)` and `n_max = 20` returns a tiny preview in milliseconds, even when the full file holds millions of rows.

**Limit how much you read with `n_max` and `skip`.** Use `n_max` to preview a large file and `skip` to jump past rows you do not want.

```r title="Preview the first rows"
read_sas(path, n_max = 4)
#> # A tibble: 4 x 5
#>   Sepal_Length Sepal_Width Petal_Length Petal_Width Species
#>          <dbl>       <dbl>        <dbl>       <dbl> <chr>
#> 1          5.1         3.5          1.4         0.2 setosa
#> 2          4.9         3            1.4         0.2 setosa
#> 3          4.7         3.2          1.3         0.2 setosa
#> 4          4.6         3.1          1.5         0.2 setosa
```

**Confirm the object class once the file is in memory.** read_sas() always returns a tibble, which prints cleanly and works with every tidyverse function.

```r title="Check the result class and size"
iris_sas <- read_sas(path)
class(iris_sas)
#> [1] "tbl_df"     "tbl"        "data.frame"
nrow(iris_sas)
#> [1] 150
```

## read_sas() vs read_sav(), read_dta() and read.csv

**read_sas() is one of three haven readers, each tied to a statistical file format.** They share the same return type and most arguments, so picking the right one is just a matter of matching the file extension.

| Function | Reads | Source software | Companion file |
|----------|-------|-----------------|----------------|
| `read_sas()` | `.sas7bdat` | SAS | `.sas7bcat` catalog |
| `read_xpt()` | `.xpt` | SAS transport | none |
| `read_sav()` | `.sav`, `.zsav` | SPSS | labels are embedded |
| `read_dta()` | `.dta` | Stata | labels are embedded |

Use `read_sas()` for native SAS data files. Switch to `read_xpt()` when the file is a SAS transport file, which regulators such as the FDA often require. For data that already lives in a CSV, `read.csv()` or `readr::read_csv()` is simpler and needs no extra package.

[KEY INSIGHT]
**A SAS file carries metadata that a CSV throws away.** read_sas() preserves variable labels, value labels, and SAS formats as tibble attributes, so you keep the survey codebook that a CSV export would flatten into bare numbers.

## Common pitfalls

**Pointing read_sas() at a path that does not exist.** The function cannot guess where the file is. A typo in the path or a missing working directory triggers an immediate error.

```r title="Pitfall: a path that does not exist"
# read_sas("missing.sas7bdat")
#> Error: Failed to open missing.sas7bdat: No such file or directory
read_sas(path)   # correct: pass a real, existing file path
#> # A tibble: 150 x 5
```

**Coded columns arriving as labelled instead of plain values.** When a SAS file stores formats, read_sas() returns those columns with class `haven_labelled`. They look like numbers but carry hidden labels, which breaks some functions. Convert them with `as_factor()` to get readable factors or `zap_labels()` to strip the labels and keep raw values.

**Forgetting the catalog file.** Value labels live in a separate `.sas7bcat` file. If you read only the `.sas7bdat`, coded columns stay as bare integers. Pass the catalog as the second argument to decode them.

[WARNING]
**SAS dates are not R dates until you convert them.** SAS stores dates as a number of days since 1960, while R counts from 1970. read_sas() applies the SAS format, but a column without a format reads as a raw integer. Check any date column and convert with `as.Date()` if it looks like a large number.

## Try it yourself

**Try it:** Read the bundled `iris.sas7bdat` file, then count how many rows have `Species` equal to `"setosa"`. Save the count to `ex_count`.

```r title="Your turn: read a SAS file and count"
# Try it: read iris.sas7bdat, count setosa rows
ex_path <- system.file("examples", "iris.sas7bdat", package = "haven")
ex_data <- # your code here

ex_count <- # your code here
ex_count
#> Expected: 50
```

<details>
<summary>Click to reveal solution</summary>

```r title="Solution"
ex_path <- system.file("examples", "iris.sas7bdat", package = "haven")
ex_data <- read_sas(ex_path)
ex_count <- sum(ex_data$Species == "setosa")
ex_count
#> [1] 50
```

**Explanation:** read_sas() returns the SAS file as a tibble. Summing a logical vector counts the `TRUE` values, which gives the number of setosa rows.

</details>

## Related haven functions

**read_sas() works alongside a small set of haven readers and label helpers.** Reach for the one that matches your file or your cleanup task.

- `read_xpt()`: read a SAS transport `.xpt` file, the format regulators often require.
- `read_sav()`: read an SPSS `.sav` file into a tibble.
- `read_dta()`: read a Stata `.dta` file into a tibble.
- `write_xpt()`: write a tibble back out as a SAS transport file.
- `as_factor()`: turn SAS labelled columns into readable factors.
- `zap_labels()`: strip value labels and keep the raw underlying values.

For the full argument reference, see the [haven read_sas() documentation](https://haven.tidyverse.org/reference/read_sas.html) on tidyverse.org.

## FAQ

**How do I import a SAS file into R?**

Install the haven package with `install.packages("haven")`, load it with `library(haven)`, then call `read_sas("path/to/file.sas7bdat")`. The function reads the binary SAS format directly and returns the data as a tibble. You do not need SAS itself, a license, or any SAS software on the machine. The path can be absolute or relative to your working directory.

**What package reads SAS files in R?**

The haven package is the standard choice. It reads `.sas7bdat` files with `read_sas()` and SAS transport `.xpt` files with `read_xpt()`, and it is part of the tidyverse. The older `sas7bdat` package and `foreign::read.ssd()` still exist, but haven is faster, actively maintained, and preserves value labels and SAS formats that the alternatives drop.

**Do I need SAS installed to use read_sas()?**

No. read_sas() parses the `.sas7bdat` binary format itself through the bundled ReadStat C library. No SAS installation, license, or server connection is involved. This is the main reason haven replaced older tools: it lets anyone open SAS data on any operating system without paying for SAS.

**What is the difference between read_sas() and read_xpt()?**

`read_sas()` reads native SAS data files with the `.sas7bdat` extension, the format SAS uses internally. `read_xpt()` reads SAS transport files with the `.xpt` extension, an older interchange format used for sharing data, especially in regulated clinical submissions. Both return tibbles. Match the function to the file extension you actually have.

**Why are my SAS columns showing as labelled in R?**

The SAS file stored formats or value labels, so read_sas() returns those columns with class `haven_labelled`. They display as numbers with attached labels. Call `as_factor()` on the data to convert labelled columns into factors, or `zap_labels()` to remove the labels and keep the raw values. This step is common when importing survey data.

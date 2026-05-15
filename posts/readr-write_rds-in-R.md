---
title: "readr write_rds() in R: Save Objects to .rds Files"
slug: readr-write_rds-in-R
description: "Use readr write_rds() in R to save an R object to a compact .rds file with optional gz compression. Covers syntax, examples, write_rds vs saveRDS, and pitfalls."
keywords: "readr write_rds, write_rds function R, readr write_rds examples, write_rds vs saveRDS, save R object to file, write rds file R"
mathjax: false
webr: true
date: "2026-05-16"
post_type: PSEO
category_id: function-deep
subcategory_id: readr--readxl--haven
fr_parent: Importing-Data-in-R.html
auto_link_terms: "write_rds()|write_rds|readr write_rds|readr::write_rds()|write RDS file"
auto_link_case_sensitive: true
target_keyword: "readr write_rds"
sibling_block_enabled: true
difficulty: Beginner
---

# readr write_rds() in R: Save Objects to .rds Files

<p class="lead">readr write_rds() saves a single R object to a compact <code>.rds</code> file on disk, preserving its exact structure so you can read it back later with <code>read_rds()</code>.</p>

[QUICK ANSWER]
write_rds(x, "x.rds")                   # save one object
write_rds(x, "x.rds", compress = "gz")  # compressed file
write_rds(x, "x.rds", version = 3)      # newer serialization format
df |> write_rds("df.rds")               # pipe-friendly, returns df
read_rds("x.rds")                       # read the object back
saveRDS(x, "x.rds")                     # base R equivalent

[DECISION TREE: Is write_rds() the right tool?]
- save one R object: write_rds(model, "model.rds")
- save many objects together: save(a, b, file = "all.RData")
- save a data frame as CSV: write_csv(df, "df.csv")
- save a fast columnar file: arrow::write_parquet(df, "df.parquet")
- read an .rds file back: read_rds("model.rds")
- write a text representation: write_rds(x, "x.rds", text = TRUE)

## What write_rds() does

**write_rds() serializes one R object to a binary file.** It takes any R object, a fitted model, a data frame, a list, or a vector, and writes it to disk in R's native `.rds` format. The saved file keeps the object's class, attributes, and types intact, so what you read back is identical to what you saved.

It is the writing half of a pair: `write_rds()` saves, and `read_rds()` restores. Both come from the readr package, which gives them consistent argument names and pipe-friendly behavior compared with the base R functions they wrap.

## Syntax and key arguments

**The signature centers on the object and the destination file.** You pass the object first and the file path second; every other argument has a sensible default.

```r title="Load readr and save an object"
library(readr)

model <- lm(mpg ~ wt + hp, data = mtcars)
write_rds(model, "model.rds")

file.exists("model.rds")
#> [1] TRUE
```

The full call is `write_rds(x, file, compress = c("none", "gz", "bz2", "xz"), version = 2, ...)`.

| Argument | Default | What it controls |
|---|---|---|
| `x` | required | The single R object to save |
| `file` | required | Destination path, conventionally ending in `.rds` |
| `compress` | `"none"` | Compression algorithm: `none`, `gz`, `bz2`, or `xz` |
| `version` | `2` | Serialization format; `3` is smaller but needs R 3.5+ |
| `text` | `FALSE` | Write an ASCII representation instead of binary |

[NOTE]
**The `file` argument was once called `path`.** readr 1.4.0 renamed it for consistency with the rest of the package. On readr 1.4.0 and later, always use `file =` if you name the argument.

## write_rds() examples

**Each example below targets a different real task.** They build on one shared session, so objects created in one block are available in the next.

### Compress the output file

**`write_rds()` skips compression by default.** That keeps saves fast but produces larger files. Switch on `gz` compression when disk space or transfer size matters.

```r title="Compare compressed and uncompressed size"
write_rds(mtcars, "cars_none.rds")
write_rds(mtcars, "cars_gz.rds", compress = "gz")

file.size("cars_none.rds")
#> [1] 1903
file.size("cars_gz.rds")
#> [1] 1267
```

### Save inside a pipe

**`write_rds()` returns its input invisibly.** That lets it slot into a pipeline without breaking the chain, so you can save an intermediate result and keep working.

```r title="Save a result mid-pipeline"
library(dplyr)

mtcars |>
  filter(mpg > 20) |>
  write_rds("efficient_cars.rds") |>
  nrow()
#> [1] 14
```

### Read the object back

**A saved object is restored with `read_rds()`.** The round trip is lossless: the model below returns the same coefficients it had before saving.

```r title="Restore the saved model"
saved <- read_rds("model.rds")
coef(saved)
#> (Intercept)          wt          hp 
#> 37.22727012 -3.87783074 -0.03177295
```

### Use the newer format version

**Setting `version = 3` uses R's modern serialization.** It produces a smaller file. Use it only when every machine that reads the file runs R 3.5.0 or newer.

```r title="Write with serialization version 3"
write_rds(mtcars, "cars_v3.rds", version = 3)
file.exists("cars_v3.rds")
#> [1] TRUE
```

## write_rds() vs saveRDS() and alternatives

**`write_rds()` is a thin wrapper around base R's `saveRDS()`.** It serializes identically, so a file written by one can be read by the other. The differences are ergonomic, not structural.

| Feature | `write_rds()` | `saveRDS()` | `save()` |
|---|---|---|---|
| Objects per file | one | one | many |
| Default compression | `"none"` | `TRUE` (gzip) | `TRUE` |
| Returns input | yes, invisibly | no | no |
| Restores with | `read_rds()` | `readRDS()` | `load()` |

Use `write_rds()` inside tidyverse pipelines where the invisible return value keeps a chain flowing. Reach for `save()` only when you must bundle several named objects into one file. For large data frames you query repeatedly, a columnar format such as Parquet will out-read any `.rds` file.

[TIP]
**Match `write_rds()` with `read_rds()`, not `load()`.** The `load()` function is for `.RData` archives written by `save()`. Pointing it at an `.rds` file fails because the formats differ.

## Common pitfalls

**Most write_rds() mistakes trace back to three assumptions.** Each one has a quick fix.

The first is expecting compression. Because `compress = "none"` is the default, an `.rds` file from `write_rds()` is larger than the same object saved with `saveRDS()`. Add `compress = "gz"` to match base R's behavior.

The second is trying to save several objects at once. `write_rds()` accepts exactly one object; extra arguments are interpreted as other parameters, not data.

```r title="Saving multiple objects needs a list"
# Wrong: only the first object is saved
# write_rds(mtcars, iris, "two.rds")

# Right: bundle them in a single list
write_rds(list(cars = mtcars, flowers = iris), "two.rds")
names(read_rds("two.rds"))
#> [1] "cars"    "flowers"
```

The third is a version mismatch: a file written with `version = 3` will not open in R older than 3.5.0. Keep the default `version = 2` when you need wide compatibility.

[WARNING]
**`write_rds()` overwrites silently.** If the target file already exists, it is replaced with no prompt and no warning. Check with `file.exists()` first when an accidental overwrite would lose work.

## Try it yourself

**Try it:** Save the first 10 rows of `mtcars` to a compressed `.rds` file named `ex_cars.rds`, then confirm the file was created.

```r title="Your turn: save with write_rds"
# Try it: write a compressed .rds file
ex_cars <- head(mtcars, 10)
# your code here

file.exists("ex_cars.rds")
#> Expected: TRUE
```

<details>
<summary>Click to reveal solution</summary>

```r title="Solution"
ex_cars <- head(mtcars, 10)
write_rds(ex_cars, "ex_cars.rds", compress = "gz")
file.exists("ex_cars.rds")
#> [1] TRUE
```

**Explanation:** `write_rds()` takes the object first and the path second. Adding `compress = "gz"` shrinks the file, and `file.exists()` confirms the write succeeded.

</details>

## Related readr functions

**`write_rds()` belongs to readr's file output family.** These functions cover the other formats you are likely to need:

- `read_rds()` reads an `.rds` file back into R.
- `write_csv()` saves a data frame as comma-separated text.
- `write_tsv()` saves a data frame as tab-separated text.
- `write_lines()` writes a character vector one element per line.
- `write_delim()` saves a data frame with any custom delimiter.

## FAQ

**What is the difference between write_rds() and saveRDS()?**

`write_rds()` is a readr wrapper around base R's `saveRDS()`. They write the same binary format, so files are interchangeable. The practical differences: `write_rds()` defaults to no compression while `saveRDS()` compresses, and `write_rds()` returns its input invisibly so it works inside a pipe. Choose `write_rds()` for tidyverse code and `saveRDS()` if you want compression without naming the argument.

**Does write_rds() compress files by default?**

No. `write_rds()` uses `compress = "none"`, which makes writes fast but produces larger files than `saveRDS()`, which compresses by default. To compress, pass `compress = "gz"` for a good speed-and-size balance, or `compress = "xz"` for the smallest file at the cost of slower writes. The compression choice does not affect reading: `read_rds()` detects the algorithm automatically.

**Can write_rds() save multiple objects at once?**

No. `write_rds()` saves exactly one object per file. To store several objects, wrap them in a named list and save that list, then unpack it after reading. If you specifically need separate named objects restored into the environment, use base R's `save()` with `load()` instead, which writes `.RData` archives.

**What file extension should I use with write_rds()?**

Use `.rds`. The extension is a convention rather than a requirement, since `write_rds()` writes the same content regardless of the name, but `.rds` signals the format to collaborators and tools. Avoid `.RData`, which implies a multi-object archive written by `save()`.

**Is write_rds() faster than write_csv()?**

Usually yes for both writing and reading, because `.rds` is a binary format that skips text parsing and preserves types directly. An `.rds` file also keeps factors, dates, and classes exactly, while a CSV stores everything as text and needs re-parsing on import. Use CSV only when a human or a non-R program must read the file.

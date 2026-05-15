---
title: "readr read_rds() in R: Load a Saved R Object"
slug: readr-read_rds-in-R
description: "Learn readr read_rds() in R to load a saved R object from an .rds file. Covers syntax, restoring models, type preservation, readRDS differences, and pitfalls."
keywords: "readr read_rds, read_rds function R, readr read_rds examples, R read rds file, read rds in R, read_rds vs readRDS, load rds file R"
mathjax: false
webr: true
date: 2026-05-16
post_type: PSEO
category_id: function-deep
subcategory_id: readr--readxl--haven
fr_parent: Importing-Data-in-R.html
auto_link_terms: "read_rds()|readr read_rds|readr::read_rds()|read RDS file in R|read_rds in R"
auto_link_case_sensitive: true
target_keyword: "readr read_rds"
sibling_block_enabled: true
difficulty: Beginner
---

# readr read_rds() in R: Load a Saved R Object

<p class="lead">The readr read_rds() function loads a single saved R object from an .rds file back into your session. Unlike a CSV reader, it restores the exact object, so a data frame, a fitted model, or a list returns with all of its types and attributes intact.</p>

[QUICK ANSWER]
read_rds("data.rds")                     # read a saved object
read_rds("https://site.com/obj.rds")     # read straight from a URL
read_rds("nums.rds.gz")                  # gzip file, decompressed automatically
read_rds("model.rds")                    # restore a fitted model object
class(read_rds("data.rds"))              # check what type came back
str(read_rds("data.rds"))                # inspect structure on read
readRDS("data.rds")                      # base R equivalent

[DECISION TREE: Is read_rds() the right tool?]
- restore one saved R object: read_rds("obj.rds")
- load many named objects at once: load("workspace.RData")
- read a CSV or text table: read_csv("data.csv")
- read an Excel workbook: read_excel("data.xlsx")
- read a fast columnar binary: read_parquet("data.parquet")
- share data with Python users: write to CSV or parquet instead

## What read_rds() does

**read_rds() restores one R object from an .rds file.** An `.rds` file is a binary snapshot of a single object that `write_rds()` or base `saveRDS()` produced earlier. You give read_rds() the path to that file, and it hands the object back exactly as it was, whether the object is a tibble, a numeric vector, a nested list, or a fitted model.

This makes read_rds() the natural way to cache work between R sessions. A cleaned data frame or a slow-to-fit model can be saved once and reloaded instantly afterward. Because the file stores the object itself, nothing is re-parsed and no column types are guessed on the way back in.

## Syntax and key arguments

**The signature is tiny because the file already knows its own shape.** There are no column types to guess and no delimiter to set. The object was serialized whole, so read_rds() only needs to know where the file lives.

```r title="The read_rds signature"
read_rds(
  file,            # path, connection, or URL to an .rds file
  refhook = NULL   # optional hook for custom reference objects
)
```

You will pass `file` on almost every call and ignore `refhook`, which only matters for objects holding external pointers. The `file` argument accepts a local path, a connection, a URL, or a raw vector of bytes, so you can read an `.rds` file straight from the web.

Compression is detected automatically. A gzip, bzip2, or xz file reads with the same call as an uncompressed one, so you never pass a compression argument to read_rds() itself.

[NOTE]
**Coming from Python?** The `.rds` workflow is the R counterpart of `pickle`. Where Python writes `pickle.dump(obj, f)` and reads `pickle.load(f)`, R writes `write_rds(obj, "obj.rds")` and reads it back with `read_rds("obj.rds")`.

## read_rds() examples

**Start with a round trip.** Write a built-in dataset to disk with `write_rds()`, then read it back so every example has a real file to work with.

```r title="Write and read an RDS file"
library(readr)

write_rds(mtcars, "cars.rds")
cars <- read_rds("cars.rds")
class(cars)
#> [1] "data.frame"
nrow(cars)
#> [1] 32
```

The object returns as the same `data.frame` with all 32 rows. No CSV parsing happened, because the file stored the object itself rather than a text table. That is why an `.rds` read is faster and more predictable than re-importing a CSV.

**read_rds() keeps exact R types.** A CSV round trip flattens factors into text and dates into strings, so you must rebuild those types every time you reload. An `.rds` round trip does not, because it serializes the object with its classes attached.

```r title="read_rds preserves exact R types"
df <- data.frame(
  grp = factor(c("a", "b", "a")),
  day = as.Date("2026-01-01") + 0:2
)
write_rds(df, "typed.rds")
restored <- read_rds("typed.rds")
class(restored$grp)
#> [1] "factor"
class(restored$day)
#> [1] "Date"
```

The factor returns with its original levels, and the date column returns as a `Date` rather than character. This type fidelity is the main reason to choose `.rds` over CSV for intermediate results.

**read_rds() restores any object, not just data frames.** A fitted model is just another R object, so you can save one after a slow fit and read it back in a later session to skip refitting entirely.

```r title="Save and restore a fitted model"
fit <- lm(mpg ~ wt + hp, data = mtcars)
write_rds(fit, "model.rds")

model <- read_rds("model.rds")
coef(model)
#> (Intercept)          wt          hp
#> 37.22727012 -3.87783074 -0.03177295
predict(model, newdata = data.frame(wt = 3, hp = 150))
#>        1
#> 20.82784
```

The restored `model` is a complete `lm` object. You can call `coef()`, `predict()`, or `summary()` on it as if you had just fit it. Saving models this way is common in scoring scripts, where training and prediction run as separate jobs.

**Compressed files read with the same call.** Pass a compression option to `write_rds()`, and read_rds() decompresses the file transparently when you read it back.

```r title="Read a compressed RDS file"
nums <- 1:1000
write_rds(nums, "nums.rds.gz", compress = "gz")
read_rds("nums.rds.gz")[1:5]
#> [1] 1 2 3 4 5
```

The integer vector returns intact. Compression shrinks large `.rds` files noticeably for a little extra time, which is usually worth it for cached data.

[KEY INSIGHT]
**An .rds file is a photograph of one object, not a table.** That mental model explains every behavior: there are no column types because the object carries its own structure, and there is one object per file because the snapshot has a single subject.

## read_rds() vs readRDS() and alternatives

**read_rds() is the readr wrapper; readRDS() is base R.** They read the same format and produce identical results, so the choice between them is about which API style the surrounding code already uses.

| Function | Reads | Objects | Format | Best for |
|----------|-------|---------|--------|----------|
| `read_rds()` | one R object | single | binary, R only | readr-style restore of any object |
| `readRDS()` | one R object | single | binary, R only | base R scripts, identical result |
| `load()` | named objects | many | `.RData` / `.rda` | restoring a whole workspace |
| `read_csv()` | a table | single | text, portable | tabular data shared across tools |

Use `read_rds()` inside tidyverse pipelines for an argument name (`file`) that matches the other readr functions. Use `load()` when a `.RData` file holds several named objects. Reach for `read_csv()` whenever the data must travel to another tool, since `.rds` is binary and R only. For very large objects, packages such as `qs` and `fst` read faster than read_rds().

[TIP]
**Use .rds for intermediate results and CSV for handoff.** Cache a cleaned data frame or a slow model as `.rds` so reruns are instant. Export to CSV only when a person or another tool needs to read the data.

## Common pitfalls

**Using read_rds() on a .RData file.** A `.RData` or `.rda` file created with `save()` can hold many named objects at once, while read_rds() expects exactly one serialized object. Pointing read_rds() at such a file fails or returns something unusable. Use `load("workspace.RData")` instead, which restores each saved name directly into your environment rather than returning a single value.

**Assuming the result is a data frame.** read_rds() returns whatever object was written, which may be a list, a vector, or a model. Pipe it straight into data-frame code without checking and you get a confusing error. Call `class()` on the returned object first when unsure.

**Expecting cross-language portability.** An `.rds` file is R-specific binary serialization that Python, databases, and spreadsheet tools cannot open. When the data must leave R, export it as CSV or Parquet instead of `.rds`.

[WARNING]
**An .rds file built with a much newer R may not open on an older one.** The serialization format is versioned. If you share `.rds` files across machines, keep R versions reasonably close, or fall back to CSV for long-term archival.

## Try it yourself

**Try it:** Write the `iris` data frame to `iris.rds`, read it back into `ex_iris`, and confirm the `Species` column is still a factor. Save its class to `ex_class`.

```r title="Your turn: round-trip iris"
# Try it: write iris to RDS, read it back, check Species
write_rds(iris, "iris.rds")
ex_iris <- # your code here

ex_class <- # your code here
ex_class
#> Expected: "factor"
```

<details>
<summary>Click to reveal solution</summary>

```r title="Solution"
write_rds(iris, "iris.rds")
ex_iris <- read_rds("iris.rds")
ex_class <- class(ex_iris$Species)
ex_class
#> [1] "factor"
```

**Explanation:** read_rds() restores the exact object, so `Species` returns as a factor with its original levels. A CSV round trip would have read it back as plain character text instead.

</details>

## Related readr functions

**read_rds() sits among readr's import and export helpers.** Reach for the one that matches the file you have.

- `write_rds()`: write a single R object to an `.rds` file, the inverse of this function.
- `read_csv()`: read comma-separated text into a tibble.
- `read_lines()`: read a text file as a character vector, one element per line.
- `read_file()`: read a whole file into a single string.
- `readRDS()`: the base R equivalent that returns the same object.

For the full argument list, see the [readr read_rds reference](https://readr.tidyverse.org/reference/read_rds.html) on tidyverse.org.

## FAQ

**What is the difference between read_rds() and readRDS() in R?**

They return the same object from the same file. `read_rds()` comes from readr and names its first argument `file`, consistent with `read_csv()`. `readRDS()` is base R and names its argument `con`. Use whichever fits the surrounding code; there is no difference in the result or the file format.

**What file type does read_rds() read?**

read_rds() reads `.rds` files, a binary format that stores exactly one serialized R object, produced by `write_rds()` or base `saveRDS()`. It is not human readable and is specific to R, so it is best for caching results between R sessions rather than sharing data widely.

**Can read_rds() read an .RData file?**

No. A `.RData` or `.rda` file made with `save()` can hold many named objects, while read_rds() expects a single object. Use `load("file.RData")` for those files; it restores each saved name into your environment instead of returning a value.

**Does read_rds() preserve factors and dates?**

Yes. Because an `.rds` file stores the object itself, read_rds() returns factors, dates, list columns, and custom attributes exactly as written. This is the main advantage over a CSV round trip, which flattens those types into plain text.

**How do I read a compressed .rds file?**

Just call `read_rds("file.rds.gz")`. read_rds() detects gzip, bzip2, and xz compression automatically and decompresses the file before deserializing it. You pass no compression argument when reading; that choice is made only when the file is written.

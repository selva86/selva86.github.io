---
title: "qs qsave() in R: Save R Objects Fast to Disk"
slug: qs-qsave-in-R
description: "Learn how to use qs qsave() in R to serialize any R object to disk fast. Covers syntax, presets, multithreading, qsave vs saveRDS, and pitfalls, with examples."
keywords: "qs qsave, qsave function R, qs qsave examples, R save objects qs, qsave vs saveRDS, qs package R, fast serialization R"
mathjax: false
webr: true
date: "2026-05-16"
post_type: PSEO
category_id: function-deep
subcategory_id: readr--readxl--haven
fr_parent: Importing-Data-in-R.html
auto_link_terms: "qsave()|qs qsave|qs::qsave()|qread()|qs package|fast serialization"
auto_link_case_sensitive: true
target_keyword: "qs qsave"
sibling_block_enabled: true
difficulty: Beginner
---

# qs qsave() in R: Save R Objects Fast to Disk

<p class="lead">The <code>qs</code> <code>qsave()</code> function in R serializes any R object to a compressed binary file, running several times faster than base R's <code>saveRDS()</code> while producing smaller files.</p>

[QUICK ANSWER]
qsave(df, "df.qs")                      # default, high compression
qsave(df, "df.qs", preset = "fast")     # speed over file size
qsave(df, "df.qs", preset = "archive")  # smallest file
qsave(model, "model.qs", nthreads = 4)  # parallel write
qread("df.qs")                          # read it back
qsavem(a, b, file = "vars.qs")          # save several objects
qs::qsave(x, "x.qs")                    # call without attaching

[DECISION TREE: Is qsave() the right tool?]
- save any R object fast: qsave(x, "x.qs")
- save only a data frame, max speed: write_fst(df, "df.fst")
- share data with non-R users: write_csv(df, "df.csv")
- base R with zero dependencies: saveRDS(x, "x.rds")
- save multiple objects at once: qsavem(a, b, file = "v.qs")
- columnar data across tools: write_parquet(df, "df.parquet")

## What qsave() does

**qsave() writes any in-memory R object to a single compressed file on disk.** It is the workhorse of the qs package, designed to serialize objects far faster than `saveRDS()` while keeping files small. You pass an object and a path, and qsave() writes the file and returns it invisibly.

Unlike format-specific writers such as `write_csv()` or `write_fst()`, qsave() is not limited to data frames. It serializes lists, fitted models, nested structures, S4 objects, and anything else R can hold in memory. The companion reader `qread()` restores the object exactly as it was, with every attribute, class, and environment intact.

The speed comes from two design choices. qs uses modern compression libraries (zstd and lz4) that are quicker than the gzip compression in `saveRDS()`, and it can spread that work across several CPU cores.

[KEY INSIGHT]
**qsave() trades a package dependency for speed.** A `.qs` file can only be opened where the qs package is installed. In return you get compression and read/write speeds base R cannot match, which makes qsave() ideal for caching intermediate results inside a project.

## qsave() syntax and arguments

**A qsave() call needs an object, a file path, and an optional compression preset.** Everything else has a sensible default, so most real code passes just two arguments.

```r title="qsave a data frame to disk"
library(qs)

qsave(mtcars, file = "mtcars.qs")

file.exists("mtcars.qs")
#> [1] TRUE
```

The full signature exposes the compression controls. The `preset` argument is the one you reach for most often, because it bundles the algorithm and its level into a single named choice.

| Argument | Default | Purpose |
|---|---|---|
| `x` | required | The R object to serialize |
| `file` | required | Destination path, conventionally ending in `.qs` |
| `preset` | `"high"` | Named bundle: `"fast"`, `"balanced"`, `"high"`, `"archive"`, `"uncompressed"` |
| `nthreads` | `1` | Threads used for compression; raise for large objects |
| `algorithm` | `"zstd"` | Compression algorithm; set by the preset unless `preset = "custom"` |
| `compress_level` | `4L` | Algorithm-specific level; higher means smaller and slower |

The default `"high"` preset uses zstd compression at a moderate level, a good balance for most work. The `"fast"` preset switches to lz4 for the quickest write at the cost of a larger file, while `"archive"` pushes zstd hard for the smallest file. Set `preset = "custom"` only when you want to combine an `algorithm` and `compress_level` by hand.

## Saving objects with qsave(): four common cases

### Round-trip a data frame

**The core pattern is qsave() to write and qread() to read.** A correct round-trip returns an object identical to the original.

```r title="Save and reload a data frame"
qsave(mtcars, "mtcars.qs")
df2 <- qread("mtcars.qs")

identical(df2, mtcars)
#> [1] TRUE
```

The `identical()` check returns `TRUE` because qsave() preserves column types, row names, and attributes. This is the everyday use: write an object after an expensive step, then read it back instead of recomputing.

### Trade file size against speed with presets

**Presets tune the speed-versus-size balance without touching algorithm internals.** The `"fast"` preset writes quickly but leaves larger files, while `"archive"` compresses hardest.

```r title="Compare qsave presets"
big <- data.frame(x = rnorm(1e5), g = sample(letters, 1e5, TRUE))

qsave(big, "fast.qs", preset = "fast")
qsave(big, "archive.qs", preset = "archive")

file.size("fast.qs") > file.size("archive.qs")
#> [1] TRUE
```

The `"fast"` file is larger because lz4 prioritizes write speed over compression ratio. For a cache you rewrite often that is the right call; for an object you save once and keep, `"archive"` is the better trade.

[TIP]
**Pick the preset by use case, not by habit.** Use `"fast"` for short-lived cache files you rewrite often, `"high"` (the default) for everyday work, and `"archive"` only for objects you store long-term and rarely re-read.

### Speed up large saves with multiple threads

**The nthreads argument splits compression across CPU cores.** For large objects this is the single biggest speed lever qsave() offers, and it applies to `qread()` too.

```r title="Multithreaded write and read"
qsave(big, "big.qs", nthreads = 4)
df3 <- qread("big.qs", nthreads = 4)

nrow(df3)
#> [1] 100000
```

Compression parallelizes cleanly, so a four-thread write finishes far sooner than the single-threaded default. Match `nthreads` to the cores you can spare; values beyond your physical core count give no further gain.

### Save several objects in one file

**qsavem() saves multiple named objects together, and qload() restores them.** This mirrors base R's `save()` and `load()` pair but with qs speed.

```r title="Save and restore multiple objects"
a <- 1:10
b <- list(name = "demo", ok = TRUE)
qsavem(a, b, file = "vars.qs")

rm(a, b)
qload("vars.qs")

b$name
#> [1] "demo"
```

After `qload()` the objects reappear under their original names, so there is no assignment step. Use `qsavem()` when a checkpoint involves several related objects, such as a model plus its training data.

## qsave() vs saveRDS() and other formats

**qsave() wins on speed for any object type, but a `.qs` file is not portable.** The table below shows where each writer fits.

| Function | Package | Speed | Object types | Best for |
|---|---|---|---|---|
| `qsave()` | qs | Very fast | Any R object | Fast caching of any object |
| `saveRDS()` | base R | Slow | Any R object | Portable, zero dependencies |
| `write_fst()` | fst | Very fast | Data frames only | Random-access data frame storage |
| `write_parquet()` | arrow | Fast | Data frames only | Sharing columnar data across tools |
| `write_csv()` | readr | Slow, large | Data frames only | Human-readable universal exchange |

Reach for qsave() when speed matters and the reader is another R session with qs installed. Fall back to `saveRDS()` when the file must open anywhere without extra packages, and pick `write_csv()` or `write_parquet()` when tools outside R need the data.

[NOTE]
**qs has a successor, qs2.** The newer qs2 package introduces `qs_save()` with an improved on-disk format. The classic `qsave()` shown here remains supported and widely used, but evaluate qs2 for brand-new projects that need a long-term stable format.

## Common pitfalls

**Sending a `.qs` file to a colleague without qs installed.** The file is unreadable anywhere the qs package is missing. For data you must share widely, write a `.csv` or `.rds` file instead, or have the recipient run `install.packages("qs")` first.

**Passing a connection instead of a path.** Unlike `saveRDS()`, qsave() expects a plain character file path, not a connection object. Wrapping the path in `gzfile()` fails because qs manages compression itself.

```r title="qsave needs a path, not a connection"
con <- gzfile("bad.qs")
qsave(mtcars, file = con)
#> Error: `file` must be a character string

qsave(mtcars, file = "good.qs")  # correct
```

**Leaving nthreads at 1 for large objects.** The default is single-threaded, so a multi-gigabyte object compresses slower than it needs to. Set `nthreads` to match the cores you can spare for an easy win.

## Try it yourself

**Try it:** Save the built-in `iris` data frame with qsave() using the `"archive"` preset, then read it back into `ex_iris` and confirm the row count.

```r title="Your turn: qsave iris"
# Try it: save iris with the archive preset, then read it back
qsave(iris, "ex_iris.qs", preset = ) # your code here
ex_iris <- # your code here

nrow(ex_iris)
#> Expected: 150
```

<details>
<summary>Click to reveal solution</summary>

```r title="Solution"
qsave(iris, "ex_iris.qs", preset = "archive")
ex_iris <- qread("ex_iris.qs")

nrow(ex_iris)
#> [1] 150
```

**Explanation:** The `"archive"` preset compresses hardest for long-term storage. `qread()` restores the data frame exactly, so `nrow()` returns the original 150 rows.

</details>

## Related qs and data import functions

These functions cover the rest of the fast serialization workflow:

- [readr write_rds()](readr-write_rds-in-R.html) writes `.rds` files with a tidyverse-friendly interface.
- [readr read_rds()](readr-read_rds-in-R.html) reads `.rds` files back into R.
- [fst write_fst()](fst-write_fst-in-R.html) stores data frames with fast random-access reads.
- [arrow write_parquet()](arrow-write_parquet-in-R.html) saves data frames in the portable Parquet format.
- `qread()` is the qs reader that restores any object written by `qsave()`.

## FAQ

**Is qsave() faster than saveRDS()?**

Yes. For most objects qsave() writes and reads several times faster than `saveRDS()`, and the gap widens for large data because qsave() can use multiple threads. It also tends to produce smaller files at the default `"high"` preset. The trade-off is that the qs package must be installed to open the file, whereas `.rds` files work in any base R session.

**What file extension should qs files use?**

By convention qs files use the `.qs` extension, as in `qsave(x, "results.qs")`. The extension is not enforced, so a file saved under any name still reads correctly through `qread()`. Sticking to `.qs` keeps your project readable and signals the format to collaborators and to scripts that scan directories for cached output.

**Can qsave() save a fitted model?**

Yes. qsave() serializes any R object, including `lm()`, `glm()`, randomForest, and other model objects, together with their attributes and environments. Use `qsave(model, "model.qs")` and restore it with `qread()`. This makes qsave() a fast way to cache trained models between sessions so you do not re-fit them on every run.

**Should I use qs or qs2 for a new project?**

The classic qs package and its `qsave()` function remain fully supported and are a safe choice today. The newer qs2 package offers an updated on-disk format through `qs_save()` and is worth considering for new projects that prioritize a stable long-term format. For everyday caching inside an active project, either package works well.

For the official argument reference, see the [qs package documentation](https://github.com/qsbase/qs).

---
title: "R Error: 'cannot open the connection', File Path Checklist That Fixes It"
slug: "R-Error-Cannot-Open-Connection"
description: "Fix R's 'cannot open the connection' error fast. Walk a 5-step file-path checklist: working directory, typos, Windows backslashes, locks, and permissions."
keywords: "R cannot open the connection, R cannot open connection error, error in file rt, R file not found, R working directory, getwd setwd, R read.csv error, here::here R"
mathjax: false
webr: true
date: "2026-04-14"
curriculum_id: "ERR8"
post_type: "FR"
auto_link_terms: "cannot open the connection|cannot open connection|Error in file(file, \"rt\")"
auto_link_case_sensitive: false
fr_parent: "R-Common-Errors.html"
difficulty: "Intermediate"
---

# R Error: 'cannot open the connection', File Path Checklist That Fixes It

<p class="lead"><code>Error in file(file, "rt") : cannot open the connection</code> means R tried to open a file or URL and failed. Nine times out of ten the file is fine, your <strong>working directory points somewhere else, the filename has a typo, or a Windows backslash mangled the path</strong>. Walk the checklist below and you'll find the cause in under a minute.</p>

## What does "cannot open the connection" actually mean?

The error message looks scary because it says "connection," but in R-speak a "connection" just means *the open handle to a file or URL*. R never got that far. Reproducing the error and printing one line of diagnostic info is enough to know which checklist item to chase next.

```r title="Reproduce the connection error"
library(here)
# Reproduce the error and capture the diagnostic in one shot
bad_path <- "not-here.csv"

err <- tryCatch(
  read.csv(bad_path),
  error = function(e) conditionMessage(e),
  warning = function(w) conditionMessage(w)
)

cat("Error message:\n  ", err, "\n\n", sep = "")
cat("Working directory: ", getwd(), "\n", sep = "")
cat("File exists?       ", file.exists(bad_path), "\n", sep = "")
cat("Resolved to:       ", normalizePath(bad_path, mustWork = FALSE), "\n", sep = "")
#> Error message:
#>   cannot open file 'not-here.csv': No such file or directory
#>
#> Working directory: /home/web_user
#> File exists?       FALSE
#> Resolved to:       /home/web_user/not-here.csv
```

The error message itself tells you nothing actionable, it just says "I tried, it failed." The three diagnostic lines below tell you everything: where R was looking, whether the file is there, and the absolute path R resolved your input to. With those three facts, every cause in this checklist becomes a 30-second fix.

[KEY INSIGHT]
**A "connection" in R is a file or URL handle, not a network connection.** Unless you literally passed a `http://` URL, this error is *always* a path problem. Stop checking your wifi.

**Try it:** Create a real file with `tempfile()` + `writeLines()`, then re-run the diagnostic block on its path. Watch `file.exists()` flip from `FALSE` to `TRUE`.

```r title="Exercise: diagnose an existing path"
# Try it: re-run the diagnostic on a path that DOES exist
ex_path <- tempfile(fileext = ".csv")
# your code here: write a line into ex_path, then print exists/resolved

#> Expected: file.exists() returns TRUE and the resolved path lives under tempdir()
```

<details>
<summary>Click to reveal solution</summary>

```r title="Existing-path solution"
ex_path <- tempfile(fileext = ".csv")
writeLines("a,b\n1,2", ex_path)

cat("File exists? ", file.exists(ex_path), "\n", sep = "")
cat("Resolved to: ", normalizePath(ex_path), "\n", sep = "")
#> File exists? TRUE
#> Resolved to: /tmp/RtmpXXXXXX/fileXXXXXX.csv
```

**Explanation:** `tempfile()` only *reserves* a path, it doesn't create the file. The `writeLines()` call is what actually puts bytes on disk, which is why `file.exists()` flips from `FALSE` to `TRUE` only after the write.

</details>

## Is your working directory where you think it is?

This is cause number one, the file you wrote is real and lives somewhere on disk, but R is looking in a different folder. Relative paths like `"data.csv"` are resolved against R's current working directory, and that directory is rarely what you assume.

```r title="Inspect and change working directory"
# What does R think "here" means right now?
original_wd <- getwd()
cat("R is currently in: ", original_wd, "\n\n", sep = "")

cat("First 5 things in this folder:\n")
cat("  ", paste(head(list.files(original_wd), 5), collapse = "\n  "), "\n", sep = "")

# Move R into the temp directory and confirm the move
tmp_wd <- setwd(tempdir())
cat("\nNow R is in: ", getwd(), "\n", sep = "")

# Always restore the original wd in scripts
setwd(original_wd)
#> R is currently in: /home/web_user
#>
#> First 5 things in this folder:
#>
#> Now R is in: /tmp
```

Two lines do all the work. `getwd()` tells you where R is looking; `list.files()` shows what R can actually see from there. If the file you want isn't in that listing, R isn't going to find it with a relative path no matter how many times you re-run `read.csv()`.

There's a sneaky variant of this bug. Inside an R Markdown or Quarto document, the working directory of each chunk is the **document's folder**, not the project root. A path that works in the console fails when you knit. The portable fix is `here::here("data", "myfile.csv")`, it builds an absolute path anchored to your project root, regardless of where the chunk runs.

[TIP]
**Don't `setwd()` inside scripts you'll share.** Hard-coded paths break for every collaborator. Use RStudio Projects (which set the wd automatically) or `here::here()` (which anchors paths to the project root, not the current chunk).

**Try it:** Build an absolute path with `here::here()` (mocked here as a `file.path()` call since `here` isn't preloaded in WebR) for a file at `data/sales.csv` under a project root of `/projects/analysis`.

```r title="Exercise: build a project path"
# Try it: construct an absolute project-relative path
ex_built <- # your code here

cat(ex_built, "\n")
#> Expected: /projects/analysis/data/sales.csv
```

<details>
<summary>Click to reveal solution</summary>

```r title="Project-path solution"
# In a real project: here::here("data", "sales.csv")
# Mocked equivalent for the WebR sandbox:
ex_built <- file.path("/projects/analysis", "data", "sales.csv")
cat(ex_built, "\n")
#> /projects/analysis/data/sales.csv
```

**Explanation:** `here::here()` walks up from the current file until it finds a project marker (`.Rproj`, `.git`, etc.) and joins your arguments with the right separator for the OS. `file.path()` is the underlying primitive that handles separators correctly on every platform.

</details>

## Does the file exist exactly where you say it does?

The working directory checks out, but R still can't find the file. Time to check whether the *name* matches what R sees on disk. Three things go wrong here: typos, hidden file extensions, and case sensitivity.

```r title="List files by extension pattern"
# Step 1: confirm the file actually exists at the path you typed
wanted <- "Data.CSV"
cat("Looking for: ", wanted, "\n", sep = "")
cat("Exists?      ", file.exists(wanted), "\n\n", sep = "")

# Step 2: list every CSV in the working directory so you can spot the real name
csvs <- list.files(pattern = "\\.csv$", ignore.case = TRUE)
cat("CSVs R can see (", length(csvs), " total):\n", sep = "")
if (length(csvs) > 0) cat("  ", paste(csvs, collapse = "\n  "), "\n", sep = "")
#> Looking for: Data.CSV
#> Exists?      FALSE
#>
#> CSVs R can see (0 total):
```

`file.exists()` is the truth oracle, if it returns `FALSE`, R will refuse to open the file, full stop. The follow-up `list.files(pattern = ...)` is the diagnostic: it shows you every candidate so you can spot the typo (`mtdata.csv` vs `mydata.csv`), the wrong extension (`.csv` vs `.tsv`), or a case mismatch (`Data.csv` vs `data.csv`).

Two platform-specific gotchas catch beginners constantly. On **Linux and macOS**, filenames are case-sensitive, so `Data.csv` and `data.csv` are two different files. On **Windows**, File Explorer hides known extensions by default, so a file you see as `data.csv` may actually be `data.csv.txt` on disk, meaning R has to be told to open `data.csv.txt`, not `data.csv`.

[WARNING]
**Windows hides known file extensions by default.** A file you see as `data.csv` in Explorer may be `data.csv.txt` on disk. Never trust File Explorer's filename, always confirm with `list.files()` from R.

**Try it:** Write a real temp file, then call `file.exists()` on it AND on a similarly-named-but-typo path. Confirm one returns `TRUE` and the other `FALSE`.

```r title="Exercise: file.exists catches typos"
# Try it: prove file.exists() catches typos
ex_tmp <- tempfile(fileext = ".csv")
# your code here: write to ex_tmp, then test ex_tmp and a typo'd version

#> Expected: real path TRUE, typo'd path FALSE
```

<details>
<summary>Click to reveal solution</summary>

```r title="Typo-detection solution"
ex_tmp <- tempfile(fileext = ".csv")
writeLines("x,y\n1,2", ex_tmp)

cat("Real path: ", file.exists(ex_tmp), "\n", sep = "")
cat("Typo'd:    ", file.exists(paste0(ex_tmp, "x")), "\n", sep = "")
#> Real path: TRUE
#> Typo'd:    FALSE
```

**Explanation:** `file.exists()` is a hard, OS-level test. It doesn't care about your intentions, it tells you whether *this exact byte sequence* points to a real entry on disk. Use it as the first line of defence before any `read.*` call.

</details>

## Are Windows backslashes breaking your path?

Windows uses `\` as its path separator, but R uses `\` as its **string escape character**. So when you paste a Windows path straight into a string literal, R thinks `\U`, `\n`, and `\t` are escape sequences, and either parses your path wrong or refuses to parse it at all. There are three clean fixes.

```r title="Three ways to write Windows paths"
# All three of these point to the SAME file on disk
forward  <- "C:/Users/you/Documents/data.csv"           # forward slashes (works on every OS)
doubled  <- "C:\\Users\\you\\Documents\\data.csv"       # doubled backslashes (the escape-safe form)
raw_path <- r"(C:\Users\you\Documents\data.csv)"        # R 4.0+ raw string literal

# file.path() builds OS-correct paths from pieces — no escaping needed
joined <- file.path("C:", "Users", "you", "Documents", "data.csv")

cat("forward:  ", forward,  "\n", sep = "")
cat("doubled:  ", doubled,  "\n", sep = "")
cat("raw:      ", raw_path, "\n", sep = "")
cat("file.path:", joined,   "\n", sep = "")
#> forward:  C:/Users/you/Documents/data.csv
#> doubled:  C:\Users\you\Documents\data.csv
#> raw:      C:\Users\you\Documents\data.csv
#> file.path: C:/Users/you/Documents/data.csv
```

All four lines produce paths Windows can resolve to the same file. `forward` is the easiest to write and works identically on Linux, macOS, and Windows. `doubled` is what you'll see in older code. The `r"(...)"` raw string is the R 4.0+ feature that lets you paste a Windows path directly from File Explorer without changing a single character, by far the friendliest fix for occasional copy-pasters. And `file.path()` is the right tool whenever you're *building* a path from variables instead of writing it as a literal.

[TIP]
**R 4.0+ raw strings (`r"(...)"`) let you paste a Windows path verbatim.** No escaping, no doubling, no editing. If you copy a path from File Explorer and wrap it in `r"(...)"`, it just works. This alone has saved more "cannot open the connection" hours than any other R 4.x feature.

**Try it:** Build a Windows-style absolute path to `report.xlsx` in `C:\Users\you\Reports` using `file.path()`.

```r title="Exercise: build a Windows path"
# Try it: build a Windows path from pieces
ex_winpath <- # your code here

cat(ex_winpath, "\n")
#> Expected: C:/Users/you/Reports/report.xlsx
```

<details>
<summary>Click to reveal solution</summary>

```r title="Windows-path solution"
ex_winpath <- file.path("C:", "Users", "you", "Reports", "report.xlsx")
cat(ex_winpath, "\n")
#> C:/Users/you/Reports/report.xlsx
```

**Explanation:** `file.path()` joins its arguments with the platform's separator (`/` on Linux/macOS, also accepted on Windows). On Windows, R uses forward slashes internally even when the OS prefers backslashes, both work for reading.

</details>

## Is something else holding the file open or denying access?

You've confirmed the path is right and the file exists, but R *still* can't read it. This is the "permission" branch of the checklist. The file is locked by another program, the OS denies your user read access, or the drive containing it has gone offline.

```r title="Test read permission with file.access"
# Create a real, readable file so we have something to inspect
real_file <- tempfile(fileext = ".csv")
writeLines("col1,col2\n10,20", real_file)

cat("Path:     ", real_file, "\n", sep = "")
cat("Exists:   ", file.exists(real_file), "\n", sep = "")

# file.access(mode = 4) tests READ permission; returns 0 on success, -1 on failure
cat("Readable: ", file.access(real_file, mode = 4) == 0, "\n", sep = "")

# mode = 2 tests write, mode = 1 tests execute, mode = 0 tests existence
cat("Writable: ", file.access(real_file, mode = 2) == 0, "\n", sep = "")

unlink(real_file)
#> Path:     /tmp/RtmpXXXXXX/fileXXXXXX.csv
#> Exists:   TRUE
#> Readable: TRUE
#> Writable: TRUE
```

`file.access()` uses Unix-style return codes, `0` means "yes, you have this permission" and `-1` means "no, you don't." It's the only base-R function that distinguishes "the file is missing" from "the file is locked or denied," which is exactly the distinction you need when `file.exists()` returns `TRUE` but `read.csv()` still fails.

Three real-world causes account for almost every permission failure: the file is **open in Excel** (Windows takes an exclusive lock on `.xlsx` and `.csv` files), the path is on a **mapped network drive** that has disconnected, or the file lives in a **protected system directory** like `C:\Program Files`. Close the file, reconnect the drive, or move the file to your home folder respectively.

[NOTE]
**On Windows, Excel takes an exclusive lock on `.xlsx` and `.csv` files while open.** R will get a permission-denied error even though the file clearly exists. Close the file in Excel before reading from R, or, better, copy it to a temp folder first so you can keep working in Excel without blocking the script.

**Try it:** Call `file.access()` with read mode on a path that doesn't exist. Confirm it returns `-1`, not `0`.

```r title="Exercise: file.access on missing path"
# Try it: file.access on a non-existent path
ex_missing <- "definitely-not-real-path.csv"
# your code here: print the file.access return value

#> Expected: -1
```

<details>
<summary>Click to reveal solution</summary>

```r title="Missing-path solution"
ex_missing <- "definitely-not-real-path.csv"
cat("file.access returned: ", file.access(ex_missing, mode = 4), "\n", sep = "")
#> file.access returned: -1
```

**Explanation:** `file.access()` returns `-1` for any failure mode, missing file, denied permission, or broken symlink. Pair it with `file.exists()` to disambiguate: if `file.exists()` is `TRUE` but `file.access(., 4) == -1`, you know it's a permission problem, not a typo.

</details>

## How do I diagnose every cause in one shot?

Six checklist items add up to a lot of typing. The fix is to wrap them in a single function and call it the moment the error appears. The function below prints the input, the resolved path, existence, parent-directory contents, read permission, and a one-line verdict, every checklist item in 15 lines.

```r title="All-in-one diagnosepath function"
# Save this in your .Rprofile and call it whenever the error appears
diagnose_path <- function(p) {
  cat("--- diagnose_path('", p, "') ---\n", sep = "")
  cat("Working directory: ", getwd(), "\n", sep = "")
  cat("Resolved path:     ", normalizePath(p, mustWork = FALSE), "\n", sep = "")
  cat("Exists:            ", file.exists(p), "\n", sep = "")
  cat("Readable:          ", file.access(p, mode = 4) == 0, "\n", sep = "")

  parent <- dirname(normalizePath(p, mustWork = FALSE))
  if (dir.exists(parent)) {
    siblings <- list.files(parent)
    n <- length(siblings)
    cat("Parent dir:        ", parent, " (", n, " files)\n", sep = "")
    if (n > 0 && n <= 8) cat("  -> ", paste(siblings, collapse = ", "), "\n", sep = "")
  } else {
    cat("Parent dir:        ", parent, " (DOES NOT EXIST)\n", sep = "")
  }

  verdict <- if (file.exists(p)) "OK to read" else "FIX THE PATH"
  cat("Verdict:           ", verdict, "\n", sep = "")
}

diagnose_path("imaginary.csv")
#> --- diagnose_path('imaginary.csv') ---
#> Working directory: /home/web_user
#> Resolved path:     /home/web_user/imaginary.csv
#> Exists:            FALSE
#> Readable:          FALSE
#> Parent dir:        /home/web_user (0 files)
#> Verdict:           FIX THE PATH
```

Every line of output corresponds to a checklist item from the previous sections. You instantly see which check failed and which one to fix. The "Parent dir" listing is the workhorse, it's where you spot the typo, the wrong extension, or the missing folder. Once `Verdict` reads `OK to read`, your `read.csv()` call will succeed.

[KEY INSIGHT]
**A 15-line diagnostic function beats 15 minutes of trial-and-error.** Save `diagnose_path()` in your `.Rprofile` so it's available in every R session. The first time you hit "cannot open the connection" after adding it, you'll wonder how you ever lived without it.

**Try it:** Call `diagnose_path()` on a fresh `tempfile()` path (the path is reserved but no file exists yet) and read the verdict.

```r title="Exercise: run diagnosepath"
# Try it: run diagnose_path on a tempfile that doesn't exist on disk yet
ex_diag <- tempfile(fileext = ".csv")
# your code here

#> Expected: Exists FALSE, Verdict "FIX THE PATH"
```

<details>
<summary>Click to reveal solution</summary>

```r title="Run-diagnose solution"
ex_diag <- tempfile(fileext = ".csv")
diagnose_path(ex_diag)
#> --- diagnose_path('/tmp/RtmpXXXXXX/fileXXXXXX.csv') ---
#> Working directory: /home/web_user
#> Resolved path:     /tmp/RtmpXXXXXX/fileXXXXXX.csv
#> Exists:            FALSE
#> Readable:          FALSE
#> Parent dir:        /tmp/RtmpXXXXXX (1 files)
#>   -> ...
#> Verdict:           FIX THE PATH
```

**Explanation:** `tempfile()` reserves a unique path inside `tempdir()` but never creates the file, so `file.exists()` is `FALSE`. The verdict line confirms what the checklist would have told you the slow way.

</details>

## Practice Exercises

### Exercise 1: Build a safe `read.csv()` wrapper

Write `safe_read_csv(path)` that reads the CSV if it exists, but if the path is missing it should print every same-extension file in the parent directory (so the user can spot the typo) and return `NULL`. Combine `file.exists()`, `dirname()`, `tools::file_ext()`, and `list.files()`.

```r title="Exercise: safereadcsv wrapper"
# Exercise: safe_read_csv that helps when the file is missing
# Hint: get the extension with tools::file_ext(path), then list.files(dir, pattern = ext)

safe_read_csv <- function(path) {
  # your code here
}

# Test on a missing path
my_result <- safe_read_csv("missing.csv")
print(is.null(my_result))
#> Expected: a "siblings" listing (or 'no matches') and TRUE for is.null
```

<details>
<summary>Click to reveal solution</summary>

```r title="safereadcsv solution"
safe_read_csv <- function(path) {
  if (file.exists(path)) return(read.csv(path))

  cat("File not found: ", path, "\n", sep = "")
  parent <- dirname(normalizePath(path, mustWork = FALSE))
  ext    <- tools::file_ext(path)
  pattern <- paste0("\\.", ext, "$")

  if (dir.exists(parent)) {
    siblings <- list.files(parent, pattern = pattern, ignore.case = TRUE)
    if (length(siblings) > 0) {
      cat("Other .", ext, " files in '", parent, "':\n", sep = "")
      cat("  ", paste(siblings, collapse = "\n  "), "\n", sep = "")
    } else {
      cat("No matching files in '", parent, "'.\n", sep = "")
    }
  }
  NULL
}

my_result <- safe_read_csv("missing.csv")
print(is.null(my_result))
#> File not found: missing.csv
#> No matching files in '/home/web_user'.
#> [1] TRUE
```

**Explanation:** The wrapper short-circuits to `read.csv()` on the happy path, so it costs nothing when the file exists. When the file is missing, `tools::file_ext()` extracts the extension, `dirname()` finds the parent, and `list.files()` shows every same-extension sibling, usually exposing the typo immediately.

</details>

### Exercise 2: Search a list of candidate directories

Write `try_paths(name, dirs)` that takes a filename and a vector of candidate directories, and returns the **first existing path** (or `NULL` if none match). Useful when a file might live in `data/`, `inputs/`, or a network share, and you don't want to handcode the lookup.

```r title="Exercise: search candidate directories"
# Exercise: search candidate dirs for the first hit
# Hint: build candidate paths with file.path(dirs, name), keep the ones where file.exists() is TRUE

try_paths <- function(name, dirs) {
  # your code here
}

# Test
my_dirs <- c(tempdir(), "/no/such/place")
my_file <- "made-up.csv"
my_hit  <- try_paths(my_file, my_dirs)
cat("Found: ", if (is.null(my_hit)) "nothing" else my_hit, "\n", sep = "")
#> Expected: "nothing" (no real file written)
```

<details>
<summary>Click to reveal solution</summary>

```r title="trypaths solution"
try_paths <- function(name, dirs) {
  candidates <- file.path(dirs, name)
  hits <- candidates[file.exists(candidates)]
  if (length(hits) == 0) return(NULL)
  hits[1]
}

# Make a real file to prove the happy path
my_file <- "demo.csv"
writeLines("a\n1", file.path(tempdir(), my_file))

my_hit <- try_paths(my_file, c("/no/such/place", tempdir()))
cat("Found: ", my_hit, "\n", sep = "")
#> Found: /tmp/RtmpXXXXXX/demo.csv
```

**Explanation:** Vectorising `file.exists()` over the candidate paths is faster and cleaner than a `for` loop. Returning the first hit (instead of all of them) gives the function deterministic semantics, the order of `dirs` becomes a priority list.

</details>

## Complete Example

Pull every checklist item together: write a CSV from `mtcars`, then read it back through `diagnose_path()` so the diagnostic confirms each step before the read happens. This is the pattern to use any time you're about to do a `read.*` call you don't trust.

```r title="End-to-end write and read"
# Step 1: write a real file we control
cars_path <- file.path(tempdir(), "mtcars-export.csv")
write.csv(mtcars, cars_path, row.names = FALSE)

# Step 2: diagnose BEFORE reading
diagnose_path(cars_path)

# Step 3: now the read is guaranteed to succeed
cars_back <- read.csv(cars_path)
cat("\nLoaded ", nrow(cars_back), " rows, ", ncol(cars_back), " columns\n", sep = "")
print(head(cars_back, 3))

unlink(cars_path)
#> --- diagnose_path('/tmp/RtmpXXXXXX/mtcars-export.csv') ---
#> Working directory: /home/web_user
#> Resolved path:     /tmp/RtmpXXXXXX/mtcars-export.csv
#> Exists:            TRUE
#> Readable:          TRUE
#> Parent dir:        /tmp/RtmpXXXXXX (1 files)
#>   -> mtcars-export.csv
#> Verdict:           OK to read
#>
#> Loaded 32 rows, 11 columns
#>    mpg cyl disp  hp drat    wt  qsec vs am gear carb
#> 1 21.0   6  160 110 3.90 2.620 16.46  0  1    4    4
#> 2 21.0   6  160 110 3.90 2.875 17.02  0  1    4    4
#> 3 22.8   4  108  93 3.85 2.320 18.61  0  1    4    4
```

The diagnostic block reads `OK to read` because every checklist item passes: working directory is sane, the path resolves to a real file, `file.exists()` is `TRUE`, `file.access()` confirms read permission, and the parent directory contains exactly the file we wrote. With every check green, `read.csv()` cannot fail with "cannot open the connection." If it ever does, one of the earlier diagnostic lines would have caught it first.

## Summary

| Cause | How to detect | Fix | Prevention |
|---|---|---|---|
| Wrong working directory | `getwd()` shows an unexpected folder | `setwd()` once, or use absolute paths | Use RStudio Projects + `here::here()` |
| Filename typo / case mismatch | `file.exists()` is `FALSE`, `list.files()` shows the real name | Correct the spelling or extension | Tab-complete file names in RStudio |
| Hidden Windows extension | `list.files()` shows `data.csv.txt` instead of `data.csv` | Use the real on-disk name | Show file extensions in Explorer |
| Backslash escape collision | String parses to wrong path or fails | Forward slashes, doubled backslashes, or `r"(...)"` | Use `file.path()` to build paths |
| File locked / permission denied | `file.exists()` is `TRUE` but `file.access(., 4) == -1` | Close the file in Excel, reconnect drive, move file | Don't read directly from `C:\Program Files` |

## References

1. R Core Team, *Connections* documentation. [Link](https://stat.ethz.ch/R-manual/R-devel/library/base/html/connections.html)
2. R Core Team, `?file.exists` reference. [Link](https://stat.ethz.ch/R-manual/R-devel/library/base/html/files.html)
3. R Core Team, `?file.access` permission codes. [Link](https://stat.ethz.ch/R-manual/R-devel/library/base/html/file.access.html)
4. `here` package documentation, Müller, K. [Link](https://here.r-lib.org/)
5. Bryan, J., *Project-oriented workflow*. tidyverse blog. [Link](https://www.tidyverse.org/blog/2017/12/workflow-vs-script/)
6. R 4.0.0 release notes, raw string literals. [Link](https://cran.r-project.org/doc/manuals/r-release/NEWS.html)

## Continue Learning

1. **R Common Errors**, the parent reference covering 50 common R errors with fixes.
2. **R Error: object 'x' not found**, the variable-scoping cousin of this error.
3. **R Error in read.csv: more columns than column names**, the next error you'll hit once `read.csv()` actually opens the file.

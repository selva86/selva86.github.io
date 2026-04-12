---
title: "R Error: 'no package called X' — Every Possible Cause and Fix"
slug: "R-Error-No-Package"
description: "The package exists but R can't find it — 6 reasons why. Covers failed installs, wrong .libPaths(), Bioconductor & GitHub-only packages, R upgrade fixes."
keywords: "R error no package called, there is no package called R, R install package failed, R libPaths, BiocManager install, install_github R, R package not found, R library path mismatch"
auto_link_terms: "no package called|there is no package called|no package error"
auto_link_case_sensitive: false
mathjax: false
webr: true
date: "2026-04-13"
curriculum_id: "ERR6"
post_type: "FR"
fr_parent: "R-Common-Errors.html"
---

# R Error: 'no package called X' — Every Possible Cause and Fix

<p class="lead"><code>Error in library(x) : there is no package called 'x'</code> means R searched every folder on its library path but found no installed copy of the package you asked for. The package may be uninstalled, half-installed, installed in a folder R no longer looks at, or hosted somewhere <code>install.packages()</code> can't reach.</p>

## What does R's "no package called X" error actually mean?

R looks up packages in a fixed list of folders called the **library path**. When you call `library(somepkg)`, R walks each folder in order, checks for a `somepkg/` subdirectory containing a parsed `DESCRIPTION` file, and stops at the first match. No match anywhere on the path triggers this error. Before guessing the cause, ask R to show you both lists — what is installed, and where it looked.

```r
# Reproduce the error against a package you don't have
library(thispackagedoesnotexist)
#> Error in library(thispackagedoesnotexist) :
#>   there is no package called 'thispackagedoesnotexist'

# Diagnose: which folders did R check?
.libPaths()
#> [1] "/home/user/R/x86_64-pc-linux-gnu-library/4.4"
#> [2] "/usr/lib/R/site-library"
#> [3] "/usr/lib/R/library"

# Diagnose: is the package present in any of them?
find.package("thispackagedoesnotexist", quiet = TRUE)
#> character(0)
```

The error tells you the *exact* name R looked up — note that R does not try alternative spellings or capitalizations. `find.package()` with `quiet = TRUE` returns an empty character vector when nothing is found, and a folder path when the package exists. This pair — `.libPaths()` plus `find.package()` — is the diagnostic backbone for every cause below.

[KEY INSIGHT]
**The error is literal, not a hint.** R checked every single folder in `.libPaths()` and reported the exact name it searched for. Your fix begins by accepting that R looked correctly — the package really isn't where R looks.

**Try it:** Reproduce the error for a package called `ex_fakepkg` and confirm with `find.package()` that R has no copy.

```r
# Try it: trigger and confirm
# Step 1: try to load ex_fakepkg
# Step 2: call find.package() with quiet = TRUE on the same name
# your code here

```

<details>
<summary>Click to reveal solution</summary>

```r
library(ex_fakepkg)
#> Error in library(ex_fakepkg) : there is no package called 'ex_fakepkg'

find.package("ex_fakepkg", quiet = TRUE)
#> character(0)
```

**Explanation:** The empty `character(0)` vector means R searched every entry in `.libPaths()` and found no folder named `ex_fakepkg/`. The error is genuine, not a session quirk.

</details>

## Cause 1: Did you forget to install the package?

By far the most frequent reason: you typed `library(somepkg)` without ever running `install.packages("somepkg")` first. R does not auto-install missing packages — it only loads what is already on disk. If you copied a script from a tutorial, every `library()` call near the top has an unwritten prerequisite that the package is already installed on your machine.

```r
# Wrong assumption: library() will install if missing
library(jsonlite)
#> Error in library(jsonlite) : there is no package called 'jsonlite'

# Right workflow: install once, then load
# install.packages("jsonlite")     # run once in your local R
library(jsonlite)
#> (package loaded silently — no output)

# Confirm it's now visible
"jsonlite" %in% rownames(installed.packages())
#> [1] TRUE
```

The install line is commented out because package installation runs in your local R, not in a browser session. After you run it once, every subsequent `library(jsonlite)` works without reinstalling. The `installed.packages()` check is a quick yes/no — useful inside scripts that need to gate a `library()` call.

[TIP]
**Use requireNamespace() for graceful checks instead of library().** `requireNamespace("pkg", quietly = TRUE)` returns `TRUE` or `FALSE` instead of erroring, which lets your script print a friendly install instruction before failing. Reach for it whenever you're shipping code other people will run.

**Try it:** Write a one-liner that uses `requireNamespace()` to check whether `dplyr` is installed and prints either "ready" or "missing".

```r
# Try it: graceful install check
# Use requireNamespace("dplyr", quietly = TRUE) inside an if/else
# your code here

```

<details>
<summary>Click to reveal solution</summary>

```r
if (requireNamespace("dplyr", quietly = TRUE)) "ready" else "missing"
#> [1] "ready"
```

**Explanation:** `requireNamespace()` is a non-throwing alternative to `library()`. It returns a logical you can branch on, so your script never crashes mid-run when a package is absent.

</details>

## Cause 2: Did install.packages() fail silently?

This trips up users who *did* run `install.packages()` and assumed it worked. The function returns invisibly even when a package fails to compile, conflicts with a locked DLL on Windows, or hits a missing system dependency on Linux. R prints warnings, not errors — so if you are not watching the console output, the error reappears the next time you call `library()`.

```r
# Detect a failed install AFTER you ran install.packages()
# Symptoms: install.packages() printed warnings, but no error, then library() fails

# Step 1: ask for the package's full description path
find.package("Rcpp", quiet = TRUE)
#> character(0)             # missing — install never finished

# Step 2: list any half-installed leftovers in your first libPath
list.files(.libPaths()[1], pattern = "^00LOCK")
#> [1] "00LOCK-Rcpp"        # the unlock file from a crashed install

# Step 3: clean up + retry
# unlink(file.path(.libPaths()[1], "00LOCK-Rcpp"), recursive = TRUE)
# install.packages("Rcpp", type = "binary")
```

A folder named `00LOCK-<pkg>` inside your library path is the smoking gun. R creates it at the start of an install and removes it on success — if you see one, the install was interrupted (Windows DLL lock, crashed R session, lost network) and never finished. Delete the lock folder before retrying. Asking for the *binary* type (`type = "binary"`) on Windows and macOS skips local compilation, which is the source of most silent failures.

[WARNING]
**install.packages() warns instead of erroring on failure.** A package can fail to install with only a warning in the console — your script keeps running. Always check `find.package()` after a fresh install before assuming it worked.

**Try it:** Write code that lists every `00LOCK-*` folder inside your first library path. Don't delete anything — just print the names.

```r
# Try it: detect crashed installs
# Use list.files() against .libPaths()[1] with pattern = "^00LOCK"
# your code here

```

<details>
<summary>Click to reveal solution</summary>

```r
list.files(.libPaths()[1], pattern = "^00LOCK")
#> character(0)
```

**Explanation:** An empty result means no crashed installs are pending. If a name appears, that package's install was interrupted — delete the lock folder and reinstall.

</details>

## Cause 3: Are your .libPaths() pointing to the wrong folder?

R can read packages from several library folders at once, and it is surprisingly easy for them to get out of sync. You might install into a personal folder while a colleague's script expects the system folder. RStudio projects with `renv` enable a *project-local* library that hides your global packages. A package can absolutely be installed on your machine and still be invisible to the current R session — because the session is looking in a different folder.

```r
# Print the search order (R checks these top-down)
lib_dirs <- .libPaths()
lib_dirs
#> [1] "/home/user/R/x86_64-pc-linux-gnu-library/4.4"   # personal
#> [2] "/usr/lib/R/site-library"                         # system

# Search every libPath for a specific package
sapply(lib_dirs, function(d) "ggplot2" %in% list.files(d))
#> /home/user/R/x86_64-pc-linux-gnu-library/4.4   /usr/lib/R/site-library
#>                                          TRUE                    FALSE

# Hard-add a folder if you know where the package lives
# .libPaths(c("/path/to/extra/library", .libPaths()))
```

The `sapply()` line tells you exactly which library folder owns the package — or whether it lives outside R's search path entirely. If a package is sitting in a folder R isn't checking, you can prepend that folder with `.libPaths(c(new_path, .libPaths()))`. The order matters: R reads from the first folder first, so put your project-local folder ahead of the system folder when you want it to win.

[NOTE]
**RStudio Projects and renv override the global library path.** If you opened a project that uses `renv`, your `.libPaths()` will point at `renv/library/...` instead of your global library — and your usual packages will appear "missing." Run `renv::status()` to confirm the project is using its own library.

**Try it:** Write code that searches every entry in `.libPaths()` for a folder named `dplyr` and returns the first matching path (or `NA` if missing).

```r
# Try it: locate dplyr's install folder
# Loop over .libPaths(); the first match wins
# your code here

```

<details>
<summary>Click to reveal solution</summary>

```r
hits <- .libPaths()[sapply(.libPaths(), function(d) "dplyr" %in% list.files(d))]
if (length(hits) > 0) hits[1] else NA
#> [1] "/home/user/R/x86_64-pc-linux-gnu-library/4.4"
```

**Explanation:** `sapply()` returns a logical for each library folder; subsetting `.libPaths()` by it gives you only the matching folders, and `[1]` picks the first one R would actually use.

</details>

## Cause 4: Did you upgrade R and lose your old packages?

Major R upgrades — say from 4.3.x to 4.4.x — create a brand-new library folder named after the new version. Your old folder still exists, but R no longer reads from it, so every package you installed last year suddenly looks "missing." The packages are not gone; they live one folder over, attached to a version of R that is no longer active.

```r
# What R version owns the current library path?
R.version.string
#> [1] "R version 4.4.2 (2024-10-31)"

# Your active library folder
.libPaths()[1]
#> [1] "/home/user/R/x86_64-pc-linux-gnu-library/4.4"

# Check whether an old version's library still exists on disk
old_lib <- "/home/user/R/x86_64-pc-linux-gnu-library/4.3"
dir.exists(old_lib)
#> [1] TRUE

# Quick fix: list packages in the old folder, reinstall in the new one
old_pkgs <- list.files(old_lib)
length(old_pkgs)
#> [1] 87

# install.packages(old_pkgs)   # run in local R after a major upgrade
```

The pattern in the path — `library/4.3` versus `library/4.4` — is your warning sign. R creates a new folder per *major.minor* version, so the version bump moves you to an empty folder. Listing the old folder gives you the full package set to reinstall; piping that into `install.packages()` rebuilds your library against the new R version. Reinstalling is safer than copying the folder because compiled C/C++ packages must be rebuilt for each major R version.

[TIP]
**For minor upgrades, copying the folder works — for major upgrades, reinstall.** A jump from 4.4.1 to 4.4.2 keeps the same library folder, so nothing breaks. A jump from 4.3 to 4.4 creates a new folder and breaks any package with compiled code. Always reinstall after a major.minor bump.

**Try it:** Write code that prints the major.minor version number from `R.version.string` (e.g., `"4.4"`).

```r
# Try it: extract major.minor
# Combine R.version$major and R.version$minor — note minor is "4.2" style
# your code here

```

<details>
<summary>Click to reveal solution</summary>

```r
paste(R.version$major, sub("\\..*", "", R.version$minor), sep = ".")
#> [1] "4.4"
```

**Explanation:** `R.version$minor` is something like `"4.2"`, so `sub()` strips the patch number. Concatenating with the major version gives the same `4.4` you see in the library folder name.

</details>

## Cause 5: Is it a Bioconductor package that needs BiocManager?

Bioconductor is a separate R package repository for bioinformatics tools — `limma`, `DESeq2`, `Biostrings`, `edgeR`, and several hundred others live there, not on CRAN. `install.packages("limma")` will fail with `package 'limma' is not available` because CRAN does not host it. You need the `BiocManager` package as the bridge.

```r
# CRAN attempt fails for a Bioconductor package
# install.packages("limma")
#> Warning: package 'limma' is not available for this version of R

# Right way: install BiocManager once, then use it for any BioC package
# install.packages("BiocManager")
# BiocManager::install("limma")

# After install, library() works the same way as any CRAN package
# library(limma)

# Quick test: is a name a Bioconductor package?
biocp <- c("limma", "DESeq2", "edgeR", "Biostrings")
biocp
#> [1] "limma"      "DESeq2"     "edgeR"      "Biostrings"
```

`BiocManager::install()` accepts both Bioconductor and CRAN names, so once you have it installed you can use it as a drop-in replacement for `install.packages()`. The Bioconductor team releases two versions a year (April and October) and pins each release to a specific R version — installing into an unsupported R version is the second-most-common cause of trouble after forgetting `BiocManager` entirely.

[NOTE]
**Bioconductor has its own release cycle pinned to R versions.** `BiocManager::version()` shows which Bioconductor release matches your R install. If the message says your R version is "out of date for this Bioconductor release," upgrade R first, then reinstall `BiocManager`.

**Try it:** Write code that checks whether `BiocManager` is installed (without loading it) and prints `"yes"` or `"no"`.

```r
# Try it: detect BiocManager
# Use requireNamespace() with quietly = TRUE
# your code here

```

<details>
<summary>Click to reveal solution</summary>

```r
if (requireNamespace("BiocManager", quietly = TRUE)) "yes" else "no"
#> [1] "no"
```

**Explanation:** `requireNamespace()` checks for the package without attaching it. If it returns `FALSE`, you need to run `install.packages("BiocManager")` once before installing any Bioconductor package.

</details>

## Cause 6: Is it a GitHub-only package that needs remotes::install_github()?

A surprising number of useful R packages live only on GitHub — development versions of CRAN packages, niche tools, internal company packages, or projects whose authors never bothered to submit to CRAN. `install.packages()` only knows how to fetch from CRAN-style repositories, so it returns the same "not available" warning even when the package very much exists on someone's GitHub page.

```r
# CRAN install will fail for github-only packages
# install.packages("hadley/emo")
#> Warning: package 'hadley/emo' is not available

# Right way: use remotes::install_github("user/repo")
# install.packages("remotes")
# remotes::install_github("hadley/emo")

# After install, the library() call uses the package name only (no user/)
# library(emo)

# Pin a specific commit for reproducibility
# remotes::install_github("hadley/emo@abc1234")

# Pin a release tag
# remotes::install_github("hadley/emo@v0.0.2")
```

The `user/repo` syntax is a GitHub coordinate, not a package name — once installed, the package is loaded by its actual name (no user prefix). The `@` suffix lets you pin to a commit SHA or release tag, which is the only way to make a GitHub install reproducible. `devtools::install_github()` works the same way and is just `remotes::install_github()` with extra dependencies.

[WARNING]
**Pin GitHub installs to a commit or tag for reproducible scripts.** A bare `remotes::install_github("user/repo")` installs whatever is on the default branch *right now*, which can change overnight. For any script that another person will run, append `@<commit>` or `@<tag>` so the install is locked.

**Try it:** Write a comment-only block showing how you would install `r-lib/cli` pinned to release tag `v3.6.0` using `remotes`.

```r
# Try it: pin a github install
# Use remotes::install_github with the @tag syntax
# your code here

```

<details>
<summary>Click to reveal solution</summary>

```r
# install.packages("remotes")
# remotes::install_github("r-lib/cli@v3.6.0")
# library(cli)
```

**Explanation:** The `@v3.6.0` suffix tells `install_github` to check out that exact release tag instead of the default branch. Without it, the install would track moving targets.

</details>

## How do you stop this error from happening again?

Every cause above shares a root: R does not know what packages your script needs, only what is currently sitting in its library folders. The fix is to make those needs explicit and version-pinned. The lightweight version is `sessionInfo()` at the bottom of every script. The full version is `renv`, which records every package and version into a lockfile your collaborators can restore with one command.

```r
# Lightweight: print every loaded package + version at the end of a script
si <- sessionInfo()
si$otherPkgs |> names()
#> NULL

# Heavyweight: renv lockfile workflow (run in your project folder)
# renv::init()        # snapshot the current library
# renv::snapshot()    # update the lockfile after installing new packages
# renv::restore()     # rebuild the library from the lockfile on a new machine

# Quick reproducibility report
report <- list(
  r_version  = R.version.string,
  lib_paths  = .libPaths(),
  pkg_count  = length(installed.packages()[, "Package"])
)
str(report, max.level = 1)
#> List of 3
#>  $ r_version: chr "R version 4.4.2 (2024-10-31)"
#>  $ lib_paths: chr [1:2] "/home/user/R/.../4.4" "/usr/lib/R/site-library"
#>  $ pkg_count: int 312
```

The three-field report is the smallest possible fingerprint — paste it at the end of any bug report or issue ticket and the person helping you can immediately spot mismatches. For team projects, escalate to `renv`: it stores every package version in a `renv.lock` file that lives in your project, so anyone who clones the repo can restore exactly the same library with `renv::restore()`.

[KEY INSIGHT]
**Reproducibility starts with one library, not one script.** Code is portable; packages are not. A script that "works on my machine" works because of the specific package versions in your specific library folder. Pin those, and the "no package called X" error disappears for everyone who runs your code.

**Try it:** Write code that prints the names of the first 5 packages in `installed.packages()` (sorted alphabetically).

```r
# Try it: peek at your installed packages
# Use rownames(installed.packages()) and head(., 5)
# your code here

```

<details>
<summary>Click to reveal solution</summary>

```r
head(sort(rownames(installed.packages())), 5)
#> [1] "base"       "boot"       "class"      "cluster"    "codetools"
```

**Explanation:** `rownames(installed.packages())` returns every installed package name; `sort()` puts them in alphabetical order; `head(., 5)` keeps the first five.

</details>

## Practice Exercises

### Exercise 1: Diagnose where a package actually lives

Write a function `find_pkg_folder(pkg)` that takes a package name and returns the first `.libPaths()` entry that contains a folder with that name — or `NA_character_` if no entry contains it. Test it on `"stats"` (a base package) and `"thispkgdoesnotexist"`.

```r
# Exercise: locate a package across all libPaths
# Hint: walk .libPaths() with sapply, then subset

# Write your code below:

```

<details>
<summary>Click to reveal solution</summary>

```r
find_pkg_folder <- function(pkg) {
  hits <- .libPaths()[sapply(.libPaths(), function(d) pkg %in% list.files(d))]
  if (length(hits) > 0) hits[1] else NA_character_
}

find_pkg_folder("stats")
#> [1] "/usr/lib/R/library"

find_pkg_folder("thispkgdoesnotexist")
#> [1] NA
```

**Explanation:** `sapply()` produces a logical vector of which library folders contain a directory named after the package. Subsetting `.libPaths()` by that vector gives only the matching folders, and `[1]` picks the first — which is also the one R would use for `library()`.

</details>

### Exercise 2: Build a safe loader

Write a function `safe_library(pkg)` that attempts to load `pkg` with `requireNamespace()`. If it succeeds, print `"loaded: <pkg>"`. If it fails, print `"missing: <pkg> — install with install.packages('<pkg>')"`. Return `TRUE` or `FALSE` invisibly.

```r
# Exercise: graceful loader with install hint
# Hint: use requireNamespace + invisible()

# Write your code below:

```

<details>
<summary>Click to reveal solution</summary>

```r
safe_library <- function(pkg) {
  ok <- requireNamespace(pkg, quietly = TRUE)
  if (ok) {
    message("loaded: ", pkg)
  } else {
    message("missing: ", pkg, " — install with install.packages('", pkg, "')")
  }
  invisible(ok)
}

safe_library("stats")
#> loaded: stats

safe_library("thispkgdoesnotexist")
#> missing: thispkgdoesnotexist — install with install.packages('thispkgdoesnotexist')
```

**Explanation:** `requireNamespace()` returns a logical instead of throwing an error, which is what makes the wrapper safe. Returning the logical with `invisible()` lets callers branch on the result without cluttering the console.

</details>

### Exercise 3: Source-aware installer

Write a function `install_from(pkg, source)` that prints (does not run) the correct install command based on `source`: `"cran"`, `"bioc"`, or `"github"`. For `"github"`, the input format is `"user/repo"`. Use `match.arg()` to validate `source`.

```r
# Exercise: route an install to the right helper
# Hint: switch() handles three named branches cleanly

# Write your code below:

```

<details>
<summary>Click to reveal solution</summary>

```r
install_from <- function(pkg, source = c("cran", "bioc", "github")) {
  source <- match.arg(source)
  cmd <- switch(source,
    cran   = sprintf('install.packages("%s")', pkg),
    bioc   = sprintf('BiocManager::install("%s")', pkg),
    github = sprintf('remotes::install_github("%s")', pkg)
  )
  message("Run this in your local R: ", cmd)
  invisible(cmd)
}

install_from("dplyr", "cran")
#> Run this in your local R: install.packages("dplyr")

install_from("limma", "bioc")
#> Run this in your local R: BiocManager::install("limma")

install_from("hadley/emo", "github")
#> Run this in your local R: remotes::install_github("hadley/emo")
```

**Explanation:** `match.arg()` validates that `source` is one of the allowed values and lets you abbreviate. `switch()` picks the matching command template; `sprintf()` substitutes the package name. Returning the command invisibly lets callers capture and run it later.

</details>

## Complete Example

Here is a single diagnostic function you can paste at the top of any script that loads packages. It walks through each cause in order and prints the most likely fix.

```r
diagnose_package <- function(pkg) {
  cat("Diagnosing package:", pkg, "\n")
  cat("R version:", R.version.string, "\n")
  cat("\n.libPaths():\n")
  print(.libPaths())

  # Cause 1: simply not installed?
  installed <- pkg %in% rownames(installed.packages())
  cat("\nInstalled? ", installed, "\n", sep = "")
  if (!installed) {
    cat("-> Likely Cause 1 (never installed) or Cause 5/6 (wrong source).\n")
    cat("   Try install.packages('", pkg, "') first.\n", sep = "")
  }

  # Cause 2: half-installed lock folder?
  locks <- list.files(.libPaths()[1], pattern = paste0("^00LOCK-", pkg, "$"))
  if (length(locks) > 0) {
    cat("-> Cause 2 detected: 00LOCK folder exists. Delete it and reinstall.\n")
  }

  # Cause 3: installed somewhere R isn't reading from?
  hits <- .libPaths()[sapply(.libPaths(), function(d) pkg %in% list.files(d))]
  cat("\nFolders containing '", pkg, "': ", length(hits), "\n", sep = "")
  if (length(hits) == 0 && installed) {
    cat("-> Cause 3 likely: package recorded but not in any libPath.\n")
  }

  invisible(NULL)
}

diagnose_package("stats")
#> Diagnosing package: stats
#> R version: R version 4.4.2 (2024-10-31)
#>
#> .libPaths():
#> [1] "/home/user/R/x86_64-pc-linux-gnu-library/4.4"
#> [2] "/usr/lib/R/site-library"
#> [3] "/usr/lib/R/library"
#>
#> Installed? TRUE
#>
#> Folders containing 'stats': 1
```

The function prints every diagnostic an experienced R user would run by hand: the R version, the library path, whether the package is on `installed.packages()`, whether a `00LOCK` folder is left over from a crashed install, and which library folder actually contains it. Running it on a missing package walks you straight to the cause.

## Summary

| Cause | Diagnostic | Fix |
|---|---|---|
| 1. Never installed | `pkg %in% rownames(installed.packages())` is `FALSE` | `install.packages("pkg")` |
| 2. Install failed silently | `00LOCK-pkg` folder in `.libPaths()[1]` | Delete lock folder; reinstall with `type = "binary"` |
| 3. Wrong libPath | Package present in disk folder but not in `.libPaths()` | `.libPaths(c(folder, .libPaths()))` |
| 4. R version upgrade | `library/4.X` folder in path differs from current `R.version` | Reinstall packages against the new R version |
| 5. Bioconductor package | `install.packages()` says "not available" | `BiocManager::install("pkg")` |
| 6. GitHub-only package | `install.packages()` says "not available" | `remotes::install_github("user/repo")` |
| Prevention | `sessionInfo()` mismatch across machines | Adopt `renv` for project libraries |

## References

1. R Core Team — *R Installation and Administration*, Add-on packages chapter. [Link](https://cran.r-project.org/doc/manuals/r-release/R-admin.html#Add_002don-packages)
2. R Core Team — `?library`, `?install.packages`, `?find.package` reference pages.
3. Bioconductor — *Install Bioconductor*. [Link](https://bioconductor.org/install/)
4. `remotes` package documentation — `install_github()` reference. [Link](https://remotes.r-lib.org/reference/install_github.html)
5. `renv` package — *Introduction to renv*. [Link](https://rstudio.github.io/renv/articles/renv.html)
6. Wickham, H. & Bryan, J. — *R Packages*, 2nd Edition. [Link](https://r-pkgs.org/)
7. R FAQ — Common installation issues. [Link](https://cran.r-project.org/doc/FAQ/R-FAQ.html)

## Continue Learning

1. [50 R Errors Decoded: Plain-English Explanations and Exact Fixes](R-Common-Errors.html) — the parent reference covering every common R error.
2. [R Error: 'could not find function' — Package Not Loaded or Name Conflict?](R-Error-Function-Not-Found.html) — what to do when the package loaded but a function name still won't resolve.
3. [R Error: 'object not found' — 7 Different Causes, 7 Different Fixes](R-Error-Object-Not-Found.html) — the sister error for missing variables and datasets.

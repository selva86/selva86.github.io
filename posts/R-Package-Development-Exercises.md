---
title: "R Package Development Exercises: 20 Practice Problems"
slug: "R-Package-Development-Exercises"
description: "Twenty R package development exercises with hidden solutions: scaffold with usethis, write roxygen2 docs, run devtools check, set up testthat, prep CRAN."
keywords: "devtools R package exercises, R package development, usethis R, roxygen2 documentation, testthat R, CRAN submission practice"
mathjax: false
webr: false
date: "2026-05-13"
post_type: "EX"
sidebar_title: "R Package Development"
sidebar_order: 168
fr_parent: "R-Tutorial.html"
auto_link_terms: "devtools R package exercises|R package development|usethis|roxygen2 documentation|testthat"
auto_link_case_sensitive: false
target_keyword: "devtools R package exercises"
sibling_block_enabled: false
difficulty: "Mixed"
---

# R Package Development Exercises: 20 Practice Problems

<p class="lead">Twenty package-shipping problems covering usethis scaffolds, DESCRIPTION metadata, roxygen2 documentation, testthat suites, and the devtools check-build-install loop. Solutions are hidden behind expandable blocks so you can attempt each problem first, then verify your answer against a runnable reference implementation.</p>

```r title="Run this once before any exercise"
library(usethis)
library(devtools)
library(roxygen2)
library(testthat)
library(desc)
library(pkgload)
```

All exercises operate inside `tempdir()` so nothing is written to your real working directory. Run each exercise as a self-contained block.

## Section 1. Scaffolding a package skeleton (4 problems)

### Exercise 1.1: Scaffold a fresh package inside a temp directory

**Task:** A maintainer prototyping a new internal helper wants a clean package skeleton in a throwaway location so accidental commits never reach the team repo. Use `usethis::create_package()` to scaffold a package named "rspkg" inside `tempdir()` with `open = FALSE`, then capture the sorted vector of top-level entries it produced and save to `ex_1_1`.

**Expected result:**

```
> ex_1_1
[1] ".Rbuildignore" "DESCRIPTION"   "NAMESPACE"     "R"             "rspkg.Rproj"
```

**Difficulty:** Beginner

```r title="Your turn"
ex_1_1 <- # your code here
ex_1_1
```

<details>
<summary>Click to reveal solution</summary>

```r title="Solution"
pkg_path <- file.path(tempdir(), "rspkg")
usethis::create_package(pkg_path, open = FALSE)
ex_1_1 <- sort(list.files(pkg_path, all.files = TRUE, no.. = TRUE))
ex_1_1
#> [1] ".Rbuildignore" "DESCRIPTION"   "NAMESPACE"     "R"             "rspkg.Rproj"
```

**Explanation:** `usethis::create_package()` writes the minimum CRAN-acceptable skeleton: a `DESCRIPTION` (machine-readable metadata), an empty `NAMESPACE`, an `R/` source directory, a `.Rbuildignore` listing files to exclude from `R CMD build`, and a `.Rproj` file for RStudio integration. Setting `open = FALSE` avoids spawning a new IDE window, which is essential for scripted setup in CI or batch test runs.

</details>

### Exercise 1.2: Add an MIT license to the freshly scaffolded package

**Task:** The legal team requires every internal package to ship a permissive license before any code is committed. Activate the package from 1.1 as the project root with `usethis::proj_set()`, run `usethis::use_mit_license("Acme Corp")`, then read the resulting one-line LICENSE file and save the character vector to `ex_1_2`.

**Expected result:**

```
> ex_1_2
[1] "YEAR: 2026"               "COPYRIGHT HOLDER: Acme Corp"
```

**Difficulty:** Intermediate

```r title="Your turn"
ex_1_2 <- # your code here
ex_1_2
```

<details>
<summary>Click to reveal solution</summary>

```r title="Solution"
pkg_path <- file.path(tempdir(), "rspkg")
usethis::proj_set(pkg_path, force = TRUE)
usethis::use_mit_license("Acme Corp")
ex_1_2 <- readLines(file.path(pkg_path, "LICENSE"))
ex_1_2
#> [1] "YEAR: 2026"               "COPYRIGHT HOLDER: Acme Corp"
```

**Explanation:** `use_mit_license()` does three coordinated things: writes a two-line `LICENSE` template (year and copyright holder), creates a `LICENSE.md` with the full MIT text, and edits `DESCRIPTION` to set `License: MIT + file LICENSE`. CRAN requires the `+ file LICENSE` form because the MIT license itself needs a copyright statement, and the standalone `LICENSE.md` is what users see on GitHub. Calling `proj_set()` first is mandatory: every `usethis::use_*` function needs an active project context.

</details>

### Exercise 1.3: Create an R source file and Roxygen stub with use_r

**Task:** With the skeleton in place, the next step is to add a first R function file. Activate the package from 1.1, call `usethis::use_r("string_utils")` to create `R/string_utils.R`, then capture the full character vector returned by `readLines()` on that file and save it to `ex_1_3`.

**Expected result:**

```
> ex_1_3
character(0)
```

**Difficulty:** Intermediate

```r title="Your turn"
ex_1_3 <- # your code here
ex_1_3
```

<details>
<summary>Click to reveal solution</summary>

```r title="Solution"
pkg_path <- file.path(tempdir(), "rspkg")
usethis::proj_set(pkg_path, force = TRUE)
usethis::use_r("string_utils")
ex_1_3 <- readLines(file.path(pkg_path, "R", "string_utils.R"))
ex_1_3
#> character(0)
```

**Explanation:** `use_r("string_utils")` creates an empty `R/string_utils.R` if it does not already exist (and silently opens it in interactive mode). The empty file is intentional: usethis nudges you toward one-file-per-function-family naming without prescribing content. `readLines()` on an empty file returns `character(0)` rather than throwing, which makes it safe in pipelines that audit package contents.

</details>

### Exercise 1.4: Edit DESCRIPTION Title and Authors with the desc package

**Task:** The default DESCRIPTION ships with placeholder Title and Authors fields that fail `R CMD check`. Activate the package from 1.1, then use `desc::desc()` to load DESCRIPTION as a mutable object, call `$set("Title", "Internal String Utilities")` and `$set_authors()` with one `person()` entry, write it back, and save the patched Title and Authors lines as a length-two character vector to `ex_1_4`.

**Expected result:**

```
> ex_1_4
[1] "Title: Internal String Utilities"
[2] "Authors@R: person(\"Jane\", \"Doe\", , \"jane@acme.com\", role = c(\"aut\", \"cre\"))"
```

**Difficulty:** Intermediate

```r title="Your turn"
ex_1_4 <- # your code here
ex_1_4
```

<details>
<summary>Click to reveal solution</summary>

```r title="Solution"
pkg_path <- file.path(tempdir(), "rspkg")
d <- desc::desc(file = file.path(pkg_path, "DESCRIPTION"))
d$set("Title", "Internal String Utilities")
d$set_authors(person("Jane", "Doe", email = "jane@acme.com", role = c("aut", "cre")))
d$write()
all_lines <- readLines(file.path(pkg_path, "DESCRIPTION"))
ex_1_4 <- grep("^(Title|Authors@R):", all_lines, value = TRUE)
ex_1_4
#> [1] "Title: Internal String Utilities"
#> [2] "Authors@R: person(\"Jane\", \"Doe\", , \"jane@acme.com\", role = c(\"aut\", \"cre\"))"
```

**Explanation:** `desc::desc()` is the programmatic alternative to hand-editing DESCRIPTION (and the engine behind every `usethis::use_*` that mutates metadata). The `$set_authors()` method enforces the `Authors@R` form (a `person()` call), which CRAN now prefers over the legacy free-text `Author:` and `Maintainer:` fields. Round-tripping through `desc` preserves field order and whitespace, so diffs stay clean across commits.

</details>

## Section 2. Dependencies and DESCRIPTION (3 problems)

### Exercise 2.1: Declare a hard dependency on dplyr with use_package

**Task:** The package now needs `dplyr::filter()` inside one of its functions, so dplyr must be declared as a hard dependency. Activate the package from 1.1, run `usethis::use_package("dplyr", type = "Imports")`, then read DESCRIPTION and save the line beginning with "Imports:" (with the dplyr entry that follows) as a character vector in `ex_2_1`.

**Expected result:**

```
> ex_2_1
[1] "Imports: "  "    dplyr"
```

**Difficulty:** Intermediate

```r title="Your turn"
ex_2_1 <- # your code here
ex_2_1
```

<details>
<summary>Click to reveal solution</summary>

```r title="Solution"
pkg_path <- file.path(tempdir(), "rspkg")
usethis::proj_set(pkg_path, force = TRUE)
usethis::use_package("dplyr", type = "Imports")
lines <- readLines(file.path(pkg_path, "DESCRIPTION"))
imports_start <- grep("^Imports:", lines)
ex_2_1 <- lines[imports_start:(imports_start + 1)]
ex_2_1
#> [1] "Imports: "  "    dplyr"
```

**Explanation:** `Imports` declares that the consumer must install dplyr but does not attach it on load: you still need `dplyr::filter()` or an `@importFrom` Roxygen tag to actually call its functions. Compare with `Depends` (attaches the package, polluting the user's namespace and now discouraged outside of metapackages) and `Suggests` (optional, for examples or vignettes only). `use_package()` also tidies the DESCRIPTION layout with one dependency per indented line.

</details>

### Exercise 2.2: Pin a minimum testthat version under Suggests

**Task:** The team wants the new package's tests to use the testthat 3rd-edition snapshot features, which require testthat (>= 3.0.0). Activate the package from 1.1, call `usethis::use_package("testthat", type = "Suggests", min_version = "3.0.0")`, then read DESCRIPTION and save just the Suggests block (the "Suggests:" line plus the following indented testthat entry) to `ex_2_2`.

**Expected result:**

```
> ex_2_2
[1] "Suggests: "          "    testthat (>= 3.0.0)"
```

**Difficulty:** Advanced

```r title="Your turn"
ex_2_2 <- # your code here
ex_2_2
```

<details>
<summary>Click to reveal solution</summary>

```r title="Solution"
pkg_path <- file.path(tempdir(), "rspkg")
usethis::proj_set(pkg_path, force = TRUE)
usethis::use_package("testthat", type = "Suggests", min_version = "3.0.0")
lines <- readLines(file.path(pkg_path, "DESCRIPTION"))
suggests_start <- grep("^Suggests:", lines)
ex_2_2 <- lines[suggests_start:(suggests_start + 1)]
ex_2_2
#> [1] "Suggests: "          "    testthat (>= 3.0.0)"
```

**Explanation:** `min_version` rewrites the entry as `testthat (>= 3.0.0)`, which `R CMD check` parses and uses to refuse installation on older testthat versions. `Suggests` is the right slot here because testthat is needed only at test time, not at runtime: keeping it out of `Imports` shaves install time for end users. Pin a minimum only when you rely on a feature introduced in that version, otherwise the constraint becomes friction.

</details>

### Exercise 2.3: Bump the package version with desc_bump_version

**Task:** After landing a minor feature, the release captain bumps the version before tagging the commit. From the package set up in 1.1, call `desc::desc_bump_version("minor")` against its DESCRIPTION, then read DESCRIPTION and save the line beginning with "Version:" to `ex_2_3` as a length-one character vector.

**Expected result:**

```
> ex_2_3
[1] "Version: 0.1.0"
```

**Difficulty:** Advanced

```r title="Your turn"
ex_2_3 <- # your code here
ex_2_3
```

<details>
<summary>Click to reveal solution</summary>

```r title="Solution"
pkg_path <- file.path(tempdir(), "rspkg")
desc::desc_bump_version("minor", file = file.path(pkg_path, "DESCRIPTION"))
lines <- readLines(file.path(pkg_path, "DESCRIPTION"))
ex_2_3 <- grep("^Version:", lines, value = TRUE)
ex_2_3
#> [1] "Version: 0.1.0"
```

**Explanation:** `desc_bump_version("minor")` follows the four-component R/CRAN convention where `0.0.0.9000` is the in-development tag and a "minor" bump drops the development suffix and increments the third number to produce `0.1.0`. Valid which-arguments are `"major"`, `"minor"`, `"patch"`, and `"dev"`. Bumping `dev` from `0.1.0` produces `0.1.0.9000`, the convention CRAN expects between releases. Manual edits work but lose the strict semver-style parsing that catches typos like `0.10.0` versus `0.1.0`.

</details>

## Section 3. Documenting functions with roxygen2 (4 problems)

### Exercise 3.1: Write a basic Roxygen header above an exported function

**Task:** A new helper called `pad_zero()` zero-pads a numeric vector to a target width. Activate the package from 1.1, write the function plus a four-line Roxygen header (`@title`, `@description`, `@param`, `@return`) into `R/pad_zero.R`, then read the file back and save the lines beginning with `#'` as a character vector in `ex_3_1`.

**Expected result:**

```
> ex_3_1
[1] "#' Zero-pad a numeric vector"
[2] "#'"
[3] "#' Coerces x to integer then left-pads with zeros to the given width."
[4] "#' @param x A numeric vector."
[5] "#' @param width Integer width of the output strings."
[6] "#' @return A character vector the same length as x."
```

**Difficulty:** Beginner

```r title="Your turn"
ex_3_1 <- # your code here
ex_3_1
```

<details>
<summary>Click to reveal solution</summary>

```r title="Solution"
pkg_path <- file.path(tempdir(), "rspkg")
src <- c(
  "#' Zero-pad a numeric vector",
  "#'",
  "#' Coerces x to integer then left-pads with zeros to the given width.",
  "#' @param x A numeric vector.",
  "#' @param width Integer width of the output strings.",
  "#' @return A character vector the same length as x.",
  "pad_zero <- function(x, width) {",
  "  formatC(as.integer(x), width = width, flag = \"0\")",
  "}"
)
writeLines(src, file.path(pkg_path, "R", "pad_zero.R"))
all_lines <- readLines(file.path(pkg_path, "R", "pad_zero.R"))
ex_3_1 <- all_lines[startsWith(all_lines, "#'")]
ex_3_1
```

**Explanation:** A Roxygen block is just R comments that start with `#'` and sit directly above the function definition. The first sentence becomes `@title` automatically (no tag needed), the paragraph that follows becomes `@description`. Each `@param` documents a single argument and shows up in the Rd file under `\arguments`. Skipping `@return` triggers an `R CMD check` note for exported functions, so include it from day one.

</details>

### Exercise 3.2: Render the Roxygen block to Rd with roxygen2::roxygenise

**Task:** With the Roxygen header in place from 3.1, the next step is to generate the actual help file. Call `roxygen2::roxygenise(pkg_path)` on the package from 1.1, then read `man/pad_zero.Rd` and save the lines containing the rendered title, the first argument item, and the return value as a length-three character vector in `ex_3_2`.

**Expected result:**

```
> ex_3_2
[1] "\\title{Zero-pad a numeric vector}"
[2] "\\item{x}{A numeric vector.}"
[3] "A character vector the same length as x."
```

**Difficulty:** Intermediate

```r title="Your turn"
ex_3_2 <- # your code here
ex_3_2
```

<details>
<summary>Click to reveal solution</summary>

```r title="Solution"
pkg_path <- file.path(tempdir(), "rspkg")
roxygen2::roxygenise(pkg_path)
rd_lines <- readLines(file.path(pkg_path, "man", "pad_zero.Rd"))
ex_3_2 <- c(
  grep("^\\\\title", rd_lines, value = TRUE),
  grep("^\\\\item\\{x\\}", rd_lines, value = TRUE),
  rd_lines[grep("^A character vector", rd_lines)]
)
ex_3_2
#> [1] "\\title{Zero-pad a numeric vector}"
#> [2] "\\item{x}{A numeric vector.}"
#> [3] "A character vector the same length as x."
```

**Explanation:** `roxygenise()` walks `R/*.R`, parses every Roxygen block, and writes one `.Rd` file per documented object into `man/`. The Rd format is LaTeX-flavoured and is what `?pad_zero` ultimately renders. Rd files are derived artefacts: never edit them by hand because the next `roxygenise()` (or `devtools::document()`) will overwrite your changes. Adding `Roxygen: list(markdown = TRUE)` to DESCRIPTION lets you write Markdown inside Roxygen blocks instead of raw Rd macros.

</details>

### Exercise 3.3: Add an @examples block and verify it lands in the Rd

**Task:** Documentation without runnable examples often gets flagged in code review. Append `@examples` plus a one-line example to the `pad_zero()` Roxygen header from 3.1, re-run `roxygen2::roxygenise()`, then read `man/pad_zero.Rd` and save the lines between (and including) `\examples{` and the matching closing brace to `ex_3_3`.

**Expected result:**

```
> ex_3_3
[1] "\\examples{"                   "pad_zero(c(7, 42), width = 4)"
[3] "}"
```

**Difficulty:** Intermediate

```r title="Your turn"
ex_3_3 <- # your code here
ex_3_3
```

<details>
<summary>Click to reveal solution</summary>

```r title="Solution"
pkg_path <- file.path(tempdir(), "rspkg")
old <- readLines(file.path(pkg_path, "R", "pad_zero.R"))
fn_start <- grep("^pad_zero", old)
new <- append(old, c("#' @examples", "#' pad_zero(c(7, 42), width = 4)"), after = fn_start - 1)
writeLines(new, file.path(pkg_path, "R", "pad_zero.R"))
roxygen2::roxygenise(pkg_path)
rd <- readLines(file.path(pkg_path, "man", "pad_zero.Rd"))
start <- grep("\\\\examples\\{", rd)
end <- start + which(rd[start:length(rd)] == "}")[1] - 1
ex_3_3 <- rd[start:end]
ex_3_3
#> [1] "\\examples{"                   "pad_zero(c(7, 42), width = 4)"
#> [3] "}"
```

**Explanation:** `\examples{}` is executed during `R CMD check --as-cran`: failures here are common rejection reasons on CRAN. Wrap slow or network-bound code in `\donttest{}` (still parsed but not run on CRAN) or `\dontrun{}` (parsed but never run, including by `example()`). Examples must be self-contained, so reference only base-R objects or objects you construct in the example itself.

</details>

### Exercise 3.4: Export pad_zero and verify NAMESPACE contains the export

**Task:** Functions are not callable from outside the package until they are exported. Add a `@export` tag to the `pad_zero()` Roxygen header from 3.3, re-run `roxygen2::roxygenise()` on the package from 1.1, then read `NAMESPACE` and save the line that registers the export to `ex_3_4` as a length-one character vector.

**Expected result:**

```
> ex_3_4
[1] "export(pad_zero)"
```

**Difficulty:** Advanced

```r title="Your turn"
ex_3_4 <- # your code here
ex_3_4
```

<details>
<summary>Click to reveal solution</summary>

```r title="Solution"
pkg_path <- file.path(tempdir(), "rspkg")
old <- readLines(file.path(pkg_path, "R", "pad_zero.R"))
fn_line <- grep("^pad_zero", old)
new <- append(old, "#' @export", after = fn_line - 1)
writeLines(new, file.path(pkg_path, "R", "pad_zero.R"))
roxygen2::roxygenise(pkg_path)
ns <- readLines(file.path(pkg_path, "NAMESPACE"))
ex_3_4 <- grep("^export\\(pad_zero\\)", ns, value = TRUE)
ex_3_4
#> [1] "export(pad_zero)"
```

**Explanation:** `@export` instructs Roxygen to add a single `export(fn)` directive to `NAMESPACE`. The NAMESPACE file is the contract between the package and the rest of R: only listed objects are visible via `pkg::fn` (and made available unqualified after `library(pkg)`). Internal helpers should not be exported, which keeps the public API small and frees you to refactor them without breaking downstream code. The reverse tag `@noRd` skips Rd generation altogether for objects you do want documented inline but not on the user-facing help index.

</details>

## Section 4. Testing with testthat (4 problems)

### Exercise 4.1: Initialize testthat infrastructure with use_testthat

**Task:** Tests live under `tests/testthat/`, and the bootstrap is best left to usethis so that the runner script is wired correctly. Activate the package from 1.1, run `usethis::use_testthat(edition = 3)`, then list the contents of the `tests/` directory recursively (using forward-slash separators) and save the sorted character vector to `ex_4_1`.

**Expected result:**

```
> ex_4_1
[1] "testthat"    "testthat.R"
```

**Difficulty:** Beginner

```r title="Your turn"
ex_4_1 <- # your code here
ex_4_1
```

<details>
<summary>Click to reveal solution</summary>

```r title="Solution"
pkg_path <- file.path(tempdir(), "rspkg")
usethis::proj_set(pkg_path, force = TRUE)
usethis::use_testthat(edition = 3)
ex_4_1 <- sort(list.files(file.path(pkg_path, "tests")))
ex_4_1
#> [1] "testthat"    "testthat.R"
```

**Explanation:** `use_testthat(edition = 3)` does four things in one call: creates `tests/testthat/`, writes `tests/testthat.R` (the bootstrapper that `R CMD check` invokes), adds testthat to `Suggests` in DESCRIPTION, and pins `Config/testthat/edition: 3` so new features (snapshot tests, parallel runners) are on by default. Editing the bootstrapper by hand is rarely necessary: the generated file already runs `testthat::test_check("pkgname")`.

</details>

### Exercise 4.2: Write your first test_that block and run it programmatically

**Task:** After bootstrapping testthat in 4.1, write a real assertion. Create `tests/testthat/test-pad_zero.R` with a single `test_that()` block calling `expect_equal(pad_zero(7, 3), "007")` and one for width 4, then run the tests with `testthat::test_dir()` and save the resulting `data.frame` summary (one row per test file) to `ex_4_2`.

**Expected result:**

```
> ex_4_2[, c("file", "nb", "failed", "warning", "skipped", "error")]
            file nb failed warning skipped error
1 test-pad_zero  2      0       0       0 FALSE
```

**Difficulty:** Intermediate

```r title="Your turn"
ex_4_2 <- # your code here
ex_4_2
```

<details>
<summary>Click to reveal solution</summary>

```r title="Solution"
pkg_path <- file.path(tempdir(), "rspkg")
pkgload::load_all(pkg_path, quiet = TRUE)
test_src <- c(
  'test_that("pad_zero pads to width 3", {',
  '  expect_equal(pad_zero(7, 3), "007")',
  '})',
  'test_that("pad_zero pads to width 4", {',
  '  expect_equal(pad_zero(42, 4), "0042")',
  '})'
)
writeLines(test_src, file.path(pkg_path, "tests", "testthat", "test-pad_zero.R"))
ex_4_2 <- as.data.frame(testthat::test_dir(file.path(pkg_path, "tests", "testthat"),
                                            reporter = "silent"))
ex_4_2[, c("file", "nb", "failed", "warning", "skipped", "error")]
#>            file nb failed warning skipped error
#> 1 test-pad_zero  2      0       0       0 FALSE
```

**Explanation:** `test_dir()` returns a `testthat_results` object that prints as a status line but coerces cleanly to a `data.frame` with one row per test file. The `nb` column counts assertions (not `test_that` blocks). `pkgload::load_all()` is the in-memory equivalent of installing the package and is what makes `pad_zero` available to the test without a build cycle: it is exactly what `devtools::load_all()` calls under the hood. Using the silent reporter keeps the output programmatic.

</details>

### Exercise 4.3: Use expect_error to verify defensive failure modes

**Task:** Good packages fail loudly on bad inputs. Edit `pad_zero` in the package from 1.1 so that calling it with `width < 1` throws `stop("width must be positive")`, then add a third `test_that()` block to `test-pad_zero.R` that uses `expect_error()` with a regexp matcher to confirm the message. Run the suite with `testthat::test_dir()` and save the failed-count column (single integer) for the test file to `ex_4_3`.

**Expected result:**

```
> ex_4_3
[1] 0
```

**Difficulty:** Intermediate

```r title="Your turn"
ex_4_3 <- # your code here
ex_4_3
```

<details>
<summary>Click to reveal solution</summary>

```r title="Solution"
pkg_path <- file.path(tempdir(), "rspkg")
fn_src <- c(
  "pad_zero <- function(x, width) {",
  "  if (width < 1) stop(\"width must be positive\")",
  "  formatC(as.integer(x), width = width, flag = \"0\")",
  "}"
)
writeLines(fn_src, file.path(pkg_path, "R", "pad_zero.R"))
pkgload::load_all(pkg_path, quiet = TRUE)
extra <- c(
  'test_that("pad_zero rejects non-positive width", {',
  '  expect_error(pad_zero(1, 0), "width must be positive")',
  '})'
)
test_file <- file.path(pkg_path, "tests", "testthat", "test-pad_zero.R")
writeLines(c(readLines(test_file), extra), test_file)
res <- as.data.frame(testthat::test_dir(file.path(pkg_path, "tests", "testthat"),
                                         reporter = "silent"))
ex_4_3 <- res$failed[1]
ex_4_3
#> [1] 0
```

**Explanation:** `expect_error()` runs the expression inside `tryCatch()` and passes if the call signals an error whose `conditionMessage()` matches the supplied regexp. Anchoring with `^width` is even safer because it guards against the message later gaining a prefix. Asserting on the message text (not just "did it throw") catches the easy mistake where the function dies from a totally unrelated bug and you would never notice. Pair with `expect_warning()` for soft failures.

</details>

### Exercise 4.4: Snapshot test the print output of a small object

**Task:** Snapshot tests freeze the printed form of an object and flag any future change. With testthat 3 enabled in 4.1, add a fourth `test_that()` block calling `expect_snapshot()` on `pad_zero(c(1, 23, 456), width = 4)`. Run `testthat::test_dir()`, then read the auto-generated `tests/testthat/_snaps/pad_zero.md` and save the line containing the snapshot output (after the `Code` and `Output` markers) to `ex_4_4` as a length-one character vector.

**Expected result:**

```
> ex_4_4
[1] "    [1] \"0001\" \"0023\" \"0456\""
```

**Difficulty:** Advanced

```r title="Your turn"
ex_4_4 <- # your code here
ex_4_4
```

<details>
<summary>Click to reveal solution</summary>

```r title="Solution"
pkg_path <- file.path(tempdir(), "rspkg")
pkgload::load_all(pkg_path, quiet = TRUE)
extra <- c(
  'test_that("pad_zero snapshot of a small vector", {',
  '  expect_snapshot(pad_zero(c(1, 23, 456), width = 4))',
  '})'
)
test_file <- file.path(pkg_path, "tests", "testthat", "test-pad_zero.R")
writeLines(c(readLines(test_file), extra), test_file)
suppressMessages(testthat::test_dir(file.path(pkg_path, "tests", "testthat"),
                                     reporter = "silent"))
snap_path <- file.path(pkg_path, "tests", "testthat", "_snaps", "pad_zero.md")
snap_lines <- readLines(snap_path)
ex_4_4 <- snap_lines[grep('^    \\[1\\]', snap_lines)]
ex_4_4
#> [1] "    [1] \"0001\" \"0023\" \"0456\""
```

**Explanation:** Snapshots solve the problem of "I want to test print output but typing out the exact lines is brittle". On first run testthat records the output to `_snaps/<test-file>.md`; on later runs it diffs the captured output and fails the test if it changed. Intentional changes are confirmed with `testthat::snapshot_accept()`. Snapshots work best for objects with stable, human-readable prints: avoid them for environments, function objects, or anything with memory addresses in the print.

</details>

## Section 5. devtools check, build, install (3 problems)

### Exercise 5.1: Regenerate Rd files with devtools::document and audit man/

**Task:** `devtools::document()` is the day-to-day wrapper around `roxygen2::roxygenise()` that also tidies NAMESPACE. From the package set up in 1.1 (with the documented `pad_zero` from Section 3), call `devtools::document(pkg_path, quiet = TRUE)` then list the contents of `man/` sorted, save the resulting character vector to `ex_5_1`.

**Expected result:**

```
> ex_5_1
[1] "pad_zero.Rd"
```

**Difficulty:** Intermediate

```r title="Your turn"
ex_5_1 <- # your code here
ex_5_1
```

<details>
<summary>Click to reveal solution</summary>

```r title="Solution"
pkg_path <- file.path(tempdir(), "rspkg")
devtools::document(pkg_path, quiet = TRUE)
ex_5_1 <- sort(list.files(file.path(pkg_path, "man")))
ex_5_1
#> [1] "pad_zero.Rd"
```

**Explanation:** `devtools::document()` calls `roxygen2::roxygenise()` internally but adds two important behaviours: it tracks which Rd files came from Roxygen and deletes orphans (Rd files whose source Roxygen block has been removed), and it bumps the `RoxygenNote` field in DESCRIPTION to match the installed roxygen2 version. That metadata bump is why teams often see noisy DESCRIPTION diffs after rebasing onto a colleague's branch.

</details>

### Exercise 5.2: Run R CMD check programmatically and count notes

**Task:** Continuous integration treats `R CMD check` as the gate. From the package built up through Section 4, run `devtools::check(pkg_path, quiet = TRUE, args = "--no-tests")` (skipping the test run for speed), then save a named integer vector with the counts of errors, warnings, and notes returned in the result object to `ex_5_2`.

**Expected result:**

```
> ex_5_2
 errors warnings    notes
      0        0        0
```

**Difficulty:** Advanced

```r title="Your turn"
ex_5_2 <- # your code here
ex_5_2
```

<details>
<summary>Click to reveal solution</summary>

```r title="Solution"
pkg_path <- file.path(tempdir(), "rspkg")
chk <- devtools::check(pkg_path, quiet = TRUE, args = "--no-tests",
                       error_on = "never")
ex_5_2 <- c(errors = length(chk$errors),
            warnings = length(chk$warnings),
            notes = length(chk$notes))
ex_5_2
#> errors warnings    notes
#>      0        0        0
```

**Explanation:** `devtools::check()` returns a list with `errors`, `warnings`, and `notes` slots so a CI script can decide which severity counts as a failure. The `error_on = "never"` argument keeps the call from `stop()`ing on warnings, which is what you want when you are inspecting the counts yourself. CRAN requires zero errors and zero warnings; notes are case-by-case (some, such as "non-standard files at top level", are accepted with a justification in `cran-comments.md`).

</details>

### Exercise 5.3: Build a source tarball with devtools::build

**Task:** Releases ship as source tarballs (`pkg_VERSION.tar.gz`) produced by `R CMD build`. From the package set up in 1.1, call `devtools::build(pkg_path, path = tempdir(), quiet = TRUE)` to produce the tarball in `tempdir()`, then capture just the basename of the resulting file path and save it to `ex_5_3`.

**Expected result:**

```
> ex_5_3
[1] "rspkg_0.1.0.tar.gz"
```

**Difficulty:** Intermediate

```r title="Your turn"
ex_5_3 <- # your code here
ex_5_3
```

<details>
<summary>Click to reveal solution</summary>

```r title="Solution"
pkg_path <- file.path(tempdir(), "rspkg")
tar_path <- devtools::build(pkg_path, path = tempdir(), quiet = TRUE)
ex_5_3 <- basename(tar_path)
ex_5_3
#> [1] "rspkg_0.1.0.tar.gz"
```

**Explanation:** `devtools::build()` wraps `R CMD build`, which strips files matched by `.Rbuildignore`, compiles vignettes if any are declared, and produces a portable tarball that can be installed on any platform with `install.packages(tar_path, repos = NULL, type = "source")`. The filename format `<pkgname>_<version>.tar.gz` is dictated by CRAN policy and is how the archive is later indexed. Building once and `install.packages()` from the tarball is a safer reproducibility pattern than re-running `devtools::install()` from a checkout because the tarball is hashable.

</details>

## Section 6. Vignettes and CRAN preparation (2 problems)

### Exercise 6.1: Scaffold an introductory vignette with use_vignette

**Task:** Vignettes are long-form package documentation that ship inside the build. Activate the package from 1.1, call `usethis::use_vignette("intro", title = "Introduction to rspkg")`, then read the resulting `vignettes/intro.Rmd` and save the lines starting with "title:" and "vignette:" from its YAML front matter to `ex_6_1` as a length-two character vector.

**Expected result:**

```
> ex_6_1
[1] "title: \"Introduction to rspkg\""
[2] "vignette: >"
```

**Difficulty:** Advanced

```r title="Your turn"
ex_6_1 <- # your code here
ex_6_1
```

<details>
<summary>Click to reveal solution</summary>

```r title="Solution"
pkg_path <- file.path(tempdir(), "rspkg")
usethis::proj_set(pkg_path, force = TRUE)
usethis::use_vignette("intro", title = "Introduction to rspkg")
vg <- readLines(file.path(pkg_path, "vignettes", "intro.Rmd"))
ex_6_1 <- c(grep('^title:', vg, value = TRUE)[1],
            grep('^vignette:', vg, value = TRUE)[1])
ex_6_1
#> [1] "title: \"Introduction to rspkg\""
#> [2] "vignette: >"
```

**Explanation:** `use_vignette()` writes a skeleton `.Rmd` with the YAML keys `vignette:`, `output:`, and `title:` already populated, adds `knitr` and `rmarkdown` to `Suggests`, sets `VignetteBuilder: knitr` in DESCRIPTION, and edits `.gitignore` to exclude rendered HTML output. The block-scalar marker `vignette: >` introduces a folded multiline YAML value containing the `\VignetteIndexEntry{}` macro that `R CMD build` reads to wire the vignette into the installed package.

</details>

### Exercise 6.2: Maintain a NEWS.md changelog and add a release entry

**Task:** A `NEWS.md` is the canonical changelog and is what CRAN reviewers skim during submission. Activate the package from 1.1, run `usethis::use_news_md()`, append a bullet "Initial release with `pad_zero()`." under the top-level version heading, save the file, then read NEWS.md and save the first three non-empty lines to `ex_6_2`.

**Expected result:**

```
> ex_6_2
[1] "# rspkg 0.1.0"
[2] "* Initial CRAN submission."
[3] "* Initial release with `pad_zero()`."
```

**Difficulty:** Advanced

```r title="Your turn"
ex_6_2 <- # your code here
ex_6_2
```

<details>
<summary>Click to reveal solution</summary>

```r title="Solution"
pkg_path <- file.path(tempdir(), "rspkg")
usethis::proj_set(pkg_path, force = TRUE)
usethis::use_news_md(open = FALSE)
news_path <- file.path(pkg_path, "NEWS.md")
news <- readLines(news_path)
news <- c(news, "* Initial release with `pad_zero()`.")
writeLines(news, news_path)
news <- readLines(news_path)
ex_6_2 <- news[nzchar(news)][1:3]
ex_6_2
#> [1] "# rspkg 0.1.0"
#> [2] "* Initial CRAN submission."
#> [3] "* Initial release with `pad_zero()`."
```

**Explanation:** `use_news_md()` seeds a NEWS.md with one second-level version heading per release and an "Initial CRAN submission." bullet. CRAN uses the contents of NEWS.md (rendered to HTML on the package landing page) for the "what changed" column on its package index. The convention is: top-level `#` for the package title (rare), `##` for a version section, bullets under each. Tools such as `pkgdown` and the GitHub release UI parse this structure directly.

</details>

## What to do next

- [How to make an R package](How-to-make-an-R-package.html) explains the full pipeline from idea to CRAN.
- [Roxygen2 documentation](Roxygen2-Documentation-in-R.html) goes deeper on tags, links, and Markdown support.
- [R Testing Exercises](R-Testing-Exercises-in-R.html) drills the testthat workflows used above on a wider surface.
- [R Functions Exercises](R-Functions-Exercises-in-R.html) gives you function-design practice that pairs well with package authoring.

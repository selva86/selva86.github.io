---
title: "R Package Development Exercises: 20 Practice Problems"
slug: "R-Package-Development-Exercises"
description: "Master R package development with 20 practice problems: usethis, devtools, roxygen2, testthat, DESCRIPTION, NAMESPACE. Hidden solutions."
keywords: "R package development exercises, usethis R, devtools R practice, R package tutorial, build R package"
mathjax: false
webr: false
date: "2026-05-11"
post_type: "EX"
sidebar_title: "R Package Development"
sidebar_order: 168
fr_parent: "R-Tutorial.html"
auto_link_terms: "R package development exercises|usethis R|devtools R practice|R package tutorial"
auto_link_case_sensitive: false
target_keyword: "R package development exercises"
sibling_block_enabled: false
difficulty: "Advanced"
---

# R Package Development Exercises: 20 Practice Problems

<p class="lead">Twenty practice problems on R package development: usethis, devtools, roxygen2, testthat, DESCRIPTION, NAMESPACE, vignettes, CRAN.</p>

```r title="Run this once before any exercise"
# library(usethis); library(devtools); library(roxygen2); library(testthat)
```

### Exercise 1: Create a package skeleton

**Difficulty:** Beginner.

<details><summary>Show solution</summary>

```r
# usethis::create_package("mypkg")
```

</details>

### Exercise 2: Add a function in R/

**Difficulty:** Beginner.

<details><summary>Show solution</summary>

```r
# usethis::use_r("hello")   # creates R/hello.R
```

</details>

### Exercise 3: Document with roxygen

**Difficulty:** Intermediate.

```r
#' Say hello
#' @param name character
#' @return character greeting
#' @export
hello <- function(name) paste("Hi", name)
```

<details><summary>Show solution</summary>

Run `devtools::document()` to convert roxygen comments to .Rd files and update NAMESPACE.

</details>

### Exercise 4: Run tests

**Difficulty:** Intermediate.

<details><summary>Show solution</summary>

```r
# devtools::test()
```

</details>

### Exercise 5: Add a test

**Difficulty:** Intermediate.

<details><summary>Show solution</summary>

```r
# usethis::use_test("hello")
# Inside tests/testthat/test-hello.R:
# test_that("greets correctly", { expect_equal(hello("R"), "Hi R") })
```

</details>

### Exercise 6: Check package

**Difficulty:** Intermediate.

<details><summary>Show solution</summary>

```r
# devtools::check()
```

</details>

### Exercise 7: Build manual

**Difficulty:** Intermediate.

<details><summary>Show solution</summary>

```r
# devtools::build_manual()
```

</details>

### Exercise 8: Add license

**Difficulty:** Intermediate.

<details><summary>Show solution</summary>

```r
# usethis::use_mit_license("Your Name")
```

</details>

### Exercise 9: Add Imports

**Difficulty:** Intermediate.

<details><summary>Show solution</summary>

```r
# usethis::use_package("dplyr")
```

</details>

### Exercise 10: Add a Suggests dependency

**Difficulty:** Intermediate.

<details><summary>Show solution</summary>

```r
# usethis::use_package("ggplot2", type = "Suggests")
```

</details>

### Exercise 11: Add data

**Difficulty:** Intermediate.

<details><summary>Show solution</summary>

```r
# mydata <- mtcars
# usethis::use_data(mydata)
```

</details>

### Exercise 12: Add vignette

**Difficulty:** Advanced.

<details><summary>Show solution</summary>

```r
# usethis::use_vignette("intro")
```

</details>

### Exercise 13: README setup

**Difficulty:** Beginner.

<details><summary>Show solution</summary>

```r
# usethis::use_readme_rmd()
```

</details>

### Exercise 14: pkgdown website

**Difficulty:** Advanced.

<details><summary>Show solution</summary>

```r
# usethis::use_pkgdown(); pkgdown::build_site()
```

</details>

### Exercise 15: Continuous integration (GitHub Actions)

**Difficulty:** Advanced.

<details><summary>Show solution</summary>

```r
# usethis::use_github_action_check_standard()
```

</details>

### Exercise 16: Bump version

**Difficulty:** Beginner.

<details><summary>Show solution</summary>

```r
# usethis::use_version("minor")
```

</details>

### Exercise 17: Install local

**Difficulty:** Beginner.

<details><summary>Show solution</summary>

```r
# devtools::install()
```

</details>

### Exercise 18: Load without install

**Difficulty:** Beginner.

<details><summary>Show solution</summary>

```r
# devtools::load_all()
```

</details>

### Exercise 19: Add @importFrom

**Difficulty:** Advanced.

```r
#' @importFrom dplyr filter
my_fn <- function(x) dplyr::filter(x, ...)
```

<details><summary>Show solution</summary>

Adds the import to NAMESPACE via roxygen so the namespaced function is available.

</details>

### Exercise 20: Submit to CRAN (concept)

**Difficulty:** Advanced.

<details><summary>Show solution</summary>

```r
# devtools::release()
# Follows checklist: check on multiple platforms, update cran-comments, etc.
```

</details>

## What to do next

- **testthat-Exercises** (coming) — testing deep dive.
- **roxygen2-Exercises** (coming) — documentation.

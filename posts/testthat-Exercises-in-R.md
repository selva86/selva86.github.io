---
title: "testthat Exercises in R: 15 Practice Problems"
slug: "testthat-Exercises-in-R"
description: "Master testthat in R with 15 practice problems: expect_equal, expect_error, fixtures, snapshots, mocks. Hidden solutions."
keywords: "testthat R exercises, R testing practice, unit tests R, expect_equal R"
mathjax: false
webr: true
date: "2026-05-11"
post_type: "EX"
sidebar_title: "testthat Exercises"
sidebar_order: 169
fr_parent: "R-Tutorial.html"
auto_link_terms: "testthat R exercises|R testing practice|unit tests R|expect_equal R"
auto_link_case_sensitive: false
target_keyword: "testthat R exercises"
sibling_block_enabled: false
difficulty: "Intermediate"
---

# testthat Exercises in R: 15 Practice Problems

<p class="lead">Fifteen practice problems on testthat: expectations, fixtures, error matching, snapshots, mocks.</p>

```r
library(testthat)
```

### Exercise 1: expect_equal

<details><summary>Show solution</summary>

```r
test_that("addition works", { expect_equal(1 + 1, 2) })
```

</details>

### Exercise 2: expect_identical

<details><summary>Show solution</summary>

```r
test_that("identical objects", { expect_identical(1L, 1L) })
```

</details>

### Exercise 3: expect_true / expect_false

<details><summary>Show solution</summary>

```r
expect_true(2 > 1); expect_false(2 < 1)
```

</details>

### Exercise 4: expect_error

<details><summary>Show solution</summary>

```r
expect_error(stop("bad"), "bad")
```

</details>

### Exercise 5: expect_warning

<details><summary>Show solution</summary>

```r
expect_warning(as.numeric("a"))
```

</details>

### Exercise 6: expect_message

<details><summary>Show solution</summary>

```r
expect_message(message("hi"), "hi")
```

</details>

### Exercise 7: expect_silent

<details><summary>Show solution</summary>

```r
expect_silent(1 + 1)
```

</details>

### Exercise 8: expect_length

<details><summary>Show solution</summary>

```r
expect_length(1:5, 5)
```

</details>

### Exercise 9: Tolerance

<details><summary>Show solution</summary>

```r
expect_equal(1.0001, 1, tolerance = 0.01)
```

</details>

### Exercise 10: skip_if_not_installed

<details><summary>Show solution</summary>

```r
test_that("uses ggplot2", {
  skip_if_not_installed("ggplot2")
  expect_true(TRUE)
})
```

</details>

### Exercise 11: expect_named

<details><summary>Show solution</summary>

```r
expect_named(c(a = 1, b = 2), c("a","b"))
```

</details>

### Exercise 12: expect_snapshot

<details><summary>Show solution</summary>

```r
# expect_snapshot(print(mtcars[1:3, ]))
```

</details>

### Exercise 13: Test setup with fixture

<details><summary>Show solution</summary>

```r
test_that("uses fixture", {
  d <- mtcars[1:3, ]
  expect_equal(nrow(d), 3)
})
```

</details>

### Exercise 14: Mock with local_mocked_bindings

<details><summary>Show solution</summary>

```r
# local_mocked_bindings(Sys.time = function() as.POSIXct("2024-01-15"))
```

</details>

### Exercise 15: Run all tests

<details><summary>Show solution</summary>

```r
# devtools::test()  # in a package
```

</details>

## What to do next

- **R-Package-Development-Exercises** (shipped) — testing fits inside packages.
- **R-Debugging-Exercises** (coming) — when tests fail.

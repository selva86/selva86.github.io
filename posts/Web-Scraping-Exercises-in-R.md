---
title: "Web Scraping Exercises in R: 15 Practice Problems"
slug: "Web-Scraping-Exercises-in-R"
description: "Master web scraping in R with 15 practice problems: rvest, CSS selectors, tables, attributes, robots.txt, polite. Hidden solutions."
keywords: "web scraping R exercises, rvest R exercises, R scraping practice, CSS selectors R, polite scraping R"
mathjax: false
webr: false
date: "2026-05-11"
post_type: "EX"
sidebar_title: "Web Scraping Exercises"
sidebar_order: 153
fr_parent: "R-Tutorial.html"
auto_link_terms: "web scraping R exercises|rvest R exercises|R scraping practice|CSS selectors R"
auto_link_case_sensitive: false
target_keyword: "web scraping R exercises"
sibling_block_enabled: false
difficulty: "Intermediate"
---

# Web Scraping Exercises in R: 15 Practice Problems

<p class="lead">Fifteen practice problems on web scraping in R with rvest: reading HTML, CSS selectors, tables, attributes, polite scraping. Hidden solutions.</p>

```r title="Run this once before any exercise"
library(rvest)
library(dplyr)
library(stringr)
```

### Exercise 1: Read an HTML page

**Difficulty:** Beginner.

<details><summary>Show solution</summary>

```r
page <- read_html("https://example.com")
page
```

</details>

### Exercise 2: Extract page title

**Difficulty:** Beginner.

<details><summary>Show solution</summary>

```r
read_html("https://example.com") |> html_element("title") |> html_text()
```

</details>

### Exercise 3: Extract h1

**Difficulty:** Beginner.

<details><summary>Show solution</summary>

```r
read_html("https://example.com") |> html_element("h1") |> html_text()
```

</details>

### Exercise 4: All paragraphs

**Difficulty:** Intermediate.

<details><summary>Show solution</summary>

```r
read_html("https://example.com") |> html_elements("p") |> html_text()
```

</details>

### Exercise 5: Links (a href)

**Difficulty:** Intermediate.

<details><summary>Show solution</summary>

```r
read_html("https://example.com") |>
  html_elements("a") |> html_attr("href")
```

</details>

### Exercise 6: CSS selector

**Difficulty:** Intermediate.

<details><summary>Show solution</summary>

```r
# Class selector
# read_html(url) |> html_elements(".btn-primary") |> html_text()
```

</details>

### Exercise 7: XPath

**Difficulty:** Advanced.

<details><summary>Show solution</summary>

```r
# read_html(url) |> html_elements(xpath = "//div[@class='post']") |> html_text()
```

</details>

### Exercise 8: Extract a table

**Difficulty:** Intermediate.

<details><summary>Show solution</summary>

```r
# Wikipedia tables example (conceptual):
# read_html(url) |> html_table() |> _[[1]]
```

</details>

### Exercise 9: Attribute value

**Difficulty:** Intermediate.

<details><summary>Show solution</summary>

```r
read_html("https://example.com") |>
  html_element("a") |> html_attr("href")
```

</details>

### Exercise 10: Loop pages with map_dfr

**Difficulty:** Advanced.

<details><summary>Show solution</summary>

```r
urls <- paste0("https://example.com/page", 1:3)
# purrr::map_dfr(urls, ~ tibble(url = .x, title = read_html(.x) |> html_element("title") |> html_text()))
```

</details>

### Exercise 11: Polite throttle

**Difficulty:** Advanced.

<details><summary>Show solution</summary>

```r
# library(polite); session <- bow("https://example.com"); scrape(session)
```

</details>

### Exercise 12: Robots.txt

**Difficulty:** Intermediate.

<details><summary>Show solution</summary>

```r
# robotstxt::paths_allowed("https://example.com/page")
```

</details>

### Exercise 13: Form fill with session

**Difficulty:** Advanced.

<details><summary>Show solution</summary>

```r
# s <- session("https://example.com/login")
# f <- s |> html_form() |> pluck(1) |> html_form_set(user = "x", pass = "y")
# session_submit(s, f)
```

</details>

### Exercise 14: Clean extracted text

**Difficulty:** Intermediate.

<details><summary>Show solution</summary>

```r
texts <- c("  Hello\nworld ", " 100\n  ")
str_squish(texts)
```

</details>

### Exercise 15: Save scraped data

**Difficulty:** Intermediate.

<details><summary>Show solution</summary>

```r
df <- tibble(title = c("a","b"), url = c("u1","u2"))
readr::write_csv(df, "out.csv")
```

</details>

## What to do next

- **API-Calls-Exercises** (coming) — structured data via APIs.
- **stringr-Exercises** (shipped) — cleanup scraped text.

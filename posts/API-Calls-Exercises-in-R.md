---
title: "API Calls Exercises in R: 15 Practice Problems"
slug: "API-Calls-Exercises-in-R"
description: "Master API calls in R with 15 practice problems: httr2, GET/POST, headers, auth, JSON, pagination. Hidden solutions."
keywords: "httr2 R exercises, R API calls practice, jsonlite R, REST API R, R API exercises"
mathjax: false
webr: false
date: "2026-05-11"
post_type: "EX"
sidebar_title: "API Calls Exercises"
sidebar_order: 154
fr_parent: "R-Tutorial.html"
auto_link_terms: "httr2 R exercises|R API calls practice|jsonlite R|REST API R"
auto_link_case_sensitive: false
target_keyword: "R API calls exercises"
sibling_block_enabled: false
difficulty: "Intermediate"
---

# API Calls Exercises in R: 15 Practice Problems

<p class="lead">Fifteen practice problems on REST API calls in R with httr2 and jsonlite: GET, POST, headers, auth, JSON, pagination. Hidden solutions.</p>

```r title="Run this once before any exercise"
library(httr2)
library(jsonlite)
library(dplyr)
```

### Exercise 1: Basic GET

**Difficulty:** Beginner.

<details><summary>Show solution</summary>

```r
request("https://httpbin.org/get") |> req_perform() |> resp_body_json()
```

</details>

### Exercise 2: GET with query parameters

**Difficulty:** Intermediate.

<details><summary>Show solution</summary>

```r
request("https://httpbin.org/get") |>
  req_url_query(name = "alice", role = "admin") |>
  req_perform() |> resp_body_json()
```

</details>

### Exercise 3: Add header

**Difficulty:** Intermediate.

<details><summary>Show solution</summary>

```r
request("https://httpbin.org/get") |>
  req_headers(`X-Custom` = "value") |>
  req_perform()
```

</details>

### Exercise 4: POST JSON

**Difficulty:** Intermediate.

<details><summary>Show solution</summary>

```r
request("https://httpbin.org/post") |>
  req_body_json(list(a = 1, b = "hello")) |>
  req_perform() |> resp_body_json()
```

</details>

### Exercise 5: POST form

**Difficulty:** Intermediate.

<details><summary>Show solution</summary>

```r
request("https://httpbin.org/post") |>
  req_body_form(name = "alice") |>
  req_perform()
```

</details>

### Exercise 6: Bearer auth

**Difficulty:** Advanced.

<details><summary>Show solution</summary>

```r
request("https://api.example.com") |>
  req_auth_bearer_token("xxxxxxx")
```

</details>

### Exercise 7: Basic auth

**Difficulty:** Intermediate.

<details><summary>Show solution</summary>

```r
request("https://httpbin.org/basic-auth/user/passwd") |>
  req_auth_basic("user", "passwd") |>
  req_perform()
```

</details>

### Exercise 8: Inspect raw response

**Difficulty:** Intermediate.

<details><summary>Show solution</summary>

```r
resp <- request("https://httpbin.org/get") |> req_perform()
list(status = resp_status(resp), headers = resp_headers(resp))
```

</details>

### Exercise 9: Retry on failure

**Difficulty:** Advanced.

<details><summary>Show solution</summary>

```r
request("https://httpbin.org/status/500") |>
  req_retry(max_tries = 3) |>
  req_error(is_error = function(resp) FALSE) |>
  req_perform()
```

</details>

### Exercise 10: Throttle requests

**Difficulty:** Advanced.

<details><summary>Show solution</summary>

```r
request("https://httpbin.org/get") |>
  req_throttle(rate = 2 / 60)   # 2 req/min
```

</details>

### Exercise 11: Parse JSON to tibble

**Difficulty:** Intermediate.

<details><summary>Show solution</summary>

```r
j <- '[{"id":1,"name":"a"},{"id":2,"name":"b"}]'
fromJSON(j) |> as_tibble()
```

</details>

### Exercise 12: Convert tibble to JSON

**Difficulty:** Intermediate.

<details><summary>Show solution</summary>

```r
toJSON(head(mtcars, 3), pretty = TRUE)
```

</details>

### Exercise 13: Pagination via loop

**Difficulty:** Advanced.

<details><summary>Show solution</summary>

```r
# all_results <- list()
# page <- 1
# repeat {
#   resp <- request("https://api.example.com") |>
#     req_url_query(page = page) |> req_perform() |> resp_body_json()
#   if (length(resp$results) == 0) break
#   all_results <- c(all_results, resp$results)
#   page <- page + 1
# }
```

</details>

### Exercise 14: Save response body

**Difficulty:** Intermediate.

<details><summary>Show solution</summary>

```r
request("https://httpbin.org/get") |>
  req_perform(path = "response.json")
```

</details>

### Exercise 15: Handle non-2xx

**Difficulty:** Advanced.

<details><summary>Show solution</summary>

```r
resp <- request("https://httpbin.org/status/404") |>
  req_error(is_error = function(resp) FALSE) |>
  req_perform()
resp_status(resp)
```

</details>

## What to do next

- **Web-Scraping-Exercises** (shipped) — HTML extraction.
- **purrr-Exercises** (shipped) — safely/possibly for resilient API loops.

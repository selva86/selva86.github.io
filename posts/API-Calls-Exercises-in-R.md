---
title: "API Calls Exercises in R: 17 Real-World Practice Problems"
slug: "API-Calls-Exercises-in-R"
description: "R API calls exercises with httr2: 17 hands-on problems on GET/POST, headers, JSON parsing, auth, pagination, retries, and rate limit throttling."
keywords: "R API calls exercises, httr2 R exercises, jsonlite R, REST API R, R httr2 practice, R API pagination"
mathjax: false
webr: false
date: "2026-05-13"
post_type: "EX"
sidebar_title: "API Calls Exercises"
sidebar_order: 154
fr_parent: "REST-APIs-in-R-with-httr2.html"
auto_link_terms: "httr2 r exercises|r api calls practice|jsonlite r|rest api r|r api pagination|r http retry"
auto_link_case_sensitive: false
target_keyword: "R API calls exercises"
sibling_block_enabled: false
difficulty: "Mixed"
---

# API Calls Exercises in R: 17 Real-World Practice Problems

<p class="lead">Seventeen practice problems on calling REST APIs from R with httr2 and jsonlite: building requests, parsing JSON, handling auth, retries, rate limits, and pagination. Solutions are hidden so you can attempt each one cold and reveal only when stuck.</p>

```r title="Run this once before any exercise"
library(httr2)
library(jsonlite)
library(dplyr)
library(tibble)
library(purrr)
```

> The network exercises target public stable endpoints (`jsonplaceholder.typicode.com`, `httpbin.org`, `api.agify.io`). They are read-only sandboxes and safe to hit repeatedly. The auth and retry exercises use `req_dry_run()` so you can verify the wire request without sending it.

## Section 1. Building and inspecting httr2 requests (4 problems)

### Exercise 1.1: Construct a basic GET request and inspect its URL

**Task:** A junior analyst onboarding to the data team is exploring `httr2` for the first time. Build a request object pointing at `https://jsonplaceholder.typicode.com/posts/1` using `request()`, do NOT perform it, and save the request to `ex_1_1` so the analyst can examine the URL, method, and body before any traffic is sent.

**Expected result:**

```
#> <httr2_request>
#> GET https://jsonplaceholder.typicode.com/posts/1
#> Body: empty
```

**Difficulty:** Beginner
[HINTS]
A request in httr2 is a lazy description of a call - you state where to point it without sending anything over the network yet.
Pass the URL string to request() and assign the result to ex_1_1; do not add any perform step.

```r title="Your turn"
ex_1_1 <- # your code here
ex_1_1
```

<details>
<summary>Click to reveal solution</summary>

```r title="Solution"
ex_1_1 <- request("https://jsonplaceholder.typicode.com/posts/1")
ex_1_1
#> <httr2_request>
#> GET https://jsonplaceholder.typicode.com/posts/1
#> Body: empty
```

**Explanation:** `request()` builds a lazy request object: no network traffic happens until you call `req_perform()` on it. This separation lets you compose, inspect, and unit-test requests safely. The printed representation shows method (default `GET`), URL, and body status, which is the fastest way to confirm you assembled the request correctly before sending it. The same object can be modified later with `req_url_path_append()` or `req_method()` rather than building a new request from scratch.

</details>

### Exercise 1.2: Attach a custom User-Agent header

**Task:** Many APIs reject requests with a generic agent string. Take the request from Exercise 1.1, add a `User-Agent` header reading `r-statistics-tutorial/1.0 (selva@example.com)` with `req_user_agent()`, and save the modified request to `ex_1_2` so it identifies itself politely to the server.

**Expected result:**

```
#> <httr2_request>
#> GET https://jsonplaceholder.typicode.com/posts/1
#> Headers:
#> * User-Agent: 'r-statistics-tutorial/1.0 (selva@example.com)'
#> Body: empty
```

**Difficulty:** Beginner
[HINTS]
Identifying who is calling is just one more piece of metadata layered onto an existing request before it is sent.
Pipe the request from Exercise 1.1 into req_user_agent() with the agent string as its only argument.

```r title="Your turn"
ex_1_2 <- # your code here
ex_1_2
```

<details>
<summary>Click to reveal solution</summary>

```r title="Solution"
ex_1_2 <- request("https://jsonplaceholder.typicode.com/posts/1") |>
  req_user_agent("r-statistics-tutorial/1.0 (selva@example.com)")
ex_1_2
#> <httr2_request>
#> GET https://jsonplaceholder.typicode.com/posts/1
#> Headers:
#> * User-Agent: 'r-statistics-tutorial/1.0 (selva@example.com)'
#> Body: empty
```

**Explanation:** A descriptive User-Agent is the polite-internet default: it tells the server who is calling so the operator can contact you if your script misbehaves. `req_user_agent()` is a thin wrapper around `req_headers()` that targets the User-Agent slot specifically, so subsequent `req_headers()` calls do not overwrite it accidentally. Generic agents like the default `httr2/x.y.z libcurl/...` are commonly throttled or 403'd by anti-bot middleware, so set this once at the top of your script.

</details>

### Exercise 1.3: Attach query parameters and dry-run the wire URL

**Task:** A data engineer needs to confirm that query parameters serialize correctly before pointing a job at production. Build a request to `https://api.agify.io`, add query parameters `name = "selva"` and `country_id = "IN"` with `req_url_query()`, then use `req_dry_run()` to print the wire-level request and save the unsent request to `ex_1_3`.

**Expected result:**

```
#> GET /?name=selva&country_id=IN HTTP/1.1
#> host: api.agify.io
#> user-agent: httr2/1.0.0 r-curl/5.2.0 libcurl/8.4.0
#> accept: */*
#> accept-encoding: deflate, gzip
```

**Difficulty:** Intermediate
[HINTS]
Query parameters are key-value pairs appended to the URL, and the library can encode them for you instead of you hand-building the string.
Add req_url_query(name = "selva", country_id = "IN") to a request() for the base URL.

```r title="Your turn"
ex_1_3 <- # your code here
ex_1_3 |> req_dry_run()
```

<details>
<summary>Click to reveal solution</summary>

```r title="Solution"
ex_1_3 <- request("https://api.agify.io") |>
  req_url_query(name = "selva", country_id = "IN")

ex_1_3 |> req_dry_run()
#> GET /?name=selva&country_id=IN HTTP/1.1
#> host: api.agify.io
#> user-agent: httr2/1.0.0 r-curl/5.2.0 libcurl/8.4.0
#> accept: */*
#> accept-encoding: deflate, gzip
```

**Explanation:** `req_url_query()` is preferable to hand-building a query string because it URL-encodes values for you (spaces, ampersands, unicode) and de-duplicates keys. `req_dry_run()` prints the exact HTTP message that would be sent without performing the request, which is invaluable when debugging mysterious 400 responses or auth failures. The header user-agent in your output may differ depending on installed `httr2` and `curl` versions; only the request line and host need to match.

</details>

### Exercise 1.4: Switch a GET request to POST and inspect the body

**Task:** A code reviewer wants to see how the same request URL can be reused across HTTP methods. Take a request to `https://httpbin.org/anything`, change the method to `POST` with `req_method()`, attach a JSON body `list(team = "data", priority = 1)` via `req_body_json()`, and save the unsent request to `ex_1_4` so the reviewer can inspect it before run-time.

**Expected result:**

```
#> <httr2_request>
#> POST https://httpbin.org/anything
#> Body: json encoded data
```

**Difficulty:** Beginner
[HINTS]
The same URL can carry a different verb and a payload - you reshape an existing request rather than build a new one.
Chain req_method("POST") and req_body_json(list(team = "data", priority = 1)) onto the request().

```r title="Your turn"
ex_1_4 <- # your code here
ex_1_4
```

<details>
<summary>Click to reveal solution</summary>

```r title="Solution"
ex_1_4 <- request("https://httpbin.org/anything") |>
  req_method("POST") |>
  req_body_json(list(team = "data", priority = 1))
ex_1_4
#> <httr2_request>
#> POST https://httpbin.org/anything
#> Body: json encoded data
```

**Explanation:** `req_body_json()` does two jobs at once: it serializes the R list to JSON with `jsonlite::toJSON()` AND sets the `Content-Type: application/json` header. If you skip the latter, many APIs will silently reject the body or treat it as form data. Note that calling `req_body_json()` also implicitly sets the method to `POST`, so the explicit `req_method("POST")` here is redundant but documentary. Use `req_dry_run()` to see the serialized JSON in the body.

</details>

## Section 2. Sending GET requests and parsing JSON (4 problems)

### Exercise 2.1: Fetch a JSON post and extract a single field

**Task:** A content team wants to pull the title of post 1 from a CMS-like sandbox. Perform a GET to `https://jsonplaceholder.typicode.com/posts/1`, parse the response with `resp_body_json()`, and save the value of the `title` element (a character scalar) to `ex_2_1` so it can be used in a downstream report.

**Expected result:**

```
#> [1] "sunt aut facere repellat provident occaecati excepturi optio reprehenderit"
```

**Difficulty:** Intermediate
[HINTS]
Sending the request returns a response, and the single value you want lives inside its parsed body.
After req_perform(), call resp_body_json() and pull the title element with $title.

```r title="Your turn"
ex_2_1 <- # your code here
ex_2_1
```

<details>
<summary>Click to reveal solution</summary>

```r title="Solution"
resp <- request("https://jsonplaceholder.typicode.com/posts/1") |>
  req_perform()

parsed <- resp |> resp_body_json()
ex_2_1 <- parsed$title
ex_2_1
#> [1] "sunt aut facere repellat provident occaecati excepturi optio reprehenderit"
```

**Explanation:** `req_perform()` is the verb that finally sends bytes over the network and returns an `httr2_response` object. `resp_body_json()` parses the body as JSON using `jsonlite` under the hood and returns a nested R list (not a tibble) by default, because JSON is fundamentally heterogeneous. To get a data frame for arrays of records, pass `simplifyVector = TRUE` or use `jsonlite::fromJSON()` on `resp_body_string()`. Pulling a single field is just list extraction.

</details>

### Exercise 2.2: Convert a list of JSON posts to a tidy tibble

**Task:** A reporting analyst needs every post by user 1 as a tibble for joining against an internal users table. Perform a GET to `https://jsonplaceholder.typicode.com/posts?userId=1`, parse the JSON array, and convert it to a tibble with columns `userId`, `id`, `title`, `body`. Save the result to `ex_2_2`.

**Expected result:**

```
#> # A tibble: 10 x 4
#>   userId    id title                                                       body
#>    <int> <int> <chr>                                                       <chr>
#> 1      1     1 sunt aut facere repellat provident occaecati excepturi opt~ quia~
#> 2      1     2 qui est esse                                                est ~
#> 3      1     3 ea molestias quasi exercitationem repellat qui ipsa sit au~ et i~
#> ...
#> # 7 more rows hidden
```

**Difficulty:** Intermediate
[HINTS]
An array of flat JSON objects is already table-shaped - the work is getting it into a rectangular structure.
Take resp_body_string(), pass it to fromJSON(), then coerce with as_tibble().

```r title="Your turn"
ex_2_2 <- # your code here
ex_2_2
```

<details>
<summary>Click to reveal solution</summary>

```r title="Solution"
resp <- request("https://jsonplaceholder.typicode.com/posts") |>
  req_url_query(userId = 1) |>
  req_perform()

ex_2_2 <- resp |>
  resp_body_string() |>
  fromJSON() |>
  as_tibble()
ex_2_2
#> # A tibble: 10 x 4
#>   userId    id title                                                       body
#>    <int> <int> <chr>                                                       <chr>
#> 1      1     1 sunt aut facere repellat provident occaecati excepturi opt~ quia~
#> 2      1     2 qui est esse                                                est ~
#> ...
```

**Explanation:** `resp_body_json()` returns a list-of-lists for an array; `jsonlite::fromJSON()` on the raw string auto-simplifies a JSON array of flat objects into a data frame in one shot, which is usually what you want for "table-shaped" responses. If the records had nested objects (e.g., `address` with sub-fields), you would call `fromJSON(..., flatten = TRUE)` or use `tidyr::unnest_wider()` on the list-column. Always inspect with `glimpse()` before assuming column types.

</details>

### Exercise 2.3: Flatten a nested JSON response into a data frame

**Task:** A data team is reading a payload that contains user profiles with nested `address` and `company` objects. Parse the JSON string `nested_json` (defined below) with `fromJSON(flatten = TRUE)`, coerce to a tibble, and save only the columns `id`, `name`, `address.city`, `company.name` to `ex_2_3` for a quick directory view.

```r title="Inline data"
nested_json <- '[
  {"id":1,"name":"Leanne","address":{"city":"Gwenborough"},"company":{"name":"Romaguera-Crona"}},
  {"id":2,"name":"Ervin",  "address":{"city":"Wisokyburgh"}, "company":{"name":"Deckow-Crist"}},
  {"id":3,"name":"Clementine","address":{"city":"McKenziehaven"},"company":{"name":"Romaguera-Jacobson"}}
]'
```

**Expected result:**

```
#> # A tibble: 3 x 4
#>      id name        address.city  company.name
#>   <int> <chr>       <chr>         <chr>
#> 1     1 Leanne      Gwenborough   Romaguera-Crona
#> 2     2 Ervin       Wisokyburgh   Deckow-Crist
#> 3     3 Clementine  McKenziehaven Romaguera-Jacobson
```

**Difficulty:** Intermediate
[HINTS]
Nested objects break the rectangle; collapsing them turns each sub-field into its own dotted column.
Call fromJSON() with flatten = TRUE, coerce with as_tibble(), then select() the four columns.

```r title="Your turn"
ex_2_3 <- # your code here
ex_2_3
```

<details>
<summary>Click to reveal solution</summary>

```r title="Solution"
ex_2_3 <- fromJSON(nested_json, flatten = TRUE) |>
  as_tibble() |>
  select(id, name, address.city, company.name)
ex_2_3
#> # A tibble: 3 x 4
#>      id name        address.city  company.name
#>   <int> <chr>       <chr>         <chr>
#> 1     1 Leanne      Gwenborough   Romaguera-Crona
#> 2     2 Ervin       Wisokyburgh   Deckow-Crist
#> 3     3 Clementine  McKenziehaven Romaguera-Jacobson
```

**Explanation:** `flatten = TRUE` collapses nested objects into dotted column names (`address.city`), which keeps the result rectangular and dplyr-friendly. Without `flatten`, you would get list-columns for `address` and `company` that need a second pass with `tidyr::unnest_wider()`. The dotted names contain periods, so wrap them in backticks if you need to reference them in `mutate()` or `filter()`. For deeply nested or irregular JSON, prefer `tibblify` or stepwise `unnest_*` over a single flat dump.

</details>

### Exercise 2.4: Inspect status code, content type, and headers of a response

**Task:** A platform engineer reviewing log output wants a one-shot health check on an endpoint. Perform a GET to `https://jsonplaceholder.typicode.com/posts/1`, then build a named list with elements `status` (from `resp_status()`), `content_type` (from `resp_content_type()`), and `server` (the `server` response header via `resp_header()`). Save this list to `ex_2_4`.

**Expected result:**

```
#> $status
#> [1] 200
#>
#> $content_type
#> [1] "application/json"
#>
#> $server
#> [1] "cloudflare"
```

**Difficulty:** Beginner
[HINTS]
A response carries metadata alongside its body - status, content type, and headers are all data you can read directly.
Build a named list() combining resp_status(), resp_content_type(), and resp_header(resp, "server").

```r title="Your turn"
ex_2_4 <- # your code here
ex_2_4
```

<details>
<summary>Click to reveal solution</summary>

```r title="Solution"
resp <- request("https://jsonplaceholder.typicode.com/posts/1") |>
  req_perform()

ex_2_4 <- list(
  status       = resp_status(resp),
  content_type = resp_content_type(resp),
  server       = resp_header(resp, "server")
)
ex_2_4
#> $status
#> [1] 200
#> $content_type
#> [1] "application/json"
#> $server
#> [1] "cloudflare"
```

**Explanation:** Treat the response metadata as first-class data: status code drives retry logic, content type tells you which parser to call (`resp_body_json()` vs `resp_body_html()` vs `resp_body_raw()`), and headers carry rate-limit, caching, and pagination hints. `resp_header()` is case-insensitive on header names per RFC 7230, so `"Server"` and `"server"` both work. By default `httr2` raises an error on 4xx/5xx; if you need to inspect failures without throwing, wrap `req_perform()` in `req_error(is_error = ~ FALSE)`.

</details>

## Section 3. POST, PUT, DELETE, and request bodies (3 problems)

### Exercise 3.1: Send a JSON POST and read the echoed payload back

**Task:** A QA engineer is verifying that an upstream service round-trips arbitrary JSON correctly. POST the body `list(name = "Selva", role = "instructor", years = 12)` to `https://httpbin.org/post`, parse the response, and save the echoed `json` element (which httpbin returns verbatim) to `ex_3_1` so the engineer can diff inputs against outputs.

**Expected result:**

```
#> $name
#> [1] "Selva"
#> $role
#> [1] "instructor"
#> $years
#> [1] 12
```

**Difficulty:** Intermediate
[HINTS]
A reflection endpoint hands your payload back inside its response, so you send a body and then read the same thing returned.
POST with req_body_json(payload), parse via resp_body_json(), and extract the json element.

```r title="Your turn"
ex_3_1 <- # your code here
ex_3_1
```

<details>
<summary>Click to reveal solution</summary>

```r title="Solution"
payload <- list(name = "Selva", role = "instructor", years = 12)

resp <- request("https://httpbin.org/post") |>
  req_body_json(payload) |>
  req_perform()

ex_3_1 <- resp |> resp_body_json() |> _$json
ex_3_1
#> $name
#> [1] "Selva"
#> $role
#> [1] "instructor"
#> $years
#> [1] 12
```

**Explanation:** `httpbin.org/post` is a reflection endpoint: it returns a JSON object containing what you sent. The `json` element is parsed from your raw body, which is the cleanest way to confirm `req_body_json()` serialized your list as intended (numeric stayed numeric, strings stayed strings, no accidental array-wrapping of scalars). The new pipe placeholder `_$json` is a 4.2+ idiom; on older R use `[["json"]]` after the pipe or store the parsed body first.

</details>

### Exercise 3.2: Send a form-urlencoded POST and parse the echoed form

**Task:** A reporting tool wants to talk to a legacy endpoint that expects `application/x-www-form-urlencoded` bodies, not JSON. POST the fields `username = "selva"` and `topic = "httr2"` to `https://httpbin.org/post` using `req_body_form()`, then extract the echoed `form` element as a tibble with one row and two columns. Save the tibble to `ex_3_2`.

**Expected result:**

```
#> # A tibble: 1 x 2
#>   topic username
#>   <chr> <chr>
#> 1 httr2 selva
```

**Difficulty:** Intermediate
[HINTS]
Legacy endpoints expect form-encoded fields rather than JSON, so the body builder you pick has to match what the server parses.
Use req_body_form() for the two fields, then pluck("form") from the parsed response and pass it to as_tibble().

```r title="Your turn"
ex_3_2 <- # your code here
ex_3_2
```

<details>
<summary>Click to reveal solution</summary>

```r title="Solution"
resp <- request("https://httpbin.org/post") |>
  req_body_form(username = "selva", topic = "httr2") |>
  req_perform()

ex_3_2 <- resp |>
  resp_body_json() |>
  pluck("form") |>
  as_tibble()
ex_3_2
#> # A tibble: 1 x 2
#>   topic username
#>   <chr> <chr>
#> 1 httr2 selva
```

**Explanation:** `req_body_form()` sets `Content-Type: application/x-www-form-urlencoded` and URL-encodes the values for you. This is the body format that traditional HTML form submissions and many SOAP-era REST endpoints expect; if you send JSON instead, the server will not parse the fields and they will appear in `data` rather than `form`. `purrr::pluck()` is a safe deep-extract that returns `NULL` rather than erroring on a missing element, which makes it a safer pick than `$` chains.

</details>

### Exercise 3.3: Issue a DELETE request and confirm the success status

**Task:** A cleanup script needs to delete resource 7 and assert it returned 200 before logging success. Issue a DELETE to `https://jsonplaceholder.typicode.com/posts/7` using `req_method("DELETE")`, capture the response, and save the integer status code to `ex_3_3` so the wrapper can branch on it.

**Expected result:**

```
#> [1] 200
```

**Difficulty:** Intermediate
[HINTS]
Deleting a resource is just another HTTP verb, and success is signalled by the status code rather than the body.
Set req_method("DELETE"), perform the request, and read the integer code with resp_status().

```r title="Your turn"
ex_3_3 <- # your code here
ex_3_3
```

<details>
<summary>Click to reveal solution</summary>

```r title="Solution"
resp <- request("https://jsonplaceholder.typicode.com/posts/7") |>
  req_method("DELETE") |>
  req_perform()

ex_3_3 <- resp_status(resp)
ex_3_3
#> [1] 200
```

**Explanation:** REST conventions allow DELETE to return `200 OK` (with a body), `202 Accepted` (queued), or `204 No Content` (success, empty body); a robust client treats any 2xx as success. `jsonplaceholder` returns `200` with an empty JSON body for DELETE, which is convenient for sandboxes but uncommon in production. Always assert on the status range rather than equality: `status >= 200 && status < 300`. If the server returns 4xx, `httr2` raises by default so this code never reaches the status check on failure.

</details>

## Section 4. Authentication, tokens, and secrets (3 problems)

### Exercise 4.1: Attach a Bearer token from an environment variable

**Task:** A compliance officer wants tokens to live in `~/.Renviron`, never in source code. Read the env var `GITHUB_PAT` with `Sys.getenv("GITHUB_PAT", unset = "demo-token")`, attach it as a Bearer token to a request for `https://api.github.com/user` using `req_auth_bearer_token()`, dry-run the request, and save the unsent request object to `ex_4_1`.

**Expected result:**

```
#> GET /user HTTP/1.1
#> host: api.github.com
#> user-agent: httr2/1.0.0 r-curl/5.2.0 libcurl/8.4.0
#> accept: */*
#> accept-encoding: deflate, gzip
#> authorization: Bearer demo-token
```

**Difficulty:** Advanced
[HINTS]
Secrets belong in the environment, not the script - read the token at runtime and attach it to the request.
Get the value with Sys.getenv("GITHUB_PAT", unset = "demo-token") and pass it to req_auth_bearer_token().

```r title="Your turn"
ex_4_1 <- # your code here
ex_4_1 |> req_dry_run()
```

<details>
<summary>Click to reveal solution</summary>

```r title="Solution"
token <- Sys.getenv("GITHUB_PAT", unset = "demo-token")

ex_4_1 <- request("https://api.github.com/user") |>
  req_auth_bearer_token(token)

ex_4_1 |> req_dry_run()
#> GET /user HTTP/1.1
#> host: api.github.com
#> user-agent: httr2/1.0.0 r-curl/5.2.0 libcurl/8.4.0
#> accept: */*
#> accept-encoding: deflate, gzip
#> authorization: Bearer demo-token
```

**Explanation:** `req_auth_bearer_token()` formats the header as `Authorization: Bearer <token>`, matching the OAuth 2.0 bearer-token spec used by GitHub, Stripe, Slack, and most modern APIs. The token is automatically redacted by `httr2`'s logging, so it will not appear in `last_response()$cache$status` traces. Keeping tokens in `.Renviron` (gitignored) means `Sys.getenv()` works in CI, on your laptop, and inside Docker without touching code, which satisfies the "never commit secrets" rule auditors check first.

</details>

### Exercise 4.2: Use HTTP Basic auth and verify the authenticated user

**Task:** A legacy internal service still uses HTTP Basic auth (username + password). Hit `https://httpbin.org/basic-auth/selva/letmein` with `req_auth_basic("selva", "letmein")`, parse the JSON response, and save the value of the `user` field (a character scalar confirming the auth identity) to `ex_4_2`.

**Expected result:**

```
#> [1] "selva"
```

**Difficulty:** Advanced
[HINTS]
Username-and-password auth is a header the client adds before the call, and the server echoes back the identity it accepted.
Attach req_auth_basic("selva", "letmein"), perform the request, then pluck("user") from the parsed body.

```r title="Your turn"
ex_4_2 <- # your code here
ex_4_2
```

<details>
<summary>Click to reveal solution</summary>

```r title="Solution"
resp <- request("https://httpbin.org/basic-auth/selva/letmein") |>
  req_auth_basic("selva", "letmein") |>
  req_perform()

ex_4_2 <- resp |> resp_body_json() |> pluck("user")
ex_4_2
#> [1] "selva"
```

**Explanation:** Basic auth base64-encodes `username:password` into the `Authorization: Basic <b64>` header. It is NOT encryption, so basic auth is only safe over HTTPS. `httpbin.org/basic-auth/<u>/<p>` returns 200 with `{"authenticated": true, "user": "<u>"}` when the credentials match, and 401 otherwise (`httr2` raises on the 401). Modern internal services have largely moved to bearer tokens or mTLS; if you maintain basic-auth integrations, document them as legacy and migrate when feasible.

</details>

### Exercise 4.3: Pass an API key as a query parameter without leaking it to logs

**Task:** Some APIs (OpenWeatherMap, NewsAPI) accept a key only as a URL query parameter, which is the most leak-prone placement. Build a request to `https://api.example.com/news` with the key from `Sys.getenv("NEWS_API_KEY", unset = "demo-key")` attached via `req_url_query(apikey = ...)`, redact the key from the printed request with `req_headers_redacted()` or by passing `.redact` to `req_url_query()`, and save the request to `ex_4_3`.

**Expected result:**

```
#> <httr2_request>
#> GET https://api.example.com/news?apikey=<REDACTED>
#> Body: empty
```

**Difficulty:** Advanced
[HINTS]
A key placed in the URL leaks easily, so it should be masked from anything that prints the request while the real value still travels on the wire.
Add the key via req_url_query() and name that same parameter in its .redact argument.

```r title="Your turn"
ex_4_3 <- # your code here
ex_4_3
```

<details>
<summary>Click to reveal solution</summary>

```r title="Solution"
key <- Sys.getenv("NEWS_API_KEY", unset = "demo-key")

ex_4_3 <- request("https://api.example.com/news") |>
  req_url_query(apikey = key, .redact = "apikey")
ex_4_3
#> <httr2_request>
#> GET https://api.example.com/news?apikey=<REDACTED>
#> Body: empty
```

**Explanation:** The `.redact` argument tells `httr2` to mask the named parameter whenever the request is printed, dry-run, or written to a log via `req_verbose()`. The real value still travels on the wire, but it will not leak into terminal screenshots, knitr documents, or shared `.R` history files. Always prefer header-based auth (Bearer, Basic) when the API supports it; query-string keys end up in proxy logs, browser history, and Referer headers. If you must use query keys, redact + rotate them on a schedule.

</details>

## Section 5. Errors, retries, throttling, and pagination (3 problems)

### Exercise 5.1: Auto-retry transient 5xx errors with exponential backoff

**Task:** A scheduled ETL job intermittently fails because the upstream API returns 503 during spikes. Configure a request to `https://httpbin.org/status/200` with `req_retry(max_tries = 3, backoff = ~ 2)` so it would retry up to twice on 5xx with a 2-second backoff between tries, then perform it and save the integer status code to `ex_5_1`.

**Expected result:**

```
#> [1] 200
```

**Difficulty:** Advanced
[HINTS]
A transient server failure should not kill a job - the client can wait briefly and try the same call again on its own.
Add req_retry(max_tries = 3, backoff = ~ 2) before req_perform(), then read the code with resp_status().

```r title="Your turn"
ex_5_1 <- # your code here
ex_5_1
```

<details>
<summary>Click to reveal solution</summary>

```r title="Solution"
resp <- request("https://httpbin.org/status/200") |>
  req_retry(max_tries = 3, backoff = ~ 2) |>
  req_perform()

ex_5_1 <- resp_status(resp)
ex_5_1
#> [1] 200
```

**Explanation:** `req_retry()` only retries on transient failures by default: 5xx responses and curl-level network errors. It honors the server's `Retry-After` header automatically, which is the right default for rate-limited APIs (Stripe, GitHub). The `backoff` argument accepts a function or a one-sided formula of `attempt`; `~ 2` means a constant 2-second wait, while `~ 2 ^ .x` gives exponential backoff (2, 4, 8 seconds). Never set `max_tries` higher than 5: if 5 retries do not succeed, the upstream is genuinely down and your job should fail loudly so on-call gets paged.

</details>

### Exercise 5.2: Throttle requests to stay under a published rate limit

**Task:** A growth team is pulling user profiles from an API that caps free-tier callers at 10 requests per minute. Build a request to `https://api.agify.io?name=selva` with `req_throttle(rate = 10 / 60)`, performing the request three times in a row via `replicate()` so the throttle is exercised, and save the vector of three integer status codes to `ex_5_2`.

**Expected result:**

```
#> [1] 200 200 200
```

**Difficulty:** Advanced
[HINTS]
Staying under a published rate cap means pacing the calls so the client never sends faster than the limit allows.
Configure req_throttle(rate = 10 / 60) on the request, then replicate() the perform-and-status call three times.

```r title="Your turn"
ex_5_2 <- # your code here
ex_5_2
```

<details>
<summary>Click to reveal solution</summary>

```r title="Solution"
req <- request("https://api.agify.io") |>
  req_url_query(name = "selva") |>
  req_throttle(rate = 10 / 60)

ex_5_2 <- replicate(3, resp_status(req_perform(req)))
ex_5_2
#> [1] 200 200 200
```

**Explanation:** `req_throttle()` enforces a maximum request rate across all uses of a given realm (default: the URL host), sleeping inside `req_perform()` if you would otherwise exceed it. Expressing the rate as `10 / 60` makes the unit explicit (10 per 60 seconds). The throttle persists across calls within the same R session, which means a loop of `req_perform()` is automatically rate-limit-safe without you writing `Sys.sleep()` glue. Combine with `req_retry()` to handle 429 responses gracefully if you do hit the cap.

</details>

### Exercise 5.3: Walk paged results with req_perform_iterative

**Task:** A reporting analyst needs every paginated record from a list endpoint, not just the first page. Use `req_perform_iterative()` with `iterate_with_offset(param_name = "_page", start = 1, offset = 1)` against `https://jsonplaceholder.typicode.com/posts` (limit `_limit = 30`), stop after 4 pages with `max_reqs = 4`, then combine all parsed bodies into one tibble with `id`, `userId`, `title` and save it to `ex_5_3`.

**Expected result:**

```
#> # A tibble: 100 x 3
#>      id userId title
#>   <int>  <int> <chr>
#> 1     1      1 sunt aut facere repellat provident occaecati excepturi optio re~
#> 2     2      1 qui est esse
#> 3     3      1 ea molestias quasi exercitationem repellat qui ipsa sit aut
#> ...
#> # 97 more rows hidden
```

**Difficulty:** Advanced
[HINTS]
A paginated endpoint reveals one page at a time, so you keep asking for the next page until every record is collected.
Drive req_perform_iterative() with iterate_with_offset("_page", start = 1, offset = 1) and max_reqs = 4, then combine the bodies with resps_data().

```r title="Your turn"
ex_5_3 <- # your code here
ex_5_3
```

<details>
<summary>Click to reveal solution</summary>

```r title="Solution"
req <- request("https://jsonplaceholder.typicode.com/posts") |>
  req_url_query(`_limit` = 30)

resps <- req_perform_iterative(
  req,
  next_req = iterate_with_offset("_page", start = 1, offset = 1),
  max_reqs = 4
)

ex_5_3 <- resps |>
  resps_data(\(resp) {
    resp |> resp_body_string() |> fromJSON() |> as_tibble()
  }) |>
  select(id, userId, title)
ex_5_3
#> # A tibble: 100 x 3
#>      id userId title
#>   <int>  <int> <chr>
#> 1     1      1 sunt aut facere repellat provident occaecati excepturi optio re~
#> ...
```

**Explanation:** `req_perform_iterative()` is the idiomatic httr2 pagination helper: it calls a `next_req` function to derive the next page request from the current response, stopping when the function returns `NULL` or `max_reqs` is reached. `iterate_with_offset()` covers the common `?page=N` or `?offset=N` pattern; use `iterate_with_link_url()` for APIs that return a `Link` header (GitHub, GitLab). Always set `max_reqs` so a runaway pagination bug cannot exhaust your rate limit; `resps_data()` collects the parsed bodies into one object via row-binding.

</details>

## What to do next

- Revisit the parent tutorial [REST APIs in R with httr2](REST-APIs-in-R-with-httr2.html) when an exercise needed a concept you had not seen yet.
- Practice scraping HTML pages (which is different from calling JSON APIs) in [Web Scraping Exercises in R](Web-Scraping-Exercises-in-R.html).
- Strengthen the data-wrangling step after parsing JSON with [dplyr Exercises in R](dplyr-Exercises-in-R.html).
- Use the [tidyr Reshaping Exercises](tidyr-Reshaping-Exercises.html) when an API returns nested or wide payloads that need to be made tidy.

# Plan: REST APIs in R with httr2

## A. Frontmatter Fields

| Field | Value |
|---|---|
| title | REST APIs in R with httr2: GET, POST, OAuth, and Paginated Results |
| slug | REST-APIs-in-R-with-httr2 |
| description | httr2 is the modern R package for HTTP. Learn request(), req_perform(), Bearer auth, JSON parsing, rate limiting with req_throttle(), and pagination. |
| keywords | httr2, REST API in R, httr2 tutorial, R API call, req_perform, req_body_json, httr2 authentication, httr2 pagination, req_throttle, R HTTP requests |
| auto_link_terms | httr2\|REST API in R\|request()\|req_perform()\|req_body_json()\|httr2 package\|calling APIs in R\|HTTP requests in R |
| auto_link_case_sensitive | true |
| mathjax | false |
| webr | false |
| date | 2026-04-06 |
| curriculum_id | DB4 |
| post_type | C |
| sidebar_section | Data Wrangling |
| sidebar_title | REST APIs (httr2) |
| sidebar_order | 16 |

## B. Breadcrumb

Home > Data Wrangling > Databases & Web > REST APIs in R with httr2

## C. Full Section Outline

### Lead sentence
httr2 is the modern R package for calling REST APIs — it lets you build HTTP requests with a pipe chain, handle authentication, parse JSON responses, and paginate through results automatically.

### Introduction (2-3 paragraphs)
- Hook: Most interesting data lives behind an API, not in a CSV. Whether you need financial data, weather forecasts, or social media metrics, you will call a REST API to get it.
- What: httr2 is the successor to httr. It uses an explicit request object and pipe-friendly `req_*()` functions to build, modify, and perform HTTP requests.
- What you'll learn: building GET/POST requests, parsing JSON responses, authentication (API keys, Bearer tokens, OAuth), rate limiting, retries, and automatic pagination.
- Inline note: httr2 requires network access — code blocks show expected output as comments. Run them locally in RStudio.

### Core Content Sections (7 sections)

#### H2: What is a REST API and how does R talk to one?
- Theory: REST = Representational State Transfer. Client sends request (verb + URL + headers + body), server returns response (status + headers + body). JSON is the standard exchange format.
- Diagram: Figure 1 (request-response sequence diagram)
- Code: None (conceptual section)
- Callout: [KEY INSIGHT] REST is stateless — every request must carry all the info the server needs.

#### H2: How do you install httr2 and make your first GET request?
- Theory: Install httr2, create a request with `request()`, perform with `req_perform()`, parse JSON with `resp_body_json()`.
- Code block 1: Install and load httr2, make GET request to httpbin.org/get, show response.
- Code block 2: GET a public API (Dog CEO random dog image) and extract the URL.
- Callout: [TIP] Use `req_dry_run()` to inspect what httr2 will send without actually sending it.

#### H2: How do you add query parameters and custom headers?
- Theory: `req_url_query()` appends ?key=value pairs. `req_headers()` sets custom headers (Accept, User-Agent, etc.).
- Code block 3: GET request to Open-Meteo weather API with lat/lon/timezone query params.
- Code block 4: Adding custom headers (Accept: application/json, custom User-Agent).
- Callout: [NOTE] Always set a descriptive User-Agent so API owners can contact you if your script misbehaves.

#### H2: How do you send data with POST, PUT, and DELETE?
- Theory: POST sends data to create a resource. `req_body_json()` encodes an R list as JSON. `req_method()` switches to PUT/DELETE.
- Code block 5: POST JSON data to httpbin.org/post, inspect echoed body.
- Code block 6: Form-encoded POST with `req_body_form()`.
- Callout: [KEY INSIGHT] httr2 automatically sets Content-Type when you use req_body_json() or req_body_form().

#### H2: How do you authenticate API requests?
- Theory: Three common patterns — API key in query/header, Bearer token, OAuth 2.0 authorization code flow.
- Diagram: Figure 3 (auth methods decision tree)
- Code block 7: API key via req_url_query() (e.g., a weather API key parameter).
- Code block 8: Bearer token via `req_auth_bearer_token()`.
- Code block 9: OAuth 2.0 skeleton with `req_oauth_auth_code()`.
- Callout: [WARNING] Never hard-code API keys in your script. Store them in environment variables with Sys.getenv().

#### H2: How do you handle errors, retries, and rate limits?
- Theory: httr2 auto-converts 4xx/5xx to R errors. `req_retry()` adds exponential backoff. `req_throttle()` caps request frequency.
- Code block 10: `req_error()` to customize error messages from the API's JSON body.
- Code block 11: `req_retry()` with max_tries and backoff.
- Code block 12: `req_throttle()` to limit to N requests per second.
- Callout: [TIP] Combine req_throttle() and req_retry() — throttle prevents hitting the limit, retry recovers when you do.

#### H2: How do you paginate through multi-page API results?
- Theory: Many APIs return data in pages. `req_perform_iterative()` follows next-page links or increments offset automatically.
- Code block 13: Manual pagination loop (for APIs with page/offset params).
- Code block 14: `req_perform_iterative()` with `iterate_with_offset()` for automatic pagination.
- Diagram: (not needed — code is self-explanatory)
- Callout: [KEY INSIGHT] req_perform_iterative() returns a list of responses. Use resps_data() to combine them into one dataset.

### Common Mistakes plan (5 mistakes)
1. Forgetting to call req_perform() (request object is inert until performed)
2. Using resp_body_string() then manually parsing JSON instead of resp_body_json()
3. Hard-coding API keys in source code (security risk)
4. Not setting req_throttle() and getting rate-limited / IP banned
5. Ignoring HTTP error codes (assuming every response is valid)

### Practice Exercises plan (4 exercises)
1. Easy: Make a GET request to the Dog CEO API and extract the image URL
2. Medium: Query the Open-Meteo API for temperature in two cities and compare
3. Medium: POST JSON data to httpbin.org/post and verify the echo
4. Challenging: Paginate through a multi-page API collecting all results

### Complete Example plan
- End-to-end: fetch current weather for 5 cities from Open-Meteo, parse responses, build a tibble, print a summary table.

### Summary plan
- Table: function → purpose → example for the 10 most important httr2 functions.

### FAQ plan (5 questions)
1. What is the difference between httr and httr2?
2. Can I use httr2 to download files?
3. How do I debug a failing API request?
4. Does httr2 support async/parallel requests?
5. How do I handle APIs that return XML instead of JSON?

### References plan (8 sources)
1. httr2 official documentation — httr2.r-lib.org
2. httr2 CRAN page
3. Wickham, H. — httr2 "Wrapping APIs" vignette
4. Wickham, H. — httr2 introduction vignette
5. rOpenSci HTTP Testing Book — Chapter 2
6. Albert Rapp — Ultimate httr2 Guide
7. Mozilla MDN — HTTP request methods reference
8. R Core Team — R documentation on Sys.getenv()

### What's Next plan
1. Web Scraping in R with rvest — scrape HTML pages when no API exists
2. DBI in R — connect to SQL databases from R
3. Importing Data in R — read CSV, Excel, and other file formats

## D. Diagram List

| # | Filename | Figure N | Caption | Placed in H2 section |
|---|---|---|---|---|
| 1 | REST-APIs-in-R-with-httr2-request-response.webp | Figure 1 | The HTTP request-response cycle: R sends a request through httr2, the API server returns a JSON response. | What is a REST API and how does R talk to one? |
| 2 | REST-APIs-in-R-with-httr2-pipe-chain.webp | Figure 2 | The httr2 pipe chain: request() starts the chain, req_*() functions modify it, req_perform() sends it, and resp_*() functions extract data. | How do you install httr2 and make your first GET request? |
| 3 | REST-APIs-in-R-with-httr2-auth-methods.webp | Figure 3 | Choosing an authentication method: no auth, API key, Bearer token, or OAuth 2.0. | How do you authenticate API requests? |

## E. Code Block Master List

| Block # | Demonstrates | Libs | Vars introduced | Vars used (from prior) |
|---|---|---|---|---|
| 1 | Install + first GET request to httpbin | httr2 | resp | — |
| 2 | GET Dog CEO API + extract URL | — | dog_resp, dog_data | — |
| 3 | GET with query params (Open-Meteo) | — | weather_resp, weather_data | — |
| 4 | Custom headers | — | header_resp | — |
| 5 | POST JSON to httpbin | — | post_resp, post_data | — |
| 6 | POST form-encoded | — | form_resp | — |
| 7 | API key in query | — | key_resp | — |
| 8 | Bearer token auth | — | auth_resp | — |
| 9 | OAuth 2.0 skeleton | — | client, oauth_req | — |
| 10 | Custom error handling | — | err_resp | — |
| 11 | req_retry() | — | retry_resp | — |
| 12 | req_throttle() | — | throttled_resp | — |
| 13 | Manual pagination loop | jsonlite | all_data, page | — |
| 14 | req_perform_iterative() | — | resps, combined | — |
| 15 | Complete example: 5 cities weather | dplyr, purrr | cities, results, weather_df | — |

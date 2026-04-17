---
title: "REST APIs in R with httr2: GET, POST, OAuth, and Paginated Results"
slug: "REST-APIs-in-R-with-httr2"
description: "httr2 is the modern R package for HTTP. Learn request(), req_perform(), Bearer auth, JSON parsing, rate limiting with req_throttle(), and pagination."
keywords: "httr2, REST API in R, httr2 tutorial, R API call, req_perform, req_body_json, httr2 authentication, httr2 pagination, req_throttle, R HTTP requests"
auto_link_terms: "httr2|REST API in R|request()|req_perform()|req_body_json()|httr2 package|calling APIs in R|HTTP requests in R"
auto_link_case_sensitive: true
mathjax: false
webr: true
date: "2026-04-06"
curriculum_id: "DB4"
post_type: "C"
sidebar_section: "Data Wrangling"
sidebar_title: "REST APIs (httr2)"
sidebar_order: 16
difficulty: "Intermediate"
---


# REST APIs in R with httr2: GET, POST, OAuth, and Paginated Results

<p class="lead">httr2 is the modern R package for calling REST APIs, it lets you build HTTP requests with a pipe chain, handle authentication, parse JSON responses, and paginate through results automatically.</p>

## Introduction

Most interesting data does not come in a CSV file. It lives behind an API. Whether you need live weather forecasts, financial quotes, social media metrics, or government statistics, you will call a REST API to get it. R makes this straightforward with the httr2 package.

httr2 is the successor to the original httr package, redesigned from scratch by Hadley Wickham. Instead of separate `GET()` and `POST()` functions, httr2 uses a single `request()` object that you build up with pipe-friendly `req_*()` functions. This design makes complex requests, with authentication, rate limiting, and pagination, just as easy to write as simple ones.

In this tutorial, you will learn how to make GET and POST requests, parse JSON responses, authenticate with API keys, Bearer tokens, and OAuth 2.0, handle errors and retries, apply rate limiting, and paginate through multi-page results. By the end, you will have a complete toolkit for pulling data from any REST API into R.

[NOTE]
**httr2 requires internet access and cannot run in the browser.** The code blocks in this tutorial show expected output as inline comments. To run the code yourself, install httr2 in RStudio with `install.packages("httr2")` and execute locally.

## What is a REST API and how does R talk to one?

A REST API is a web service that accepts HTTP requests and returns structured data, usually JSON. REST stands for Representational State Transfer, but the name matters less than the mechanics. You send a request with a verb (GET, POST, PUT, DELETE), a URL, optional headers, and an optional body. The server processes it and returns a response with a status code, headers, and a body.

Think of it like ordering at a restaurant. You (the client) tell the waiter (HTTP) what you want (the request). The kitchen (the server) prepares it and sends back your meal (the response). The menu (the API documentation) tells you what you can order and how to ask for it.

![The HTTP request-response cycle: R sends a request through httr2, the API server returns a JSON response](screenshots/REST-APIs-in-R-with-httr2-request-response.webp)

*Figure 1: The HTTP request-response cycle: R sends a request through httr2, the API server returns a JSON response.*

The four most common HTTP verbs map to familiar database operations. GET retrieves data (like a SELECT query). POST creates new data (like an INSERT). PUT updates existing data (like an UPDATE). DELETE removes data. Most data-fetching work in R uses GET requests, but you will also use POST when sending data to an API.

[KEY INSIGHT]
**REST is stateless, every request must carry all the information the server needs.** The server does not remember your previous requests. If an endpoint requires authentication, you must include your credentials in every single request, not just the first one.

## How do you install httr2 and make your first GET request?

Getting started with httr2 takes three steps: install the package, create a request object, and perform it. The `request()` function takes a URL and returns a request object. The `req_perform()` function sends it. The `resp_body_json()` function parses the JSON response into an R list.

Let's start with a simple GET request to httpbin.org, a free testing service that echoes back whatever you send it.

```r title="First GET request with httr2"
# Install and load httr2
install.packages("httr2")
library(httr2)

# Create and perform a GET request
resp <- request("https://httpbin.org/get") |>
  req_perform()

# Check the status code
resp_status(resp)
#> [1] 200

# Parse the JSON body
resp_body_json(resp)
#> $args
#> named list()
#>
#> $headers
#> $headers$Accept
#> [1] "*/*"
#>
#> $headers$Host
#> [1] "httpbin.org"
#>
#> $url
#> [1] "https://httpbin.org/get"
```

A status code of 200 means success. The response body shows the request headers and URL that the server received. This confirms httr2 is working.

![The httr2 pipe chain: request() starts the chain, req_*() functions modify it, req_perform() sends it, and resp_*() functions extract data](screenshots/REST-APIs-in-R-with-httr2-pipe-chain.webp)

*Figure 2: The httr2 pipe chain: request() starts the chain, req_*() functions modify it, req_perform() sends it, and resp_*() functions extract data.*

Now let's call a real API. The Dog CEO API returns a random dog image URL with no authentication required.

```r title="Fetch a random dog image"
# Get a random dog image
dog_resp <- request("https://dog.ceo/api/breeds/image/random") |>
  req_perform()

dog_data <- resp_body_json(dog_resp)
dog_data$message
#> [1] "https://images.dog.ceo/breeds/retriever-golden/n02099601_1234.jpg"

dog_data$status
#> [1] "success"
```

The response is a list with two elements: `message` (the image URL) and `status`. This is the typical pattern, call `resp_body_json()` to get a list, then extract the fields you need.

[TIP]
**Use req_dry_run() to inspect what httr2 will send without actually sending it.** This is invaluable for debugging. Just replace `req_perform()` with `req_dry_run()` in your pipe chain to see the exact HTTP request that would be sent.

## How do you add query parameters and custom headers?

Many APIs require query parameters, the `?key=value` pairs at the end of a URL. Instead of manually constructing URLs, use `req_url_query()` to add them cleanly. For custom headers, use `req_headers()`.

Let's fetch weather data from the Open-Meteo API, which provides free weather forecasts without authentication. It requires latitude, longitude, and the variables you want as query parameters.

```r title="Weather query parameters"
# Fetch current temperature for London
weather_resp <- request("https://api.open-meteo.com/v1/forecast") |>
  req_url_query(
    latitude = 51.5074,
    longitude = -0.1278,
    current = "temperature_2m,wind_speed_10m",
    timezone = "Europe/London"
  ) |>
  req_perform()

weather_data <- resp_body_json(weather_resp)
weather_data$current$temperature_2m
#> [1] 14.2

weather_data$current$wind_speed_10m
#> [1] 8.5
```

The `req_url_query()` function builds the URL `https://api.open-meteo.com/v1/forecast?latitude=51.5074&longitude=-0.1278&current=temperature_2m,wind_speed_10m&timezone=Europe/London` for you. This is cleaner and less error-prone than concatenating strings.

Custom headers tell the server about your client. The most important ones are `Accept` (what format you want back) and `User-Agent` (who you are).

```r title="Custom headers with reqheaders"
# Add custom headers to a request
header_resp <- request("https://httpbin.org/headers") |>
  req_headers(
    Accept = "application/json",
    `User-Agent` = "my-r-script/1.0 (contact@example.com)"
  ) |>
  req_perform()

resp_body_json(header_resp)$headers$`User-Agent`
#> [1] "my-r-script/1.0 (contact@example.com)"
```

The backticks around `User-Agent` are needed because the header name contains a hyphen. R treats it as an expression otherwise.

[NOTE]
**Always set a descriptive User-Agent so API owners can identify your script.** Include a contact email or project URL. If your script accidentally sends too many requests, the API owner can reach you instead of simply blocking your IP.

## How do you send data with POST, PUT, and DELETE?

GET requests retrieve data. POST requests send data to the server, for creating records, submitting forms, or triggering actions. httr2 provides three body-encoding functions: `req_body_json()` for JSON, `req_body_form()` for form data, and `req_body_multipart()` for file uploads.

Let's POST a JSON payload to httpbin.org, which echoes it back so you can verify what was sent.

```r title="POST JSON body with reqbodyjson"
# POST JSON data
post_resp <- request("https://httpbin.org/post") |>
  req_body_json(list(
    name = "Alice",
    language = "R",
    packages = list("httr2", "dplyr", "ggplot2")
  )) |>
  req_perform()

post_data <- resp_body_json(post_resp)
post_data$json$name
#> [1] "Alice"

post_data$json$packages
#> [[1]]
#> [1] "httr2"
#> [[2]]
#> [1] "dplyr"
#> [[3]]
#> [1] "ggplot2"
```

Notice that you did not need to call `req_method("POST")`. When you add a body with `req_body_json()`, httr2 automatically switches the method to POST. The R list is serialized to JSON, nested lists become JSON arrays, named lists become JSON objects.

For APIs that expect form-encoded data (like HTML forms), use `req_body_form()` instead.

```r title="POST form-encoded body"
# POST form-encoded data
form_resp <- request("https://httpbin.org/post") |>
  req_body_form(
    username = "alice",
    password = "secret123"
  ) |>
  req_perform()

resp_body_json(form_resp)$form$username
#> [1] "alice"
```

The difference is the Content-Type header. `req_body_json()` sends `application/json`, while `req_body_form()` sends `application/x-www-form-urlencoded`. The API documentation tells you which one to use.

[KEY INSIGHT]
**httr2 automatically sets the Content-Type header when you use req_body_json() or req_body_form().** You never need to set it manually. If you use `req_body_raw()` for binary data, then you must specify the content type yourself.

For PUT and DELETE requests, add `req_method()` to your pipe chain.

```r title="PUT request with reqmethod"
# PUT request (update a resource)
put_resp <- request("https://httpbin.org/put") |>
  req_body_json(list(name = "Alice", language = "Python")) |>
  req_method("PUT") |>
  req_perform()

resp_status(put_resp)
#> [1] 200
```

## How do you authenticate API requests?

Most production APIs require authentication. The three most common methods are API keys, Bearer tokens, and OAuth 2.0. Each serves a different use case, and httr2 has built-in support for all three.

![Choosing an authentication method: no auth, API key, Bearer token, or OAuth 2.0](screenshots/REST-APIs-in-R-with-httr2-auth-methods.webp)

*Figure 3: Choosing an authentication method: no auth, API key, Bearer token, or OAuth 2.0.*

**API keys** are the simplest. The API gives you a string, and you include it in every request, either as a query parameter or a header. Here is the query parameter approach.

```r title="API key via query parameter"
# API key as a query parameter
# Store your key in .Renviron: WEATHER_API_KEY=your_key_here
api_key <- Sys.getenv("WEATHER_API_KEY")

key_resp <- request("https://api.example.com/data") |>
  req_url_query(api_key = api_key) |>
  req_perform()
```

**Bearer tokens** are used by APIs that issue short-lived access tokens. You include the token in the Authorization header. httr2 provides a convenience function for this.

```r title="Bearer token authentication"
# Bearer token authentication
token <- Sys.getenv("MY_API_TOKEN")

auth_resp <- request("https://api.example.com/protected") |>
  req_auth_bearer_token(token) |>
  req_perform()
```

The `req_auth_bearer_token()` function adds the header `Authorization: Bearer <token>` to your request. This is equivalent to calling `req_headers(Authorization = paste("Bearer", token))`, but cleaner and less error-prone.

**OAuth 2.0** is the most complex authentication flow. It involves registering your app, redirecting the user to a login page, receiving an authorization code, and exchanging it for an access token. httr2 handles the entire flow.

```r title="OAuth two authorization code flow"
# OAuth 2.0 authorization code flow
client <- oauth_client(
  id = Sys.getenv("OAUTH_CLIENT_ID"),
  secret = Sys.getenv("OAUTH_CLIENT_SECRET"),
  token_url = "https://api.example.com/oauth/token",
  name = "my-r-app"
)

oauth_req <- request("https://api.example.com/user") |>
  req_oauth_auth_code(
    client = client,
    auth_url = "https://api.example.com/oauth/authorize"
  ) |>
  req_perform()
```

When you run this, httr2 opens your browser for login, receives the callback, exchanges the code for a token, caches it, and attaches it to the request. On subsequent runs, it reuses the cached token until it expires.

[WARNING]
**Never hard-code API keys or tokens in your script.** Store them in a `.Renviron` file (one `KEY=value` per line) and read them with `Sys.getenv("KEY")`. This keeps credentials out of version control. Run `usethis::edit_r_environ()` to open the file.

## How do you handle errors, retries, and rate limits?

APIs fail. Servers go down, rate limits get hit, and networks drop. httr2 provides three layers of resilience: automatic error detection, configurable retries, and request throttling.

By default, httr2 converts any 4xx or 5xx HTTP status code into an R error. This means a failed request stops your script immediately instead of silently returning bad data. You can customize the error message to include details from the API's response body.

```r title="Custom error messages with reqerror"
# Custom error handling
err_resp <- request("https://httpbin.org/status/404") |>
  req_error(body = function(resp) {
    paste("API returned:", resp_status(resp), resp_status_desc(resp))
  }) |>
  req_perform()
#> Error in `req_perform()`:
#> ! HTTP 404 Not Found
#> * API returned: 404 Not Found
```

The `body` argument to `req_error()` is a function that receives the response and returns a string. This string is appended to the error message, making it much easier to diagnose failures.

For transient errors (server overload, network timeouts), add `req_retry()` to automatically retry failed requests with exponential backoff.

```r title="Automatic retries with backoff"
# Automatic retries with backoff
retry_resp <- request("https://httpbin.org/status/503") |>
  req_retry(
    max_tries = 3,
    backoff = ~ 2  # wait 1s, 2s, 4s between retries
  ) |>
  req_perform()
```

httr2 will attempt the request up to 3 times, waiting 1 second before the first retry, 2 seconds before the second, and so on. It only retries on 429 (Too Many Requests) and 503 (Service Unavailable) status codes by default.

To prevent hitting rate limits in the first place, use `req_throttle()`. This limits how many requests httr2 sends per second.

```r title="Rate limit with reqthrottle"
# Rate limiting: max 1 request per second
throttled_resp <- request("https://httpbin.org/get") |>
  req_throttle(rate = 1) |>  # 1 request per second
  req_perform()
```

The rate applies across all requests to the same host, even if you create separate request objects. This is global rate limiting, httr2 tracks it automatically.

[TIP]
**Combine req_throttle() and req_retry() in every production script.** Throttle prevents you from hitting the rate limit. Retry recovers when transient errors happen anyway. Together, they make your API calls robust without extra code.

## How do you paginate through multi-page API results?

Many APIs return data in pages. A search might match 10,000 records, but the API returns 100 at a time. You need to loop through all pages to get the complete dataset. httr2 offers two approaches: a manual loop and the automatic `req_perform_iterative()` function.

Here is the manual approach using an offset-based API. This works with any API that accepts `page` or `offset` parameters.

```r title="Manual pagination loop"
# Manual pagination loop
library(httr2)

all_data <- list()
page <- 1
has_more <- TRUE

while (has_more) {
  resp <- request("https://pokeapi.co/api/v2/pokemon") |>
    req_url_query(limit = 20, offset = (page - 1) * 20) |>
    req_throttle(rate = 2) |>
    req_perform()

  body <- resp_body_json(resp)
  all_data <- c(all_data, body$results)

  has_more <- !is.null(body$`next`)
  page <- page + 1

  if (page > 5) break  # safety limit for this example
}

length(all_data)
#> [1] 100

all_data[[1]]$name
#> [1] "bulbasaur"
```

This loop fetches 20 Pokemon per page, appending results to a list. It stops when the API's `next` field is NULL (no more pages) or after 5 pages as a safety limit.

For APIs that follow standard pagination patterns, `req_perform_iterative()` automates the loop. You provide a callback that tells httr2 how to build the next request from the current response.

```r title="Automatic pagination iterator"
# Automatic pagination with req_perform_iterative()
resps <- request("https://pokeapi.co/api/v2/pokemon") |>
  req_url_query(limit = 20) |>
  req_throttle(rate = 2) |>
  req_perform_iterative(
    next_req = iterate_with_offset(
      param_name = "offset",
      start = 0,
      offset = 20,
      resp_pages = function(resp) ceiling(resp_body_json(resp)$count / 20)
    ),
    max_reqs = 5
  )

length(resps)
#> [1] 5

# Combine all responses into one list
combined <- resps |>
  resps_data(function(resp) resp_body_json(resp)$results)

length(combined)
#> [1] 100

combined[[1]]$name
#> [1] "bulbasaur"
```

The `iterate_with_offset()` helper increments the offset parameter by 20 each time. The `resp_pages` callback tells httr2 the total number of pages so it knows when to stop. The `max_reqs` parameter adds a safety cap.

[KEY INSIGHT]
**req_perform_iterative() returns a list of responses, not a single combined dataset.** Use `resps_data()` with an extraction function to combine them. This keeps the raw responses available for debugging if any page fails.

## Common Mistakes and How to Fix Them

### Mistake 1: Forgetting to call req_perform()

The `request()` function and all `req_*()` functions return a request object, they do not send anything. The request sits idle until you call `req_perform()`.

```r title="Mistake: Forgetting reqperform"
# Wrong: this creates a request object but never sends it
resp <- request("https://httpbin.org/get") |>
  req_headers(Accept = "application/json")

class(resp)
#> [1] "httr2_request"
```

**Why it is wrong:** The variable `resp` contains a request, not a response. Calling `resp_body_json(resp)` on it will throw an error because it is not a response object.

```r title="Correct: Add reqperform to send"
# Correct: add req_perform() to send the request
resp <- request("https://httpbin.org/get") |>
  req_headers(Accept = "application/json") |>
  req_perform()

resp_status(resp)
#> [1] 200
```

### Mistake 2: Manually parsing JSON instead of using resp_body_json()

Some programmers extract the body as text and then call `jsonlite::fromJSON()`. This works but skips httr2's built-in parsing and error checking.

```r title="Mistake: Manual jsonlite parsing"
# Inefficient: manual JSON parsing
raw_text <- resp_body_string(resp)
data <- jsonlite::fromJSON(raw_text)
```

**Why it is wrong:** `resp_body_json()` handles character encoding, checks the Content-Type header, and integrates with httr2's error system. Manual parsing bypasses all of this.

```r title="Correct: Use respbodyjson directly"
# Correct: use resp_body_json() directly
data <- resp_body_json(resp)
```

### Mistake 3: Hard-coding API keys in your script

```r title="Mistake: Hardcoded API key"
# Wrong: key visible in source code
resp <- request("https://api.example.com/data") |>
  req_url_query(api_key = "sk-abc123secret") |>
  req_perform()
```

**Why it is wrong:** If you commit this file to Git, your key is exposed to anyone with repository access. Automated scanners on GitHub detect leaked keys within minutes.

```r title="Correct: Read key from environment"
# Correct: read from environment variable
resp <- request("https://api.example.com/data") |>
  req_url_query(api_key = Sys.getenv("MY_API_KEY")) |>
  req_perform()
```

### Mistake 4: Not throttling requests in a loop

```r title="Mistake: No throttle in loop"
# Wrong: hammering the API as fast as possible
for (i in 1:1000) {
  resp <- request(paste0("https://api.example.com/item/", i)) |>
    req_perform()
}
```

**Why it is wrong:** Most APIs enforce rate limits (e.g., 60 requests per minute). Exceeding them results in 429 errors and potential IP bans.

```r title="Correct: Throttle each request"
# Correct: throttle requests
for (i in 1:1000) {
  resp <- request(paste0("https://api.example.com/item/", i)) |>
    req_throttle(rate = 1) |>
    req_perform()
}
```

### Mistake 5: Assuming every response contains valid data

```r title="Mistake: Parse without status check"
# Wrong: parsing without checking status
resp <- request("https://api.example.com/data") |>
  req_error(is_error = ~ FALSE) |>  # suppress auto-errors
  req_perform()

data <- resp_body_json(resp)  # might parse an error message as "data"
```

**Why it is wrong:** If you suppress automatic error checking with `req_error(is_error = ~ FALSE)`, a 404 or 500 response still returns a body, but it contains an error message, not your data. Your downstream code processes garbage.

```r title="Correct: Let httr2 auto-error"
# Correct: check status before parsing
resp <- request("https://api.example.com/data") |>
  req_perform()  # auto-throws on 4xx/5xx

data <- resp_body_json(resp)  # only reached if status is 2xx
```

## Practice Exercises

### Exercise 1: Fetch a random dog image

Use httr2 to call the Dog CEO API at `https://dog.ceo/api/breeds/image/random` and extract just the image URL from the response. Print it to the console.

```r title="Exercise: Fetch dog image URL"
# Exercise: fetch a random dog image URL
# Hint: use request() |> req_perform() |> resp_body_json()

# Write your code below:

```

<details>
<summary>Click to reveal solution</summary>

```r title="Dog image URL solution"
library(httr2)

my_resp <- request("https://dog.ceo/api/breeds/image/random") |>
  req_perform()

my_data <- resp_body_json(my_resp)
cat("Dog image URL:", my_data$message, "\n")
#> Dog image URL: https://images.dog.ceo/breeds/hound-afghan/n02088094_1003.jpg
```

**Explanation:** `request()` creates the request, `req_perform()` sends it, and `resp_body_json()` parses the JSON. The image URL is in the `message` field.

</details>

### Exercise 2: Compare temperatures in two cities

Use the Open-Meteo API (`https://api.open-meteo.com/v1/forecast`) to fetch the current temperature for Paris (lat 48.8566, lon 2.3522) and Tokyo (lat 35.6762, lon 139.6503). Print both temperatures and which city is warmer.

```r title="Exercise: Compare two city temperatures"
# Exercise: compare temperatures in two cities
# Hint: make two separate requests with req_url_query(latitude, longitude, current = "temperature_2m")

# Write your code below:

```

<details>
<summary>Click to reveal solution</summary>

```r title="Two-city temperatures solution"
library(httr2)

get_temp <- function(lat, lon, city) {
  my_resp <- request("https://api.open-meteo.com/v1/forecast") |>
    req_url_query(
      latitude = lat,
      longitude = lon,
      current = "temperature_2m"
    ) |>
    req_perform()

  temp <- resp_body_json(my_resp)$current$temperature_2m
  cat(city, ":", temp, "C\n")
  temp
}

paris_temp <- get_temp(48.8566, 2.3522, "Paris")
tokyo_temp <- get_temp(35.6762, 139.6503, "Tokyo")

warmer <- if (paris_temp > tokyo_temp) "Paris" else "Tokyo"
cat("Warmer city:", warmer, "\n")
#> Paris : 16.3 C
#> Tokyo : 22.1 C
#> Warmer city: Tokyo
```

**Explanation:** A helper function avoids repeating the same request pattern. Each call builds a request with latitude and longitude query parameters, performs it, and extracts the temperature.

</details>

### Exercise 3: POST JSON and verify the echo

Send a POST request to `https://httpbin.org/post` with a JSON body containing your name and a list of three favourite R packages. Parse the response and verify that the echoed JSON matches what you sent.

```r title="Exercise: POST JSON and verify echo"
# Exercise: POST JSON data and verify the echo
# Hint: use req_body_json(list(...)) and check resp_body_json()$json

# Write your code below:

```

<details>
<summary>Click to reveal solution</summary>

```r title="POST JSON echo solution"
library(httr2)

my_payload <- list(
  name = "Student",
  packages = list("ggplot2", "dplyr", "httr2")
)

my_resp <- request("https://httpbin.org/post") |>
  req_body_json(my_payload) |>
  req_perform()

my_echo <- resp_body_json(my_resp)$json
cat("Name echoed:", my_echo$name, "\n")
cat("Packages echoed:", paste(my_echo$packages, collapse = ", "), "\n")
cat("Match:", identical(my_echo$name, "Student"), "\n")
#> Name echoed: Student
#> Packages echoed: ggplot2, dplyr, httr2
#> Match: TRUE
```

**Explanation:** httpbin.org echoes back the JSON body in the `json` field of its response. The `identical()` check confirms the round-trip worked.

</details>

### Exercise 4: Paginate through the PokeAPI

Fetch the first 60 Pokemon names from `https://pokeapi.co/api/v2/pokemon` using a manual pagination loop with `limit=20` per page. Store all names in a character vector and print the first 10.

```r title="Exercise: Paginate sixty Pokemon names"
# Exercise: paginate through 3 pages of the PokeAPI
# Hint: use a while loop, increment offset by 20 each time, collect $results

# Write your code below:

```

<details>
<summary>Click to reveal solution</summary>

```r title="Sixty Pokemon solution"
library(httr2)

my_names <- character(0)
my_offset <- 0

while (my_offset < 60) {
  my_resp <- request("https://pokeapi.co/api/v2/pokemon") |>
    req_url_query(limit = 20, offset = my_offset) |>
    req_throttle(rate = 2) |>
    req_perform()

  my_results <- resp_body_json(my_resp)$results
  my_names <- c(my_names, vapply(my_results, \(x) x$name, character(1)))
  my_offset <- my_offset + 20
}

cat("Total Pokemon:", length(my_names), "\n")
head(my_names, 10)
#> Total Pokemon: 60
#>  [1] "bulbasaur"  "ivysaur"    "venusaur"   "charmander" "charmeleon"
#>  [6] "charizard"  "squirtle"   "wartortle"  "blastoise"  "caterpie"
```

**Explanation:** The loop increments `my_offset` by 20 each iteration, fetching the next page. `vapply()` extracts the `name` field from each result element. The `req_throttle(rate = 2)` ensures polite API usage.

</details>

## Putting It All Together

Let's build a complete workflow: fetch current weather for five major cities, parse the responses, and assemble a clean summary table.

```r title="End-to-end five-city weather dashboard"
library(httr2)
library(dplyr)
library(purrr)

# Define cities with coordinates
cities <- tibble(
  city = c("London", "New York", "Tokyo", "Sydney", "Nairobi"),
  lat = c(51.5074, 40.7128, 35.6762, -33.8688, -1.2921),
  lon = c(-0.1278, -74.0060, 139.6503, 151.2093, 36.8219)
)

# Fetch weather for each city
get_weather <- function(lat, lon) {
  resp <- request("https://api.open-meteo.com/v1/forecast") |>
    req_url_query(
      latitude = lat,
      longitude = lon,
      current = "temperature_2m,wind_speed_10m,relative_humidity_2m"
    ) |>
    req_throttle(rate = 2) |>
    req_retry(max_tries = 3) |>
    req_perform()

  resp_body_json(resp)$current
}

# Map over cities and extract weather data
results <- pmap(cities, function(city, lat, lon) {
  w <- get_weather(lat, lon)
  tibble(
    city = city,
    temp_c = w$temperature_2m,
    wind_kmh = w$wind_speed_10m,
    humidity = w$relative_humidity_2m
  )
})

# Combine into one data frame
weather_df <- bind_rows(results)
weather_df <- weather_df |>
  arrange(desc(temp_c))

print(weather_df)
#> # A tibble: 5 x 4
#>   city     temp_c wind_kmh humidity
#>   <chr>     <dbl>    <dbl>    <dbl>
#> 1 Nairobi    26.1      8.2       52
#> 2 Sydney     21.3     12.4       65
#> 3 Tokyo      18.7      6.1       71
#> 4 London     14.2      8.5       78
#> 5 New York   12.8     15.3       68
```

This example demonstrates the full httr2 workflow in a realistic scenario. The `get_weather()` function builds a request with query parameters, applies throttling and retry logic, performs the request, and extracts the data. The `pmap()` call applies it to each city row. The result is a clean tibble sorted by temperature.

Notice how `req_throttle(rate = 2)` and `req_retry(max_tries = 3)` are baked into the helper function. Every request is automatically polite and resilient. This is the production pattern you should use for any API integration.

## Summary

Here are the most important httr2 functions and when to use them.

| Function | Purpose | Example |
|---|---|---|
| `request()` | Create a request object from a URL | `request("https://api.example.com")` |
| `req_url_query()` | Add query parameters (?key=value) | `req_url_query(limit = 10)` |
| `req_headers()` | Set custom HTTP headers | `req_headers(Accept = "application/json")` |
| `req_body_json()` | Add a JSON body (auto-switches to POST) | `req_body_json(list(name = "Alice"))` |
| `req_auth_bearer_token()` | Add Bearer token authentication | `req_auth_bearer_token(token)` |
| `req_throttle()` | Limit request rate per host | `req_throttle(rate = 1)` |
| `req_retry()` | Auto-retry on transient failures | `req_retry(max_tries = 3)` |
| `req_perform()` | Send the request and get a response | `req_perform()` |
| `resp_body_json()` | Parse response body as JSON | `resp_body_json(resp)` |
| `resp_status()` | Get the HTTP status code | `resp_status(resp)` |

The typical workflow is: `request(url)` then pipe through `req_*()` modifiers, then `req_perform()`, then `resp_*()` extractors. Every modifier returns the request object, so the entire chain is one readable pipe.

## FAQ

**What is the difference between httr and httr2?**

httr2 is a ground-up rewrite of httr by the same author (Hadley Wickham). The biggest change is the API design: httr has separate `GET()`, `POST()`, `PUT()` functions, while httr2 uses a single `request()` object modified by `req_*()` pipes. httr2 also adds built-in rate limiting, retries, OAuth improvements, and secret management that httr lacks. New projects should use httr2.

**Can I use httr2 to download files?**

Yes. Use `req_perform()` with the `path` argument to save the response body directly to a file: `req_perform(path = "output.csv")`. This streams the file to disk without loading it into memory, which is important for large files.

**How do I debug a failing API request?**

Three tools help. First, `req_dry_run()` shows the exact request without sending it. Second, `last_response()` retrieves the most recent response after an error. Third, `resp_body_string()` shows the raw response body as text, which often contains an error message from the API.

**Does httr2 support async or parallel requests?**

httr2 provides `req_perform_parallel()` for sending multiple requests concurrently. Pass a list of request objects and it returns a list of responses. This is faster than sequential requests when you need data from many endpoints.

**How do I handle APIs that return XML instead of JSON?**

httr2 does not have a built-in XML parser, but you can extract the body as text with `resp_body_string()` and parse it with the xml2 package: `xml2::read_xml(resp_body_string(resp))`. Most modern APIs return JSON, so this is uncommon.

## References

1. Wickham, H., httr2: Perform HTTP Requests and Process the Responses. Official documentation. [Link](https://httr2.r-lib.org/)
2. Wickham, H., "Wrapping APIs" vignette for httr2. [Link](https://httr2.r-lib.org/articles/wrapping-apis.html)
3. Wickham, H., httr2 introduction vignette. [Link](https://httr2.r-lib.org/articles/httr2.html)
4. httr2 CRAN page, Package reference manual (v1.1.0). [Link](https://cran.r-project.org/web/packages/httr2/index.html)
5. Chamberlin, S. & Salmon, M., *HTTP Testing in R*, Chapter 2: HTTP in R 101. rOpenSci. [Link](https://books.ropensci.org/http-testing/http-in-r-101.html)
6. Rapp, A., "The Ultimate Guide to Get Data Through APIs With httr2 and R." [Link](https://albert-rapp.de/posts/web_dev/07_httr2_ultimate_guide/07_httr2)
7. Mozilla Developer Network, HTTP request methods. [Link](https://developer.mozilla.org/en-US/docs/Web/HTTP/Methods)
8. R Core Team, Sys.getenv() documentation. [Link](https://stat.ethz.ch/R-manual/R-devel/library/base/html/Sys.getenv.html)

## Continue Learning

Now that you can pull data from APIs, explore these related tutorials:

- **[Web Scraping in R with rvest](Web-Scraping-in-R-with-rvest.html)**, When a website has no API, scrape the HTML directly to extract tables and text.
- **[DBI in R: Connect to Any Database](DBI-in-R.html)**, Connect R to SQL databases like SQLite, PostgreSQL, and MySQL with a unified interface.
- **[Importing Data in R](Importing-Data-in-R.html)**, Read CSV, Excel, JSON, and other file formats into R data frames.

---
title: "Web Scraping in R with rvest: Extract Any Table or Text in 10 Minutes"
slug: "Web-Scraping-in-R-with-rvest"
description: "rvest makes web scraping in R easy. Master read_html(), html_elements(), html_table(), and html_text() plus pagination, sessions, and polite scraping."
keywords: "web scraping in R, rvest, read_html, html_elements, html_table, html_text, R web scraping tutorial, rvest tutorial, scrape website R, polite scraping R"
auto_link_terms: "web scraping in R|rvest|read_html()|html_elements()|html_table()|html_text()|web scraping|rvest package"
auto_link_case_sensitive: true
mathjax: false
webr: true
date: "2026-04-06"
curriculum_id: "DB3"
post_type: "C"
sidebar_section: "Data Wrangling"
sidebar_title: "Web Scraping (rvest)"
sidebar_order: 15
---


# Web Scraping in R with rvest: Extract Any Table or Text in 10 Minutes

<p class="lead">rvest is an R package that reads HTML pages, selects elements with CSS selectors, and extracts text, tables, and attributes into clean data frames — letting you turn any website into structured data.</p>

## Introduction

The data you need often lives on a website, not in a CSV file. Maybe it is a table of country statistics on Wikipedia, a list of product prices on an e-commerce site, or research results published in HTML. Web scraping is the technique that extracts that data programmatically so you can analyse it in R.

The rvest package is the tidyverse's tool for web scraping. It wraps the libxml2 C library for fast HTML parsing and provides a small set of intuitive functions: `read_html()` to fetch a page, `html_elements()` to select nodes, and extraction helpers like `html_text2()`, `html_table()`, and `html_attr()` to pull out the data you need.

In this tutorial, you will learn how to read HTML into R, target specific elements with CSS selectors, extract text and tables, handle pagination across multiple pages, manage cookies with sessions, and scrape politely using the robotstxt and polite packages. By the end, you will have a complete scraping workflow from URL to clean data frame.

[NOTE]
**rvest requires internet access and cannot run in the browser.** The code blocks in this tutorial show expected output as comments. To run the code yourself, install rvest in RStudio with `install.packages("rvest")` and execute locally.

![The rvest scraping pipeline: from URL to clean data frame](screenshots/Web-Scraping-in-R-with-rvest-pipeline.webp)

*Figure 1: The rvest scraping pipeline: from URL to clean data frame.*

## What is web scraping and when should you use it?

Web scraping means writing code that downloads a web page's HTML and extracts specific data from it. Instead of copying and pasting by hand, your R script reads the page, finds the elements you care about, and returns them as vectors or data frames.

You should consider web scraping when three conditions are met. First, the data is publicly available on a website. Second, there is no API or downloadable file that provides the same data in a structured format. Third, the website's terms of service and robots.txt file do not prohibit automated access.

Before you scrape any site, check two things. Open `https://example.com/robots.txt` in your browser to see which paths are allowed or disallowed for bots. Then read the site's Terms of Service — some explicitly forbid scraping even on public pages.

[WARNING]
**Always check robots.txt and Terms of Service before scraping.** Ignoring these can result in your IP being blocked, legal action, or violating ethical norms. When in doubt, contact the site owner or look for an official API.

Web scraping is appropriate for academic research on public data, monitoring publicly posted prices or statistics, collecting data for personal projects, and aggregating information that has no API. It is not appropriate for scraping behind login walls without permission, collecting personal data, or circumventing paywalls.

## How do you read an HTML page into R with rvest?

Every rvest workflow starts with `read_html()`. This function takes a URL (or a local file path) and returns a parsed HTML document that you can query with other rvest functions.

Let's install and load rvest, then read a Wikipedia page.

```r
# Install rvest (run once)
install.packages("rvest")

# Load the library
library(rvest)

# Read a Wikipedia page
page <- read_html("https://en.wikipedia.org/wiki/R_(programming_language)")
page
#> {html_document}
#> <html class="client-nojs" lang="en" dir="ltr">
#> [1] <head>\n<meta http-equiv="Content-Type" content="text/html; charset=UTF-8 ...
#> [2] <body class="mediawiki ltr sitedir-ltr mw-hide-empty-elt ns-0 rootpage-R_ ...
```

The `page` object is an XML document stored in memory. It contains the entire DOM tree of the web page. You will never work with this object directly — instead, you pass it to `html_elements()` to select the parts you need.

You can also read HTML from a local file or from a character string. This is useful for testing your selectors without hitting a live server repeatedly.

```r
# Read HTML from a string (useful for testing)
test_page <- read_html("<html><body><h1>Hello</h1><p>World</p></body></html>")
test_page
#> {html_document}
#> <html>
#> [1] <body>\n<h1>Hello</h1>\n<p>World</p>\n</body>
```

[TIP]
**Test your selectors on a local HTML string first.** Create a minimal HTML snippet with `read_html()`, verify your CSS selectors work, then switch to the live URL. This saves time and avoids hitting the server unnecessarily.

## How do CSS selectors target HTML elements?

CSS selectors are patterns that identify specific HTML elements on a page. They are the same selectors used in web design to apply styles. In rvest, you pass a CSS selector string to `html_elements()` to pick out exactly the elements you want.

HTML elements have three main identifiers you can target. A **tag name** like `p`, `h1`, `table`, or `a` identifies the element type. A **class** (prefixed with `.`) groups elements that share a style or purpose. An **id** (prefixed with `#`) uniquely identifies one specific element on the page.

![Five types of CSS selectors used to target HTML elements](screenshots/Web-Scraping-in-R-with-rvest-css-selectors.webp)

*Figure 2: Five types of CSS selectors used to target HTML elements.*

Here is a quick reference for the most common selector patterns.

| Selector | What It Matches | Example |
|----------|----------------|---------|
| `p` | All `<p>` elements | All paragraphs |
| `.info` | Elements with `class="info"` | `<div class="info">` |
| `#main` | The element with `id="main"` | `<div id="main">` |
| `div > p` | `<p>` that is a direct child of `<div>` | Nested paragraphs |
| `a[href]` | `<a>` elements that have an `href` attribute | All links |
| `table.wikitable` | `<table>` with `class="wikitable"` | Wikipedia tables |

Let's use these selectors on our Wikipedia page to extract different elements.

```r
# Select all h2 headings
headings <- page |> html_elements("h2")
length(headings)
#> [1] 18

# Select elements by class
toc_items <- page |> html_elements(".toc-text")
length(toc_items)
#> [1] 45

# Select by combined tag + class
wiki_tables <- page |> html_elements("table.wikitable")
length(wiki_tables)
#> [1] 2
```

The `html_elements()` function always returns a list of matching nodes (a `nodeset`). If no elements match, you get an empty nodeset rather than an error. Use `html_element()` (singular) when you expect exactly one match — it returns `NA` instead of an empty set when nothing matches.

[TIP]
**Use the SelectorGadget browser extension to find CSS selectors visually.** Install it from selectorgadget.com. Click on the element you want, and it generates the CSS selector for you. This is far faster than reading the raw HTML source.

## How do you extract text, tables, and attributes from HTML?

Once you have selected HTML elements with `html_elements()`, you need to pull out the actual data. The rvest package provides three main extraction functions: `html_text2()` for text content, `html_table()` for tables, and `html_attr()` for attributes like links and image sources.

![How rvest functions map to the HTML DOM tree](screenshots/Web-Scraping-in-R-with-rvest-function-map.webp)

*Figure 3: How rvest functions map to the HTML DOM tree.*

### Extracting text with html_text2()

The `html_text2()` function extracts the visible text from HTML elements. It mimics how a browser renders text — collapsing whitespace, respecting line breaks, and stripping HTML tags.

```r
# Extract text from h2 headings
heading_text <- page |>
  html_elements("h2") |>
  html_text2()

head(heading_text, 6)
#> [1] "History"           "Features"          "Packages"
#> [4] "Milestones"        "Interfaces"        "Implementations"
```

[KEY INSIGHT]
**Always use html_text2() instead of html_text().** The older `html_text()` preserves raw whitespace from the HTML source, which often includes invisible tabs and newlines. `html_text2()` returns clean, browser-like text. The only exception is when you specifically need the raw whitespace for parsing.

### Extracting tables with html_table()

Many websites display data in HTML `<table>` elements. The `html_table()` function converts these directly into R data frames — no manual parsing needed.

```r
# Extract all tables from the page
tables <- page |> html_elements("table.wikitable") |> html_table()
length(tables)
#> [1] 2

# Look at the first table
df <- tables[[1]]
head(df, 5)
#>   Release  Date
#> 1 0.16     ...
#> 2 0.49     1997-04-23
#> 3 0.60     1997-12-05
#> 4 0.65.1   1999-10-07
#> 5 1.0      2000-02-29
```

The `html_table()` function returns a tibble by default. If the table has merged cells or complex headers, you may need to set `fill = TRUE` to handle irregular structures.

### Extracting attributes with html_attr()

HTML elements carry metadata in their attributes. Links have `href`, images have `src`, and many elements have `class` or `id`. The `html_attr()` function extracts a single attribute by name.

```r
# Extract all links from the page
links <- page |> html_elements("a") |> html_attr("href")
length(links)
#> [1] 1247

# Show the first 5 links
head(links, 5)
#> [1] "/wiki/Main_Page"
#> [2] "/wiki/Wikipedia:Contents"
#> [3] "/wiki/Portal:Current_events"
#> [4] "/wiki/Special:Random"
#> [5] "/wiki/Wikipedia:About"

# Filter to external links only
external <- links[grepl("^https?://", links)]
head(external, 3)
#> [1] "https://www.r-project.org/"
#> [2] "https://cran.r-project.org/"
#> [3] "https://github.com/wch/r-source"
```

Use `html_attrs()` (plural) to get all attributes of an element as a named character vector. This is useful when you are exploring a page and do not know which attributes are available.

## How do you scrape multiple pages with pagination?

Real-world scraping often involves multiple pages. A paginated website might show 20 results per page, with URLs like `page=1`, `page=2`, and so on. You handle this by building a vector of URLs and looping through them.

The key pattern is: construct the URLs, loop with a delay between requests, extract data from each page, and combine the results.

```r
library(rvest)
library(dplyr)

# Build URLs for pages 1 through 5
base_url <- "https://quotes.toscrape.com/page/"
urls <- paste0(base_url, 1:5, "/")

# Scrape each page with a polite delay
all_quotes <- list()
for (i in seq_along(urls)) {
  cat("Scraping page", i, "of", length(urls), "\n")

  page_html <- read_html(urls[i])
  quotes <- page_html |>
    html_elements(".quote .text") |>
    html_text2()
  authors <- page_html |>
    html_elements(".quote .author") |>
    html_text2()

  all_quotes[[i]] <- tibble(
    page = i,
    quote = quotes,
    author = authors
  )

  Sys.sleep(2)  # Wait 2 seconds between requests
}

# Combine all pages
quotes_df <- bind_rows(all_quotes)
nrow(quotes_df)
#> [1] 50

head(quotes_df, 3)
#>   page quote                                                          author
#> 1    1 "The world as we have created it is a process of our thinking..." Albert Einstein
#> 2    1 "It is our choices, Harry, that show what we truly are..."        J.K. Rowling
#> 3    1 "There are only two ways to live your life..."                   Albert Einstein
```

[WARNING]
**Always add Sys.sleep() between requests.** Hitting a server with rapid-fire requests can get your IP address blocked and puts unnecessary load on the website. A 1-2 second delay is the minimum. For large scraping jobs, use 3-5 seconds.

The `tryCatch()` function is essential for production scraping. Wrap each `read_html()` call in it so that a single failed page does not crash your entire loop.

```r
# Robust scraping with error handling
safe_scrape <- function(url) {
  tryCatch(
    read_html(url),
    error = function(e) {
      message("Failed: ", url, " - ", e$message)
      return(NULL)
    }
  )
}

# Use it in your loop
page_html <- safe_scrape(urls[i])
if (!is.null(page_html)) {
  # ... extract data
}
```

## How do sessions help with login-protected and multi-step scraping?

A regular `read_html()` call is stateless — it fetches one page and forgets everything. If the website sets cookies, requires login, or expects you to navigate through a sequence of pages, you need a **session**.

The `session()` function in rvest creates a persistent browser-like session that stores cookies, tracks your navigation history, and maintains headers between requests.

```r
# Start a session
sess <- session("https://quotes.toscrape.com/")
sess
#> <session> https://quotes.toscrape.com/
#>   Status: 200
#>   Type:   text/html; charset=utf-8
#>   Size:   11053

# Navigate to page 2 using a link on the page
sess <- sess |> session_follow_link("Next")
sess$url
#> [1] "https://quotes.toscrape.com/page/2/"

# Or jump directly to a URL (cookies persist)
sess <- sess |> session_jump_to("https://quotes.toscrape.com/page/5/")
sess$url
#> [1] "https://quotes.toscrape.com/page/5/"

# Extract data from the current page
sess |>
  html_elements(".quote .text") |>
  html_text2() |>
  head(3)
#> [1] "... a mind needs books as a sword needs a whetstone..."
#> [2] "... the person, be it gentleman or lady, who has not pleasure in..."
#> [3] "... a day without sunshine is like, you know, night."
```

Sessions also handle form submission. If a page has a search box or login form, you can fill it in and submit it programmatically.

```r
# Find forms on a page
sess <- session("https://quotes.toscrape.com/login")
login_form <- html_form(sess)[[1]]

# Fill in the form fields
filled_form <- login_form |>
  html_form_set(username = "myuser", password = "mypass")

# Submit the form
logged_in <- session_submit(sess, filled_form)
logged_in$url
#> [1] "https://quotes.toscrape.com/"
```

[NOTE]
**Some websites block automated sessions regardless of cookies.** Sites that use JavaScript-based authentication, CAPTCHAs, or anti-bot services like Cloudflare will not work with rvest alone. For those, you need browser automation tools like chromote or RSelenium.

## How do you scrape politely with robotstxt and rate limiting?

Responsible scraping goes beyond just adding `Sys.sleep()`. The R ecosystem provides two packages that make polite scraping easy: robotstxt for checking permissions and polite for automated rate-limited scraping.

The robotstxt package reads a website's robots.txt file and tells you whether your scraper is allowed to access a specific path.

```r
library(robotstxt)

# Check if scraping is allowed
paths_allowed("https://en.wikipedia.org/wiki/R_(programming_language)")
#> [1] TRUE

paths_allowed("https://www.google.com/search?q=r+programming")
#> [1] FALSE

# Get the full robots.txt rules
rt <- robotstxt("https://en.wikipedia.org")
rt$permissions
#>          field        useragent value
#> 1     Disallow              * /w/
#> 2     Disallow              * /api/
#> 3     Disallow              * /trap/
#> ...
```

The polite package wraps rvest and automatically respects robots.txt, enforces rate limits, and caches responses. The workflow has two steps: `bow()` to introduce yourself, and `scrape()` to fetch the page.

```r
library(polite)

# Introduce yourself to the server
sess_polite <- bow(
  "https://en.wikipedia.org/wiki/R_(programming_language)",
  user_agent = "R tutorial bot (educational, non-commercial)"
)
sess_polite
#> <polite session> https://en.wikipedia.org/wiki/R_(programming_language)
#>     User-agent: R tutorial bot (educational, non-commercial)
#>     robots.txt: 456 rules are defined for 33 bots
#>    Crawl delay: 5 sec
#>   The path is scrapable for this user-agent

# Scrape the page (respects crawl delay automatically)
html_polite <- scrape(sess_polite)

# Extract data as usual
html_polite |>
  html_elements("h2") |>
  html_text2() |>
  head(5)
#> [1] "History"     "Features"    "Packages"    "Milestones"  "Interfaces"
```

[KEY INSIGHT]
**polite handles rate limiting, robots.txt, and caching for you automatically.** When you use `bow()` + `scrape()`, the package reads the site's crawl delay, waits the required time between requests, and caches responses so repeated scrapes of the same URL do not hit the server again.

Here is a summary of best practices for polite scraping.

| Practice | How to Implement |
|----------|-----------------|
| Check robots.txt | `robotstxt::paths_allowed(url)` |
| Rate limit requests | `Sys.sleep(2)` or use the polite package |
| Set a user agent | `polite::bow(url, user_agent = "...")` |
| Cache responses | polite does this automatically |
| Handle errors gracefully | `tryCatch()` around `read_html()` |
| Respect Terms of Service | Read manually before scraping |

## Common Mistakes and How to Fix Them

### Mistake 1: Using html_text() instead of html_text2()

❌ **Wrong:**
```r
page |> html_elements("p") |> html_text()
#> [1] "\n      Some text with\n      weird spacing\n    "
```

**Why it is wrong:** `html_text()` preserves raw HTML whitespace including tabs, newlines, and extra spaces. The output is messy and hard to work with.

✅ **Correct:**
```r
page |> html_elements("p") |> html_text2()
#> [1] "Some text with weird spacing"
```

### Mistake 2: Forgetting Sys.sleep() in a scraping loop

❌ **Wrong:**
```r
for (url in urls) {
  page <- read_html(url)
  # ... extract data (no delay!)
}
```

**Why it is wrong:** Rapid-fire requests can overwhelm the server, trigger rate-limiting defences, or get your IP address banned permanently.

✅ **Correct:**
```r
for (url in urls) {
  page <- read_html(url)
  # ... extract data
  Sys.sleep(2)  # Polite 2-second delay
}
```

### Mistake 3: Expecting rvest to render JavaScript

❌ **Wrong:**
```r
# This returns empty results on JS-rendered pages
page <- read_html("https://some-spa-website.com")
page |> html_elements(".dynamic-content") |> html_text2()
#> character(0)
```

**Why it is wrong:** rvest downloads raw HTML and does not execute JavaScript. Single-page applications (SPAs) built with React, Vue, or Angular render their content with JavaScript, so the HTML source has no data in it.

✅ **Correct:**
```r
# Use chromote for JavaScript-rendered pages
library(chromote)
b <- ChromoteSession$new()
b$Page$navigate("https://some-spa-website.com")
Sys.sleep(3)  # Wait for JS to render
html <- b$Runtime$evaluate("document.documentElement.outerHTML")$result$value
page <- read_html(html)
page |> html_elements(".dynamic-content") |> html_text2()
```

### Mistake 4: Using html_element() when you need html_elements()

❌ **Wrong:**
```r
# Returns only the FIRST match
page |> html_element("p") |> html_text2()
#> [1] "Just the first paragraph"
```

**Why it is wrong:** `html_element()` (singular) returns only the first matching element. If you need all paragraphs, you get just one and miss the rest.

✅ **Correct:**
```r
# Returns ALL matches
page |> html_elements("p") |> html_text2()
#> [1] "First paragraph"  "Second paragraph" "Third paragraph"
```

### Mistake 5: Hardcoding CSS selectors that change

❌ **Wrong:**
```r
# Fragile: depends on exact class name
page |> html_elements("div.sc-1a2b3c4d-0") |> html_text2()
```

**Why it is wrong:** Auto-generated class names (common in React/Next.js sites) change with every deployment. Your scraper breaks silently next week.

✅ **Correct:**
```r
# More stable: use semantic selectors
page |> html_elements("[data-testid='price']") |> html_text2()
# Or use element structure
page |> html_elements("article > h2") |> html_text2()
```

## Practice Exercises

### Exercise 1: Extract a page title

Read the Wikipedia page for "Data science" and extract just the page title (the `<h1>` element text).

```r
# Exercise: extract the page title
# Hint: use read_html() then html_element("h1") then html_text2()

# Write your code below:

```

<details>
<summary>Click to reveal solution</summary>

```r
ex_page <- read_html("https://en.wikipedia.org/wiki/Data_science")
ex_title <- ex_page |> html_element("h1") |> html_text2()
print(ex_title)
#> [1] "Data science"
```

**Explanation:** `html_element()` (singular) returns the first match. Since there is only one `<h1>` on the page, this is perfect. `html_text2()` extracts the visible text.

</details>

### Exercise 2: Scrape a table and inspect it

Read any Wikipedia page that contains a table (e.g., "List of countries by population"). Extract the first table and print its column names and first 5 rows.

```r
# Exercise: scrape a Wikipedia table
# Hint: html_elements("table.wikitable") |> html_table()
# Remember: html_table() returns a list of tables, pick the first with [[1]]

# Write your code below:

```

<details>
<summary>Click to reveal solution</summary>

```r
ex_page2 <- read_html("https://en.wikipedia.org/wiki/List_of_countries_by_population_(United_Nations)")
ex_tables <- ex_page2 |> html_elements("table.wikitable") |> html_table()
ex_df <- ex_tables[[1]]
names(ex_df)
#> [1] "Country/Territory" "UN continental region" "UN statistical subregion"
#> [4] "Population (1 July 2023)"  ...
head(ex_df, 5)
```

**Explanation:** Wikipedia tables use the `wikitable` class. `html_table()` returns a list of data frames, so `[[1]]` picks the first table.

</details>

### Exercise 3: Extract and filter links

Read the R programming Wikipedia page. Extract all links (`<a>` tags), get their `href` attributes, and filter to only external links that start with `http`.

```r
# Exercise: extract and filter links
# Hint: html_elements("a"), html_attr("href"), grepl("^http", ...)

# Write your code below:

```

<details>
<summary>Click to reveal solution</summary>

```r
ex_page3 <- read_html("https://en.wikipedia.org/wiki/R_(programming_language)")
ex_links <- ex_page3 |> html_elements("a") |> html_attr("href")
ex_external <- ex_links[grepl("^https?://", ex_links)]
ex_external <- unique(ex_external)
length(ex_external)
#> [1] 97
head(ex_external, 5)
#> [1] "https://www.r-project.org/"
#> [2] "https://cran.r-project.org/"
#> ...
```

**Explanation:** `html_attr("href")` pulls the URL from each `<a>` tag. The `grepl()` call filters to links starting with `http://` or `https://`, excluding internal wiki paths.

</details>

### Exercise 4: Scrape multiple pages

The site `https://quotes.toscrape.com/` has 10 pages of quotes at `/page/1/` through `/page/10/`. Scrape pages 1-3, extract all quote texts, and combine them into a single character vector. Add a 2-second delay between requests.

```r
# Exercise: paginated scraping
# Hint: build URLs with paste0(), loop, html_elements(".quote .text"), Sys.sleep(2)

# Write your code below:

```

<details>
<summary>Click to reveal solution</summary>

```r
ex_urls <- paste0("https://quotes.toscrape.com/page/", 1:3, "/")
ex_all_quotes <- character()

for (ex_url in ex_urls) {
  ex_html <- read_html(ex_url)
  ex_quotes <- ex_html |>
    html_elements(".quote .text") |>
    html_text2()
  ex_all_quotes <- c(ex_all_quotes, ex_quotes)
  Sys.sleep(2)
}

length(ex_all_quotes)
#> [1] 30
head(ex_all_quotes, 3)
#> [1] "\u201cThe world as we have created it is a process of our thinking...\u201d"
#> [2] "\u201cIt is our choices, Harry, that show what we truly are...\u201d"
#> [3] "\u201cThere are only two ways to live your life...\u201d"
```

**Explanation:** The loop iterates through 3 URLs, extracts quotes from each using the `.quote .text` CSS selector, appends them to a vector, and waits 2 seconds between requests.

</details>

## Putting It All Together

Let's build a complete scraping workflow from start to finish. We will scrape a table of R packages from CRAN's task view page, clean the data, and produce a summary.

```r
library(rvest)
library(dplyr)

# Step 1: Read the page
url <- "https://cran.r-project.org/web/views/WebTechnologies.html"
page <- read_html(url)

# Step 2: Extract the main content
pkg_links <- page |>
  html_elements("ul li a") |>
  html_text2()

head(pkg_links, 10)
#> [1] "curl"       "httr"       "httr2"      "crul"
#> [5] "httpuv"     "jsonlite"   "xml2"       "rvest"
#> [9] "RSelenium"  "chromote"

# Step 3: Count packages
cat("Total packages listed:", length(pkg_links), "\n")
#> Total packages listed: 85

# Step 4: Check for key scraping packages
scraping_pkgs <- c("rvest", "httr2", "curl", "polite", "robotstxt", "chromote")
found <- scraping_pkgs %in% pkg_links
tibble(package = scraping_pkgs, listed = found)
#>   package    listed
#> 1 rvest      TRUE
#> 2 httr2      TRUE
#> 3 curl       TRUE
#> 4 polite     TRUE
#> 5 robotstxt  TRUE
#> 6 chromote   TRUE
```

This complete example demonstrates the full workflow: load rvest, read a page, select elements with CSS selectors, extract text, and organise the results into a clean tibble. You can adapt this pattern to scrape any website — just change the URL and CSS selectors.

## Summary

Here is a quick reference for the rvest functions covered in this tutorial.

| Function | Purpose | Example |
|----------|---------|---------|
| `read_html(url)` | Fetch and parse an HTML page | `read_html("https://...")` |
| `html_elements(css)` | Select all matching elements | `html_elements("table.wikitable")` |
| `html_element(css)` | Select the first matching element | `html_element("h1")` |
| `html_text2()` | Extract visible text (clean) | `html_text2()` |
| `html_table()` | Convert `<table>` to data frame | `html_table(fill = TRUE)` |
| `html_attr(name)` | Extract one attribute | `html_attr("href")` |
| `html_attrs()` | Extract all attributes | `html_attrs()` |
| `session(url)` | Start a stateful session | `session("https://...")` |
| `session_jump_to(url)` | Navigate within a session | `session_jump_to("/page/2")` |
| `session_submit(form)` | Submit an HTML form | `session_submit(sess, form)` |

Key takeaways:

- rvest reads HTML with `read_html()` and selects elements with CSS selectors via `html_elements()`
- Use `html_text2()` for text, `html_table()` for tables, and `html_attr()` for attributes
- For pagination, loop through URLs with `Sys.sleep()` between requests
- For cookies and navigation, use `session()` instead of `read_html()`
- Always check robots.txt with the robotstxt package before scraping
- The polite package automates rate limiting, robots.txt checking, and caching

## FAQ

**Can rvest scrape JavaScript-rendered pages?**

No. rvest downloads raw HTML and does not execute JavaScript. For single-page applications built with React, Vue, or Angular, use the chromote package (headless Chrome) or RSelenium to render the page first, then pass the HTML to rvest for extraction.

**What is the difference between html_element() and html_elements()?**

`html_elements()` (plural) returns all matching nodes as a nodeset. `html_element()` (singular) returns only the first match. Use the plural form when scraping lists or tables. Use the singular form when you know there is only one match, like a page title.

**Is web scraping legal?**

It depends on the jurisdiction and the specific website. Scraping publicly available data is generally legal in most countries, but you must respect the website's Terms of Service and robots.txt directives. Never scrape personal data, copyrighted content behind paywalls, or data you agreed not to collect. When in doubt, consult a legal professional.

**How fast can I scrape with rvest?**

rvest itself is fast — parsing an HTML page takes milliseconds. The bottleneck is network latency and the rate limits you should impose. A typical polite scraping rate is 1 request every 2-5 seconds. The polite package reads the site's preferred crawl delay and enforces it automatically.

**What are alternatives to rvest for web scraping in R?**

For API-based data collection, use httr2. For JavaScript-heavy sites, use chromote or RSelenium. For large-scale scraping with built-in politeness, use the polite package (which wraps rvest). For XML documents, use the xml2 package directly. Python users who switch to R will find rvest comparable to BeautifulSoup.

## References

1. Wickham, H. — rvest: Easily Harvest (Scrape) Web Pages. CRAN. [Link](https://cran.r-project.org/package=rvest)
2. Wickham, H. & Grolemund, G. — *R for Data Science*, 2nd Edition. Chapter 24: Web Scraping. [Link](https://r4ds.hadley.nz/webscraping.html)
3. rvest package — Web scraping 101 vignette. Tidyverse. [Link](https://rvest.tidyverse.org/articles/rvest.html)
4. Heiss, A. — robotstxt: A robots.txt Parser and Webbot/Spider/Crawler Permissions Checker. CRAN. [Link](https://cran.r-project.org/package=robotstxt)
5. Perepolkin, D. — polite: Be Nice on the Web. CRAN. [Link](https://cran.r-project.org/package=polite)
6. Cantrill, A. — SelectorGadget: CSS Selector Generation Tool. [Link](https://selectorgadget.com/)
7. W3Schools — CSS Selectors Reference. [Link](https://www.w3schools.com/cssref/css_selectors.php)
8. Wickham, H. — httr2: Perform HTTP Requests and Process the Responses. CRAN. [Link](https://cran.r-project.org/package=httr2)

## Continue Learning

Now that you can scrape data from websites, explore these related tutorials:

- **[REST APIs in R with httr2](httr2-in-R.html)** — When data is available through an API, use httr2 instead of scraping HTML. Learn GET, POST, authentication, and pagination.
- **[DBI in R: Connect to Any Database](DBI-in-R.html)** — Store your scraped data in a database for efficient querying and long-term storage.
- **[dplyr filter & select](dplyr-filter-select.html)** — Clean and transform your scraped data frames with the most-used dplyr verbs.

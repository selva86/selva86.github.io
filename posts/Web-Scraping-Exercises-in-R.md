---
title: "Web Scraping Exercises in R: 16 Real-World Practice Problems"
slug: "Web-Scraping-Exercises-in-R"
description: "Sixteen practice problems on web scraping in R with rvest: CSS selectors, tables, attributes, forms, pagination, polite scraping. Hidden solutions."
keywords: "rvest R exercises, web scraping R exercises, R scraping practice, CSS selectors R, rvest html_table"
mathjax: false
webr: false
date: "2026-05-13"
post_type: "EX"
sidebar_title: "Web Scraping Exercises"
sidebar_order: 153
fr_parent: "R-Tutorial.html"
auto_link_terms: "rvest r exercises|web scraping r exercises|r scraping practice|css selectors r"
auto_link_case_sensitive: false
target_keyword: "rvest R exercises"
sibling_block_enabled: false
difficulty: "Mixed"
---

# Web Scraping Exercises in R: 16 Real-World Practice Problems

<p class="lead">Sixteen practice problems on web scraping in R with `rvest`, covering node selection, attributes, tables, forms, pagination, polite scraping, and end-to-end workflows. Each problem ships with a verified expected result and a hidden solution.</p>

```r title="Run this once before any exercise"
library(rvest)
library(dplyr)
library(stringr)
library(tibble)
library(purrr)
library(xml2)
library(polite)
library(httr2)
```

## Section 1. Reading HTML and selecting nodes (3 problems)

### Exercise 1.1: Parse an HTML snippet into a document with read_html

**Task:** A data engineer is auditing a vendor's product page before a scraping pipeline goes live. Parse the HTML snippet below into a document using `read_html()` so you can inspect its structure, and save the parsed document to `ex_1_1`.

**Expected result:**

```
#> {html_document}
#> <html>
#> [1] <head>\n<title>Sample Store</title>\n</head>
#> [2] <body>\n<h1>Catalog</h1>\n<ul>\n<li class="item">Pen</li>\n<li class="item ...
```

**Difficulty:** Beginner
[HINTS]
A raw HTML string can be turned into a queryable document the same way a live web address would be.
Pass `html_str` to `read_html()` and assign the returned document to `ex_1_1`.

```r title="Your turn"
html_str <- '
<html>
  <head><title>Sample Store</title></head>
  <body>
    <h1>Catalog</h1>
    <ul>
      <li class="item">Pen</li>
      <li class="item">Notebook</li>
      <li class="item">Eraser</li>
    </ul>
  </body>
</html>'

ex_1_1 <- # your code here
ex_1_1
```

<details>
<summary>Click to reveal solution</summary>

```r title="Solution"
html_str <- '
<html>
  <head><title>Sample Store</title></head>
  <body>
    <h1>Catalog</h1>
    <ul>
      <li class="item">Pen</li>
      <li class="item">Notebook</li>
      <li class="item">Eraser</li>
    </ul>
  </body>
</html>'

ex_1_1 <- read_html(html_str)
ex_1_1
#> {html_document}
#> <html>
#> [1] <head>\n<title>Sample Store</title>\n</head>
#> [2] <body>\n<h1>Catalog</h1>\n<ul>\n<li class="item">Pen</li>\n<li class="item ...
```

**Explanation:** `read_html()` accepts a URL, a connection, or a raw string and returns an `xml_document` you can query with CSS or XPath. For one-off testing, passing a string is faster than spinning up a server. The same function handles live URLs (`read_html("https://example.com")`) so the rest of the pipeline stays identical. If the string is large, `xml2::read_html()` reads it directly without the rvest wrapper.

</details>

### Exercise 1.2: Select every list item using a CSS class selector

**Task:** From the parsed document `ex_1_1`, select every `<li>` element with class `item` using a CSS selector and store the resulting node set in `ex_1_2`. You should end up with three nodes that you can iterate over later.

**Expected result:**

```
#> {xml_nodeset (3)}
#> [1] <li class="item">Pen</li>
#> [2] <li class="item">Notebook</li>
#> [3] <li class="item">Eraser</li>
```

**Difficulty:** Beginner
[HINTS]
You want every matching list item returned as a set, not just the first one.
Use the plural getter `html_elements()` with the CSS selector `"li.item"`.

```r title="Your turn"
ex_1_2 <- ex_1_1 |>
  # your code here
ex_1_2
```

<details>
<summary>Click to reveal solution</summary>

```r title="Solution"
ex_1_2 <- ex_1_1 |>
  html_elements("li.item")
ex_1_2
#> {xml_nodeset (3)}
#> [1] <li class="item">Pen</li>
#> [2] <li class="item">Notebook</li>
#> [3] <li class="item">Eraser</li>
```

**Explanation:** `html_elements()` (plural) returns every match as a node set, while `html_element()` (singular) returns only the first match or `NA` if missing. The CSS selector `li.item` matches every `<li>` carrying the `item` class. Selectors compose: `ul > li.item:first-child` would pick only the first child. Use `xml2::xml_find_all()` with XPath when CSS cannot express the constraint (axis traversals, positional predicates).

</details>

### Exercise 1.3: Compare html_element and html_elements on a one-record card

**Task:** Parse the single-card HTML below, then use BOTH `html_element()` and `html_elements()` to grab the price element. Return a named list with components `singular` and `plural` so you can compare what each function yields. Save the list to `ex_1_3`.

**Expected result:**

```
#> $singular
#> {html_node}
#> <span class="price">$19.99</span>
#>
#> $plural
#> {xml_nodeset (1)}
#> [1] <span class="price">$19.99</span>
```

**Difficulty:** Intermediate
[HINTS]
One getter returns a single node while its plural counterpart returns a node set; run each against the same card.
Call `html_element(card, ".price")` for `singular` and `html_elements(card, ".price")` for `plural`.

```r title="Your turn"
card_str <- '<div class="card"><span class="price">$19.99</span></div>'
card     <- read_html(card_str)

ex_1_3 <- list(
  singular = # your code here,
  plural   = # your code here
)
ex_1_3
```

<details>
<summary>Click to reveal solution</summary>

```r title="Solution"
card_str <- '<div class="card"><span class="price">$19.99</span></div>'
card     <- read_html(card_str)

ex_1_3 <- list(
  singular = html_element(card,  ".price"),
  plural   = html_elements(card, ".price")
)
ex_1_3
#> $singular
#> {html_node}
#> <span class="price">$19.99</span>
#>
#> $plural
#> {xml_nodeset (1)}
#> [1] <span class="price">$19.99</span>
```

**Explanation:** The visual output looks similar but the structure differs. `html_element()` returns a single `html_node`, perfect for column-wise extraction where you iterate one card at a time and want a scalar per row. `html_elements()` returns an `xml_nodeset` that you almost always loop over with `purrr::map_chr()` or another vectorised extractor. Mixing the two inside one card produces ragged lists; the rule of thumb is one card per row, singular getters per column.

</details>

## Section 2. Extracting text, attributes, and links (3 problems)

### Exercise 2.1: Clean noisy headlines with html_text2

**Task:** The growth team wants a clean list of homepage headlines for a content audit. Parse the snippet below, select every `<h2>` element, then extract its text with `html_text2()` so that leading whitespace, line breaks, and entity references render cleanly. Save the character vector to `ex_2_1`.

**Expected result:**

```
#> [1] "Sale ends Friday"      "New arrivals & restocks"
#> [3] "Free shipping over $50"
```

**Difficulty:** Intermediate
[HINTS]
After selecting the heading nodes, extract their text with the getter that normalises whitespace and decodes entities like a browser.
Chain `html_elements("h2")` into `html_text2()`.

```r title="Your turn"
news_html <- read_html('
<html><body>
  <h2>   Sale ends Friday   </h2>
  <h2>New arrivals
       &amp; restocks</h2>
  <h2>Free shipping over $50</h2>
</body></html>')

ex_2_1 <- news_html |>
  # your code here
ex_2_1
```

<details>
<summary>Click to reveal solution</summary>

```r title="Solution"
news_html <- read_html('
<html><body>
  <h2>   Sale ends Friday   </h2>
  <h2>New arrivals
       &amp; restocks</h2>
  <h2>Free shipping over $50</h2>
</body></html>')

ex_2_1 <- news_html |>
  html_elements("h2") |>
  html_text2()
ex_2_1
#> [1] "Sale ends Friday"      "New arrivals & restocks"
#> [3] "Free shipping over $50"
```

**Explanation:** `html_text2()` is the right default for human-readable text: it collapses inner whitespace the way a browser would, decodes HTML entities (`&amp;` becomes `&`), and replaces `<br>` with a newline. The older `html_text()` returns the raw text content verbatim, which keeps leading or trailing spaces and unrendered entities. Reach for `html_text()` only when you need byte-faithful output for a downstream parser that cannot tolerate browser-style normalisation.

</details>

### Exercise 2.2: Extract every href attribute from a navigation list

**Task:** A marketing analyst is auditing the site footer to confirm every legal link still points to the right page. From the HTML below, select every anchor under `nav.footer` and extract its `href` attribute into a character vector. Save the result to `ex_2_2`.

**Expected result:**

```
#> [1] "/about"   "/careers" "/privacy" "/terms"
```

**Difficulty:** Intermediate
[HINTS]
Scope the anchors to the footer navigation, then pull a single named attribute off each one.
Select with `html_elements("nav.footer a")`, then read the link target with `html_attr("href")`.

```r title="Your turn"
footer_html <- read_html('
<html><body>
<nav class="footer">
  <a href="/about">About</a>
  <a href="/careers">Careers</a>
  <a href="/privacy">Privacy</a>
  <a href="/terms">Terms</a>
</nav>
</body></html>')

ex_2_2 <- footer_html |>
  # your code here
ex_2_2
```

<details>
<summary>Click to reveal solution</summary>

```r title="Solution"
footer_html <- read_html('
<html><body>
<nav class="footer">
  <a href="/about">About</a>
  <a href="/careers">Careers</a>
  <a href="/privacy">Privacy</a>
  <a href="/terms">Terms</a>
</nav>
</body></html>')

ex_2_2 <- footer_html |>
  html_elements("nav.footer a") |>
  html_attr("href")
ex_2_2
#> [1] "/about"   "/careers" "/privacy" "/terms"
```

**Explanation:** `html_attr()` reads any HTML attribute, not just `href`: pass `"src"` for images, `"data-id"` for custom data attributes, or `"title"` for tooltip text. When the attribute is missing on a node, `html_attr()` returns `NA` so the output vector keeps its length aligned with the node set. To pull several attributes at once, use `html_attrs()`, which returns a list of named character vectors. The descendant selector `nav.footer a` avoids picking up navigation links from a header that also uses `<a>`.

</details>

### Exercise 2.3: Resolve relative hrefs to absolute URLs with url_absolute

**Task:** A compliance officer needs the full absolute URL of every link on a product page so the audit log is unambiguous. Take the relative hrefs in `ex_2_2`, resolve them against the base URL `"https://r-statistics.co/shop/"` using `xml2::url_absolute()`, and save the absolute URL vector to `ex_2_3`.

**Expected result:**

```
#> [1] "https://r-statistics.co/about"   "https://r-statistics.co/careers"
#> [3] "https://r-statistics.co/privacy" "https://r-statistics.co/terms"
```

**Difficulty:** Intermediate
[HINTS]
Each relative link needs to be combined with a base address so it resolves to a complete location.
Call `url_absolute()` with `ex_2_2` and `base = "https://r-statistics.co/shop/"`.

```r title="Your turn"
ex_2_3 <- # your code here
ex_2_3
```

<details>
<summary>Click to reveal solution</summary>

```r title="Solution"
ex_2_3 <- url_absolute(ex_2_2, base = "https://r-statistics.co/shop/")
ex_2_3
#> [1] "https://r-statistics.co/about"   "https://r-statistics.co/careers"
#> [3] "https://r-statistics.co/privacy" "https://r-statistics.co/terms"
```

**Explanation:** `xml2::url_absolute()` handles the messy edge cases of relative URLs: leading slash means root-relative, no slash means base-relative, `..` walks up a level, and protocol-relative `//cdn.example.com` keeps the parent scheme. Hard-coding `paste0(base, href)` breaks for any href that is not strictly path-relative and silently produces broken URLs. Resolving early in the pipeline means downstream code only ever sees absolute URLs, which simplifies deduplication, caching, and obeying robots.txt rules.

</details>

## Section 3. Tables and structured fragments (3 problems)

### Exercise 3.1: Parse an HTML table into a data frame with html_table

**Task:** A reporting analyst pulled a table of Q1 sales by region from a wiki page. Parse the snippet below, extract the table with `html_table()`, and coerce the result to a tibble. Save the tibble to `ex_3_1`.

**Expected result:**

```
#> # A tibble: 3 x 3
#>   Region      Sales Returns
#>   <chr>       <int>   <int>
#> 1 North       18450     320
#> 2 South       22100     410
#> 3 West        15770     290
```

**Difficulty:** Beginner
[HINTS]
A well-formed table maps directly onto a rectangular data structure with no per-cell work.
Select the `"table"` node, run `html_table()`, then pass the result to `as_tibble()`.

```r title="Your turn"
sales_html <- read_html('
<table>
<tr><th>Region</th><th>Sales</th><th>Returns</th></tr>
<tr><td>North</td><td>18450</td><td>320</td></tr>
<tr><td>South</td><td>22100</td><td>410</td></tr>
<tr><td>West</td><td>15770</td><td>290</td></tr>
</table>')

ex_3_1 <- sales_html |>
  # your code here
ex_3_1
```

<details>
<summary>Click to reveal solution</summary>

```r title="Solution"
sales_html <- read_html('
<table>
<tr><th>Region</th><th>Sales</th><th>Returns</th></tr>
<tr><td>North</td><td>18450</td><td>320</td></tr>
<tr><td>South</td><td>22100</td><td>410</td></tr>
<tr><td>West</td><td>15770</td><td>290</td></tr>
</table>')

ex_3_1 <- sales_html |>
  html_element("table") |>
  html_table() |>
  as_tibble()
ex_3_1
#> # A tibble: 3 x 3
#>   Region      Sales Returns
#>   <chr>       <int>   <int>
#> 1 North       18450     320
#> 2 South       22100     410
#> 3 West        15770     290
```

**Explanation:** `html_table()` is the fastest path from a well-structured table to a tibble: it detects `<thead>` and `<tbody>`, guesses the header row, and runs type conversion column-by-column. When a page has multiple tables, prefer `html_elements("table")` and `purrr::map(html_table)` to keep the list shape. For tables with merged cells (`rowspan`/`colspan`) the output gets duplicated values; that is a feature, not a bug, since it gives you a rectangular result you can clean downstream.

</details>

### Exercise 3.2: Map across product cards into a tidy listings tibble

**Task:** An e-commerce buyer wants today's product cards extracted into a clean tibble with one row per item. From the listings HTML below, build a tibble named `ex_3_2` with three columns: `name` (string), `price` (numeric, dollars stripped), and `in_stock` (logical, TRUE when the badge reads "In stock"). Use column-wise extraction with `html_element()` per card.

**Expected result:**

```
#> # A tibble: 3 x 3
#>   name           price in_stock
#>   <chr>          <dbl> <lgl>
#> 1 Cotton T-Shirt  19.9 TRUE
#> 2 Wool Scarf      34.5 FALSE
#> 3 Linen Hat       22   TRUE
```

**Difficulty:** Intermediate
[HINTS]
Fix the row count by isolating the repeating card first, then extract one scalar per column from each card.
On `cards` use `html_element(".name")`, `html_element(".price")`, and `html_element(".stock")` piped through `html_text2()`; strip the dollar sign with `str_remove("\\$")` plus `as.numeric()`, and test the stock text against `"In stock"`.

```r title="Your turn"
listings_html <- read_html('
<div class="listings">
  <div class="card">
    <h3 class="name">Cotton T-Shirt</h3>
    <span class="price">$19.90</span>
    <span class="stock">In stock</span>
  </div>
  <div class="card">
    <h3 class="name">Wool Scarf</h3>
    <span class="price">$34.50</span>
    <span class="stock">Out of stock</span>
  </div>
  <div class="card">
    <h3 class="name">Linen Hat</h3>
    <span class="price">$22.00</span>
    <span class="stock">In stock</span>
  </div>
</div>')

cards <- listings_html |> html_elements(".card")

ex_3_2 <- tibble(
  name     = # your code here,
  price    = # your code here,
  in_stock = # your code here
)
ex_3_2
```

<details>
<summary>Click to reveal solution</summary>

```r title="Solution"
listings_html <- read_html('
<div class="listings">
  <div class="card">
    <h3 class="name">Cotton T-Shirt</h3>
    <span class="price">$19.90</span>
    <span class="stock">In stock</span>
  </div>
  <div class="card">
    <h3 class="name">Wool Scarf</h3>
    <span class="price">$34.50</span>
    <span class="stock">Out of stock</span>
  </div>
  <div class="card">
    <h3 class="name">Linen Hat</h3>
    <span class="price">$22.00</span>
    <span class="stock">In stock</span>
  </div>
</div>')

cards <- listings_html |> html_elements(".card")

ex_3_2 <- tibble(
  name     = cards |> html_element(".name")  |> html_text2(),
  price    = cards |> html_element(".price") |> html_text2() |>
               str_remove("\\$") |> as.numeric(),
  in_stock = cards |> html_element(".stock") |> html_text2() == "In stock"
)
ex_3_2
#> # A tibble: 3 x 3
#>   name           price in_stock
#>   <chr>          <dbl> <lgl>
#> 1 Cotton T-Shirt  19.9 TRUE
#> 2 Wool Scarf      34.5 FALSE
#> 3 Linen Hat       22   TRUE
```

**Explanation:** The card-then-column pattern is the workhorse of structured scraping. First isolate the repeating unit (`.card`) with `html_elements()` to fix the row count, then use `html_element()` on each card per column so missing fields fill with `NA` rather than misaligning rows. Compare to a naive flat selector like `html_elements(".price")` which would silently drop products that lack a price tag and shift every subsequent row. Cast price to numeric eagerly so downstream aggregations stay type-safe.

</details>

### Exercise 3.3: Pair dt and dd into a key-value tibble from a definition list

**Task:** A taxonomy team is migrating glossary entries from a legacy HTML page into a database. Parse the `<dl>` snippet, then build a tibble with two columns `term` and `definition` by pairing each `<dt>` with the `<dd>` that immediately follows it. Use the CSS adjacent-sibling combinator so pairs stay aligned. Save the tibble to `ex_3_3`.

**Expected result:**

```
#> # A tibble: 3 x 2
#>   term    definition
#>   <chr>   <chr>
#> 1 RMSE    Root mean squared error
#> 2 AUC     Area under the ROC curve
#> 3 p-value Probability of seeing the data under the null
```

**Difficulty:** Advanced
[HINTS]
A CSS combinator can match each value element that immediately follows its term element, so pairs stay aligned without index zipping.
Select terms with `"dl.glossary > dt"` and definitions with `"dl.glossary > dt + dd"`, then run `html_text2()` on each set.

```r title="Your turn"
gloss_html <- read_html('
<dl class="glossary">
  <dt>RMSE</dt>    <dd>Root mean squared error</dd>
  <dt>AUC</dt>     <dd>Area under the ROC curve</dd>
  <dt>p-value</dt> <dd>Probability of seeing the data under the null</dd>
</dl>')

ex_3_3 <- tibble(
  term       = # your code here,
  definition = # your code here
)
ex_3_3
```

<details>
<summary>Click to reveal solution</summary>

```r title="Solution"
gloss_html <- read_html('
<dl class="glossary">
  <dt>RMSE</dt>    <dd>Root mean squared error</dd>
  <dt>AUC</dt>     <dd>Area under the ROC curve</dd>
  <dt>p-value</dt> <dd>Probability of seeing the data under the null</dd>
</dl>')

dts <- gloss_html |> html_elements("dl.glossary > dt")
dds <- gloss_html |> html_elements("dl.glossary > dt + dd")

ex_3_3 <- tibble(
  term       = dts |> html_text2(),
  definition = dds |> html_text2()
)
ex_3_3
#> # A tibble: 3 x 2
#>   term    definition
#>   <chr>   <chr>
#> 1 RMSE    Root mean squared error
#> 2 AUC     Area under the ROC curve
#> 3 p-value Probability of seeing the data under the null
```

**Explanation:** The CSS adjacent-sibling combinator `dt + dd` picks each `<dd>` that immediately follows a `<dt>` at the same nesting level. That preserves the dt-to-dd pairing without needing position-based zipping, which would break when a stray `<dd>` appears mid-list or a term lacks its partner. Restricting the selector with `dl.glossary >` scopes the walk to the right list so a sibling glossary on the page does not bleed into the result. CSS handles this case, so you can stay inside the rvest API surface.

</details>

## Section 4. Forms, sessions, and pagination (3 problems)

### Exercise 4.1: Submit a search form using html_form_set and session_submit

**Task:** A research analyst wants to query a small in-house catalog by submitting its search form rather than hitting a URL pattern. Start a session at `"https://hrbrmstr.github.io/rvest-test/"` (a sandbox), pull the first `<form>`, fill the `q` field with "ggplot2" using `html_form_set()`, and submit the form via `session_submit()`. Save the resulting session object to `ex_4_1`.

**Expected result:**

```
#> <session> https://hrbrmstr.github.io/rvest-test/?q=ggplot2
#>   Status: 200
#>   Type:   text/html; charset=utf-8
#>   Size:   3421
```

**Difficulty:** Advanced
[HINTS]
Fill the form template's field first, then send it back through the same session so cookies and hidden fields travel with it.
Set the field with `form |> html_form_set(q = "ggplot2")` and send it via `session_submit()`.

```r title="Your turn"
sess <- session("https://hrbrmstr.github.io/rvest-test/")
form <- sess |> html_form() |> pluck(1)

ex_4_1 <- # your code here
ex_4_1
```

<details>
<summary>Click to reveal solution</summary>

```r title="Solution"
sess <- session("https://hrbrmstr.github.io/rvest-test/")
form <- sess |> html_form() |> pluck(1)

ex_4_1 <- sess |>
  session_submit(form |> html_form_set(q = "ggplot2"))
ex_4_1
#> <session> https://hrbrmstr.github.io/rvest-test/?q=ggplot2
#>   Status: 200
#>   Type:   text/html; charset=utf-8
#>   Size:   3421
```

**Explanation:** The form workflow has three steps: pull the form template with `html_form()`, mutate its values with `html_form_set()`, and submit via `session_submit()` so cookies and headers stay attached. This is more durable than guessing the URL pattern because it respects hidden CSRF fields the server stamps into the form. `pluck(1)` reaches into the list of forms returned by `html_form()`; if the page has multiple forms, inspect their names first. The submitted page is reachable from the session like any other URL, so `read_html(ex_4_1)` returns the response body.

</details>

### Exercise 4.2: Walk paginated listings using session_jump_to

**Task:** A pricing analyst wants every page of a 3-page archive captured in order. Start a session at the listings index `"https://r-statistics.co/index.html"`, then build a list of three session objects by jumping to `"page-1.html"`, `"page-2.html"`, and `"page-3.html"` from the same session. Save the list to `ex_4_2`.

**Expected result:**

```
#> [[1]]
#> <session> https://r-statistics.co/page-1.html
#>   Status: 200
#> [[2]]
#> <session> https://r-statistics.co/page-2.html
#>   Status: 200
#> [[3]]
#> <session> https://r-statistics.co/page-3.html
#>   Status: 200
```

**Difficulty:** Advanced
[HINTS]
Reuse the existing session for each page instead of opening a fresh connection per request.
Map over the three page names, calling `session_jump_to(sess, p)` for each.

```r title="Your turn"
sess <- session("https://r-statistics.co/index.html")

ex_4_2 <- # your code here
ex_4_2
```

<details>
<summary>Click to reveal solution</summary>

```r title="Solution"
sess <- session("https://r-statistics.co/index.html")

ex_4_2 <- map(
  c("page-1.html", "page-2.html", "page-3.html"),
  \(p) session_jump_to(sess, p)
)
ex_4_2
#> [[1]]
#> <session> https://r-statistics.co/page-1.html
#>   Status: 200
#> [[2]]
#> <session> https://r-statistics.co/page-2.html
#>   Status: 200
#> [[3]]
#> <session> https://r-statistics.co/page-3.html
#>   Status: 200
```

**Explanation:** `session_jump_to()` reuses the same TCP connection, cookies, and headers as the original `session()` handshake, which is exactly what hostile rate limiters look at when they decide whether to throttle you. Spinning up a fresh `read_html()` per page would create a new connection and ignore session state. Use `purrr::map()` rather than a `for` loop so the result is a clean list ready for `bind_rows()` after extraction. For very large archives, switch to `polite::nod()` for built-in delay between hops.

</details>

### Exercise 4.3: Stop pagination when the next-page link is missing

**Task:** A scraping job should keep following the "next" link until it does not exist anymore, so it survives whether the archive has 3 pages or 30. Given the HTML snippet below, write a function `next_url(html)` that returns the absolute URL of the rel="next" link or `NA_character_` if it is missing. Apply it to the snippet and save the resulting URL (or NA) to `ex_4_3`.

**Expected result:**

```
#> [1] "https://r-statistics.co/page-2.html"
```

**Difficulty:** Advanced
[HINTS]
The safest stop condition is the absence of a link, so the function must yield a missing value when nothing matches.
Grab the node with `html_element(html, 'link[rel="next"]')`, branch on `is.na()`, and resolve its `href` with `url_absolute()`.

```r title="Your turn"
page_html <- read_html('
<html><head>
  <link rel="next" href="page-2.html">
</head><body>Page 1</body></html>')

next_url <- function(html) {
  # your code here
}

ex_4_3 <- next_url(page_html)
ex_4_3
```

<details>
<summary>Click to reveal solution</summary>

```r title="Solution"
page_html <- read_html('
<html><head>
  <link rel="next" href="page-2.html">
</head><body>Page 1</body></html>')

next_url <- function(html) {
  node <- html_element(html, 'link[rel="next"]')
  if (is.na(node)) return(NA_character_)
  url_absolute(html_attr(node, "href"), "https://r-statistics.co/")
}

ex_4_3 <- next_url(page_html)
ex_4_3
#> [1] "https://r-statistics.co/page-2.html"
```

**Explanation:** Termination by absence is the safest stop condition for an unknown-length archive: a fixed page count breaks the moment the site adds a page, and trapping HTTP errors leaks transient failures into the terminate path. `html_element()` returns `NA` when no match is found, which is cleaner than `html_elements()` followed by a length check. Branching on `is.na(node)` keeps the function total: it always returns a length-one character vector, ready to feed a `while (!is.na(url))` driver loop.

</details>

## Section 5. Polite scraping and robustness (3 problems)

### Exercise 5.1: Open a polite session with bow and check robots.txt

**Task:** The legal team requires every new scraper to honour `robots.txt` and identify itself with a contact email. Open a polite session against `"https://r-statistics.co"` using `polite::bow()`, supplying a descriptive `user_agent` string that includes the email `audit@example.com`. Save the returned `polite` object to `ex_5_1`.

**Expected result:**

```
#> <polite session> https://r-statistics.co
#>     User-agent: r-stats-audit (audit@example.com)
#>     robots.txt: 0 rules are observed for your user-agent across 0 domains
#>     Crawl delay: 5 sec
#>     The path is scrapable for this user-agent
```

**Difficulty:** Intermediate
[HINTS]
A courteous scraper announces who it is and reads the site's crawl rules before fetching anything.
Call `bow()` with `url`, a `user_agent` string containing `audit@example.com`, and a `delay`.

```r title="Your turn"
ex_5_1 <- # your code here
ex_5_1
```

<details>
<summary>Click to reveal solution</summary>

```r title="Solution"
ex_5_1 <- bow(
  url        = "https://r-statistics.co",
  user_agent = "r-stats-audit (audit@example.com)",
  delay      = 5
)
ex_5_1
#> <polite session> https://r-statistics.co
#>     User-agent: r-stats-audit (audit@example.com)
#>     robots.txt: 0 rules are observed for your user-agent across 0 domains
#>     Crawl delay: 5 sec
#>     The path is scrapable for this user-agent
```

**Explanation:** `polite::bow()` does three things in one call: fetches `robots.txt`, sets a courteous delay between subsequent requests, and stamps a custom user-agent on every outgoing header. A traceable user-agent matters because site owners can ask you to slow down or stop without resorting to IP bans. The `delay` argument is honored by `scrape()` and `nod()` automatically, so you cannot accidentally hammer the server inside a tight loop. Always set a contactable string; "Mozilla/5.0" style spoofing is the fastest way to get blocked.

</details>

### Exercise 5.2: Retry transient HTTP errors with httr2 req_retry

**Task:** A reliability engineer is wrapping an external scrape with retry logic so transient 5xx failures do not break the nightly job. Build an `httr2` request for `"https://r-statistics.co"`, attach a polite user-agent, configure `req_retry()` with `max_tries = 3` and `backoff = \(i) 2 ^ i`, then perform the request and save the response object to `ex_5_2`.

**Expected result:**

```
#> <httr2_response>
#> GET https://r-statistics.co/
#> Status: 200 OK
#> Content-Type: text/html
#> Body: In memory (...)
```

**Difficulty:** Intermediate
[HINTS]
Wrap the request so transient server failures are re-attempted with growing pauses before it gives up.
Build the request, add `req_user_agent()`, then `req_retry(max_tries = 3, backoff = \(i) 2 ^ i)` before `req_perform()`.

```r title="Your turn"
ex_5_2 <- # your code here
ex_5_2
```

<details>
<summary>Click to reveal solution</summary>

```r title="Solution"
ex_5_2 <- request("https://r-statistics.co") |>
  req_user_agent("r-stats-audit (audit@example.com)") |>
  req_retry(max_tries = 3, backoff = \(i) 2 ^ i) |>
  req_perform()
ex_5_2
#> <httr2_response>
#> GET https://r-statistics.co/
#> Status: 200 OK
#> Content-Type: text/html
#> Body: In memory (...)
```

**Explanation:** `req_retry()` reruns the request on transient failures (5xx, network resets) with exponential backoff between attempts; `\(i) 2 ^ i` sleeps 2, 4, 8 seconds between tries. The retry layer ignores 4xx by default because client errors will not fix themselves. Pair retry with `req_throttle()` for sustained rate limiting and `req_timeout()` to bound the worst-case wall clock. The response body is reachable with `resp_body_html()` so you can hand it straight to rvest selectors.

</details>

### Exercise 5.3: Cache responses to disk with httr2 req_cache

**Task:** During iterative development the scraping pipeline should not refetch the same page on every script run. Build an `httr2` request for `"https://r-statistics.co"`, attach a polite user-agent, enable on-disk caching with `req_cache()` pointed at `tempdir()`, and perform the request. Save the response to `ex_5_3` so reruns hit the cache instead of the network.

**Expected result:**

```
#> <httr2_response>
#> GET https://r-statistics.co/
#> Status: 200 OK
#> Content-Type: text/html
#> Body: In memory (...)
```

**Difficulty:** Intermediate
[HINTS]
Store fetched responses on disk so repeated runs read local copies instead of hitting the network.
Add `req_cache(path = tempdir())` to the request chain before `req_perform()`.

```r title="Your turn"
ex_5_3 <- # your code here
ex_5_3
```

<details>
<summary>Click to reveal solution</summary>

```r title="Solution"
ex_5_3 <- request("https://r-statistics.co") |>
  req_user_agent("r-stats-audit (audit@example.com)") |>
  req_cache(path = tempdir(), use_on_error = TRUE) |>
  req_perform()
ex_5_3
#> <httr2_response>
#> GET https://r-statistics.co/
#> Status: 200 OK
#> Content-Type: text/html
#> Body: In memory (...)
```

**Explanation:** `req_cache()` honors HTTP cache headers (`ETag`, `Last-Modified`) and falls back to a freshness window when the server omits them. The `use_on_error = TRUE` flag means a stale cached copy still answers when the upstream is down, which is gold for nightly jobs that must finish even when the source flakes. Point `path` at a persistent location for production; `tempdir()` is fine for ad-hoc work but loses its contents on R restart. Cached responses still flow through the rest of the pipeline unchanged.

</details>

## Section 6. End-to-end workflows (2 problems)

### Exercise 6.1: Build a catalog tibble from a multi-page archive

**Task:** A product manager wants a single tibble combining titles and prices from a 3-page archive. Given the three pre-parsed page snippets in `pages` below, write a `scrape_page()` function that returns a tibble (`title`, `price`) per page, then call it across `pages` with `purrr::map_dfr()` so the rows stack vertically. Save the combined tibble to `ex_6_1`.

**Expected result:**

```
#> # A tibble: 6 x 2
#>   title       price
#>   <chr>       <dbl>
#> 1 Item A1      10
#> 2 Item A2      12
#> 3 Item B1      15
#> 4 Item B2      18
#> 5 Item C1      21
#> 6 Item C2      25
```

**Difficulty:** Advanced
[HINTS]
Write one function that handles a single page, then stack its results across every page into one table.
Inside `scrape_page()` select `"li.row"` and extract the `.t` and `.p` columns, then combine the pages with `map_dfr()`.

```r title="Your turn"
pages <- list(
  read_html('<ul><li class="row"><span class="t">Item A1</span><span class="p">$10</span></li>
                 <li class="row"><span class="t">Item A2</span><span class="p">$12</span></li></ul>'),
  read_html('<ul><li class="row"><span class="t">Item B1</span><span class="p">$15</span></li>
                 <li class="row"><span class="t">Item B2</span><span class="p">$18</span></li></ul>'),
  read_html('<ul><li class="row"><span class="t">Item C1</span><span class="p">$21</span></li>
                 <li class="row"><span class="t">Item C2</span><span class="p">$25</span></li></ul>')
)

scrape_page <- function(html) {
  # your code here
}

ex_6_1 <- # your code here
ex_6_1
```

<details>
<summary>Click to reveal solution</summary>

```r title="Solution"
pages <- list(
  read_html('<ul><li class="row"><span class="t">Item A1</span><span class="p">$10</span></li>
                 <li class="row"><span class="t">Item A2</span><span class="p">$12</span></li></ul>'),
  read_html('<ul><li class="row"><span class="t">Item B1</span><span class="p">$15</span></li>
                 <li class="row"><span class="t">Item B2</span><span class="p">$18</span></li></ul>'),
  read_html('<ul><li class="row"><span class="t">Item C1</span><span class="p">$21</span></li>
                 <li class="row"><span class="t">Item C2</span><span class="p">$25</span></li></ul>')
)

scrape_page <- function(html) {
  rows <- html_elements(html, "li.row")
  tibble(
    title = rows |> html_element(".t") |> html_text2(),
    price = rows |> html_element(".p") |> html_text2() |>
              str_remove("\\$") |> as.numeric()
  )
}

ex_6_1 <- map_dfr(pages, scrape_page)
ex_6_1
#> # A tibble: 6 x 2
#>   title       price
#>   <chr>       <dbl>
#> 1 Item A1      10
#> 2 Item A2      12
#> 3 Item B1      15
#> 4 Item B2      18
#> 5 Item C1      21
#> 6 Item C2      25
```

**Explanation:** Splitting the work into a single-page function plus a stacker keeps the pipeline testable: `scrape_page()` can be unit-tested against one fixture, and `map_dfr()` becomes the only place pagination concerns leak in. The card-then-column extraction inside `scrape_page()` keeps rows aligned even if a card is missing one field. For production runs, swap `map_dfr()` for `purrr::map()` + `bind_rows(.id = "page")` so you keep a provenance column tying every row back to its source.

</details>

### Exercise 6.2: Validate scraped output and flag data-quality issues

**Task:** Before the catalog tibble in `ex_6_1` ships to the warehouse, run three data-quality checks: prices must be positive, titles must be non-empty, and no row may be duplicated on `title`. Build a tibble named `ex_6_2` with one row per failed check (`check`, `n_bad`) and zero rows when everything passes.

**Expected result:**

```
#> # A tibble: 0 x 2
#> # i 2 variables: check <chr>, n_bad <int>
```

**Difficulty:** Intermediate
[HINTS]
Count how many rows violate each rule, then keep only the rules that were actually broken.
Fill `n_bad` with `sum()` of each bad-row condition (and `nrow()` minus unique titles for duplicates), then `filter(n_bad > 0)`.

```r title="Your turn"
checks <- tibble(
  check = c("non_positive_price", "empty_title", "duplicate_title"),
  n_bad = c(
    # your code here
  )
)

ex_6_2 <- # your code here
ex_6_2
```

<details>
<summary>Click to reveal solution</summary>

```r title="Solution"
checks <- tibble(
  check = c("non_positive_price", "empty_title", "duplicate_title"),
  n_bad = c(
    sum(ex_6_1$price <= 0 | is.na(ex_6_1$price)),
    sum(is.na(ex_6_1$title) | str_length(ex_6_1$title) == 0),
    nrow(ex_6_1) - length(unique(ex_6_1$title))
  )
)

ex_6_2 <- checks |> filter(n_bad > 0)
ex_6_2
#> # A tibble: 0 x 2
#> # i 2 variables: check <chr>, n_bad <int>
```

**Explanation:** Validation belongs at the boundary between scrape and load, not buried inside extraction logic. A zero-row tibble is the cleanest "all good" signal because the downstream job can branch on `nrow(ex_6_2) == 0` without parsing strings. Counting bad rows per check (rather than raising on the first failure) preserves a full diagnostic in one pass; pipe the result into a Slack alert or a daily report. For richer assertions, look at `pointblank` or `validate`, which add schema and threshold rules on top of the same idea.

</details>

## What to do next

- Practice scraping idioms further: [dplyr-Exercises-in-R.html](dplyr-Exercises-in-R.html) for the verbs you'll chain after extraction.
- Strengthen your text-handling toolkit: [Stringr-Exercises-in-R.html](Stringr-Exercises-in-R.html) for the regex work that follows raw HTML.
- Tidy your scraped lists into rectangles: [Purrr-Exercises-in-R.html](Purrr-Exercises-in-R.html) for `map_dfr` and friends.
- Round-trip results to disk safely: [readr-Exercises-in-R.html](readr-Exercises-in-R.html) for write-then-reload validation.

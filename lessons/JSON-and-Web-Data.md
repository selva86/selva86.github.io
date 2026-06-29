---
title: "Importing Data Lesson 3: JSON and Web Data"
catalog_blurb: "How to bring data into R from a web API and a web page."
description: "Pull data straight off the web into R: parse a JSON API response with jsonlite, scrape an HTML table with rvest, and learn the fetch-versus-parse split."
keywords: "JSON in R, jsonlite, fromJSON, parse JSON in R, web API in R, web scraping in R, rvest, read_html, html_table, html_elements, CSS selector, import data in R"
post_type: "LESSON"
curriculum_id: "1.4.3"
webr: true
lesson_access: "free"
course_id: "nr-import"
course_title: "Importing Data into R"
course_lesson: "3"
course_total: "5"
course_landing: "R-Foundations-Import-Course.html"
course_next: "Databases-and-Big-Files.html"
course_prev: "Reading-Excel-and-Other-Formats.html"
---

=== step === cover
::eyebrow Lesson 3 of 5
## JSON and Web Data

In lessons 1 and 2 you read data out of files: a `.csv`, an Excel workbook, an SPSS file. But a growing amount of data never arrives as a file at all. Maria's bakery just joined a food-delivery app. The app does not email her a spreadsheet; it exposes her orders through a **web API** that answers in a text format called **JSON**. And to keep an eye on the competition, Maria wants the price list from a rival bakery's website, but the rival has no API, so its numbers sit in a **table on a web page**.

This lesson brings both into R as the same tidy tibble you already know, with nothing to download. By the end you will be able to:

- Read JSON's shape, **objects** and **arrays**, and say what each becomes in R
- Parse a JSON response into a data frame with **jsonlite**, and flatten it when it nests
- Scrape a **table** off a web page into a tibble with **rvest**, and pick out single values with a CSS selector
- Explain the one idea that ties it together: **fetch** the data, then **parse** it

**Prerequisites:** lessons 1 and 2 (you know what a **tibble** is, that columns have a **type**, and how to load a package with `library()`). Every new term is defined as it appears. The map below is the whole lesson in one picture: which tool meets which web source.

::widget tree-diagram {"root":"a web API?","l":"returns JSON?","r":"data in a page table?","leaves":["fromJSON","read_csv","html_table","html_elements"]}

=== step === concept
::eyebrow The format APIs speak
## What JSON looks like

**JSON** (JavaScript Object Notation) is just text, the format almost every web API answers in. It is built from two pieces:

- An **object**, written in curly braces `{ }`, is a set of `"key": value` pairs, exactly like an R **named list**.
- An **array**, written in square brackets `[ ]`, is an ordered list of values, like an R **vector** or unnamed list.

A value can be text, a number, `true`/`false`, or another object or array, so JSON **nests**. Here is what Maria's delivery app sends back when she asks for today's orders:

```json
{
  "shop": "Maria Bakery",
  "open": true,
  "orders": [
    { "item": "croissant", "qty": 14 },
    { "item": "muffin",    "qty": 11 }
  ]
}
```

You can read its structure straight off the indentation: one object at the top, with an `orders` key whose value is an array of two more objects. The whole point of a JSON reader is to turn that text into R objects you can compute on, following a simple mapping:

| JSON piece | Example | Becomes in R |
|---|---|---|
| object `{ }` | `{"item":"muffin","qty":11}` | a named list (one record) |
| array of objects | `[ {...}, {...} ]` | a **data frame**: one row per object |
| array of values | `[14, 11, 6]` | a vector |
| nested object | `"totals": { ... }` | a list sitting inside the list |

[KEY INSIGHT]
The shape of the JSON decides the shape of your R object. The happy case, an **array of flat objects**, becomes a tidy data frame all by itself. You will see exactly that on the next step.

=== step === concept
::eyebrow Into R
## Parse JSON in one call

The **jsonlite** package turns JSON text into R objects. Its reader is `fromJSON()`. We will hand it the exact text the API returns, so you can see the parsing happen. (In a moment we will cover where that text comes from in a real project.)

Watch what happens when the JSON is an array of flat objects, the happy case from the table above:

```r
library(jsonlite)

# Exactly the text Maria's delivery app returns for today's orders:
orders_json <- '[
  {"id": 1, "item": "croissant", "qty": 14},
  {"id": 2, "item": "muffin",    "qty": 11},
  {"id": 3, "item": "baguette",  "qty": 6}
]'

orders <- fromJSON(orders_json)   # parse the text into R
orders
#>   id      item qty
#> 1  1 croissant  14
#> 2  2    muffin  11
#> 3  3  baguette   6

class(orders)
#> [1] "data.frame"
```

No loops, no manual splitting. `fromJSON()` saw an array of objects that all share the same keys and did the obvious thing: one **row** per object, one **column** per key. You are back in tibble-and-columns territory, the same place every reader in this course lands.

Where does `orders_json` come from in real life? You usually do not paste it; you point `fromJSON()` at the API's web address and it fetches the text for you:

```r-static
# In production, the app lives at a URL and fromJSON downloads it for you:
orders <- fromJSON("https://api.mariasbakery.example/orders/today")
```

We are using a string here so the parsing runs live in your browser. Hold on to that fetch-versus-parse split; it is the idea that ties this whole lesson together.

=== step === quiz
::eyebrow Check yourself
## What comes back?

Maria's app returns an **array of flat objects**: each order is `{"id": ..., "item": ..., "qty": ...}` with no nesting. She runs `fromJSON(orders_json)`. What does she get back?

::quiz {"correct":2,"gate":true,"difficulty":"beginner"}
- One long character string she still has to split apart herself ::no `fromJSON()` does not hand back text; it parses the text into real R objects. Splitting strings by hand is exactly the work it saves you.
- A data frame: one row per object, one column per key ::ok Right. An array of flat objects that share the same keys simplifies straight to a tidy data frame, ready to use like any tibble.
- A deeply nested list she must loop over to build a table ::no That is the OTHER case. Flat objects auto-simplify to a data frame; you only get nested lists when the JSON itself nests, which is the next step.

=== step === concept
::eyebrow When it nests
## Flatten a nested response

Real APIs rarely stay flat. Maria's app can return a richer order where each order carries a nested `totals` object. Plain `fromJSON()` is faithful to that shape: it makes `totals` a **column that is itself a table** (a data frame tucked inside the data frame), which is awkward to work with.

```r
library(jsonlite)

rich_json <- '[
  {"id": 1, "item": "croissant", "totals": {"qty": 14, "eur": 35.00}},
  {"id": 2, "item": "muffin",    "totals": {"qty": 11, "eur": 35.75}}
]'

rich <- fromJSON(rich_json)
str(rich)
#> 'data.frame': 2 obs. of  3 variables:
#>  $ id    : int  1 2
#>  $ item  : chr  "croissant" "muffin"
#>  $ totals:'data.frame':  2 obs. of  2 variables:
#>   ..$ qty: int  14 11
#>   ..$ eur: num  35 35.8
```

See the `totals` line: a data frame inside a data frame. To pull those buried numbers up into ordinary, flat columns, set `flatten = TRUE`. jsonlite then renames each one `parent.child`, so `totals` becomes `totals.qty` and `totals.eur`:

```r
flat <- fromJSON(rich_json, flatten = TRUE)
flat
#>   id      item totals.qty totals.eur
#> 1  1 croissant         14      35.00
#> 2  2    muffin         11      35.75
```

The widget below shows that exact move: the single nested `totals` column is spread into two flat columns you can sum, filter and plot.

::widget table-transform {"code":"flat <- fromJSON(rich_json, flatten = TRUE)","caption":"flatten = TRUE lifts the nested totals object into flat parent.child columns.","before":{"cols":["id","item","totals"],"rows":[[1,"croissant","{qty:14, eur:35.00}"],[2,"muffin","{qty:11, eur:35.75}"]]},"after":{"cols":["id","item","totals.qty","totals.eur"],"rows":[[1,"croissant",14,35.00],[2,"muffin",11,35.75]]}}

=== step === tryit
::eyebrow Your turn
## Flatten the order

Here is the nested response again. Plain `fromJSON()` would leave `totals` as a column that is itself a table. Add the one argument that spreads it into flat `totals.qty` and `totals.eur` columns, then check it.

```r
library(jsonlite)
rich_json <- '[{"id":1,"totals":{"qty":14,"eur":35.0}},{"id":2,"totals":{"qty":11,"eur":35.75}}]'
fromJSON(rich_json, ____)
```
::check {"regex":"flatten\\s*=\\s*TRUE","gate":true,"difficulty":"beginner","ok":"Exactly. flatten = TRUE turns the nested totals object into ordinary totals.qty and totals.eur columns.","no":"Spread the nested object with the flatten argument: flatten = TRUE."}
::solution
```r
library(jsonlite)
rich_json <- '[{"id":1,"totals":{"qty":14,"eur":35.0}},{"id":2,"totals":{"qty":11,"eur":35.75}}]'
fromJSON(rich_json, flatten = TRUE)
```

=== step === concept
::eyebrow No API? Read the page
## Scrape a table off a web page

The rival bakery has no API. Its prices simply live in a `<table>` on its web page. **Scraping** means reading that page's HTML and lifting the data out. The tool is the **rvest** package: `read_html()` parses the page into a document you can navigate, and `html_table()` finds every table and hands each one back as a tibble.

We will parse the page's HTML from a string, the exact text `read_html()` would download, so it runs live here:

```r
library(rvest)

# The rival's price page. This is the HTML read_html() would fetch from the URL:
page_html <- "<html><body>
  <h1>Old Town Bakery</h1>
  <table>
    <tr><th>item</th><th>price</th></tr>
    <tr><td>croissant</td><td>2.40</td></tr>
    <tr><td>muffin</td><td>3.10</td></tr>
    <tr><td>baguette</td><td>3.80</td></tr>
  </table>
</body></html>"

page   <- read_html(page_html)   # parse the HTML into a navigable document
tables <- html_table(page)       # finds EVERY <table> on the page -> a list
prices <- tables[[1]]            # grab the first (and only) one
prices
#> # A tibble: 3 x 2
#>   item      price
#>   <chr>     <dbl>
#> 1 croissant   2.4
#> 2 muffin      3.1
#> 3 baguette    3.8
```

Two things to notice. `html_table()` returns a **list**, because a page can hold several tables, so you index the one you want with `[[1]]`. And it was smart about types: it read the `<th>` cells as column names and converted `price` to a number (`<dbl>`) for you.

When the data is **not** in a neat table, you reach for a **CSS selector**, a short pattern that names which HTML elements you want. `html_elements()` finds every match; `html_text2()` pulls the text out of each. The `|>` below is R's **pipe**: it feeds the result on its left into the next function, so you read the steps top to bottom in the order they run:

```r
library(rvest)

# Sometimes each price sits in its own tagged element, not a table:
snippet <- "<ul>
  <li class='product'>croissant <span class='price'>2.40</span></li>
  <li class='product'>muffin <span class='price'>3.10</span></li>
</ul>"

doc <- read_html(snippet)
doc |>
  html_elements("span.price") |>   # CSS selector: every <span> with class price
  html_text2()                     # the text inside each match
#> [1] "2.40" "3.10"
```

`span.price` reads as "a `span` element whose class is `price`". Unlike `html_table()`, a selector gives you the raw **text**, so `"2.40"` is a character string; you would wrap it in `as.numeric()` when you need a number.

=== step === tryit
::eyebrow Your turn
## Pick the element with a selector

The rival's page puts its name in an `<h1>` element. The page is already parsed into `doc`. Fill in the **CSS selector** that targets the heading, then check it. (Both `"h1"` and the class selector `".shop-name"` work.)

```r
library(rvest)
snippet <- "<html><body>
  <h1 class='shop-name'>Old Town Bakery</h1>
  <p>Open daily from 7am</p>
</body></html>"
doc <- read_html(snippet)

# Pull the shop name out of its heading:
doc |> html_elements(____) |> html_text2()
```
::check {"regex":"h1|shop-name","gate":true,"difficulty":"intermediate","ok":"That is the one. The selector names the element you want, and html_text2() returns its text: Old Town Bakery.","no":"Target the heading by its tag name h1 (or by its class, .shop-name) as a quoted string, e.g. html_elements(\"h1\")."}
::solution
```r
library(rvest)
snippet <- "<html><body>
  <h1 class='shop-name'>Old Town Bakery</h1>
  <p>Open daily from 7am</p>
</body></html>"
doc <- read_html(snippet)
doc |> html_elements("h1") |> html_text2()
```

=== step === concept
::eyebrow The whole journey
## Fetch, then parse

Step back and the two halves of this lesson are the same shape. Whether the source is a JSON API or an HTML page, you do four things: point at the source, read it, get a tibble, tidy the types.

::widget process-flow {"steps":[{"title":"Point at the source","sub":"a URL: an API endpoint, or a web page"},{"title":"Read it","sub":"fromJSON for JSON, read_html for a page"},{"title":"Get a tibble","sub":"the array or the table becomes rows and columns"},{"title":"Tidy the types","sub":"coerce text that should be numbers or dates"}]}

The split that matters is **fetch versus parse**. Everything you ran above was the *parsing* half, working on text we already had, which is why it runs in your browser. The *fetch* half, downloading that text, is what needs a live internet connection. The good news: the same readers do both. Hand `fromJSON()` or `read_html()` a URL instead of a string and they fetch the page first, then parse it exactly as you saw.

[NOTE]
Scrape considerately. If a site offers an API, prefer it: it is faster and meant to be read by programs. Check a site's terms of use and its `robots.txt` before scraping, take only what you need, and do not hammer a server with rapid repeated requests.

=== step === quiz
::eyebrow Check yourself
## From string to live URL

Every example here parsed text held in a **string**, so it ran in your browser. In a real project the data lives at a web address instead. How do you fetch it?

::quiz {"correct":1,"gate":true,"difficulty":"intermediate"}
- Pass the URL straight to the reader: fromJSON(url) or read_html(url) downloads it and parses it in one call ::ok Right. The same functions accept a URL or a string. Given a URL they fetch the page first, then parse it exactly as you saw with the string.
- Download the file by hand in a browser, save it to disk, then read the saved file ::no No manual step needed. The readers fetch for you; handing them the URL does the download and the parse together.
- Parsing only works on strings, so a live URL needs a completely different package ::no Same package, same function. fromJSON() and read_html() each take a URL or a string; the parsing afterward is identical.

=== step === concept
::eyebrow Go deeper
## References

A few authoritative places to take this further:

- [jsonlite: getting started (CRAN vignette)](https://cran.r-project.org/web/packages/jsonlite/vignettes/json-aaquickstart.html) - how `fromJSON` maps JSON objects and arrays onto R lists and data frames.
- [Ooms (2014), The jsonlite Package (arXiv)](https://arxiv.org/abs/1403.2805) - the precise, consistent rules behind that mapping, including flattening.
- [rvest package home (tidyverse)](https://rvest.tidyverse.org/) - the full reference for `read_html`, `html_table`, `html_elements` and friends.
- [R for Data Science (2e): Web scraping](https://r4ds.hadley.nz/webscraping.html) - the canonical free walkthrough, including scraping etiquette and the law.
- [rvest: SelectorGadget vignette](https://rvest.tidyverse.org/articles/selectorgadget.html) - how to find the CSS selector for the element you actually want.

=== step === complete
## Lesson 3 complete

You can now bring data into R when there is no file to open. You read JSON's shape (objects and arrays), parsed it with `fromJSON()` into a tidy data frame, and flattened a nested response with `flatten = TRUE`. You scraped a price table off a web page with `read_html()` and `html_table()`, and picked single values out with a CSS selector. And you have the idea that unifies it all: **fetch** the text from a URL, then **parse** it into a tibble, with the same readers doing both.

Next, Lesson 4: Databases and big files. When the data is too large to fit in memory, or already lives in a database, you query it instead of reading it whole, and that is the last source this course teaches you to open.

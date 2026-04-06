# Plan: Web Scraping in R with rvest

## A. Frontmatter Fields

| Field | Value |
|---|---|
| title | Web Scraping in R with rvest: Extract Any Table or Text in 10 Minutes |
| slug | Web-Scraping-in-R-with-rvest |
| description | rvest makes web scraping in R easy. Master read_html(), html_elements(), html_table(), and html_text() plus pagination, sessions, and polite scraping. |
| keywords | web scraping in R, rvest, read_html, html_elements, html_table, html_text, R web scraping tutorial, rvest tutorial, scrape website R, polite scraping R |
| auto_link_terms | web scraping in R\|rvest\|read_html()\|html_elements()\|html_table()\|html_text()\|web scraping\|rvest package |
| auto_link_case_sensitive | true |
| mathjax | false |
| webr | false |
| date | 2026-04-06 |
| curriculum_id | DB3 |
| post_type | C |
| sidebar_section | Data Wrangling |
| sidebar_title | Web Scraping (rvest) |
| sidebar_order | 15 |

## B. Breadcrumb

Home > Data Wrangling > Databases & Web > Web Scraping in R with rvest

## C. Full Section Outline

### Lead Sentence
rvest is an R package that reads HTML pages, selects elements with CSS selectors, and extracts text, tables, and attributes into clean data frames — letting you turn any website into structured data.

### Introduction (2-3 paragraphs)
- Hook: data lives on websites as HTML, not in CSV files; rvest bridges the gap
- What: rvest is tidyverse's web scraping package — wraps libxml2 for fast HTML parsing
- What you'll learn: read_html(), CSS selectors, html_elements(), html_text2(), html_table(), html_attr(), sessions, pagination, polite scraping
- NOTE callout: rvest requires internet access and XML2 system libraries — code blocks show output as comments, not interactive execution

### Core Content Sections (7 H2s)

#### H2 1: What is web scraping and when should you use it?
- Theory: definition, legal/ethical landscape, robots.txt, Terms of Service
- When appropriate: public data, no API available, research purposes
- Diagram: Figure 1 — Web Scraping Pipeline (placed here)
- Callout: WARNING about always checking robots.txt and ToS

#### H2 2: How do you read an HTML page into R with rvest?
- Install rvest: install.packages("rvest")
- read_html() from URL or local file
- Code block: read_html() on a sample Wikipedia page, show structure
- Explain the XML document object returned

#### H2 3: How do CSS selectors target HTML elements?
- HTML element anatomy: tags, classes, IDs, attributes
- CSS selector syntax: tag, .class, #id, tag.class, parent > child, [attr]
- Diagram: Figure 2 — CSS Selector Types
- SelectorGadget browser extension recommendation
- Code block: html_elements() with different selectors
- TIP callout: use SelectorGadget to find selectors visually

#### H2 4: How do you extract text, tables, and attributes from HTML?
- html_text2() vs html_text() — whitespace handling
- html_table() — converts HTML tables to data frames
- html_attr() / html_attrs() — get href, src, class, etc.
- Code blocks: extract text from headings, scrape a Wikipedia table, extract all links
- Diagram: Figure 3 — HTML to rvest Function Map
- KEY INSIGHT callout: html_text2() mimics browser-rendered text

#### H2 5: How do you scrape multiple pages with pagination?
- Building URL patterns: paste0("https://example.com/page/", 1:5)
- Loop with Sys.sleep() for rate limiting
- Combining results with bind_rows()
- Code block: paginated scraping loop with delay
- WARNING callout: always add Sys.sleep() between requests

#### H2 6: How do sessions help with login-protected and multi-step scraping?
- session() — maintains cookies, headers, referrer
- session_jump_to(), session_follow_link()
- html_form(), html_form_set(), session_submit()
- Code block: create a session, navigate between pages
- NOTE callout: some sites block automated access regardless

#### H2 7: How do you scrape politely with robotstxt and rate limiting?
- robotstxt package: paths_allowed() check
- polite package: bow() + scrape()
- Rate limiting best practices
- User-Agent headers
- Code block: check robots.txt, use polite::bow()
- KEY INSIGHT callout: polite scraping keeps websites accessible for everyone

### Common Mistakes (3-5)
1. Using html_text() instead of html_text2() — invisible whitespace issues
2. Forgetting Sys.sleep() in loops — getting IP-banned
3. Scraping JavaScript-rendered content with rvest (needs RSelenium/chromote)
4. Using html_element() when html_elements() is needed (or vice versa)
5. Hardcoding CSS selectors that break when the site changes

### Practice Exercises (4)
1. Easy: Extract the title from any Wikipedia page
2. Medium: Scrape a table from Wikipedia and convert to data frame
3. Medium: Extract all links (href) from a page and filter external ones
4. Hard: Scrape multiple pages of a paginated listing

### Complete Example
- End-to-end: scrape a table of R packages from CRAN, clean it, analyze it
- Full code from URL to final clean data frame

### Summary
- Table of key rvest functions and their purpose
- Best practices checklist

### FAQ (5 questions)
1. Can rvest scrape JavaScript-rendered pages?
2. What is the difference between html_element() and html_elements()?
3. Is web scraping legal?
4. How fast can I scrape with rvest?
5. What are alternatives to rvest for R web scraping?

### References (7-8)
1. rvest CRAN documentation
2. R for Data Science Ch. 24 — Web scraping
3. rvest tidyverse vignette
4. robotstxt package CRAN
5. polite package CRAN
6. SelectorGadget tool
7. W3Schools CSS Selectors reference
8. httr2 package (for API-based scraping)

### What's Next?
- REST APIs in R with httr2 (DB4 curriculum entry)
- DBI in R — connect to databases
- dplyr filter & select — for cleaning scraped data

## D. Diagram List

| # | Filename | Figure N | Caption | Placed in H2 section |
|---|---|---|---|---|
| 1 | Web-Scraping-in-R-with-rvest-pipeline.webp | Figure 1 | The rvest scraping pipeline: from URL to clean data frame. | What is web scraping and when should you use it? |
| 2 | Web-Scraping-in-R-with-rvest-css-selectors.webp | Figure 2 | Five types of CSS selectors used to target HTML elements. | How do CSS selectors target HTML elements? |
| 3 | Web-Scraping-in-R-with-rvest-function-map.webp | Figure 3 | How rvest functions map to the HTML DOM tree. | How do you extract text, tables, and attributes from HTML? |

## E. Code Block Master List

| Block # | Demonstrates | Libs | Vars introduced | Vars used (from prior) |
|---|---|---|---|---|
| 1 | Install and load rvest | rvest | — | — |
| 2 | read_html() from URL | — | page | — |
| 3 | html_elements() with CSS selectors | — | headings | page |
| 4 | html_text2() to extract text | — | heading_text | headings |
| 5 | html_table() to extract a table | — | tables, df | page |
| 6 | html_attr() to extract links | — | links, hrefs | page |
| 7 | Paginated scraping loop | — | all_data | — |
| 8 | session() for stateful browsing | — | sess | — |
| 9 | robotstxt paths_allowed() | robotstxt | allowed | — |
| 10 | polite bow() + scrape() | polite | html_polite | — |
| 11-15 | Common mistakes examples | — | various | — |
| 16 | Complete example | rvest, dplyr | pkg_table, clean_pkgs | — |

Note: All code blocks are non-interactive (regular fenced code blocks with #> output comments) because rvest requires internet access and XML2 system libs which are NOT available in WebR.

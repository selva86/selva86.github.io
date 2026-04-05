# Post Plan: stringr in R

## A. Frontmatter Fields

| Field | Value |
|---|---|
| title | stringr in R: 15 Functions That Handle Every String Task You'll Actually Encounter |
| slug | stringr-in-R |
| description | stringr gives R consistent, pipe-friendly string functions. Learn str_detect, str_replace, str_extract, str_split, str_pad, and 9 more with real data examples. |
| keywords | stringr, stringr in R, str_detect, str_replace, str_extract, str_split, str_pad, R string functions, string manipulation R, stringr tutorial |
| auto_link_terms | stringr\|stringr in R\|str_detect()\|str_replace()\|str_extract()\|str_split()\|str_pad()\|string manipulation in R |
| auto_link_case_sensitive | false |
| mathjax | false |
| webr | true |
| date | 2026-04-06 |
| curriculum_id | 1.2.10 |
| post_type | C |
| sidebar_section | Data Wrangling |
| sidebar_title | stringr |
| sidebar_order | 11 |

## B. Breadcrumb

Home > Data Wrangling > String & Date Manipulation > stringr in R

## C. Full Section Outline

### Lead sentence
stringr is a tidyverse package that provides a consistent, pipe-friendly set of functions for detecting, extracting, replacing, and formatting strings in R.

### Introduction
- Hook: Strings are messy — names have extra spaces, dates arrive as text, survey responses need cleaning. Base R has string functions, but their names and argument orders are inconsistent. stringr fixes that.
- What: stringr wraps the powerful stringi engine in 50+ functions that all start with `str_` and take the string vector as the first argument.
- Why it matters: pipe-friendly, consistent, fast, readable.
- What you'll learn: 15 essential functions grouped into 5 task categories.
- Diagram: Figure 1 (function families mindmap) placed here.

### Core H2 Sections (5 sections, 15 functions)

#### H2-1: How Do You Detect and Count Pattern Matches?
- **Functions:** str_detect(), str_subset(), str_count()
- **Theory:** Boolean pattern matching, filtering vectors, counting occurrences
- **Code block 1:** str_detect() on fruit vector — returns TRUE/FALSE
- **Code block 2:** str_subset() to filter, str_count() to count
- **Callout:** [KEY INSIGHT] str_detect() is the stringr equivalent of grepl() but with consistent argument order.

#### H2-2: How Do You Extract and Locate Text Within Strings?
- **Functions:** str_extract(), str_extract_all(), str_sub()
- **Theory:** Pulling out matched patterns vs. positional substrings
- **Code block 3:** str_extract() with regex to pull area codes from phone numbers
- **Code block 4:** str_sub() for positional extraction
- **Callout:** [TIP] Use str_extract_all() when a string might contain multiple matches.
- **Diagram:** Figure 2 (choose-function decision flow) placed here.

#### H2-3: How Do You Replace and Transform Text?
- **Functions:** str_replace(), str_replace_all(), str_to_upper(), str_to_lower(), str_to_title()
- **Theory:** First-match vs. global replacement, case transformation
- **Code block 5:** str_replace() vs str_replace_all() side-by-side
- **Code block 6:** Case conversion chain
- **Callout:** [WARNING] str_replace() only changes the FIRST match. Use str_replace_all() to replace every occurrence.

#### H2-4: How Do You Split and Combine Strings?
- **Functions:** str_split(), str_c()
- **Theory:** Breaking strings apart by delimiter, joining strings together
- **Code block 7:** str_split() on CSV-like data
- **Code block 8:** str_c() with sep and collapse arguments
- **Callout:** [NOTE] str_c() is the stringr equivalent of paste0(). Use the sep argument to add separators.

#### H2-5: How Do You Clean and Format Strings?
- **Functions:** str_trim(), str_squish(), str_pad(), str_trunc()
- **Theory:** Whitespace removal, padding for alignment, truncation for display
- **Code block 9:** str_trim() and str_squish() on messy survey data
- **Code block 10:** str_pad() for fixed-width formatting
- **Diagram:** Figure 3 (regex anatomy) placed here.
- **Callout:** [TIP] str_squish() removes leading, trailing, AND repeated internal whitespace — it is more aggressive than str_trim().

### Common Mistakes Plan
1. Using str_replace() when str_replace_all() is needed (only first match replaced)
2. Forgetting to escape special regex characters (. matches everything)
3. Using == instead of str_detect() for partial matching
4. Passing a data frame column without pulling it as a vector
5. Not using fixed() for literal string matching (performance + correctness)

### Practice Exercises Plan
1. Easy: Use str_detect() to find state names containing "New"
2. Easy: Use str_replace_all() to clean phone number formatting
3. Medium: Extract all email domains from a character vector using str_extract()
4. Medium: Split full names into first/last using str_split() and combine with str_c()
5. Challenging: Clean a messy address vector using multiple stringr functions

### Complete Example Plan
- End-to-end: clean a messy customer dataset with names, emails, phone numbers
- Chain: str_trim → str_to_title → str_extract → str_replace_all → str_detect (filter)

### Summary Plan
- Table: 15 functions, grouped by task, with one-line description and base R equivalent

### FAQ Plan
1. What is the difference between stringr and stringi?
2. Can stringr handle Unicode and non-English text?
3. When should I use fixed() instead of regex patterns?
4. How does str_detect() differ from grepl()?
5. Is stringr faster than base R string functions?

### References Plan
1. Wickham, H. — stringr: Simple, Consistent Wrappers for Common String Operations. https://stringr.tidyverse.org/
2. Wickham, H. & Grolemund, G. — R for Data Science, Ch. 14: Strings. https://r4ds.had.co.nz/strings.html
3. CRAN — stringr vignette. https://cran.r-project.org/web/packages/stringr/vignettes/stringr.html
4. RStudio — stringr cheatsheet. https://rstudio.github.io/cheatsheets/html/strings.html
5. Gagolewski, M. — stringi: Fast and Portable Character String Processing. https://stringi.gagolewski.com/
6. R Core Team — grep() documentation. https://stat.ethz.ch/R-manual/R-devel/library/base/html/grep.html
7. Sanchez, G. — Handling Strings with R. https://www.gastonsanchez.com/r4strings/

### What's Next Plan
1. R Regular Expressions — dive deeper into regex patterns for complex string matching
2. lubridate in R — handle date-time strings after you've cleaned them with stringr
3. dplyr mutate & rename — combine stringr with dplyr to transform string columns in data frames

## D. Diagram List

| # | Filename | Figure N | Caption | Placed in H2 section |
|---|---|---|---|---|
| 1 | stringr-in-R-function-families.webp | Figure 1 | The five families of stringr functions. | Introduction |
| 2 | stringr-in-R-choose-function.webp | Figure 2 | Choosing the right stringr function for your task. | How Do You Extract and Locate Text Within Strings? |
| 3 | stringr-in-R-regex-anatomy.webp | Figure 3 | The four building blocks of a regex pattern. | How Do You Clean and Format Strings? |

## E. Code Block Master List

| Block # | Demonstrates | Libs | Vars introduced | Vars used (from prior) |
|---|---|---|---|---|
| 1 | Load stringr + create fruit vector | stringr | fruits | — |
| 2 | str_subset() and str_count() | — | berry_fruits, berry_counts | fruits |
| 3 | str_extract() area codes from phones | — | phones, area_codes | — |
| 4 | str_sub() positional extraction | — | codes, first_three | codes |
| 5 | str_replace() vs str_replace_all() | — | messy_text, cleaned_once, cleaned_all | — |
| 6 | Case conversion chain | — | names, upper_names, title_names | — |
| 7 | str_split() on delimited data | — | csv_data, split_result | — |
| 8 | str_c() with sep and collapse | — | first, last, full_names, one_line | — |
| 9 | str_trim() and str_squish() | — | survey_responses, trimmed, squished | — |
| 10 | str_pad() for alignment | — | ids, padded_ids | — |
| 11 | Complete example: clean customer data | dplyr | customers, clean_customers | — |

Estimated word count: ~4500 words

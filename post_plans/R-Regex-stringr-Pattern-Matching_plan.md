# Plan: R Regular Expressions: Pattern Matching with stringr (20 Examples)

## A. Frontmatter Fields

| Field | Value |
|---|---|
| title | R Regular Expressions: Pattern Matching with stringr (20 Examples) |
| slug | R-Regex-stringr-Pattern-Matching |
| description | Master R regex with 20 practical stringr examples: character classes, quantifiers, anchors, groups, and lookaheads using str_detect(), str_extract(), and str_replace(). |
| keywords | R regular expressions, R regex, stringr regex, str_detect regex, str_extract regex, str_replace regex, R pattern matching, R character classes, R regex lookahead, regex in R |
| auto_link_terms | R regular expressions\|R regex\|regex in R\|regular expressions in R\|pattern matching in R |
| auto_link_case_sensitive | false |
| mathjax | false |
| webr | true |
| date | 2026-04-06 |
| curriculum_id | FR-stri-1 |
| post_type | FR |
| fr_parent | stringr-in-R.html |

## B. Breadcrumb

Home > Data Wrangling > Further Reading > R Regular Expressions with stringr

## C. Full Section Outline

### Lead sentence
Regular expressions (regex) are text patterns that match, extract, and replace strings — and stringr makes them easy to use in R with consistent functions like str_detect(), str_extract(), and str_replace().

### Introduction (2-3 paragraphs)
- Hook: You need to extract phone numbers from messy text, validate email formats, or pull dollar amounts from thousands of rows. Hard-coded string matching won't cut it — you need patterns.
- What: Regular expressions are a mini-language for describing text patterns. Combined with stringr, they become the most powerful string tool in R.
- What you'll learn: 20 practical examples organized by regex concept — character classes, quantifiers, anchors, groups, and lookaheads. All code runs interactively in your browser.

### Core Content Sections (5 H2s, organized by regex concept)

#### H2: How Do Character Classes Match Specific Characters? (Examples 1-4)
- Theory: Character classes let you match specific sets of characters. `[abc]`, `[a-z]`, `[^abc]`, shorthand classes `\\d`, `\\w`, `\\s`.
- Example 1: Extract all digits from mixed text with `str_extract_all()` and `\\d+`
- Example 2: Detect strings containing only letters with `str_detect()` and `^[a-zA-Z]+$`
- Example 3: Replace all non-word characters with `str_replace_all()` and `\\W`
- Example 4: Match whitespace-separated tokens with `str_extract_all()` and `\\S+`
- Callout: [KEY INSIGHT] on \\d vs [0-9] in R (same in most cases, but \\d may match Unicode digits)

#### H2: How Do Quantifiers Control Pattern Repetition? (Examples 5-8)
- Theory: `?` (0 or 1), `+` (1+), `*` (0+), `{n}` (exactly n), `{n,m}` (n to m). Greedy vs lazy.
- Example 5: Extract optional area codes from phone numbers with `\\(?\\d{3}\\)?`
- Example 6: Match variable-length words with `\\b[a-z]{3,6}\\b`
- Example 7: Greedy vs lazy extraction with `str_extract()` and `".*"` vs `".*?"`
- Example 8: Validate fixed-format codes like ZIP codes with `^\\d{5}(-\\d{4})?$`
- Callout: [WARNING] on greedy being the default — always test with real data

#### H2: How Do Anchors and Boundaries Pin Patterns to Positions? (Examples 9-12)
- Theory: `^` (start), `$` (end), `\\b` (word boundary). Why anchors matter for validation.
- Example 9: Detect strings that start with a capital letter with `^[A-Z]`
- Example 10: Extract the last word of a sentence with `\\w+$`
- Example 11: Replace whole words only using `\\b` to avoid partial matches
- Example 12: Validate email format with anchors and character classes
- Callout: [TIP] on `\\b` preventing accidental partial matches (e.g., "cat" inside "concatenate")

#### H2: How Do Groups and Backreferences Capture Subpatterns? (Examples 13-16)
- Theory: Parentheses `()` create groups. `str_match()` extracts groups separately. Backreferences `\\1` let you refer to previous captures. Non-capturing groups `(?:)`.
- Example 13: Extract area code and number separately from phone numbers with `str_match()`
- Example 14: Swap first and last names using backreferences with `str_replace()`
- Example 15: Use `|` (alternation) inside groups to match variants
- Example 16: Use non-capturing groups for efficiency when you don't need the match
- Callout: [KEY INSIGHT] on str_match() returning a matrix — column 1 is the full match, columns 2+ are groups

#### H2: How Do Lookaheads and Lookbehinds Match Without Consuming? (Examples 17-20)
- Theory: `(?=...)` positive lookahead, `(?!...)` negative lookahead, `(?<=...)` positive lookbehind, `(?<!...)` negative lookbehind. They assert context without including it in the match.
- Example 17: Extract dollar amounts but not euro amounts using lookbehind `(?<=\\$)\\d+`
- Example 18: Find words followed by a comma using lookahead `\\w+(?=,)`
- Example 19: Match numbers NOT preceded by a minus sign using negative lookbehind
- Example 20: Validate password strength with multiple lookaheads
- Callout: [NOTE] on R requiring fixed-width lookbehinds (no `*` or `+` inside lookbehinds)

### Common Mistakes Plan (3-5 mistakes)
1. Forgetting to double-escape in R strings (`\d` vs `\\d`) — runtime error
2. Missing anchors in validation patterns (partial matches pass) — wrong results
3. Greedy quantifiers capturing too much (`.*` gobbles everything) — wrong results
4. Using `str_extract()` when `str_extract_all()` is needed — silent bug (only first match returned)
5. Putting quantifiers inside character classes `[a-z+]` (treats `+` as literal) — wrong results

### Practice Exercises Plan (4 exercises)
1. Easy: Extract all 4-digit years from a text string
2. Medium: Validate a vector of phone numbers matching `(XXX) XXX-XXXX` format
3. Medium: Extract domain names from email addresses using groups
4. Challenging: Clean messy product codes by extracting category prefix, digits, and suffix using named-like group extraction

### Complete Example Plan
End-to-end: Clean a messy address dataset — extract ZIP codes, normalize phone numbers, validate email formats, all in a single dplyr + stringr pipeline.

### Summary Plan
Table: 5 regex concepts x 3 columns (Concept, Syntax, stringr Function)

### FAQ Plan (5 questions)
1. What is the difference between `str_extract()` and `str_match()`?
2. How do I make regex case-insensitive in stringr?
3. Can I use regex with dplyr filter()?
4. What is the difference between `\\b` and `^`/`$`?
5. How do I debug a regex that doesn't match?

### References Plan
1. Wickham, H. — R for Data Science, 2e. Chapter 15: Regular Expressions.
2. stringr documentation — regex pattern overview.
3. R Core Team — `?regex` help page.
4. Wickham, H. — stringr: Simple, Consistent Wrappers for Common String Operations (CRAN).
5. Friedl, J.E.F. — Mastering Regular Expressions, 3rd Edition. O'Reilly (2006).
6. regex101.com — interactive regex tester.
7. ICU Regular Expressions documentation (stringr uses ICU engine).

### What's Next Plan
1. stringr-in-R.html — Parent tutorial covering all 15 stringr functions
2. lubridate-in-R.html — Parse and manipulate dates (the other common "messy text" problem)

## D. Diagram List

Skipped — FR post, and regex concepts are better taught through code examples than diagrams.

## E. Code Block Master List

| Block # | Demonstrates | Libs | Vars introduced | Vars used (from prior) |
|---|---|---|---|---|
| 1 | Load stringr + create sample data | stringr | messy_text, phones, emails | — |
| 2 | Ex1: Extract digits with \\d+ | — | digits | messy_text |
| 3 | Ex2: Detect letter-only strings | — | words, letter_only | — |
| 4 | Ex3: Replace non-word chars | — | cleaned | messy_text |
| 5 | Ex4: Extract non-whitespace tokens | — | tokens | messy_text |
| 6 | Ex5: Optional area codes | — | area_matches | phones |
| 7 | Ex6: Match variable-length words | — | short_words | — |
| 8 | Ex7: Greedy vs lazy | — | greedy, lazy | — |
| 9 | Ex8: Validate ZIP codes | — | zips, valid_zip | — |
| 10 | Ex9: Starts with capital | — | sentences, starts_cap | — |
| 11 | Ex10: Last word extraction | — | last_words | sentences |
| 12 | Ex11: Whole-word replacement | — | text_boundary | — |
| 13 | Ex12: Email validation | — | valid_email | emails |
| 14 | Ex13: Extract phone parts with str_match | — | phone_parts | phones |
| 15 | Ex14: Swap names with backreference | — | names_vec, swapped | — |
| 16 | Ex15: Alternation in groups | — | fruits, citrus_or_berry | — |
| 17 | Ex16: Non-capturing groups | — | nc_result | — |
| 18 | Ex17: Lookbehind for dollar amounts | — | prices, dollars | — |
| 19 | Ex18: Lookahead for words before comma | — | before_comma | — |
| 20 | Ex19: Negative lookbehind | — | numbers_text, positive_nums | — |
| 21 | Ex20: Password validation with lookaheads | — | passwords, strong | — |
| 22 | Complete example: address cleaning pipeline | dplyr | address_df, clean_df | — |
| 23-26 | Exercises 1-4 (starter + solution) | — | my_years, my_valid, my_domains, my_parts | — |

## Estimated Word Count: ~4500-5000
## H2 Sections: 12 (1 intro + 5 core + 6 tail)
## Code Blocks: ~26 tutorial + ~8 exercise = ~34 total
## Callouts: ~8-10

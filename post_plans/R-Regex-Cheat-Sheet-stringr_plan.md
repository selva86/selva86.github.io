# Plan: R Regex Cheat Sheet: 30 Patterns With stringr Examples

## A. Frontmatter Fields

| Field | Value |
|---|---|
| title | R Regex Cheat Sheet: 30 Patterns With stringr Examples — Copy and Paste |
| slug | R-Regex-Cheat-Sheet-stringr |
| description | Quick reference: character classes, quantifiers, anchors, groups, lookaheads — all with str_detect(), str_extract(), and str_replace() examples. |
| keywords | R regex cheat sheet, R regular expressions, stringr regex, str_detect regex, str_extract regex, str_replace regex, R pattern matching, regex in R |
| auto_link_terms | R regex cheat sheet\|regex in R\|regular expressions in R\|R regex patterns\|R pattern matching |
| auto_link_case_sensitive | false |
| mathjax | false |
| webr | true |
| date | 2026-04-06 |
| curriculum_id | CHT8 |
| post_type | FR |
| fr_parent | stringr-in-R.html |

## B. Breadcrumb

Home > Data Wrangling > String & Date Manipulation > R Regex Cheat Sheet

## C. Full Section Outline

### Lead sentence
A copy-paste regex pattern library for R: 30 patterns organized by category, each with a stringr example and expected output.

### Introduction (2 paragraphs)
- Hook: You know your data has the pattern. You know stringr can find it. But which regex syntax was it again? This page answers that in under 10 seconds.
- What this covers: 30 regex patterns in 6 categories (literals, character classes, quantifiers, anchors, groups/alternation, lookarounds). Every pattern has a description, the regex, a stringr example, and the output. Designed for bookmarking.

### Core Content Sections (6 H2 sections — one per regex category)

#### H2 1: How Do You Match Literal Characters and Metacharacters? (Patterns 1-5)
- Theory: Literal matching, escaping metacharacters with \\, the . wildcard
- Table: 5 patterns (literal, dot, escaped dot, escaped backslash, pipe literal)
- Code block: str_detect/str_extract demo with literals and escaped chars
- Callout: WARNING about double-backslash in R strings

#### H2 2: How Do Character Classes Work in R Regex? (Patterns 6-12)
- Theory: Square brackets, ranges, negation, shorthand classes \\d \\w \\s, POSIX classes
- Table: 7 patterns ([abc], [a-z], [^0-9], \\d, \\w, \\s, [:alpha:])
- Code block: str_extract_all with character classes on sample text
- Callout: TIP about POSIX classes inside double brackets [[:alpha:]]

#### H2 3: How Do Quantifiers Control Pattern Repetition? (Patterns 13-19)
- Theory: Greedy vs lazy quantifiers, exact counts
- Table: 7 patterns (?, +, *, {n}, {n,}, {n,m}, lazy +?)
- Code block: str_extract with quantifiers on phone-number-like strings
- Callout: KEY INSIGHT about greedy vs lazy matching

#### H2 4: How Do Anchors and Boundaries Pin a Pattern in Place? (Patterns 20-23)
- Theory: Start/end of string, word boundaries
- Table: 4 patterns (^, $, \\b, \\B)
- Code block: str_detect with anchors to filter words
- Callout: WARNING about ^ inside [] vs outside

#### H2 5: How Do Groups and Alternation Capture Subpatterns? (Patterns 24-27)
- Theory: Capturing groups, non-capturing groups, backreferences, alternation
- Table: 4 patterns ((), (?:), \\1 backreference, |)
- Code block: str_match to extract grouped subpatterns
- Callout: TIP about str_match vs str_extract for groups

#### H2 6: How Do Lookaheads and Lookbehinds Match Without Consuming? (Patterns 28-30)
- Theory: Zero-width assertions, positive/negative lookahead/lookbehind
- Table: 3 patterns ((?=...), (?!...), (?<=...))
- Code block: str_extract with lookahead/lookbehind
- Callout: NOTE about lookbehind requiring fixed-width patterns in some engines

### Common Mistakes (3-5 mistakes)
1. Forgetting double backslash in R (\\d vs \d)
2. Using ^ for negation outside character class
3. Greedy quantifier grabbing too much (use lazy)
4. Forgetting that . matches any character (not literal dot)
5. Using str_extract when str_match is needed for groups

### Practice Exercises (5 exercises)
1. Easy: Extract all digits from a messy string
2. Easy: Detect emails containing a specific domain
3. Medium: Extract area codes from phone numbers using groups
4. Medium: Replace all non-alphanumeric characters
5. Challenging: Use lookahead to extract prices before "USD"

### Complete Example
- End-to-end: Clean and extract structured data from messy log entries using 5+ regex patterns

### Summary
- Table: all 30 patterns with one-line description and category

### FAQ (5 questions)
1. What is the difference between grepl() and str_detect()?
2. How do I make regex case-insensitive in stringr?
3. Can I use regex with str_replace_all()?
4. Why does \\d need two backslashes in R?
5. How do I match a literal dollar sign?

### References (6-8 sources)
1. stringr.tidyverse.org regex vignette
2. RStudio Regex Cheat Sheet PDF
3. R4DS 2e Chapter 15 Regular Expressions
4. R documentation ?regex
5. Wickham, H. — R for Data Science, 2nd ed.
6. CRAN stringr package docs

### What's Next
- stringr-in-R.html (parent: full stringr tutorial)
- Link to a text mining or data cleaning post if available

## D. Diagram List
Diagrams skipped (FR post, instruction says optional — skip).

## E. Code Block Master List

| Block # | Demonstrates | Libs | Vars introduced | Vars used |
|---|---|---|---|---|
| 1 | Load stringr, create sample data | stringr | texts, messy_data | — |
| 2 | Literal and metacharacter matching | — | — | texts |
| 3 | Character class extraction | — | — | texts |
| 4 | Quantifier demos with phone numbers | — | phones | — |
| 5 | Anchor and boundary filtering | — | words | — |
| 6 | Group capture with str_match | — | dates | — |
| 7 | Lookahead/lookbehind extraction | — | prices | — |
| 8 | Common mistake: single vs double backslash | — | — | — |
| 9 | Exercise starter blocks (5) | — | my_* vars | — |
| 10 | Complete example: log parsing | — | log_entries, cleaned | — |

## Plan Summary
- 13 H2 sections (1 Intro + 6 core + 6 tail)
- 0 diagrams
- ~10-12 code blocks (plus exercise blocks)
- 5 exercises
- 30 regex patterns in 6 tables
- Estimated word count: 3500-4000

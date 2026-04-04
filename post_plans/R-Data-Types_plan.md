# Plan: R-Data-Types

## Frontmatter
- title: "R Data Types: Which Type Is Your Variable?"
- slug: R-Data-Types (LOCKED)
- description: "R's 6 data types — numeric, integer, character, logical, complex, raw. Learn how to check types, why coercion causes bugs, and when each type belongs." (153 chars)
- keywords: R data types, numeric in R, integer in R, character in R, logical in R, complex in R, class() vs typeof(), R type coercion, as.numeric, is.numeric
- auto_link_terms: "R data types|R type coercion|numeric in R|character in R|logical in R"
- auto_link_case_sensitive: false
- mathjax: false, webr: true, date: 2026-04-05
- curriculum_id: 1.1.5, post_type: C
- sidebar_section: Learn R, sidebar_title: R Data Types, sidebar_order: 5

## Breadcrumb
`Home > Learn R > Fundamentals > R Data Types`

## Section Outline (13 H2s)

**Lead:** "R has six basic data types: numeric (double), integer, character, logical, complex, and raw. Every variable in R belongs to exactly one of these types, and knowing which type you're working with prevents most silent bugs."

**## Introduction** — hook: "typeof(1) returns 'double' — that surprises everyone"; 6 types overview; WebR note

**## What are R's six data types?** (core H2)
- numeric/double (default), integer (L suffix), character, logical, complex, raw
- One code block per type with typeof() output

**## How do you check a variable's type?** (core H2)
- class() — what the object IS to R's dispatch system
- typeof() — storage type at C level
- storage.mode() — less common, similar to typeof
- is.*() family — boolean checks
- Comparison table

**## How does R convert between types?** (core H2)
- Explicit coercion: as.numeric(), as.integer(), as.character(), as.logical()
- NA warnings from failed coercion
- Round-trip gotchas (double → integer truncation)

**## Why does R auto-promote types?** (core H2)
- Implicit coercion hierarchy: logical → integer → double → complex → character
- Diagram: coercion ladder
- c(TRUE, 1L, 2.5) → all become doubles
- c(1, "a") → all become character

**## What are NA, NULL, NaN, and Inf?** (core H2)
- NA: typed missing (NA_real_, NA_integer_, NA_character_)
- NULL: absence, length 0
- NaN: from 0/0
- Inf: from 1/0
- Diagram: special values

**## Common Mistakes** (4)
1. Using `1 + "1"` (character doesn't coerce to number)
2. Treating NA as comparable (NA == NA returns NA, not TRUE)
3. Assuming typeof() and class() always agree
4. Integer overflow silently becomes NA

**## Practice Exercises** (5)
1. Easy: Check type of 3 variables
2. Easy-Med: Convert character "42" to integer
3. Med: Coerce a logical vector to sum
4. Med: Compare NA correctly using is.na()
5. Hard: Type-check a mixed vector and explain coercion

**## Complete Example:** Building a clean vector — typed inputs, check types, detect coercion, handle NAs

**## Summary:** 3-column table (Type | typeof() | Example)

**## FAQ** (5)
- What's the difference between numeric and double?
- Why does R default to double instead of integer?
- When should I use the L suffix?
- Why does TRUE + TRUE return 2?
- Is NA the same as NULL?

**## References** (7)
- R Core Team, An Introduction to R (Types)
- Wickham, Advanced R, Ch 3 (Vectors)
- R Language Definition (Basic types)
- stat.ethz.ch typeof docs
- stat.ethz.ch NA docs
- tidyverse style guide
- Wickham & Grolemund R4DS

**## What's Next?**
- R Vectors
- R Factors
- R Special Values (NA/NULL deep dive)

## Diagrams
- R-Data-Types-coercion-ladder.webp (in "Why does R auto-promote types?" section)
- R-Data-Types-decision-tree.webp (in "What are R's six data types?" section)
- R-Data-Types-special-values.webp (in "What are NA, NULL, NaN, and Inf?" section)

## Callouts planned (6)
- KEY INSIGHT: Numbers are doubles by default, not integers
- WARNING: NA == NA returns NA, not TRUE
- TIP: Use typeof() for storage type, class() for dispatch
- NOTE: R has no integer64 natively — use bit64 package
- KEY INSIGHT: Coercion ladder — R silently promotes toward character
- TIP: Use is.na() and is.null() — never ==

Estimated word count: 3200-3800

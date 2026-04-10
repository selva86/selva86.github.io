# Plan — R Data Types (rewrite)

## Frontmatter
- title: R Data Types: Which Type Is Your Variable? (And Why It Matters)
- slug: R-Data-Types
- description: Learn R's 6 data types — numeric, integer, character, logical, complex, raw. How to check types, why coercion causes silent bugs, and when each belongs.
- keywords: R data types, numeric vs integer R, R class typeof, R type coercion, L suffix R, check data type R, R character vs factor
- auto_link_terms: R data types|numeric in R|integer in R|character in R|logical in R|typeof()|class()|type coercion in R
- auto_link_case_sensitive: false
- mathjax: false
- webr: true
- date: 2026-04-11
- curriculum_id: 1.1.5
- post_type: C
- sidebar_section: R Fundamentals
- sidebar_title: R Data Types
- sidebar_order: 5

## Outline (7 core + 5 tail = 12 H2)

1. What are R's six data types? (entry, payoff: one-of-each + class())
2. How do I check a variable's type?
3. What's the difference between class(), typeof(), and mode()?
4. Why does numeric really mean double in R?
5. How does R coerce types automatically? (Figure 1 coercion ladder)
6. What about NA, NULL, NaN, and Inf? (Figure 3 special values)
7. Which type should I use when? (Figure 2 decision tree)
8. Practice Exercises (3 capstones)
9. Putting It All Together (weather log)
10. Summary (table)
11. References (5)
12. Continue Learning (3 links)

## Diagrams (reuse rendered webp)
- R-Data-Types-coercion-ladder.webp — Figure 1 — coercion ladder — placed in "How does R coerce types automatically?"
- R-Data-Types-decision-tree.webp — Figure 2 — decision tree — placed in "Which type should I use when?"
- R-Data-Types-special-values.webp — Figure 3 — NA/NULL/NaN/Inf — placed in "What about NA, NULL, NaN, and Inf?"

## Code block master list
1. Create one of each 6 types + class() — payoff
2. Try it: character
3. class() + is.numeric/is.character/is.logical
4. Try it: is.logical
5. class vs typeof vs mode table
6. Try it: typeof(5) vs typeof(5L)
7. numeric = double, L suffix, integer overflow
8. Try it: L suffix
9. Coercion in vectors + arithmetic on logicals
10. Try it: predict class(c(TRUE, 1L, 2.5))
11. NA/NULL/NaN/Inf + is.na/is.null
12. Try it: is.na count
13. Pick right type for age column
14. Try it: temperature column
15. Capstone 1: type detective
16. Capstone 2: fix c(1,2,"3")
17. Capstone 3: integer vs double memory
18. Complete example: weather log

## Callouts (~6)
- KEY INSIGHT: coercion hierarchy
- KEY INSIGHT: class() vs typeof()
- TIP: use L suffix
- WARNING: is.na vs is.null trap
- NOTE: raw type is rare
- TIP: character vs factor

Est words: ~2700

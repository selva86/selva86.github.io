# Plan — R Vectors (rewrite)

## Frontmatter
- title: R Vectors: The Foundation of Everything in R (Master This First)
- slug: R-Vectors
- description: Master R vectors — create with c(), index with [], name elements, recycle, vectorize. The core data structure every R user must understand before anything else.
- keywords: R vectors, create vector R, c() function, vector indexing R, vector recycling, vectorized operations, named vectors, negative indexing R
- auto_link_terms: R vectors|vectors in R|c() function|vector recycling|vectorized operations|named vectors in R|vector indexing
- auto_link_case_sensitive: false
- mathjax: false
- webr: true
- date: 2026-04-11
- curriculum_id: 1.1.6
- post_type: C
- sidebar_section: R Fundamentals
- sidebar_title: R Vectors
- sidebar_order: 6

## Outline (7 core + 5 tail = 12 H2)

1. What is an R vector and how do you create one? (payoff: c() + mean/sum/max output)
2. How does R decide a vector's type?
3. How do you index vectors with []? (positive, negative, logical, named)
4. How do vectorized operations work?
5. What is recycling and when does it bite?
6. How do you create sequences and repeat vectors? (seq, :, rep)
7. How do you modify vectors in place?
8. Practice Exercises
9. Putting It All Together
10. Summary
11. References
12. Continue Learning

## Diagrams (2)
- R-Vectors-indexing-methods.webp — Figure 1 — four indexing methods — "How do you index vectors with []?"
- R-Vectors-recycling.webp — Figure 2 — recycling rule — "What is recycling and when does it bite?"

## Code block master list
1. Create numeric vector + mean/sum/max (payoff)
2. Try it: create character vector
3. Type inference + typeof
4. Try it: typeof of c(1, "a")
5. Positive indexing [c(1,3)]
6. Negative indexing [-1]
7. Logical indexing x > 3
8. Named indexing
9. Try it: subset by name
10. Vectorized arithmetic
11. Try it: scale a vector
12. Recycling example (safe + warning)
13. Try it: predict recycling
14. seq(), :, rep()
15. Try it: seq with length.out
16. Modify in place x[2] <- 99
17. Try it: replace multiple
18. Capstone 1: grade vector
19. Capstone 2: temperature outliers
20. Capstone 3: discount prices
21. Complete example: monthly sales

Est words: ~2700

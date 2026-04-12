# Plan: R Subsetting Exercises

## A. Frontmatter Fields

| Field | Value |
|---|---|
| title | R Subsetting Exercises: 10 [] vs [[]] vs $ Practice Problems — Solved Step-by-Step |
| slug | R-Subsetting-Exercises |
| description | Practice R subsetting with 10 solved exercises on [], [[]], and $. Work through vectors, lists, and data frames with interactive code you can run in your browser. |
| keywords | R subsetting exercises, R bracket exercises, [] vs [[]] vs $ R, R indexing practice problems, R subsetting practice, subset R exercises, R extract elements, R list subsetting exercises, double bracket R |
| auto_link_terms | R subsetting exercises\|subsetting exercises\|[] vs [[]] vs $\|bracket exercises in R\|R indexing practice |
| auto_link_case_sensitive | false |
| mathjax | false |
| webr | true |
| date | 2026-04-12 |
| curriculum_id | E1.10 |
| post_type | EX |
| sidebar_section | — (EX routes to Practice Exercises automatically) |
| sidebar_title | R Subsetting Exercises |
| sidebar_order | — (EX uses append order) |
| fr_parent | R-Vectors.html |

## B. Breadcrumb

Home > Learn R > Fundamentals > R Subsetting Exercises

## C. Full Section Outline

### Lead Paragraph
**Lead sentence:** Subsetting — pulling specific pieces out of vectors, lists, and data frames with `[]`, `[[]]`, and `$` — is one of the most-used skills in R, and one of the trickiest to master.

These 10 exercises take you from basic vector indexing to nested list extraction, each with starter code and a full worked solution. Run every block, predict the output before you peek, and you'll have the three operators locked in.

### First H2 Opening Plan (≤80 words)
"R gives you three subsetting operators, and each returns something different. The fastest way to build intuition is to run code and check your predictions. Start with vectors — the simplest structure — and `[]`, the operator you'll use most."

---

### Core H2 Sections

#### H2-1: How does [] work on vectors?
- **Theory:** [] selects one or more elements by position, name, or logical condition. Returns same type as input. Six indexing methods: positive integer, negative integer, logical, character (named), nothing, zero.
- **Problem 1:** Given `scores <- c(math = 88, science = 92, english = 79, history = 95, art = 84)`, extract the 2nd and 4th elements by position, then extract the same elements by name.
- **Problem 2:** From the same `scores` vector, extract all scores above 85 using a logical condition. Then exclude the 3rd element using negative indexing.
- **Code blocks:** 2 (one per problem with starter + solution reveal)
- **Callouts:** [KEY INSIGHT] — [] always returns a vector of the same type
- **Inline exercise:** Try it: create a vector of 5 cities and extract the first and last using positive indexing and `length()`.

#### H2-2: How does [] behave differently on lists?
- **Theory:** [] on a list returns a *sub-list*, not the element inside. This is the #1 source of confusion. The train-car analogy: [] gives you a train car (still a list), [[]] opens the car and hands you the contents.
- **Problem 3:** Given a list `student <- list(name = "Ava", grades = c(90, 85, 92), graduated = FALSE)`, use `[]` to extract the first two elements. Check `class()` of the result — it's still a list.
- **Problem 4:** From the same `student` list, compare `student[2]` vs `student[[2]]`. What type does each return? When would you want each?
- **Code blocks:** 2
- **Callouts:** [WARNING] — `student["grades"]` returns a list containing the vector, not the vector itself. Passing it to `mean()` will fail.
- **Inline exercise:** Try it: create a list with 3 elements and use `[]` to extract a sub-list of elements 1 and 3. Verify with `is.list()`.

#### H2-3: When should you use [[]] to extract elements?
- **Theory:** [[]] extracts a *single* element from a list or data frame, stripping the container. Works by position or name. Cannot select multiple elements. Essential for programmatic access (variable names).
- **Problem 5:** Given `config <- list(host = "localhost", port = 8080, debug = TRUE)`, extract the port value using [[]] by name and by position. Store in a variable and add 1 to it (proves it's a numeric, not a list).
- **Problem 6:** Using the built-in `mtcars` data frame, extract the `mpg` column using `[[]]` by name and by position. Compute its mean.
- **Code blocks:** 2
- **Callouts:** [TIP] — Use [[]] when you need the *value* for computation. Use [] when you need a *subset* that preserves structure.
- **Inline exercise:** Try it: given `col_name <- "hp"`, extract that column from `mtcars` using `[[col_name]]` (programmatic access).

#### H2-4: How does $ simplify named access?
- **Theory:** $ is shorthand for `[["name"]]`. Works only with literal names (not variables). Supports partial matching (dangerous!). Most readable for interactive use.
- **Problem 7:** Using `mtcars`, extract the `cyl` column with `$`, compute `table()` of cylinder counts.
- **Problem 8:** Create a list `person <- list(first_name = "Raj", last_name = "Patel", age = 30)`. Access `first_name` with `$`. Then try `person$f` — observe partial matching. Show why this is dangerous.
- **Code blocks:** 2
- **Callouts:** [WARNING] — $ silently partial-matches: `person$f` returns `first_name`. Set `options(warnPartialMatchDollar = TRUE)` in scripts.
- **Inline exercise:** Try it: use `$` to extract the `Species` column from `iris` and count unique values with `length(unique(...))`.

#### H2-5: How do you combine [], [[]], and $ on data frames?
- **Theory:** Data frames are lists of columns. All three operators work but return different things. `df["col"]` → 1-column data frame. `df[["col"]]` / `df$col` → vector. `df[rows, cols]` → 2D subsetting.
- **Problem 9:** From `mtcars`, extract: (a) a data frame containing just `mpg` and `hp` using `[]`, (b) the `mpg` vector using `[[]]`, (c) rows where `cyl == 6` and columns `mpg`, `hp`, `wt` using `[rows, cols]`.
- **Problem 10:** Nested subsetting challenge: given `records <- list(team_a = list(scores = c(10, 20, 30), captain = "Lee"), team_b = list(scores = c(15, 25, 35), captain = "Kim"))`, extract team_b's second score in a single expression.
- **Code blocks:** 2
- **Callouts:** [KEY INSIGHT] — A data frame is just a named list of equal-length vectors. That's why `[[]]` and `$` work on it exactly like on a list.
- **Inline exercise:** Try it: extract the 3rd row and 2nd column of `mtcars` as a single value using `[row, col]`.

---

### Tail Sections

#### Practice Exercises (Capstone — 2 exercises)

**Exercise 1 (Medium):** Given `survey <- data.frame(id = 1:5, score = c(72, 88, 91, 65, 80), passed = c(FALSE, TRUE, TRUE, FALSE, TRUE))`, write a pipeline: (a) extract `score` as a vector with `[[]]`, (b) find which are > 80, (c) use that logical vector to subset the data frame rows with `[]`, (d) extract the `id` column from the result with `$`.

**Exercise 2 (Hard):** Given a nested list `dept <- list(hr = list(head = "Sara", staff = c("Mo", "Li")), eng = list(head = "Dev", staff = c("Jo", "Al", "Bo")))`, write one expression using `[[]]` and `[]` to extract the 2nd and 3rd staff members of the `eng` department. Then write another expression to get a named vector of all department heads.

#### Complete Example
End-to-end walkthrough: build a mini data frame, demonstrate all three operators on it, combine with logical subsetting to answer a real question ("which high-mileage cars have 6 cylinders?").

#### Summary
Table comparing [], [[]], $:
- Input types
- Output type
- Multiple elements?
- Programmatic names?
- Partial matching?
- Best use case

#### References (5-10)
1. Wickham, H. — Advanced R, 2nd Ed., Chapter 4: Subsetting
2. R Core Team — An Introduction to R, Section 2.7: Index vectors
3. R Documentation — Extract or Replace Parts of an Object (`?Extract`)
4. Wickham, H. & Grolemund, G. — R for Data Science, Chapter 20: Vectors
5. R FAQ — 7.1 What are the differences between `[`, `[[`, and `$`?

#### Continue Learning
1. R Vectors tutorial (parent post) — deep dive on creating, naming, and operating on vectors
2. R Lists Exercises — practice with list creation, nested access, and lapply
3. R Data Types — understand the type system behind subsetting behavior

## D. Diagram List
None (EX post — optional, skipped).

## E. Code Block Master List

| Block # | Demonstrates | Libs | Vars introduced | Vars used (from prior) |
|---|---|---|---|---|
| 1 | Problem 1: [] on named vector (positions + names) | — | scores | — |
| 2 | Problem 2: [] logical + negative indexing | — | high_scores, no_english | scores |
| 3 | Problem 3: [] on list returns sub-list | — | student, sub | — |
| 4 | Problem 4: [] vs [[]] on list | — | — | student |
| 5 | Problem 5: [[]] extract single element | — | config, port_val | — |
| 6 | Problem 6: [[]] on data frame column | — | mpg_vec | — |
| 7 | Problem 7: $ on data frame | — | — | — |
| 8 | Problem 8: $ partial matching danger | — | person | — |
| 9 | Problem 9: Combining operators on mtcars | — | subset_df, mpg_vector, cyl6 | — |
| 10 | Problem 10: Nested list subsetting | — | records, team_b_score2 | — |
| 11 | Inline ex 1: vector first+last | — | ex_cities | — |
| 12 | Inline ex 2: sub-list extract | — | ex_info | — |
| 13 | Inline ex 3: programmatic [[]] | — | ex_col | — |
| 14 | Inline ex 4: $ unique Species | — | ex_species | — |
| 15 | Inline ex 5: [row,col] single value | — | ex_val | — |
| 16 | Capstone 1: pipeline subsetting | — | survey, my_scores, my_above80, my_passed, my_ids | — |
| 17 | Capstone 2: nested list access | — | dept, my_staff, my_heads | — |
| 18 | Complete example: full workflow | — | cars_df | — |

No library() calls needed — all base R.

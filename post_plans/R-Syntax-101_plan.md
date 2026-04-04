# Plan: R-Syntax-101

## A. Frontmatter Fields

| Field | Value |
|---|---|
| `title` | R Syntax 101: Write Your First Working Script in 10 Minutes |
| `slug` | R-Syntax-101 |
| `description` | Learn R's core syntax: arithmetic operators, variable assignment with <-, comments, and how to write and run your first script — with every line explained. |
| `keywords` | R syntax, R basic syntax, R assignment operator, R comments, R arithmetic operators, first R script, R syntax tutorial, R basics, R operators, R variables |
| `auto_link_terms` | R syntax\|R basic syntax\|first R script\|R arithmetic operators\|R assignment operator |
| `auto_link_case_sensitive` | false |
| `mathjax` | false |
| `webr` | true |
| `date` | 2026-04-05 |
| `curriculum_id` | 1.1.4 |
| `post_type` | C |
| `sidebar_section` | Learn R |
| `sidebar_title` | R Syntax 101 |
| `sidebar_order` | 4 |

## B. Breadcrumb
`Home > Learn R > Fundamentals > R Syntax 101`

## C. Section Outline (14 H2 sections)

**Lead (definition for featured snippet):**
"R's basic syntax has three building blocks: arithmetic and logical operators for computation, the `<-` assignment operator for storing values in variables, and comments with `#` for annotating code. Master these three and you can read — and write — any R script."

**`## Introduction`** (2-3 paragraphs)
- Hook: Type `2 + 2` in R console, press Enter — you just ran R. Learning the full syntax is 10 minutes.
- What you'll learn: arithmetic, assignment, comments, variables, operators, vectorization
- Note: code runs in browser via WebR — no setup required

**Core sections (6):**

1. **`## Your First R Script in 60 Seconds`**
   - Run `2 + 2` — instant feedback
   - Run multiple lines
   - The R console as a playground
   - Code block 1: first calculation + output
   - Code block 2: multiple expressions

2. **`## Comments: Telling R to Ignore Text`**
   - `#` single-line comments
   - R has no native multi-line comment (workaround: `if(FALSE){...}`)
   - Good commenting style
   - Code block 3: comments and their purpose

3. **`## Variables and Assignment: The <- Arrow`**
   - Intuition: `<-` is an arrow pointing into the variable
   - Diagram: assignment operators visual
   - `<-` vs `=` (when to use which)
   - Reassigning variables
   - Code blocks 4-5: assignment basics + reassignment

4. **`## Arithmetic, Comparison, and Logical Operators`**
   - Full operator table
   - Precedence (PEMDAS + extensions)
   - Diagram: operator precedence
   - Code blocks 6-8: arithmetic, comparison, logical

5. **`## How R Names and Stores Values`**
   - Naming rules (allowed characters, reserved words)
   - Case sensitivity (`x` and `X` are different!)
   - `ls()` to list variables, `rm()` to remove
   - Code blocks 9-10: naming rules, environment management

6. **`## Why R Is Vectorized (And What That Means)`** ← differentiator
   - Intuition: R treats everything as a vector
   - `c()` to create vectors
   - Vectorized arithmetic (no loops needed)
   - Code blocks 11-12: vectors + vectorized ops

**Tail sections (7):**

7. **`## Common Mistakes and How to Fix Them`** (4 mistakes)
   - Using `=` where you meant `==` (silent bug)
   - Case sensitivity (treating `Data` and `data` as same)
   - Forgetting `c()` when creating vectors
   - Wrong operator precedence

8. **`## Practice Exercises`** (5 exercises, easy → hard)
   - Ex 1 (easy): Create 3 variables and calculate their sum
   - Ex 2 (easy-med): Compound interest calculation
   - Ex 3 (med): Compare two numbers with logical operators
   - Ex 4 (med): Vectorized BMI calculation for 5 people
   - Ex 5 (hard): Mini script combining everything

9. **`## Complete Example: A 10-Minute R Script`**
   - End-to-end script analyzing tips dataset
   - Uses comments, variables, arithmetic, vectors, conditions

10. **`## Summary`** (takeaways table)

11. **`## FAQ`** (5 Q&A)
    - Why use `<-` instead of `=`?
    - How do I write multi-line comments?
    - What's the difference between `print()` and `cat()`?
    - Why is R case-sensitive?
    - How do I run an R script file?

12. **`## References`** (7 sources)
    - R Core Team, *An Introduction to R*
    - Wickham, *Advanced R*, Chapter 2 (Names and values)
    - tidyverse style guide (assignment)
    - R Language Definition
    - R-bloggers assignment operators article
    - Wickham & Grolemund, *R for Data Science*, Chapter 4
    - stat.ethz.ch R manual (assignOps)

13. **`## What's Next?`**
    - R Data Types
    - R Vectors
    - R Control Flow

## D. Diagrams (3 pre-rendered)
- `R-Syntax-101-assignment-operators.webp` — placed in Section 3 (Variables and Assignment)
- `R-Syntax-101-operator-precedence.webp` — placed in Section 4 (Operators)
- `R-Syntax-101-script-execution.webp` — placed in Section 1 (Your First R Script)

## E. Code Block Master List (15 blocks)

| # | Section | Purpose | Variables introduced |
|---|---|---|---|
| 1 | Your First Script | Basic arithmetic `2 + 2`, operator demo | — |
| 2 | Your First Script | Multi-line expressions | — |
| 3 | Comments | Single-line + workaround for multi-line | — |
| 4 | Variables | First assignment with `<-` | `age`, `name`, `pi_value` |
| 5 | Variables | Reassignment | `counter` |
| 6 | Operators | Arithmetic operators table | `a`, `b` |
| 7 | Operators | Comparison operators | — |
| 8 | Operators | Logical operators + precedence | — |
| 9 | Naming | Case sensitivity demo | `Data`, `data` |
| 10 | Naming | ls() / rm() environment mgmt | — |
| 11 | Vectorization | Create vector with `c()` | `ages`, `names` |
| 12 | Vectorization | Vectorized arithmetic | `temperatures_c`, `temperatures_f` |
| 13 | Complete Example | End-to-end tips script | `bill`, `tip_rate`, `tip`, `total` |
| 14 | Exercises | Starter blocks (5) | — |
| 15 | Exercises | Solutions (5) | `my_*` prefix to avoid pollution |

## F. Callouts Planned (6 total, ~1 per 500 words)
- TIP: use `<-` shortcut (Alt + minus in RStudio)
- WARNING: `=` in function calls means argument, not assignment
- NOTE: R 4.1+ native pipe `|>`
- KEY INSIGHT: R is vectorized — no loops needed for most operations
- KEY INSIGHT: Variable names are case-sensitive
- TIP: use descriptive variable names (avoid `x`, `y` except in quick tests)

## Estimated word count: 3500-4500 words

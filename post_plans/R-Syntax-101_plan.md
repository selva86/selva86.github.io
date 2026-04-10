# Plan: R Syntax 101: Write Your First Working Script in 10 Minutes

## A. Frontmatter

| Field | Value |
|---|---|
| title | R Syntax 101: Write Your First Working Script in 10 Minutes |
| slug | R-Syntax-101 |
| description | Learn R's core syntax: arithmetic operators, variable assignment with <-, comments, and how to write and run your first script — with every line explained. |
| keywords | R syntax, R basic syntax, R arithmetic operators, R assignment operator, R comments, first R script, R programming basics, learn R |
| auto_link_terms | R syntax\|R basic syntax\|arithmetic operators in R\|assignment operator in R\|R comments |
| auto_link_case_sensitive | false |
| mathjax | false |
| webr | true |
| date | 2026-04-11 |
| curriculum_id | 1.1.4 |
| post_type | C |
| sidebar_section | R Fundamentals |
| sidebar_title | R Syntax 101 |
| sidebar_order | 1 |
| fr_parent | null |

## B. Breadcrumb (auto)
Home > Learn R > Fundamentals > R Syntax 101

## C. Outline

### Lead sentence
R's core syntax is refreshingly small. Learn five ideas — arithmetic operators, variable assignment with `<-`, hash comments, naming rules, and running a `.R` script — and you can read nearly any R code you'll encounter.

### First H2: "How do you run your first line of R code?"
Opening prose (~70 words): "The fastest way to understand R is to type an expression and watch R answer back. Open RStudio, click inside the console at the bottom, and every line you type is evaluated the moment you press Enter — no compile step, no build. R is an interactive calculator that happens to also run whole scripts. Here's a three-line example that shows arithmetic, assignment, and printing in one go."

Block 1 (payoff, no libraries needed):
```r
2 + 2
#> [1] 4

x <- 10        # store 10 in x
y <- x * 3     # use x to compute y
y
#> [1] 30
```
Interpretation: The `[1]` is R's row index (ignore it for now). Line 1 is pure arithmetic, line 2 assigns a value, line 3 uses that value, and line 4 recalls `y`. Those four operations are ~80% of what most R code does.

Inline Try-it 1: store your age in seconds in `ex_age_seconds`.

### Core H2s

**H2 #2: What arithmetic operators does R support?**
- Theory: 7 operators: `+ - * / ^ %% %/%`
- Block 2: all 7 in one demo with `#>` outputs
- Block 3: precedence — `2 + 3 * 4` vs `(2 + 3) * 4`
- Callout [TIP]: use parentheses for clarity
- Inline Try-it 2: rectangle area with parentheses

**H2 #3: How do you assign values to variables in R?**
- Theory: `<-` idiomatic, `=` works, `->` rare
- Diagram 1 (R-Syntax-101-assignment-directions.webp) placed here
- Block 4: `<-`, `=`, `->` all equivalent
- Block 5: reassigning, case sensitivity
- Callout [KEY INSIGHT]: why `<-` over `=`
- Callout [WARNING]: `=` vs `==`
- Inline Try-it 3: swap two variables

**H2 #4: How do comments make R code readable?**
- Theory: `#` comments to end of line
- Block 6: whole-line, trailing, commenting out code
- Callout [TIP]: no `/* */` — use `#` on every line
- Inline Try-it 4: add a trailing comment

**H2 #5: What are the rules for naming R variables?**
- Theory: letters/digits/`.`/`_`; start with letter or `.`; no reserved words; case-sensitive
- Block 7: valid vs invalid names
- Callout [NOTE]: snake_case preferred (tidyverse style)
- Inline Try-it 5: fix three invalid names

**H2 #6: How do you write and run a complete R script?**
- Theory: save `.R` file, run line-by-line (Ctrl+Enter) or whole file (Ctrl+Shift+Enter)
- Diagram 2 (R-Syntax-101-script-run-flow.webp) placed here
- Block 8: complete Celsius→Fahrenheit script with comments
- Callout [TIP]: Ctrl+Enter runs current line

### Practice Exercises (capstone — 3)
1. **BMI calculator** (medium) — combine assignment + arithmetic + comments
2. **Compound interest** (hard) — formula with `^`
3. **Rectangle analyzer** (hard) — area, perimeter, diagonal in one script

### Complete Example
Tip calculator: bill, tip %, number of people → per-person total. Full commented script.

### Summary
Table of the 5 syntax elements + one-line description + code sample. Diagram 3 (syntax-map.webp) as visual recap.

### References (7)
1. R Core Team — *An Introduction to R*
2. R Language Definition (CRAN)
3. Wickham, H. — *Advanced R*, 2nd ed., Ch. 2
4. Wickham & Grolemund — *R for Data Science*, 2e, Ch. 2
5. Tidyverse style guide — style.tidyverse.org
6. Posit — RStudio IDE documentation
7. R FAQ — CRAN

### What's Next
1. R Data Types
2. R Vectors
3. Writing R Functions

## D. Diagrams

| # | Filename | Figure N | Caption | Placed in H2 |
|---|---|---|---|---|
| 1 | R-Syntax-101-assignment-directions.webp | Figure 1 | Three ways to assign in R: `<-` (idiomatic), `=` (valid but reserved for function arguments), and `->` (rare right-to-left form). | How do you assign values to variables in R? |
| 2 | R-Syntax-101-script-run-flow.webp | Figure 2 | How R evaluates a script: write, save, run, see output — no separate compile step. | How do you write and run a complete R script? |
| 3 | R-Syntax-101-syntax-map.webp | Figure 3 | The five core R syntax elements covered in this post, at a glance. | Summary |

## E. Code Block Master List

| # | Demonstrates | Libs | Vars introduced | Vars used |
|---|---|---|---|---|
| 1 | Arithmetic + assignment payoff | — | x, y | — |
| 2 | All 7 arithmetic operators | — | — | — |
| 3 | Operator precedence | — | — | — |
| IE1 | Age in seconds | — | ex_age_seconds | — |
| IE2 | Rectangle area | — | ex_area | — |
| 4 | <- vs = vs -> | — | a, b, c | — |
| 5 | Reassignment + case sensitivity | — | counter, Counter | — |
| IE3 | Swap two variables | — | ex_a, ex_b, ex_temp | — |
| 6 | Comments demo | — | price, tax_rate | — |
| IE4 | Trailing comment | — | ex_miles, ex_km | — |
| 7 | Valid/invalid names | — | my_var, .hidden | — |
| IE5 | Fix invalid names | — | ex_user_name, ex_v2, ex_total | — |
| 8 | Celsius → Fahrenheit script | — | celsius, fahrenheit | — |
| CE | Tip calculator | — | bill, tip_pct, n_people, per_person | — |
| EX1 | BMI calculator | — | my_weight, my_height, my_bmi | — |
| EX2 | Compound interest | — | my_principal, my_rate, my_years, my_final | — |
| EX3 | Rectangle analyzer | — | my_width, my_height, my_area, my_perimeter, my_diagonal | — |

No libraries — all base R.

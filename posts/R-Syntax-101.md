---
title: "R Syntax 101: Write Your First Working Script in 10 Minutes"
slug: "R-Syntax-101"
description: "Learn R's core syntax: arithmetic operators, variable assignment with <-, comments, and how to write and run your first script — with every line explained."
keywords: "R syntax, R arithmetic operators, R assignment operator, R comments, R script, learn R basics, R first script, operator precedence R, R variables, R for beginners"
auto_link_terms: "R syntax|basic R syntax|R arithmetic operators|assignment operator in R|R comments|writing R scripts"
auto_link_case_sensitive: false
mathjax: false
webr: true
date: "2026-04-11"
curriculum_id: "1.1.4"
post_type: "C"
sidebar_section: "Learn R"
sidebar_title: "R Syntax 101"
sidebar_order: 5
---

# R Syntax 101: Write Your First Working Script in 10 Minutes

<p class="lead">R's syntax is the small set of rules that lets you do arithmetic, store values with <code>&lt;-</code>, write <code>#</code> comments, and save it all as a <code>.R</code> script. Master these four pieces and you can write real R code today.</p>

## How do you do arithmetic in R?

Arithmetic is the gentlest way into R. Type an expression, press Enter, and R prints the answer — no `print()` call, no setup, no boilerplate. Every calculator key you've ever used has a one-character equivalent in R, plus two extras Excel doesn't give you.

Here are all six arithmetic operators in a single block. Run it and read the `#>` output lines alongside each expression.

```r
# The six arithmetic operators in R
2 + 3        # addition
#> [1] 5

10 - 4       # subtraction
#> [1] 6

6 * 7        # multiplication
#> [1] 42

20 / 8       # real division
#> [1] 2.5

2 ^ 10       # exponent (2 to the power of 10)
#> [1] 1024

17 %% 5      # modulo — the remainder after dividing
#> [1] 2
```

Four of those are identical to a pocket calculator. The two worth a closer look are `^` and `%%`. `^` is R's power operator — `2 ^ 10` means "two raised to the tenth", giving `1024`. `%%` returns what's left over after division: `17 %% 5` equals `2` because `17 = 5 × 3 + 2`. Modulo is how you test whether a number is even (`x %% 2 == 0`) or divisible by anything else.

### What order does R apply operators in?

R follows the same PEMDAS rules your maths teacher drilled into you: parentheses first, then exponents, then multiplication and division, then addition and subtraction. Mix operators in one expression and the order matters.

```r
2 + 3 * 4      # multiplication happens before addition
#> [1] 14

(2 + 3) * 4    # parentheses force addition first
#> [1] 20

2 ^ 3 + 1      # exponent first, then add
#> [1] 9

2 ^ (3 + 1)    # parentheses flip it to 2^4
#> [1] 16
```

The first two lines give different answers from the same numbers. That's the whole reason parentheses exist. When you read code written by someone else, parentheses spell out the author's intent — there's no ambiguity left for R (or you) to misinterpret.

![R operator precedence from parentheses down to assignment](screenshots/R-Syntax-101-operator-precedence.webp)
*Figure 1: R evaluates operators in PEMDAS order — parentheses first, assignment last.*

[TIP]
**Parentheses are free — use them liberally.** Even when you're sure of the precedence, `(a * b) + (c * d)` reads in one glance where `a * b + c * d` makes the reader stop and translate. Clarity beats cleverness every time.

### What built-in math functions does R ship with?

Beyond the basic operators, R bundles every maths function you'd expect: square roots, logarithms, exponentials, rounding. You don't need to load a library — they're ready the moment R starts.

```r
sqrt(16)        # square root
#> [1] 4

log(100)        # natural log (base e)
#> [1] 4.60517

log10(100)      # log base 10
#> [1] 2

exp(1)          # e ^ 1 (Euler's number)
#> [1] 2.718282

abs(-7.5)       # absolute value
#> [1] 7.5

round(3.14159, digits = 2)   # round to 2 decimal places
#> [1] 3.14
```

Notice `round()` takes two arguments: the number and how many decimals to keep, separated by a comma. That comma pattern — function, open paren, arguments, close paren — is how every R function is called. You just saw the syntactic backbone of the entire language.

**Try it:** Write a one-liner that computes the value of $100 invested at 5% annual interest for 3 years, using the formula `principal * (1 + rate) ^ years`. The three inputs are already set up — you just need to write the expression.

```r
# Try it: compound interest
ex_principal <- 100
ex_rate <- 0.05
ex_years <- 3

# your code here
#> Expected: [1] 115.7625
```

<details>
<summary>Click to reveal solution</summary>

```r
ex_principal * (1 + ex_rate) ^ ex_years
#> [1] 115.7625
```

**Explanation:** Parentheses wrap `1 + ex_rate` so the addition happens before the exponent; otherwise `^` would bind tighter and break the formula.

</details>

## How do you assign values to variables in R?

A variable is a name you give to a value so you can reuse it. In R, you create one with the `<-` operator, which you should read out loud as "gets". Say `x <- 5` as "x gets five" and the mental model clicks instantly.

Here's how you'd compute body mass index (BMI) using named variables instead of raw numbers. Each assignment stores a value; the final line uses all three.

```r
weight_kg <- 72
height_m  <- 1.78
bmi <- weight_kg / (height_m ^ 2)

bmi
#> [1] 22.72188
```

Three things just happened. First, `weight_kg <- 72` created a box called `weight_kg` and put `72` inside it. Second, `height_m <- 1.78` did the same for height. Third, the BMI line pulled values out of both boxes, ran the calculation, and stored the answer in a new box called `bmi`. Typing a variable name on its own line (`bmi`) tells R to print its contents.

![Flow showing x gets 5 through evaluation, memory storage, and later reuse](screenshots/R-Syntax-101-assignment-flow.webp)
*Figure 2: The `<-` operator sends a value into a name.*

[TIP]
**Alt+- types `<-` for you in RStudio.** RStudio maps `Alt + Minus` (Option + Minus on Mac) to insert ` <- ` with spaces on both sides. Your pinky will thank you after the hundredth variable.

### What can you name a variable?

R variable names must start with a letter or a dot, and can contain letters, digits, underscores, and dots. They're case-sensitive — `Sales` and `sales` are two different variables. A few conventions make your code easier to read later.

```r
# Valid, readable names
sales_2026 <- 45000
mean_mpg   <- 20.09
customer_count <- 128

# Also valid, but less common
salesTotal <- 100     # camelCase
sales.total <- 100    # dot.style (legacy — avoid, dots have S3 meaning)

# INVALID — each of these would throw an error:
# 2026_sales <- 45000   # can't start with a digit
# sales-2026 <- 45000   # dash is subtraction, not part of a name
# my var <- 5           # spaces not allowed
```

Stick with `snake_case` (lowercase words joined by underscores) — it's the tidyverse convention and matches most modern R code you'll read online. Avoid single letters except in short formulas; `customer_count` is always clearer than `cc`.

[KEY INSIGHT]
**`<-` takes a snapshot, it doesn't create a link.** When you write `bmi <- weight_kg / (height_m^2)`, R calculates the number *once* and stores it. Change `weight_kg` afterwards and `bmi` stays put — it's a photograph of the answer, not a live formula. This is the opposite of how Excel cells work, and it trips up every spreadsheet migrant on day one.

### Can you reassign a variable?

Yes — and you do it constantly. Writing `counter <- counter + 1` means "take whatever is in `counter`, add one, and put the result back". R evaluates the right side first, then overwrites the left.

```r
counter <- 0
counter
#> [1] 0

counter <- counter + 1
counter
#> [1] 1

counter <- counter + 10
counter
#> [1] 11
```

Each assignment completely replaces the previous value. There's no history — `counter` now holds `11` and the `0` and `1` are gone unless you stored them somewhere else. This is how loops, counters, and running totals work in every imperative language, R included.

**Try it:** Create two variables `ex_a` and `ex_b` with any two numbers, then compute and print their product in a third variable called `ex_product`.

```r
# Try it: assign and multiply
ex_a <- 7
ex_b <- 6

# your code here — create ex_product
#> Expected: [1] 42
```

<details>
<summary>Click to reveal solution</summary>

```r
ex_product <- ex_a * ex_b
ex_product
#> [1] 42
```

**Explanation:** `ex_a * ex_b` evaluates to `42`, and `<-` stores that number in the new name `ex_product`.

</details>

## How do you add comments to R code?

A comment is a note for humans that R ignores. Every character after a `#` on a line is treated as plain text. Comments explain *why* the code exists — the *what* is already in the code itself.

```r
# This is a full-line comment — R skips it entirely

radius <- 5                    # inline comment after a statement
area <- pi * radius ^ 2        # pi is a built-in constant ≈ 3.14159
area
#> [1] 78.53982

# ----------------------------
# Section header: helpful for
# organising long scripts
# ----------------------------
```

Three patterns cover 99% of real-world use. Full-line comments explain the next block. Inline comments clarify a single line — especially non-obvious values or units. Section header comments (a row of dashes or `###`) visually divide a long script so you can scan it.

[NOTE]
**R has no block-comment syntax.** Unlike C's `/* ... */` or Python's triple-quoted strings, R only supports single-line `#`. To comment out ten lines, you prefix each one with `#`. In RStudio, select the lines and press `Ctrl+Shift+C` (`Cmd+Shift+C` on Mac) to toggle them all at once.

**Try it:** Below is a mini tax calculator. Comment out the first assignment so `ex_tax` uses the second `ex_price`. The expected output should be the tax on `200`, not `100`.

```r
# Try it: comment out one line so ex_price ends up as 200
ex_price <- 100
ex_price <- 200
ex_tax <- ex_price * 0.18
ex_tax
#> Expected: [1] 36
```

<details>
<summary>Click to reveal solution</summary>

```r
# ex_price <- 100       # commented out, so this line is skipped
ex_price <- 200
ex_tax <- ex_price * 0.18
ex_tax
#> [1] 36
```

**Explanation:** Once the first assignment is commented, only the second one runs, and `ex_price` ends up as `200`. The tax calculation then gives `36`.

</details>

## How do you write and run your first R script?

A script is a plain text file with a `.R` extension holding a sequence of R statements. R reads it from top to bottom, running each non-comment line in order. Scripts are how you save your work, share it, and rerun the same analysis tomorrow without retyping.

Here's a complete script that converts Celsius to Fahrenheit. Copy it into a new file called `temp_converter.R` in RStudio (File → New File → R Script) and save it.

```r
# temp_converter.R
# Convert a Celsius temperature to Fahrenheit.
# Author: You
# Date: 2026-04-11

celsius <- 25                          # input temperature
fahrenheit <- celsius * 9 / 5 + 32     # conversion formula

# Print both values
print(celsius)
#> [1] 25
print(fahrenheit)
#> [1] 77
```

Every line in that script falls into one of the categories you've already learned. The first four lines are comments — a header block that documents the purpose. Lines 6 and 7 are assignments using arithmetic. Lines 10 and 11 print the values. That's the whole language so far.

![Flowchart showing a script reading lines, skipping comments, executing others, and storing results](screenshots/R-Syntax-101-script-execution.webp)
*Figure 3: A script runs top-to-bottom, skipping comment lines.*

### What are the three ways to run a script?

Once the file is saved, you have three ways to execute it:

1. **RStudio Source button.** Open the file and click **Source** in the top-right of the editor (or press `Ctrl+Shift+S`). RStudio runs the whole script in the Console and prints any output.
2. **`source()` from the console.** Type `source("temp_converter.R")` at the R prompt. R reads the file and executes every line as if you'd typed them yourself.
3. **`Rscript` from the terminal.** Outside RStudio, open a terminal in the same folder and run `Rscript temp_converter.R`. This is how scheduled jobs, batch processing, and deployment pipelines run R code.

Use the Source button while you're developing, `source()` when you want a helper script available inside a bigger analysis, and `Rscript` when you're automating something that should run without a human in the loop.

[TIP]
**Start every script with a header comment.** Three lines — purpose, author, date — take five seconds to write and save Future-You hours of "what is this file?". A single extra line listing required packages or input files is worth ten more minutes later.

**Try it:** Extend the script to convert Fahrenheit back to Celsius. Use the inverse formula `(ex_f - 32) * 5 / 9` and store the result in `ex_c`.

```r
# Try it: convert Fahrenheit back to Celsius
ex_f <- 77

# your code here — compute ex_c from ex_f
#> Expected: [1] 25
```

<details>
<summary>Click to reveal solution</summary>

```r
ex_f <- 77
ex_c <- (ex_f - 32) * 5 / 9
ex_c
#> [1] 25
```

**Explanation:** The subtraction must happen before the multiplication, so the parentheses around `ex_f - 32` are essential. Drop them and you'd compute `77 - 32 * 5 / 9`, which is not what you want.

</details>

## What other operators will you use all the time?

Beyond arithmetic, two more operator families come up in almost every real script: comparison and logical operators. Comparison operators ask "is this true?" and return `TRUE` or `FALSE`. Logical operators combine those answers.

```r
# Comparison operators — all return TRUE or FALSE
celsius > 20       # greater than
#> [1] TRUE

celsius < 10       # less than
#> [1] FALSE

celsius >= 25      # greater than or equal
#> [1] TRUE

celsius == 25      # EQUAL — note the double equals
#> [1] TRUE

celsius != 30      # NOT equal
#> [1] TRUE
```

The critical one to notice is `==` (two equals signs), which tests equality. A single `=` is an assignment (like `<-`), not a test. Mixing them up is the single most common beginner mistake in every language — and R is no gentler.

[WARNING]
**`=` inside `if()` is a hard error in R, not a silent bug.** In some languages, `if (x = 5)` quietly assigns `5` to `x` and keeps going. In R, the parser raises a syntax error the moment it sees `=` where a comparison belongs. That's a feature — it turns a hidden bug into a loud, immediate failure. Always use `==` for equality tests.

### How do you combine conditions with logical operators?

Once you have TRUE/FALSE values, you combine them with `&` (AND), `|` (OR), and `!` (NOT). These follow normal boolean logic.

```r
celsius <- 25

# AND — both must be TRUE
celsius > 20 & celsius < 30
#> [1] TRUE

# OR — at least one must be TRUE
celsius < 10 | celsius > 20
#> [1] TRUE

# NOT — flips TRUE to FALSE and vice versa
!(celsius == 25)
#> [1] FALSE
```

These three operators are the whole vocabulary of conditional logic in R. "Between 20 and 30" is two comparisons joined by `&`. "Outside normal range" is two comparisons joined by `|`. Any filter you'll ever write — in base R, in `dplyr`, or in a model formula — is built out of these three symbols.

**Try it:** Check whether `ex_score` is strictly between 10 and 20. The expression should return `TRUE` for `15` and `FALSE` for `25`.

```r
# Try it: range check
ex_score <- 15

# your code here — return TRUE if 10 < ex_score < 20
#> Expected: [1] TRUE
```

<details>
<summary>Click to reveal solution</summary>

```r
ex_score <- 15
ex_score > 10 & ex_score < 20
#> [1] TRUE
```

**Explanation:** R has no chained comparison like Python's `10 < x < 20`. You must write two separate comparisons and join them with `&`.

</details>

## Practice Exercises

These capstone exercises combine everything from the tutorial. Each one is solvable with just arithmetic, assignment, comments, and comparison operators. Use `my_`-prefixed variable names so they don't overwrite anything from earlier blocks.

### Exercise 1: BMI calculator with category

Compute the BMI of a person weighing 80 kg who is 1.80 m tall, then decide which category it falls into: `"Under"` if BMI < 18.5, `"Normal"` if 18.5 ≤ BMI < 25, or `"Over"` if BMI ≥ 25. Hint: use three comparisons and print whichever one is TRUE.

```r
# Exercise 1: BMI + category
# Hint: compute my_bmi first, then use comparison operators

my_weight <- 80
my_height <- 1.80

# Write your code below:

```

<details>
<summary>Click to reveal solution</summary>

```r
my_weight <- 80
my_height <- 1.80
my_bmi <- my_weight / (my_height ^ 2)
my_bmi
#> [1] 24.69136

# Category checks — exactly one will be TRUE
my_bmi < 18.5                          # "Under"
#> [1] FALSE
my_bmi >= 18.5 & my_bmi < 25           # "Normal"
#> [1] TRUE
my_bmi >= 25                           # "Over"
#> [1] FALSE
```

**Explanation:** The BMI of `24.69` falls inside the `[18.5, 25)` range, so the middle comparison returns `TRUE`. Once you learn `if/else` in a later tutorial, you can turn those three checks into a single branching statement.

</details>

### Exercise 2: Restaurant tip and split calculator

Three friends share a restaurant bill of $84.50. They want to leave an 18% tip and split the total equally. Compute the total (bill + tip) and the per-person share rounded to 2 decimal places. Store the share in `my_share`.

```r
# Exercise 2: tip + split
# Hint: compute my_total first (bill * (1 + tip_pct)), then divide by people
# Use round(x, digits = 2) for the final answer

my_bill    <- 84.50
my_tip_pct <- 0.18
my_people  <- 3

# Write your code below:

```

<details>
<summary>Click to reveal solution</summary>

```r
my_bill    <- 84.50
my_tip_pct <- 0.18
my_people  <- 3

my_total <- my_bill * (1 + my_tip_pct)
my_total
#> [1] 99.71

my_share <- round(my_total / my_people, digits = 2)
my_share
#> [1] 33.24
```

**Explanation:** Parentheses around `1 + my_tip_pct` are essential — without them, R computes `my_bill * 1 + my_tip_pct`, which adds the decimal tip percent after the full bill and gives a nonsense answer. Always parenthesise when mixing addition with multiplication.

</details>

## Complete Example: A Monthly Budget Script

Here's everything you've learned in one short script. It computes monthly disposable income from a handful of inputs, uses comments for structure, and prints a clear result.

```r
# --------------------------------------------
# monthly_budget.R
# Quick disposable-income calculator.
# Inputs at the top, computation in the middle,
# result at the bottom — the classic script shape.
# --------------------------------------------

# --- Inputs ---
income    <- 4500      # monthly take-home, in dollars
rent      <- 1400
groceries <- 450
transport <- 180

# --- Calculation ---
total_expenses <- rent + groceries + transport
savings        <- income - total_expenses

# --- Output ---
total_expenses
#> [1] 2030
savings
#> [1] 2470
```

Read the script top to bottom and you can trace every rule from this tutorial. The header block is comments that document the purpose. The `--- Inputs ---`, `--- Calculation ---`, and `--- Output ---` dividers are also just comments — pure visual sugar. Every variable is created with `<-`. The arithmetic in `total_expenses` and `savings` uses plain `+` and `-`. Nothing exotic is happening, and that's exactly the point: 90% of real R code is this shape, scaled up.

## Summary

![Mind map showing Arithmetic, Assignment, Comments, and First Script branching from R Syntax](screenshots/R-Syntax-101-syntax-mindmap.webp)
*Figure 4: The four building blocks of R syntax in one view.*

Four rules, one language:

| Concept | Syntax | Purpose |
|---|---|---|
| Arithmetic | `+` `-` `*` `/` `^` `%%` | Calculate numbers, respecting PEMDAS precedence. |
| Assignment | `x <- value` | Give a value a name you can reuse. |
| Comments | `# text` | Leave notes for humans; R ignores them. |
| Scripts | `file.R` + Source | Save a sequence of statements as a file and rerun anytime. |
| Comparison | `<` `>` `<=` `>=` `==` `!=` | Ask yes/no questions; return `TRUE` or `FALSE`. |
| Logical | `&` `|` `!` | Combine or negate comparisons. |

Master these and you've already internalised the shape of every R program you'll ever read. Data types, vectors, functions, and packages are the vocabulary built on top — but the grammar doesn't get much more complicated than what you just learned.

## References

1. R Core Team — *An Introduction to R*, §1.8 Simple manipulations: numbers and vectors. [Link](https://cran.r-project.org/doc/manuals/r-release/R-intro.html#Simple-manipulations-numbers-and-vectors)
2. Wickham, H. — *Advanced R*, 2nd Edition. Chapter 2: Names and values. [Link](https://adv-r.hadley.nz/names-values.html)
3. Wickham, H. — *The tidyverse style guide*, Syntax chapter. [Link](https://style.tidyverse.org/syntax.html)
4. R Core Team — *R Language Definition*, §3 Evaluation of expressions. [Link](https://cran.r-project.org/doc/manuals/r-release/R-lang.html#Evaluation-of-expressions)
5. Paradis, E. — *R for Beginners* (CRAN contributed docs). [Link](https://cran.r-project.org/doc/contrib/Paradis-rdebuts_en.pdf)

## What's Next?

1. **[R Data Types](R-Data-Types.html)** — numbers, text, TRUE/FALSE, and the type system living inside every variable you just created.
2. **[R Vectors](R-Vectors.html)** — how a single value becomes many. Vectors are R's fundamental data structure, and every variable you've written so far is secretly a length-1 vector.
3. **[Install R and RStudio](Install-R-and-RStudio-2026.html)** — if you haven't set up your environment yet, come back here after.

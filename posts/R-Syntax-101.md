---
title: "R Syntax 101: Write Your First Working Script in 10 Minutes"
slug: "R-Syntax-101"
description: "Learn R's core syntax: arithmetic operators, variable assignment with <-, comments, and how to write and run your first script — with every line explained."
keywords: "R syntax, R basic syntax, R assignment operator, R comments, R arithmetic operators, first R script, R syntax tutorial, R basics, R operators, R variables"
mathjax: false
webr: true
date: "2026-04-05"
curriculum_id: "1.1.4"
post_type: "C"
auto_link_terms: "R syntax|R basic syntax|first R script|R arithmetic operators|R assignment operator"
auto_link_case_sensitive: false
sidebar_section: "Learn R"
sidebar_title: "R Syntax 101"
sidebar_order: 4
---


# R Syntax 101: Write Your First Working Script in 10 Minutes

<p class="lead">R's basic syntax has three building blocks: arithmetic and logical operators for computation, the <code>&lt;-</code> assignment operator for storing values in variables, and comments with <code>#</code> for annotating code. Master these three and you can read — and write — any R script.</p>

## Introduction

Type `2 + 2` into R and press Enter. R answers `4`. That's it — you just ran R code. The entire basic syntax of R fits in about 10 minutes of focused learning.

This tutorial walks you through every piece: how to run your first calculation, store values in variables, write comments, use operators, and chain everything together into a real script. Every code block below is live — click **Run** (or press **Ctrl+Enter**) to execute it directly in your browser. No installation needed.

By the end, you'll read any R script without confusion and write your own from scratch.

## How do you write and run R expressions?

R treats its console as a giant calculator. Every expression you type gets evaluated and the result prints immediately. This is the fastest way to learn — skip the theory, start typing.

Let's start with the simplest possible R program: basic arithmetic. The code below shows what R does when you ask it to compute.

```r
# Addition
2 + 2
#> [1] 4

# R handles all standard math
15 / 3
#> [1] 5

# And exponents
3 ^ 4
#> [1] 81
```

R printed three results: `4`, `5`, `81`. The `[1]` before each number is R telling you "this is the first element of the result". You'll see `[1]` everywhere in R output — it's not an error, it's a row index. We'll explain why later when we cover vectors.

A script is just a sequence of expressions. R evaluates them top to bottom, one line at a time. Here's how R processes a typical script:

![How R Executes a Script](screenshots/R-Syntax-101-script-execution.webp)
*Figure 1: R reads scripts line by line, skipping comments and executing each expression in order.*

Let's run a small script with several expressions back-to-back. Each line does one thing, and R prints each result.

```r
# A three-line script
10 + 5
20 * 3
100 - 50
#> [1] 15
#> [1] 60
#> [1] 50
```

R evaluated all three lines. When you write a `.R` script file, you can run the whole file at once — R processes each line the same way the interactive console does.

[TIP]
**Try changing the numbers above and click Run again.** R will re-execute with your new values. This is the fastest way to learn syntax — experiment, break things, fix them.

## How do you write comments in R?

Comments are notes you leave for yourself (or future readers) explaining what the code does. R ignores them completely — they exist only for humans. Use them liberally.

R uses the `#` character for comments. Everything from `#` to the end of the line is a comment.

```r
# This is a comment. R skips it entirely.
x <- 42  # You can also put a comment after code on the same line

# Comments are free. Use them to explain WHY, not WHAT.
bill <- 50       # dinner bill in dollars
tip_rate <- 0.18 # generous tip at 18%
```

R skipped every `#` line and every text after `#`. When you run this, you won't see the comments in the output — only the code executes. Good comments explain *why* you made a choice, not what the code literally does.

R has no built-in multi-line comment syntax. If you need to comment out many lines, either prefix each with `#` or wrap the block in `if(FALSE){...}`.

```r
# Multi-line style 1: prefix each line with #
# This block is entirely ignored.
# You can write paragraphs of explanation here.
# Most editors let you toggle comments with Ctrl+Shift+C.

# Multi-line style 2: if(FALSE) trick
if (FALSE) {
  "This code never runs."
  "R parses it but never executes it."
  "Handy for temporarily disabling big blocks."
}
```

The `if(FALSE)` wrapper is technically valid R code that R parses but never executes, because the condition is always false. It's a common workaround when you need to disable a large chunk of code temporarily.

## How do you assign values to variables in R?

A variable is a named storage location for a value. Once you store something in a variable, you can use that name anywhere in your code to retrieve the value. This is how you avoid retyping the same number fifty times.

R uses the **assignment operator** `<-` (less-than sign followed by hyphen) to store a value in a variable. Read it as "gets" or imagine it as an arrow pointing from the value into the variable name.

```r
# Store values in variables
age <- 30
name <- "Alice"
pi_value <- 3.14159

# Retrieve them by name
age
#> [1] 30
name
#> [1] "Alice"
pi_value
#> [1] 3.14159
```

Three variables were created: `age` holds the number 30, `name` holds the text "Alice", and `pi_value` holds 3.14159. Typing a variable name by itself prints its value. In programming terms, you wrote three *assignments* and three *print* statements.

R supports several assignment operators, but `<-` is the standard. Here's a visual comparison:

![R Assignment Operators Compared](screenshots/R-Syntax-101-assignment-operators.webp)
*Figure 2: R's four assignment operators. Use `<-` in 99% of cases.*

Most R code uses `<-`. The `=` sign also works at the top level but causes confusion inside function calls. The right-arrow `->` works but is rarely used. The double-arrow `<<-` modifies variables in a parent environment — advanced and usually unnecessary.

[WARNING]
**Inside function calls, the equals sign means argument binding — not assignment.** When you write `mean(x = c(1,2,3))`, the `=` tells R "the argument named x gets this value". Using `=` for assignment works outside function calls but creates confusion inside them. Stick with `<-` for assignment, always.

You can reassign a variable at any time. The new value simply replaces the old one.

```r
# Create a counter
counter <- 0
counter
#> [1] 0

# Update it
counter <- counter + 1
counter
#> [1] 1

# Update it again
counter <- counter * 10
counter
#> [1] 10
```

R took the current value of `counter` (0), added 1 to get 1, then stored 1 back into `counter`. The next line took `counter` (now 1), multiplied by 10, and stored 10. This pattern — read, compute, store back — is the foundation of every program you'll ever write.

[TIP]
**In RStudio, press Alt + minus to type the assignment arrow instantly.** The shortcut types ` <- ` with spaces around it. This tiny habit saves hours over a career.

## What operators does R use for math, comparison, and logic?

R has three families of operators: arithmetic for math, comparison for testing values, and logical for combining conditions. Each family has a clear purpose and predictable behavior.

The arithmetic operators work the way you expect from a calculator. Here's the full set:

```r
a <- 17
b <- 5

# Basic arithmetic
a + b    # addition
#> [1] 22
a - b    # subtraction
#> [1] 12
a * b    # multiplication
#> [1] 85
a / b    # division
#> [1] 3.4
a ^ b    # exponentiation (17 to the 5th power)
#> [1] 1419857
a %% b   # modulo (remainder after division)
#> [1] 2
a %/% b  # integer division (quotient, discarding remainder)
#> [1] 3
```

The modulo operator `%%` returns what's left over after dividing. `17 %% 5` is 2 because 17 = 5×3 + 2. The integer division operator `%/%` returns the whole-number quotient only, discarding the remainder. These two are essential for working with cycles, calendars, and indexes.

Comparison operators test whether values meet a condition. They always return `TRUE` or `FALSE`.

```r
# Comparison always returns TRUE or FALSE
5 > 3         # greater than
#> [1] TRUE
5 < 3         # less than
#> [1] FALSE
5 == 5        # equality (note: TWO equals signs)
#> [1] TRUE
5 != 3        # not equal
#> [1] TRUE
5 >= 5        # greater than or equal
#> [1] TRUE
```

Comparisons are the building blocks of conditional logic. The single most important thing to remember: use `==` (two equals signs) to test equality. A single `=` means assignment, which does something completely different.

Logical operators combine `TRUE` and `FALSE` values into more complex conditions.

```r
# Logical AND, OR, NOT
TRUE & TRUE          # AND: both must be TRUE
#> [1] TRUE
TRUE & FALSE
#> [1] FALSE
TRUE | FALSE         # OR: at least one must be TRUE
#> [1] TRUE
!TRUE                # NOT: flip the value
#> [1] FALSE

# Combine with comparisons
age <- 25
(age > 18) & (age < 65)   # adult and not retired
#> [1] TRUE
```

The `&` operator returns `TRUE` only when both sides are `TRUE`. The `|` operator returns `TRUE` when at least one side is `TRUE`. The `!` operator flips a logical value. Combined with comparison operators, these let you express rules like "adult and not retired" or "morning or weekend".

When you mix operators in one expression, R follows **precedence rules** — which operator runs first. Parentheses override everything; otherwise, exponents come first, then multiplication/division, then addition/subtraction.

![R Operator Precedence](screenshots/R-Syntax-101-operator-precedence.webp)
*Figure 3: R operator precedence from highest to lowest. When in doubt, add parentheses.*

Here's precedence in action:

```r
# Without parentheses: exponent first, then multiply, then add
2 + 3 * 4 ^ 2
#> [1] 50

# R computed: 4^2 = 16, then 3*16 = 48, then 2+48 = 50

# With parentheses: override the order
(2 + 3) * 4 ^ 2
#> [1] 80

# Now: 2+3 = 5, then 4^2 = 16, then 5*16 = 80
```

The first expression gave 50 because R respected precedence: exponent, multiplication, addition. The second expression gave 80 because the parentheses forced addition first. When you're unsure about precedence, add parentheses — they cost nothing and make your intent explicit.

## How does R name and store variables?

R has strict rules for variable names and a few quirks worth knowing upfront. Break any of these rules and R will throw an error or, worse, silently create a new variable.

Variable names must start with a letter or a dot, and can contain letters, numbers, dots, and underscores. They cannot start with a number. R is **case-sensitive**, meaning `age` and `Age` are two different variables.

```r
# Valid names
my_age <- 30
first_name <- "Alice"
data2 <- c(1, 2, 3)

# R is case-sensitive — these are THREE different variables
val <- 10
Val <- 20
VAL <- 30

cat("val =", val, "\n")
#> val = 10
cat("Val =", Val, "\n")
#> Val = 20
cat("VAL =", VAL, "\n")
#> VAL = 30
```

R treats `val`, `Val`, and `VAL` as completely unrelated names. This trips up every beginner at least once — you name something `Data`, then later type `data`, and R complains it can't find `data`. Always double-check capitalization.

[KEY INSIGHT]
**Variable names are case-sensitive — Data and data are different objects.** This is the single most common source of "object not found" errors for R beginners. When R complains a variable doesn't exist, check the capitalization first.

R stores your variables in an **environment**. You can inspect what's in there with `ls()` and remove variables with `rm()`.

```r
# List all variables in the current environment
ls()
# (shows every variable defined so far in this session)

# Remove a specific variable
rm(VAL)
exists("VAL")
#> [1] FALSE

# Check another variable still exists
exists("val")
#> [1] TRUE
```

The `ls()` function returns every variable name currently in memory. After `rm(VAL)`, the variable was gone. Use `ls()` when you forget what's defined, and `rm()` to tidy up. To wipe everything at once, use `rm(list = ls())` — but be careful, there's no undo.

## Why is R a vectorized language?

Most programming languages treat single values as the default and force you to write loops for collections. R flips this: **vectors are the default**, and single values are just vectors of length one. This changes how you write R code.

A **vector** is a sequence of values of the same type. You create one with the `c()` function (short for "combine").

```r
# Create vectors with c()
ages <- c(25, 30, 35, 40, 45)
names <- c("Alice", "Bob", "Carol", "Dave", "Eve")

ages
#> [1] 25 30 35 40 45
names
#> [1] "Alice" "Bob"   "Carol" "Dave"  "Eve"
```

`ages` holds five numbers; `names` holds five strings. When R prints them, it shows `[1]` at the start — the index of the first element. For longer vectors, you'll see `[6]`, `[11]` marking each new row.

Here's the magic: arithmetic operators apply element-by-element to entire vectors. You don't need a loop.

```r
# Vectorized arithmetic — no loop needed!
temperatures_c <- c(0, 10, 20, 30, 100)

# Convert all 5 temperatures to Fahrenheit in one line
temperatures_f <- temperatures_c * 9/5 + 32
temperatures_f
#> [1]  32  50  68  86 212
```

R applied the formula `* 9/5 + 32` to every element of `temperatures_c` at once. The result is a new vector of the same length. This is called **vectorization** — it's faster than loops and makes R code shorter and more readable.

[KEY INSIGHT]
**R is vectorized: operators apply element-by-element without loops.** This is R's signature design choice. When you see code like `x * 2 + 1` in R, it works whether x is a single number or a million-element vector.

Vectorization works with comparison and logical operators too.

```r
# Which temperatures are above freezing?
above_freezing <- temperatures_c > 0
above_freezing
#> [1] FALSE  TRUE  TRUE  TRUE  TRUE

# Count how many
sum(above_freezing)
#> [1] 4
```

The comparison `temperatures_c > 0` produced a logical vector: `FALSE` for the 0, `TRUE` for the other four. The `sum()` function counted the `TRUE` values by treating them as 1s. This pattern — compare, then count or filter — is the foundation of every R data analysis you'll ever write.

## Common Mistakes and How to Fix Them

These four mistakes trip up almost every R beginner. Recognizing them early saves hours of debugging later.

### Mistake 1: Using `=` where you meant `==`

❌ **Wrong:**
```r
my_x <- 10
if (my_x = 10) {
  print("x is ten")
}
```

**Why it is wrong:** A single `=` is assignment, not comparison. Inside `if()`, R expects a condition. Writing `my_x = 10` inside `if()` throws an error in R (unlike some languages where it silently assigns).

✅ **Correct:**
```r
my_x <- 10
if (my_x == 10) {
  print("x is ten")
}
#> [1] "x is ten"
```

### Mistake 2: Case sensitivity trap

❌ **Wrong:**
```r
MyData <- c(1, 2, 3)
mean(mydata)
# Error: object 'mydata' not found
```

**Why it is wrong:** R is case-sensitive. `MyData` and `mydata` are different variables. The `mean(mydata)` call looks for a variable named `mydata` (lowercase), which doesn't exist.

✅ **Correct:**
```r
my_data <- c(1, 2, 3)
mean(my_data)
#> [1] 2
```

### Mistake 3: Forgetting `c()` when creating vectors

❌ **Wrong:**
```r
my_ages <- 25, 30, 35
# Error: unexpected ',' in "my_ages <- 25,"
```

**Why it is wrong:** R doesn't recognize comma-separated values as a vector. You must wrap them in `c()` to combine them into one.

✅ **Correct:**
```r
my_ages <- c(25, 30, 35)
my_ages
#> [1] 25 30 35
```

### Mistake 4: Wrong operator precedence

❌ **Wrong:**
```r
# Intent: average of 10 and 20
my_avg <- 10 + 20 / 2
my_avg
#> [1] 20
```

**Why it is wrong:** Division runs before addition, so R computed `10 + (20/2) = 10 + 10 = 20` — not the average. The average should be 15.

✅ **Correct:**
```r
my_avg <- (10 + 20) / 2
my_avg
#> [1] 15
```

## Practice Exercises

These five exercises build from basic assignment to a complete script. Use variable names prefixed with `my_` so your code doesn't overwrite tutorial variables.

### Exercise 1: Three Variables

Create three variables: `my_name_str` (your name), `my_age_num` (your age), `my_city_str` (your city). Print all three.

```r
# Exercise: create 3 variables with <-
# Hint: strings need quotes, numbers don't

# Write your code below:

```

<details>
<summary>Click to reveal solution</summary>

```r
my_name_str <- "Alex"
my_age_num <- 28
my_city_str <- "Mumbai"

my_name_str
#> [1] "Alex"
my_age_num
#> [1] 28
my_city_str
#> [1] "Mumbai"
```

**Explanation:** Each `<-` stores a value under a variable name. Strings need double quotes; numbers don't. Typing the name on its own line prints the value.

</details>

### Exercise 2: Compound Interest

Calculate the final balance after 3 years of 5% annual compound interest on $1000. Formula: `final = principal * (1 + rate) ^ years`.

```r
# Exercise: calculate compound interest
# Hint: use ^ for exponentiation, use parentheses for order of operations

my_principal <- 1000
my_rate <- 0.05
my_years <- 3

# Write your formula below:

```

<details>
<summary>Click to reveal solution</summary>

```r
my_principal <- 1000
my_rate <- 0.05
my_years <- 3

my_final <- my_principal * (1 + my_rate) ^ my_years
my_final
#> [1] 1157.625
```

**Explanation:** Wrapping `1 + my_rate` in parentheses forces addition before exponentiation. Without them, R would compute `my_rate ^ my_years` first — a completely different answer.

</details>

### Exercise 3: Logical Check

Check whether a person's age qualifies them as a voting adult (≥18) AND a non-senior (<65). Use logical operators.

```r
# Exercise: check adult AND non-senior
# Hint: use & to combine two comparisons

my_person_age <- 42

# Write the logical expression below:

```

<details>
<summary>Click to reveal solution</summary>

```r
my_person_age <- 42

my_is_voting_adult <- (my_person_age >= 18) & (my_person_age < 65)
my_is_voting_adult
#> [1] TRUE
```

**Explanation:** Each comparison returns `TRUE` or `FALSE`. The `&` operator returns `TRUE` only when both sides are `TRUE`. At age 42, both conditions hold.

</details>

### Exercise 4: Vectorized BMI

You have heights (cm) and weights (kg) for 5 people. Calculate BMI for all 5 in one line using vectorization. BMI formula: `weight / (height/100)^2`.

```r
# Exercise: vectorized BMI calculation
# Hint: R applies operators element-by-element to vectors

my_heights <- c(170, 165, 180, 155, 175)
my_weights <- c(65, 58, 82, 52, 70)

# Write the BMI formula below:

```

<details>
<summary>Click to reveal solution</summary>

```r
my_heights <- c(170, 165, 180, 155, 175)
my_weights <- c(65, 58, 82, 52, 70)

my_bmi <- my_weights / (my_heights/100)^2
my_bmi
#> [1] 22.49135 21.30395 25.30864 21.64412 22.85714
```

**Explanation:** R divides each height by 100, squares the result element-by-element, then divides each weight by the matching squared height. All 5 BMIs computed in one vectorized operation — no loop needed.

</details>

### Exercise 5: Mini Script

Write a short script that: (a) defines `my_bill_amount` = 85.50, (b) defines a tip rate of 20%, (c) calculates the tip, (d) calculates the total, (e) prints a formatted summary using `cat()`.

```r
# Exercise: a complete mini-script
# Hint: use cat() to print multiple values with newlines \n

# Write your code below:

```

<details>
<summary>Click to reveal solution</summary>

```r
my_bill_amount <- 85.50
my_tip_rate <- 0.20
my_tip_value <- my_bill_amount * my_tip_rate
my_total_value <- my_bill_amount + my_tip_value

cat("Bill:   $", my_bill_amount, "\n",
    "Tip:    $", my_tip_value, "\n",
    "Total:  $", my_total_value, "\n", sep = "")
#> Bill:   $85.5
#> Tip:    $17.1
#> Total:  $102.6
```

**Explanation:** Each `<-` creates a variable. Arithmetic on those variables produces new values. `cat()` prints multiple items separated by the `sep` argument — here `""` (empty string) joins them directly, and `\n` adds line breaks.

</details>

## Complete Example: A 10-Minute R Script

Here's a complete, realistic R script that combines everything you've learned: variables, arithmetic, comparisons, vectors, and vectorized operations. It analyzes a simple restaurant bill dataset.

```r
# --- Restaurant Tip Analyzer ---
# Goal: analyze 5 bills and recommend tip amounts

# Step 1: Raw data (parallel vectors)
bills <- c(45.00, 72.50, 28.75, 95.00, 60.25)
party_sizes <- c(2, 4, 1, 5, 3)

# Step 2: Calculate base tip (18% of bill)
base_tips <- bills * 0.18

# Step 3: Extra tip for large parties (5% for parties of 4+)
large_party <- party_sizes >= 4
large_party
#> [1] FALSE  TRUE FALSE  TRUE FALSE

# Step 4: Additional tip vector (5% of bill for large parties, 0% otherwise)
extra_tips <- bills * 0.05 * large_party
extra_tips
#> [1] 0.0000 3.6250 0.0000 4.7500 0.0000

# Step 5: Final tips and totals
total_tips <- base_tips + extra_tips
total_bills <- bills + total_tips

# Step 6: Summary
cat("Tips by table:", total_tips, "\n")
#> Tips by table: 8.1 16.675 5.175 21.85 10.845

cat("Totals by table:", total_bills, "\n")
#> Totals by table: 53.1 89.175 33.925 116.85 71.095

cat("Average tip: $", round(mean(total_tips), 2), "\n", sep = "")
#> Average tip: $12.53
```

This 6-step script demonstrates R's full basic syntax in action. Notice how every line does one clear thing: create data, apply arithmetic vectorwise, test conditions, combine results, summarize. When `large_party` was multiplied by `bills * 0.05`, R treated `TRUE` as 1 and `FALSE` as 0 — so large parties got the extra 5%, others got zero. The whole script runs in milliseconds because R is vectorized end-to-end.

[NOTE]
**R 4.1+ introduced the native pipe |> operator.** It lets you chain operations readably, e.g., `bills |> mean() |> round(2)`. You'll see `|>` (and the older magrittr `%>%`) throughout R tutorials. We cover the pipe in detail in the dplyr tutorials.

## Summary

| Concept | Syntax | Example |
|---|---|---|
| Arithmetic | `+ - * / ^ %% %/%` | `17 %% 5` → `2` |
| Comparison | `== != < > <= >=` | `5 == 5` → `TRUE` |
| Logical | `& \| !` | `TRUE & FALSE` → `FALSE` |
| Assignment | `<-` (preferred) | `x <- 42` |
| Comment | `#` | `# this is a comment` |
| Vector | `c(...)` | `c(1, 2, 3)` |
| List variables | `ls()` | `ls()` |
| Remove variable | `rm(name)` | `rm(x)` |
| Print with format | `cat(...)` | `cat("x =", x, "\n")` |

The three rules that matter most: use `<-` for assignment, wrap multiple values in `c()` to make a vector, and remember that operators apply element-by-element to vectors automatically.

## FAQ

### Why use `<-` instead of `=` for assignment?

Historically, R inherited `<-` from the S language, which used a dedicated arrow key. Today, `<-` is preferred because `=` has a second meaning inside function calls — argument binding. Writing `f(x = 5)` passes 5 to the argument named `x`. Writing `f(x <- 5)` assigns 5 to `x` in the outer scope AND passes the value 5 to the first positional argument. Using `<-` avoids ambiguity.

### How do I write multi-line comments in R?

R has no native multi-line comment syntax. Use one of two workarounds: (1) prefix every line with `#`, or (2) wrap the block in `if(FALSE){...}`. Most editors (RStudio, VS Code) have a "toggle comment" shortcut — select lines, press Ctrl+Shift+C — that comments all lines at once.

### What's the difference between `print()` and `cat()`?

`print()` shows values with R's quotation and formatting (strings get quotes, vectors get `[1]` indices). `cat()` concatenates and prints without formatting — useful for building human-readable output. Use `print()` for inspecting values, `cat()` for user-facing messages. Example: `print("hello")` gives `[1] "hello"`; `cat("hello")` gives `hello`.

### Why is R case-sensitive?

R follows the C-family tradition where identifiers distinguish case. It's a design choice: case sensitivity allows conventions like `x` for a variable and `X` for a matrix without naming collisions. The tradeoff is beginner confusion — when R complains "object not found", the first thing to check is capitalization.

### How do I save and run a .R script file?

Three ways. From RStudio: open the `.R` file, press Ctrl+Shift+S (or click "Source"). From the command line: `Rscript my_script.R`. From inside R: `source("my_script.R")`. All three run every line top to bottom. For interactive use, you can also run single lines with Ctrl+Enter in RStudio.

## References

1. R Core Team — *An Introduction to R*, Chapter 1 (Introduction and preliminaries). [Link](https://cran.r-project.org/doc/manuals/r-release/R-intro.html)
2. Wickham, H. — *Advanced R*, 2nd Edition, Chapter 2 (Names and values). CRC Press (2019). [Link](https://adv-r.hadley.nz/names-values.html)
3. tidyverse style guide — Assignment section. [Link](https://style.tidyverse.org/syntax.html#assignment)
4. R Language Definition — Expressions and evaluation. [Link](https://cran.r-project.org/doc/manuals/r-release/R-lang.html)
5. R manual — `assignOps` reference (stat.ethz.ch). [Link](https://stat.ethz.ch/R-manual/R-devel/library/base/html/assignOps.html)
6. Wickham, H. & Grolemund, G. — *R for Data Science*, 2nd Edition, Chapter 4 (Workflow: code style). [Link](https://r4ds.hadley.nz/workflow-style.html)
7. R manual — `Syntax` (operator precedence). [Link](https://stat.ethz.ch/R-manual/R-devel/library/base/html/Syntax.html)

## What's Next?

Now that you know R's basic syntax, the next step is understanding the *types* of values R can store and how to combine many values together.

- **[R Data Types](R-Data-Types.html)** — learn about numeric, integer, character, logical, complex, and raw types. Every variable belongs to one.
- **[R Vectors](R-Vectors.html)** — R's fundamental data structure. Master `c()`, indexing, and vector recycling.
- **[R Control Flow](R-Control-Flow.html)** — `if`/`else`, `for`, and `while` loops for branching and iteration.

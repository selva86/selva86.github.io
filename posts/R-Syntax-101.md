---
title: "R Syntax 101: Write Your First Working Script in 10 Minutes"
slug: "R-Syntax-101"
description: "Learn R syntax end-to-end: arithmetic, variable assignment with <-, comments, and writing your first working R script in 10 minutes, every line explained."
keywords: "R syntax, R basic syntax, R arithmetic operators, R assignment operator, R comments, first R script, R programming basics, learn R syntax, R <- operator, R tutorial beginners"
mathjax: false
webr: true
date: "2026-04-10"
curriculum_id: "1.1.4"
post_type: "C"
auto_link_terms: "R syntax|R basic syntax|R assignment operator|R arithmetic operators|R comments|first R script|R script basics|R programming syntax"
auto_link_case_sensitive: false
sidebar_section: "Learn R"
sidebar_title: "R Syntax 101"
sidebar_order: 5
---

# R Syntax 101: Write Your First Working Script in 10 Minutes

<p class="lead">R syntax is the small set of rules for typing arithmetic, storing values with <code>&lt;-</code>, adding <code>#</code> comments, and saving it all into a <code>.R</code> script. Learn these four building blocks and you can run real R code today.</p>

## Introduction

If you can type `2 + 2` into a box and press Enter, you already know five percent of R. R takes what you typed, figures out what it means, and shows you the answer. That's the whole job of syntax — giving the language enough rules that your intent becomes unambiguous.

Most beginner tutorials rush past this in two pages. We're going to slow down for exactly ten minutes, because the four rules below are the ground you'll stand on for every single R script you ever write: **arithmetic**, **variables**, **comments**, and **scripts**. Get them right now and dplyr, ggplot2, and every statistical model you learn next will feel like vocabulary on top of solid grammar.

![The four building blocks of R syntax](screenshots/R-Syntax-101-syntax-mindmap.webp)
*Figure 1: The four building blocks of R syntax covered in this tutorial.*

Every code block below is live. Click **Run** (or press **Ctrl+Enter** inside the editor) and R executes it right in your browser — no install, no setup.

## What does a line of R code look like?

A line of R code is an **expression** — something R evaluates to a value and then prints. Type a number, you get the number back. Type an arithmetic operation, you get the result. Type text inside quotes, you get the text. R reads each line, does the work, shows the answer.

Three things matter right away: R is **case-sensitive** (`Age` and `age` are two different things), whitespace is mostly ignored (`2+2` and `2 + 2` behave the same), and R prefixes printed output with `[1]` to tell you the index of the first value on that line.

Let's see all three in one block.

```r
# Four expressions R will evaluate and print
42
"Hello, R"
10 + 5
10 + 5 * 2
```

Run that. You'll see each result on its own line, each prefixed with `[1]`. The prefix looks weird right now — it will make sense the moment you learn about vectors, because R treats *every* value as a vector and `[1]` is just saying "the first element shown here."

> **NOTE:** The `[1]` in output is not an error or a line number. It's R telling you "the next value is element number one of what I'm about to show you." For a single number it looks redundant. For a list of a hundred numbers it becomes essential.

### Try it: print your name and double a number

Write a one-line expression that prints your name (in quotes) and a second line that computes `2 * 8`.

```r
# Your turn — replace with your name
"Your name here"
2 * 8
```

## How do you do arithmetic in R?

Arithmetic is where every R journey starts. R has seven arithmetic operators, and they behave exactly like a calculator with two extras for modulus and integer division:

| Operator | Meaning | Example |
|---|---|---|
| `+` | Addition | `5 + 3` → `8` |
| `-` | Subtraction | `5 - 3` → `2` |
| `*` | Multiplication | `5 * 3` → `15` |
| `/` | Division | `10 / 4` → `2.5` |
| `^` | Exponent | `2 ^ 10` → `1024` |
| `%%` | Modulus (remainder) | `17 %% 5` → `2` |
| `%/%` | Integer division | `17 %/% 5` → `3` |

The first four are obvious. The exponent operator `^` raises the left number to the power of the right. Modulus `%%` gives the remainder after dividing — useful for "is this number even?" checks. Integer division `%/%` is the whole-number quotient, throwing away the remainder.

Let's run them all at once.

```r
# All seven arithmetic operators
5 + 3
5 - 3
5 * 3
10 / 4
2 ^ 10
17 %% 5
17 %/% 5
```

Now, a thing that trips up every beginner: **operator precedence**. When you write `2 + 3 * 4`, R follows standard math rules — multiplication and division bind tighter than addition and subtraction, so the answer is `14`, not `20`. If you want the addition to happen first, use parentheses.

```r
# Precedence: * binds tighter than +
2 + 3 * 4
# Parentheses force the order you want
(2 + 3) * 4
```

> **TIP:** When you're not sure how R will group an expression, parenthesise explicitly. It costs nothing, removes all ambiguity, and makes your code easier to read months later.

### Try it: modulus then exponent

Compute the remainder of 17 divided by 5, then raise that result to the power of 3. Answer on one line using parentheses.

```r
# Expected result: 8
(17 %% 5) ^ 3
```

## How do you store values in variables with the assignment operator?

Typing `2 + 2` is fun for about ten seconds. To write anything useful you need to **store** values so you can reuse them — that's what variables are for. In R, the idiomatic way to assign a value to a variable is the left-arrow operator `<-`.

![How R evaluates x <- 5 and stores the value](screenshots/R-Syntax-101-assignment-flow.webp)
*Figure 2: How R evaluates `x <- 5` and stores the value in memory.*

Read `x <- 5` as "x gets 5" or "5 goes into x." R evaluates whatever is on the right side, then stores the result under the name on the left. Once it's stored, you can use the name anywhere a value is expected.

```r
# Assign, then use
x <- 5
y <- 3
x + y

# Reassign — the old value is simply overwritten
x <- x + 1
x
```

You can also reassign a variable using itself on the right-hand side, as `x <- x + 1` shows. R first evaluates `x + 1` (which is `6`), then stores that new value back into `x`. The old `5` is gone.

> **KEY INSIGHT:** The arrow `<-` makes the direction of assignment visually obvious. The value on the right flows into the name on the left. You'll occasionally see `=` used for assignment, and R accepts it, but `<-` is the tidyverse and base-R convention for a reason: it reads unambiguously in function calls where `=` is reserved for named arguments.

**Naming rules.** A variable name can contain letters, digits, dots, and underscores. It must start with a letter or a dot, never a digit. Names are case-sensitive and cannot be R reserved words like `if`, `TRUE`, or `function`.

```r
# Case sensitivity — age and Age are two different variables
age <- 30
Age <- 99
age
Age
```

> **WARNING:** Avoid naming your variables `c`, `t`, `T`, `F`, or `mean`. These are built-in R names — `c()` creates vectors, `mean()` computes the mean, `T` is a shortcut for `TRUE`. If you shadow them with your own values, the next function call that expects the original behaviour breaks with a confusing error.

### Try it: compute your age

Store your birth year in `birth_year`, the current year in `this_year`, and compute your age as a new variable.

```r
# Replace with your values
birth_year <- 1995
this_year <- 2026
age_now <- this_year - birth_year
age_now
```

## How do you add comments to explain your code?

Comments are notes you leave for yourself and other humans. R ignores them completely — they exist purely for readability. Start a comment with `#` and everything to the end of that line becomes a comment.

R does not have a built-in multi-line comment syntax like `/* ... */` in other languages. Instead, the idiomatic R pattern is to stack single-line `#` comments, one per line. Most editors (including RStudio) let you select a block and comment it all at once with **Ctrl+Shift+C**.

```r
# -----------------------------------------
# Calculate after-tax price
# Author: you
# Date: today
# -----------------------------------------

tax_rate <- 0.18          # Trailing comments work too
price <- 100
total <- price * (1 + tax_rate)
total
```

Three comment styles appear in that block: a header block made of stacked `#` lines, a trailing inline comment on the `tax_rate` line, and no comment at all on the arithmetic lines because the code is self-explanatory.

> **TIP:** Write comments that explain **why**, not **what**. `# tax rate for 2026 filing` is useful — it tells the next reader something the code can't. `# set tax_rate to 0.18` is noise — anyone can see that from the code.

### Try it: comment a calculation

Write three lines: a header comment describing the task, a variable assignment with a trailing comment, and the calculation itself.

```r
# Your turn
# Calculate minutes in a week
minutes_per_day <- 60 * 24   # 1440
minutes_per_day * 7
```

## How do you write and run your first R script?

Typing expressions one at a time is fine for experimenting, but real work happens in **scripts** — text files with a `.R` extension that hold many lines of R code R executes top to bottom. A script is literally just a file containing the same kinds of lines you've been running.

In RStudio, the workflow is:

1. Open RStudio.
2. Click **File → New File → R Script** (or press **Ctrl+Shift+N**).
3. Type your code in the editor pane that opens.
4. Save it with **Ctrl+S**, giving it a name like `hello.R`.
5. Run the current line with **Ctrl+Enter**, or the whole file with **Ctrl+Shift+Enter**.

Here's a four-line script you could save as `hello.R` and run right now — we'll run it inline so you can see what happens:

```r
# hello.R — my first R script
price <- 100
qty <- 5
total <- price * qty
total
```

When you run that script, R executes each line in order. The first line is a comment and is ignored. Lines 2, 3, and 4 create three variables. The last line is just `total` on its own — an expression R evaluates and prints, which is how you see output from a script.

> **NOTE:** You can also run a script from the terminal without opening RStudio: `Rscript hello.R` executes the file and prints the results. This is how R is used in automation and production jobs.

### Try it: a three-line price script

Write a short script that assigns a price, a quantity, and prints the total.

```r
# Your turn
item_price <- 49.99
item_qty <- 3
item_price * item_qty
```

## Common Mistakes and How to Fix Them

### Mistake 1: Confusing `=` (assign) with `==` (compare)

In R, `=` stores a value and `==` checks equality. Mix them up and you'll either overwrite a variable by accident or get the wrong answer silently.

```r
# WRONG — this reassigns x to 5, always returns nothing useful
x <- 10
# if (x = 5) { "equal" }   # syntax error or surprise

# RIGHT — == is the comparison operator
x == 5
x == 10
```

### Mistake 2: Case sensitivity

`MyVar` and `myvar` are two separate variables. R will happily let you create both and never warn you.

```r
# Two different variables — easy to create by accident
myvar <- 10
MyVar <- 99
myvar
MyVar
```

Pick one casing convention (snake_case is most common in modern R) and stick with it across an entire project.

### Mistake 3: The `+` continuation prompt

If you forget to close a parenthesis or quote, R doesn't error — it waits for you to finish and shows a `+` prompt instead of `>`. Beginners see `+` and panic. The fix is to either finish the expression or press **Esc** to cancel.

```r
# Pretend you typed this and forgot the closing paren
# mean(c(1, 2, 3
# R would show + waiting for the rest
# Press Esc or type the ) to finish:
mean(c(1, 2, 3))
```

### Mistake 4: Shadowing built-in names

Naming a variable `c` overrides R's vector-creation function with your value. The next call to `c(1, 2, 3)` then fails with a cryptic error.

```r
# DON'T do this
# c <- 10
# c(1, 2, 3)   # would break — c is now a number, not a function

# Avoid these reserved-feeling names
# c, t, T, F, mean, sum, df, data
good_name <- 10
good_name
```

### Mistake 5: Using `=` inside function calls expecting it to persist

`mean(x = 1:10)` is valid R — but `x` only exists inside the function call, it is not stored afterwards. If you want `x` to persist, assign it first with `<-`.

```r
# Inside-the-call = does NOT create a persistent x
mean(x = 1:10)
# exists("x") would be FALSE here

# This is the pattern you want
x <- 1:10
mean(x)
```

## Practice Exercises

### Exercise 1: Mini calculator

Assign three variables `a`, `b`, and `c` to any numbers you like. Compute two things: `(a + b) * c` and the remainder of `a` divided by `b`. Print both results.

```r
# Your solution
a <- 12
b <- 5
c <- 3
(a + b) * c
a %% b
```

<details>
<summary>Click for expected output pattern</summary>

For `a = 12`, `b = 5`, `c = 3`:

- `(a + b) * c` → `51`
- `a %% b` → `2`

</details>

### Exercise 2: Fahrenheit to Celsius converter

Store a Fahrenheit temperature in a variable `temp_f`. Convert it to Celsius using the formula `(temp_f - 32) * 5 / 9`. Round the result to one decimal place using `round()` and print a labelled message.

```r
# Your solution
temp_f <- 98.6
temp_c <- (temp_f - 32) * 5 / 9
temp_c_rounded <- round(temp_c, 1)
paste(temp_f, "F is", temp_c_rounded, "C")
```

<details>
<summary>Click for expected output</summary>

For `temp_f = 98.6`: `"98.6 F is 37 C"`

</details>

## Complete Example: A 10-Line Tip Calculator

Here is every concept on this page — comments, variables, arithmetic, precedence with parentheses, and printing — combined into a short script you could save as `tip_calculator.R`.

```r
# tip_calculator.R
# Compute tip and grand total for a restaurant bill.
# Author: you
# Date: 2026-04-10

bill <- 84.50          # dollars
tip_pct <- 0.18        # 18 percent

tip <- bill * tip_pct
grand_total <- bill + tip

# Print the labelled results
paste("Bill:", bill)
paste("Tip:", round(tip, 2))
paste("Grand total:", round(grand_total, 2))
```

Look closely. Every line is something from this tutorial. Comments explain intent. `<-` assigns. Arithmetic computes. The final three lines evaluate expressions that print. That is the entire shape of a real R program.

## Summary

| Building block | Key syntax | One-line takeaway |
|---|---|---|
| Arithmetic | `+ - * / ^ %% %/%` | Use parentheses when precedence matters. |
| Assignment | `name <- value` | Left-arrow is idiomatic; reads as "gets". |
| Comments | `# text to end of line` | Explain *why*, not *what*. |
| Scripts | `.R` file, Ctrl+Enter | Lines run top to bottom; bare names print. |

Master these four and everything else in R — data types, vectors, functions, ggplot2, dplyr — is vocabulary piled on top of this grammar.

## FAQ

### Why use `<-` instead of `=` for assignment?

Both work at the top level, but `=` is also used to pass named arguments inside function calls like `mean(x = 1:10)`. Using `<-` keeps assignment visually distinct from argument passing, which prevents a common class of bugs and matches the tidyverse style guide and most professional R codebases.

### What does the `[1]` mean in R's output?

It's an index marker. R treats every value as a vector, and `[1]` is saying "the next value shown is element number one." For a single number the marker looks redundant, but for long vectors R wraps output across lines and uses `[1]`, `[15]`, `[29]` as a ruler so you can find a specific position.

### Can I put multiple statements on one line?

Yes, separate them with a semicolon: `x <- 5; y <- 3; x + y`. It works but most R style guides discourage it — one statement per line is clearer and easier to debug. Use semicolons only when it genuinely helps readability.

### How do I comment out several lines at once?

R has no block-comment syntax. Either prefix every line with `#`, or in RStudio select the block and press **Ctrl+Shift+C** which toggles `#` on every selected line at once.

### What's the difference between `<-` and `<<-`?

`<-` assigns in the current environment. `<<-` is the "super-assignment" operator — it walks up to the parent environment to find and modify a variable, or creates one in the global environment if it doesn't find one. You almost never need `<<-` as a beginner; when you do, it's usually inside closures or reference classes.

## References

- [R Language Definition — Expressions and evaluation](https://cran.r-project.org/doc/manuals/r-release/R-lang.html)
- [An Introduction to R — CRAN](https://cran.r-project.org/doc/manuals/r-release/R-intro.html)
- [R for Data Science (Wickham, Çetinkaya-Rundel, Grolemund) — Workflow basics](https://r4ds.hadley.nz/workflow-basics.html)
- [Advanced R (Wickham) — Names and values](https://adv-r.hadley.nz/names-values.html)
- [The tidyverse style guide — Assignment](https://style.tidyverse.org/syntax.html#assignment)
- [RStudio IDE documentation](https://posit.co/products/open-source/rstudio/)

## What's Next?

- [R Data Types](R-Data-Types.html) — once you can assign values, the next question is *what kind* of value you just stored.
- [R Vectors](R-Vectors.html) — the `[1]` marker finally makes sense when you meet R's fundamental data structure.
- [RStudio IDE Tour](RStudio-IDE-Tour.html) — learn the panes, shortcuts, and workflow that make writing R scripts fast.

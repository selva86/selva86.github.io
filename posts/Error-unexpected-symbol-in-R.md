---
title: "Fix 'unexpected symbol' in R"
slug: "Error-unexpected-symbol-in-R"
description: "R's unexpected symbol error means the parser hit two pieces of code with nothing joining them. See 5 causes, from missing commas to curly quotes, with fixes."
keywords: "unexpected symbol, unexpected symbol R, unexpected symbol in R, fix unexpected symbol, R error unexpected symbol, unexpected symbol error meaning, unexpected string constant R"
mathjax: false
webr: true
date: "2026-07-14"
post_type: "PSEO"
category_id: "error-message"
subcategory_id: "base-r-errors"
fr_parent: "R-Common-Errors.html"
auto_link_terms: "unexpected symbol|Error: unexpected symbol|unexpected symbol error|unexpected numeric constant|unexpected string constant"
auto_link_case_sensitive: false
target_keyword: "unexpected symbol"
sibling_block_enabled: true
difficulty: "Beginner"
---

# Fix 'unexpected symbol' in R

<p class="lead">The error <code>unexpected symbol</code> means R's parser found two pieces of code sitting side by side with nothing legal joining them, most often because of a missing comma or operator. The quoted text in the message ends at the exact word that broke the line.</p>

[QUICK ANSWER]
mean(x, trim = 0.1)             # add the missing comma
2 * x                           # write the operator, 2x is a parse error
my_var                          # valid name: no spaces, no leading digit
read.csv("C:/data/sales.csv")   # quote file paths, forward slashes
"hello"                         # straight quotes, not curly quotes
data.frame(x = 1:3)             # data.frame, not data frame

## What this error means

**This is a grammar problem, not a logic problem.** Before R runs a line, its parser checks that the line is valid R grammar. A symbol is any name: a variable, a function, a column. When the parser reads one complete piece of code and then bumps into a name with no comma, operator, or bracket connecting it, it gives up and reports the name it choked on:

```r title="Reproduce the error"
# This line stops R before it runs:
# total <- 5 apples
#
# Error: unexpected symbol in "total <- 5 apples"

total_apples <- 5   # one connected name parses fine
total_apples
#> [1] 5
```

Here `total <- 5` is already a complete statement. The word `apples` that follows is the unexpected symbol: R has no rule that lets a bare name sit after a finished assignment.

The message has one reliable property. R quotes the line only as far as the token it choked on, so the last word inside the quotes is the culprit, and the real mistake usually sits right before it.

[KEY INSIGHT]
**The failing line never ran.** A syntax error happens at parse time, before execution starts, so no half-finished computation exists and no objects were changed by that line. Fix the text of the line and run it again; there is nothing else to undo.

## The five causes and their fixes

**Almost every case reduces to two tokens with a missing connector.** These five patterns cover most real cases, in rough order of frequency.

### 1. A missing comma between arguments

**Function arguments must be separated by commas.** Leave one out and the second argument's name becomes the unexpected symbol:

```r title="Add the missing comma"
# mean(c(1, 5, 9) trim = 0.1) stops with:
# Error: unexpected symbol in "mean(c(1, 5, 9) trim"

mean(c(1, 5, 9), trim = 0.1)
#> [1] 5
```

The quoted snippet cuts off at `trim`, and the missing comma sits just before it. This trigger hides well in long calls with many arguments.

### 2. A missing operator between values

**R never multiplies implicitly.** On paper, `2x` means two times x. To the parser it is the number 2 followed by a name, with nothing connecting them:

```r title="Write the multiplication explicitly"
# price <- 2x stops with:
# Error: unexpected symbol in "price <- 2x"

x <- 10
price <- 2 * x
price
#> [1] 20
```

The same applies to any two values placed side by side: if you meant an operation, spell out the operator.

### 3. A space or leading digit inside a name

**R names cannot contain spaces or start with a digit.** The parser reads `my var` as two separate symbols and stops at the second one:

```r title="Fix the variable name"
# my var <- 5 stops with: unexpected symbol in "my var"
# 2var <- 5   stops with: unexpected symbol in "2var"

my_var <- 5
var2 <- 5
my_var + var2
#> [1] 10
```

Legal names use letters, digits, dots, and underscores, and must not begin with a digit; the [R Language Definition](https://cran.r-project.org/doc/manuals/r-release/R-lang.html#Identifiers) spells out the exact rules. The same mistake produces `data frame(x = 1:3)` instead of `data.frame(x = 1:3)`, which fails with `unexpected symbol in "data frame"`.

### 4. An unquoted file path or text value

**Anything that is not code must be in quotes.** A bare Windows file path is a stew of names, colons, and slashes the parser cannot digest:

```r title="Quote the file path"
# read.csv(C:\Users\me\data.csv) stops with:
# Error: unexpected symbol in "read.csv(C:\Users"

path <- "C:/Users/me/data.csv"
path
#> [1] "C:/Users/me/data.csv"
```

Wrap the path in quotes and use forward slashes, which work on every operating system. The same rule covers plain text values: `name <- Selva` needs quotes around `Selva` or R treats it as a variable name.

### 5. Curly quotes pasted from Word or the web

**Pasted code often carries characters that only look right.** Word processors, PDFs, and chat apps replace straight quotes with curly ones, and R's parser rejects them. Depending on the character, the message reads `unexpected input` instead of `unexpected symbol`; the cause and the fix are the same:

```r title="Retype the quotes"
# x <- “hello”  (curly quotes from Word) stops with:
# Error: unexpected input in "x <- “"

x <- "hello"
x
#> [1] "hello"
```

[WARNING]
**Invisible characters survive the paste.** Non-breaking spaces and curly quotes are pixel-identical to the real thing in most fonts. When a pasted line refuses to run and you cannot see why, delete the flagged line entirely and retype it by hand in your editor.

## Other 'unexpected' errors in the same family

**The parser names whatever token surprised it.** Once you can read one member of this family, you can read them all: look just before the named token.

| Message | Example trigger | Usual fix |
|---------|----------------|-----------|
| `unexpected symbol` | `mean(x trim = 0.1)` | Add the missing comma or operator |
| `unexpected numeric constant` | `c(1, 2 3)` | Add a comma or operator before the number |
| `unexpected string constant` | `paste("a" "b")` | Add a comma between the strings |
| `unexpected input` | `x <- “hello”` | Retype curly quotes or stray characters |
| `unexpected ')'` | `mean(c(1, 2)))` | Delete the extra closing parenthesis |
| `unexpected ','` | A comma outside any function call | Remove the stray comma |
| `unexpected 'else'` | `else` starting its own line at the console | Keep `else` on the same line as the closing `}` |
| `unexpected '>'` | Pasting the console prompt `> x <- 5` | Strip the leading `>` before running |

The `else` row is the sneakiest: at the console, `if (TRUE) 1` is complete on its own, so a line starting with `else` has nothing to attach to. Writing `} else {` on one line avoids it everywhere.

## Find the exact character that broke it

**The console message hides the location; the parser knows it.** You can ask R to show line, column, and a caret pointing at the failure by parsing the text yourself:

```r title="See where the parser stopped"
res <- try(parse(text = "mean(c(1, 5, 9) trim = 0.1)"), silent = TRUE)
cat(attr(res, "condition")$message)
#> <text>:1:17: unexpected symbol
#> 1: mean(c(1, 5, 9) trim
#>                     ^
```

The header `1:17` means line 1, column 17, and the caret sits under `trim`. You get this richer format for free when a whole file fails: `source("script.R")` reports something like `script.R:2:11: unexpected symbol` with the same numbered lines and caret.

[TIP]
**Let your editor find it first.** RStudio's diagnostics mark syntax errors with a red circle in the margin and a wavy underline before you run anything. If a script has several marks, always fix the topmost one first; a single missing comma can make perfectly good lines below it look broken.

## How to avoid it next time

**A few habits keep the parser on your side.**

- Type code in a proper editor, not in Word or an email draft, so the quotes stay straight.
- In a call with several arguments, check that a comma separates every pair.
- Translate math notation as you type: `2x` becomes `2 * x`, and `x(y + 1)` means "call the function x" unless you write `x * (y + 1)`.
- Quote every file path and use forward slashes, even on Windows.

[NOTE]
**Coming from Python?** This error is R's cousin of `SyntaxError: invalid syntax`. Both fire at parse time, both point at the first token that made the line ungrammatical, and in both languages the real mistake usually sits just before the position reported.

## Try it yourself

**Try it:** The commented line stops with `unexpected symbol` because of a missing comma. Fix it so `ex_avg` holds the mean of 4, 8, and 18.

```r title="Your turn: fix the syntax"
# ex_avg <- mean(c(4, 8, 18) na.rm = TRUE) fails: unexpected symbol
ex_avg <- # your code here

ex_avg
#> Expected: [1] 10
```

<details>
<summary>Click to reveal solution</summary>

```r title="Solution"
ex_avg <- mean(c(4, 8, 18), na.rm = TRUE)
ex_avg
#> [1] 10
```

**Explanation:** The error pointed at `na.rm` because the comma before it was missing. Every argument after the first needs a comma in front of it.

</details>

## FAQ

**What is an unexpected symbol in R?**

It is a syntax error raised by R's parser, the component that checks grammar before any code runs. A symbol is a name, such as a variable or function. The parser reports one as unexpected when it appears where the grammar allows no name, typically right after a complete expression with no comma or operator in between. The line never executes; correcting its text is the whole fix.

**How do I find the unexpected symbol in my code?**

Read the quoted text in the message: R cuts the quote at the token it choked on, so the last word in the quotes marks the spot, and the mistake usually sits just before it. For a precise position, run the file with `source()`, which reports line and column with a caret. In RStudio, the diagnostics margin flags the line with a red circle before you even run it.

**What does "unexpected string constant" mean in R?**

It is the same family of parse error with a quoted string as the surprise token instead of a name. `paste("a" "b")` fails this way because the parser finishes reading `"a"` and then meets `"b"` with no comma between them. Add the comma, or the missing operator if you meant to combine the strings some other way, and the line parses.

**What does "unexpected input" mean in R?**

The parser met a character that is not part of R's alphabet at all, so it cannot even classify the token. The classic source is pasting code containing curly quotes from Word, a PDF, or a web page. Fix it by deleting the flagged line and retyping it with straight quotes in your editor. If the line looks perfect, suspect an invisible character such as a non-breaking space.

## Related R errors

Start with the parent guide to [common R errors and how to read them](R-Common-Errors.html). Two frequent neighbors have their own walkthroughs: [could not find function](Error-could-not-find-function-X-in-R.html) fires when a name parses fine but is not loaded, and [object not found](R-Error-Object-Not-Found.html) when a parsed name has no value. For the quirkiest member of the family, see [object of type closure is not subsettable](Error-object-of-type-closure-is-not-subsettable-in-R.html).

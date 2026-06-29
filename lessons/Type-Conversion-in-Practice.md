---
title: "R Foundations Lesson 5: Type Conversion in Practice"
catalog_blurb: "Change what type your data is, and fix a column that imported wrong."
description: "Convert R values on purpose with as.numeric(), as.character() and as.factor(), tell explicit conversion from silent coercion, and fix a column that imported as the wrong type."
keywords: "type conversion in R, as.numeric, as.character, as.factor, as.integer, coercion in R, fix character column, NAs introduced by coercion, factor to numeric, R for beginners"
post_type: "LESSON"
curriculum_id: "1.2.5"
webr: true
lesson_access: "free"
track: "foundations"
course_id: "nr-structures"
course_title: "R Foundations: Data Structures"
course_lesson: "5"
course_total: "5"
course_landing: "R-Foundations-Structures-Course.html"
course_next: ""
course_prev: "Matrices-and-Arrays.html"
---

=== step === cover
::eyebrow Lesson 5 of 5
## Type Conversion in Practice
In [Lesson 4](Matrices-and-Arrays.html) you built grids of pure numbers. But real data rarely arrives in the type you want. Priya runs a small bakery and exports each day's sales to a spreadsheet. When she reads the file back into R, the **price** column, full of numbers like `3.50` and `2.75`, comes back as *text*, and now she cannot add up a single day's takings.

This lesson is the fix: how to change a value's type **on purpose**, and how to repair a column that imported as the wrong type.

By the end of this lesson you will be able to:

- Diagnose the type of every column with `str()` and `class()`
- Convert on purpose with `as.numeric()`, `as.character()`, `as.integer()` and `as.factor()`
- Spot the two classic traps: text that will not become a number, and a factor that turns into meaningless codes

**Prerequisites:** Lessons 1-4 of this course. You can build a [vector](Atomic-Vectors-and-Data-Types.html) and a [data frame](Data-Frames-and-Tibbles.html), and you know an atomic vector holds [one type](Atomic-Vectors-and-Data-Types.html), so mixing types silently *coerces* the whole vector up the ladder logical < integer < double < character. The box below holds three of Priya's prices as numbers. Press a **+ "hi" (text)** button and watch all of them turn into text, the very accident we are about to learn to undo.

::widget vector-coercion {"start":[{"lit":"3.50","type":"double"},{"lit":"2.75","type":"double"},{"lit":"1.50","type":"double"}]}

=== step === concept
::eyebrow Step 1: look before you leap
## Diagnose first: what type is each column?

Before you can fix a type, you have to **see** it. Let us bring Priya's sales into R exactly the way she does, by reading a small CSV. Each lesson runs in a fresh R session, so we write the file in-session first, then read it back (run this once; later steps reuse `sales`):

```r
rows <- c("item,price,sold",
          "muffin,3.50,12",
          "scone,2.75,8",
          "latte,n/a,15",
          "cookie,1.50,20")
writeLines(rows, "bakery.csv")              # the file Priya's spreadsheet exported
sales <- read.csv("bakery.csv", stringsAsFactors = FALSE)
str(sales)
#> 'data.frame':	4 obs. of  3 variables:
#>  $ item : chr  "muffin" "scone" "latte" "cookie"
#>  $ price: chr  "3.50" "2.75" "n/a" "1.50"
#>  $ sold : int  12 8 15 20
```

`str()` is your x-ray from Lesson 3. Read the tag after each column name: `item` is `chr` (character), `sold` is `int` (integer), but look at `price`, it is `chr` too. Those are *text*, even though they read like money. The reason is the rule from Lesson 2: one cell in that column, the missing latte price, was the text `n/a`. The moment a non-number sits in the column, R cannot keep the column numeric, so it coerces the **whole** column to character on import.

To check just the kinds, ask each column for its `class`. `sapply()` simply runs `class()` on every column and lines the answers up for you:

```r
sapply(sales, class)    # the type of every column at a glance
#>        item       price        sold
#> "character" "character"   "integer"
```

[KEY INSIGHT]
A wrong-type column almost never announces itself. It looks right on screen (`3.50` reads like a number) but behaves wrong (you cannot multiply it). `str()` and `class()` are how you catch it before it bites.

The toggles below show the same idea on a clean frame: each column is its own type, and you can read that type under the table.

::widget dataframe-builder {"columns":[{"name":"item","type":"character","values":["muffin","scone","latte","cookie"]},{"name":"price","type":"character","values":["3.50","2.75","n/a","1.50"]},{"name":"sold","type":"integer","values":[12,8,15,20]}]}

=== step === concept
::eyebrow Step 2: the toolbox
## Convert on purpose: the as.* family

R gives you a small family of functions whose only job is to change a value's type. You name the type you want, and R rebuilds the values as that type. Each is `as.` followed by the target:

```r
as.numeric(c("3.50", "2.75", "1.50"))   # text that is genuinely numeric -> real numbers
#> [1] 3.50 2.75 1.50
as.character(42)                          # a number -> its text form (note the quotes)
#> [1] "42"
as.integer(4.9)                           # a double -> an integer (it truncates, never rounds)
#> [1] 4
as.logical(c(1, 0, 1))                    # 1 -> TRUE, 0 -> FALSE
#> [1]  TRUE FALSE  TRUE
```

This is the deliberate mirror image of Lesson 2. There, mixing types caused R to coerce a vector **silently**, behind your back. Here, *you* are in charge: you state the target type, and the conversion happens only where you ask for it.

[KEY INSIGHT]
Coercion is what R does *to* you automatically when you mix types. Conversion is what you do *on purpose* with an `as.*` function. Same machinery, opposite intent: one is a silent accident, the other is a named decision.

The widget shows Priya's price column making exactly the move she needs, from text (look at the quotes) to real numbers she can multiply.

::widget table-transform {"code":"sales$price <- as.numeric(sales$price)","caption":"The price column was text (the quotes are the tell). as.numeric() rebuilds it as real numbers, so price x quantity finally works.","before":{"cols":["item","price","sold"],"rows":[["muffin","3.50",12],["scone","2.75",8],["cookie","1.50",20]]},"after":{"cols":["item","price","sold"],"rows":[["muffin",3.50,12],["scone",2.75,8],["cookie",1.50,20]]}}

=== step === quiz
::eyebrow Check yourself
## Which conversion do you reach for?

A colleague sends you three ages that arrived as text: `c("29", "41", "35")`. You want their average. Which function turns them into something `mean()` can work with?

::quiz {"correct":1,"gate":true,"difficulty":"beginner"}
- `as.numeric()`, because it rebuilds the text as real numbers you can average ::ok Right. `as.numeric(c("29","41","35"))` gives the doubles `29 41 35`, so `mean()` returns `35`. Naming the target type is the whole move.
- `as.character()`, because the values need to be clean text first ::no They are *already* character, that is the problem. `as.character()` would leave them as text, and you still could not average text.
- `as.factor()`, because the ages fall into categories ::no Ages are quantities, not categories. Turning them into a factor would make the averaging *harder*, not easier (you will see why factors and numbers do not mix two steps from now).

=== step === tryit
::eyebrow Your turn
## Rescue numbers stuck as text

Priya also kept this week's order counts, but they arrived as **text**: `c("12", "8", "15", "20")`. As characters you cannot add them. Fill the blank with the conversion that turns them into real numbers, so `sum()` can total them. The answer should be `55`.

```r
counts <- c("12", "8", "15", "20")   # arrived as text
total  <- sum(____(counts))          # convert to numbers, then add them up
total
```
::check {"regex":"as\\.(numeric|integer|double)\\s*[(]\\s*counts\\s*[)]","gate":true,"difficulty":"beginner","ok":"Exactly. as.numeric(counts) turns the text into the numbers 12, 8, 15, 20, so sum() can add them to 55.","no":"Wrap counts in as.numeric() before summing: sum(as.numeric(counts))."}
::solution
```r
counts <- c("12", "8", "15", "20")
sum(as.numeric(counts))
#> [1] 55
```

=== step === concept
::eyebrow Step 3: when conversion can't
## When a value is not really a number

What happens to Priya's `n/a`? `as.numeric()` cannot invent a number for it, so it does the only safe thing: it returns `NA` (R's marker for "missing") for that cell and a **warning**, not an error. The conversion still succeeds for every real number:

```r
as.numeric(c("3.50", "n/a", "1.50"))   # "n/a" cannot become a number
#> [1] 3.50   NA 1.50
#> Warning message:
#> NAs introduced by coercion
```

Read that warning as a gift, not a scolding. The exact phrase, **"NAs introduced by coercion"**, is R telling you precisely which values were not really numbers. To find *which* cells turned into `NA`, ask with `is.na()`:

```r
prices <- as.numeric(c("3.50", "n/a", "1.50"))
which(is.na(prices))    # the position of each value that failed to convert
#> [1] 2
```

[WARNING]
"NAs introduced by coercion" is not noise to silence. It means the column held something that was never a number, a stray `n/a`, a `sold out`, a `$` sign, or a `1,200` with a comma. Track that value down before you trust the column. The conversion is doing you a favour by flagging it.

=== step === concept
::eyebrow Step 4: a new structure
## Categories become factors

Not every text column should become a number. Some columns are **categories**, a value drawn from a fixed, repeating set: a day of the week, a size, a product name. R has a purpose-built type for these called a **factor**. You make one with `as.factor()` (or `factor()` for more control):

```r
item <- c("muffin", "scone", "latte", "muffin", "cookie")
f <- as.factor(item)
f
#> [1] muffin scone  latte  muffin cookie
#> Levels: cookie latte muffin scone
```

A factor looks like text, but underneath it stores two things: a dictionary of the distinct values (its **levels**), and, for each element, a small **integer code** pointing into that dictionary. Reveal the codes with `as.integer()`:

```r
levels(f)        # the dictionary: each distinct value, sorted
#> [1] "cookie" "latte"  "muffin" "scone"
as.integer(f)    # what is really stored: a code per value (muffin is level 3, scone 4, ...)
#> [1] 3 4 2 3 1
```

When categories have a natural order (small < medium < large), say so with `factor(..., ordered = TRUE)`, and R will respect that order in comparisons and plots:

```r
size <- factor(c("small", "large", "medium"),
               levels = c("small", "medium", "large"), ordered = TRUE)
size
#> [1] small  large  medium
#> Levels: small < medium < large
```

This "text in, levels and codes out" pipeline is exactly what `as.factor()` builds for you:

::widget process-flow {"steps":[{"title":"Raw text","sub":"muffin, scone, latte, muffin, cookie"},{"title":"Find the levels","sub":"cookie, latte, muffin, scone (the sorted distinct values)"},{"title":"Store a code","sub":"each value kept as an integer: 3, 4, 2, 3, 1"}]}

=== step === concept
::eyebrow Step 5: the famous gotcha
## The one factor trap everyone hits

Here is the mistake that catches every R user once. Suppose a year column was read as a **factor** (it happens with older import settings). You try to turn it back into numbers the obvious way, and get nonsense:

```r
years <- factor(c("2019", "2021", "2020"))   # years that came in as a factor
as.numeric(years)                             # WRONG: you get the level CODES
#> [1] 1 3 2
```

`1 3 2`? Those are not years, they are the *integer codes* from the step before. `as.numeric()` on a factor returns what the factor actually stores (the codes), not what the labels look like. The fix is to step through **text** first, so R reads the labels rather than the codes:

```r
as.numeric(as.character(years))    # RIGHT: labels -> text -> numbers
#> [1] 2019 2021 2020
```

[WARNING]
Never call `as.numeric()` directly on a factor of numbers. You will silently get the codes `1, 2, 3, ...` instead of the real values, and nothing will error to warn you. Always go through `as.character()` first: `as.numeric(as.character(f))`.

=== step === quiz
::eyebrow Check yourself
## Why the wrong years?

A year column was read as a factor, `factor(c("2019", "2021", "2020"))`. You run `as.numeric()` on it directly and get `1 3 2` instead of the years. What happened?

::quiz {"correct":2,"gate":true,"difficulty":"intermediate"}
- `as.numeric()` rounded the years down to small numbers ::no `as.numeric()` never rounds like that. `1 3 2` are not shrunken years at all, they are something else entirely.
- A factor stores each value as an integer code pointing into its levels, and `as.numeric()` returned those codes, not the labels ::ok Exactly. The levels are `2019, 2020, 2021`, so the codes are 1, 2, 3; your three values map to codes `1, 3, 2`. Convert through `as.character()` first to read the labels.
- The years were corrupted when the file was read ::no The data is fine. `as.character(years)` would show the real `"2019" "2021" "2020"`. The codes appear only because you converted the factor to numbers directly.

=== step === tryit
::eyebrow Put it all together
## Fix the column and finish the job

Back to Priya. Her `sales` frame is still as it imported: `price` is text. Your job is the full repair, the exact workflow you will use on real data:

1. **Diagnose** (done: `str()` showed `price` is `chr`)
2. **Convert** the column to the right type
3. **Verify** by doing the arithmetic you needed all along

Fill the blank to convert `price` to numbers. The `n/a` becomes `NA` (that is fine, `na.rm = TRUE` skips it), and the day's revenue comes out as `94`.

```r
str(sales$price)                          # still text from the import: chr "3.50" "2.75" "n/a" "1.50"
sales$price <- ____(sales$price)          # convert the price column to real numbers
revenue     <- sales$price * sales$sold   # price x quantity, row by row
sum(revenue, na.rm = TRUE)                # total takings, skipping the missing price
```
::check {"regex":"as\\.numeric\\s*[(]\\s*sales\\$price\\s*[)]","gate":true,"difficulty":"intermediate","ok":"Exactly. as.numeric(sales$price) rebuilds the column as numbers (the n/a becomes NA), so price x sold works and the takings total to 94.","no":"Convert the column with as.numeric(): sales$price <- as.numeric(sales$price). The n/a will become NA, which na.rm = TRUE then skips."}
::solution
```r
sales$price <- as.numeric(sales$price)
revenue     <- sales$price * sales$sold
sum(revenue, na.rm = TRUE)
#> [1] 94
```

=== step === concept
::eyebrow Go deeper
## References

A few trustworthy places to take this further, all free:

- [Advanced R (2e): Vectors](https://adv-r.hadley.nz/vectors-chap.html) - the definitive account of R's types and the coercion rules that conversion undoes.
- [R for Data Science (2e): Factors](https://r4ds.hadley.nz/factors) - a clear, example-led chapter on factors, levels and ordering, the structure behind today's trap.
- [R documentation: factor()](https://stat.ethz.ch/R-manual/R-devel/library/base/html/factor.html) - every argument of `factor()`, including `levels` and `ordered`, straight from the source.
- [An Introduction to R: objects, their modes and attributes](https://cran.r-project.org/doc/manuals/r-release/R-intro.html#Objects) - the canonical reference on R's modes and how a value's type is recorded.

=== step === complete
## Lesson 5 complete

You learned to change a value's type **on purpose**: diagnose every column with `str()` and `class()`, then convert with the `as.*` family, `as.numeric()`, `as.character()`, `as.integer()`, `as.logical()` and `as.factor()`. You saw the two traps that catch everyone: converting genuinely non-numeric text gives `NA` and the warning "NAs introduced by coercion" (a flag, not noise), and calling `as.numeric()` straight on a factor returns its hidden integer codes, so you go through `as.character()` first. Finally you fixed a real imported column end to end, diagnose, convert, verify, and got Priya her day's takings.

That completes **R Foundations: Data Structures**. You can now build, inspect and repair every core R object: vectors, lists, data frames, matrices and factors. Next in the foundations track comes **Programming**, where you start acting on these structures: subsetting and replacing their elements, branching with `if`/`else`, looping, and writing your own functions.

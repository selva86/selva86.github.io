---
title: "Joining Data Lesson 3: Split, Unite & Fuzzy Joins"
catalog_blurb: "Rescue the messy, almost-matching data that defeats a plain join."
description: "Clean messy data in R: split a crammed column with separate(), build a key with unite(), and match names that nearly agree using string-distance fuzzy joins."
keywords: "separate, unite, tidyr, separate columns in R, fuzzy join, fuzzyjoin, stringdist, string distance, edit distance, adist, data cleaning in R, join keys, stringr"
post_type: "LESSON"
curriculum_id: "2.2.3"
webr: true
mathjax: true
lesson_access: "free"
course_id: "da-joins"
course_title: "Joining and Reshaping Data in R"
course_lesson: "3"
course_total: "3"
course_landing: "Join-Reshape-Course.html"
course_next: ""
course_prev: "Pivoting-Long-and-Wide-in-R.html"
---

=== step === cover
::eyebrow Lesson 3 of 3
## Split, Unite & Fuzzy Joins
In Lesson 2 you changed a table's **shape**. But real data arrives dirty in a different way: a single column crams two facts together, or two tables that should line up have keys that only *nearly* agree.

Maya, who runs a small bakery, now pulls sales from an online-orders export and prices from a supplier sheet someone typed by hand. Below are her items on the left and the supplier's price sheet on the right. To you they read as the same four products. Click **inner**: an exact join finds only **two** matches. The other two are spelled just differently enough to be invisible to the join.

By the end of this lesson you will be able to:

- Split one crammed column into several with `separate()` (set `into` and `sep`)
- Combine several columns into one with `unite()`, the exact inverse of `separate()`
- Spot keys that only nearly match, surface them with `anti_join()`, and repair them by cleaning and by **string distance** (a fuzzy join)

**Prerequisites:** you can run R, you know a [tibble](Importing-and-Tidy-Data-in-R.html) and the [dplyr verbs](The-dplyr-Verbs.html), and you met the `inner`, `left` and `anti` [joins and the join key](Joining-Tables-in-R.html) in Lesson 1.

::widget join-diagram {"left":{"cols":["item","units"],"rows":[["Sourdough",20],["Bagel",38],["Croissant",15],["Pretzel",12]]},"right":{"cols":["item","price"],"rows":[["sourdough",4.5],["Bagel",1.5],["Croisant",4],["Pretzel",2]]},"key":"item","op":"inner"}

=== step === concept
::eyebrow One column, two facts
## separate() splits a crammed column

Maya's online store exports one row per order, but it crams the product **name** and its **size** into a single `product` field, like `"Sourdough/Large"`. That breaks a rule of tidy data: one variable per column. To analyse sales by item, and separately by size, those two facts need their own columns.

Each lesson runs in a fresh R session, so we build her export right here as a tibble, then never touch the disk again:

```r
library(dplyr)    # the verbs and the pipe
library(tidyr)    # separate(), unite()
library(tibble)   # tribble()
library(stringr)  # str_to_lower(), str_squish()

orders <- tribble(
  ~order, ~product,           ~ordered_on,
  "A1",   "Sourdough/Large",  "2024-03-01",
  "A2",   "Bagel/Small",      "2024-03-02",
  "A3",   "Croissant/Large",  "2024-03-02"
)
```

`tribble()` from **tibble** just lets us type a small table by hand: the `~order`, `~product`, `~ordered_on` entries are the column names, and the values follow row by row underneath.

`separate()`, from **tidyr**, takes one column and cuts each value into pieces at a separator. You tell it three things: which column to cut (`product`), what to name the pieces (`into`), and the character to cut on (`sep`):

```r
orders %>%
  separate(product, into = c("item", "size"), sep = "/")
#> # A tibble: 3 x 4
#>   order item      size  ordered_on
#>   <chr> <chr>     <chr> <chr>
#> 1 A1    Sourdough Large 2024-03-01
#> 2 A2    Bagel     Small 2024-03-02
#> 3 A3    Croissant Large 2024-03-02
```

The one `product` column became two, `item` and `size`, split at the `/`. Read it as a picture: the crammed column on the left opens out into the two clean columns on the right.

| order | product | ordered_on | | order | item | size | ordered_on |
|---|---|---|---|---|---|---|---|
| A1 | Sourdough**/**Large | 2024-03-01 | **->** | A1 | Sourdough | Large | 2024-03-01 |
| A2 | Bagel**/**Small | 2024-03-02 | **->** | A2 | Bagel | Small | 2024-03-02 |
| A3 | Croissant**/**Large | 2024-03-02 | **->** | A3 | Croissant | Large | 2024-03-02 |

[NOTE]
`separate()` still works, but recent **tidyr** marks it superseded in favour of the clearer `separate_wider_delim(product, delim = "/", names = c("item", "size"))`. Same idea, newer name. We use `separate()` here because it is the verb you will see most often in the wild.

=== step === quiz
::eyebrow Check yourself
## Naming the pieces

Maya's `product` values are `"Sourdough/Large"`, `"Bagel/Small"`, `"Croissant/Large"`. She runs `separate(product, into = c("item", "size"), sep = "/")`. What decides that the split lands correctly?

::quiz {"correct":2,"gate":true,"difficulty":"beginner"}
- `sep` is ignored; `separate()` always splits on a space ::no There is no space in `"Sourdough/Large"` to split on, so that would fail. `sep` is exactly the character you cut at, here the `/` you pass in.
- `into` must list one name per piece the split produces, and `sep` must match the real delimiter ::ok Right. Each value cuts into two pieces at the `/`, so `into` needs two names (`item`, `size`) and `sep = "/"` names the cut. Get either wrong and the pieces land in the wrong columns or trigger a warning.
- `into` can name any number of columns; extra names are filled with the value repeated ::no The number of names in `into` must match the number of pieces. Too few or too many names drops data or warns about missing pieces; it never repeats a value to fill the gap.

=== step === concept
::eyebrow The inverse move
## unite() glues columns back into one

`separate()` has a mirror image. `unite()` takes several columns and pastes them into a single one, joined by a separator you choose. It is to `separate()` what `pivot_wider()` was to `pivot_longer()` in Lesson 2: do one, then the other, and you are back where you started.

First we keep the split result so later steps can reuse it, then glue `item` and `size` straight back together:

```r
tidy_orders <- orders %>%
  separate(product, into = c("item", "size"), sep = "/")

tidy_orders %>%
  unite("product", item, size, sep = "/")
#> # A tibble: 3 x 3
#>   order product         ordered_on
#>   <chr> <chr>           <chr>
#> 1 A1    Sourdough/Large 2024-03-01
#> 2 A2    Bagel/Small     2024-03-02
#> 3 A3    Croissant/Large 2024-03-02
```

Exactly Maya's original `product` column, reconstructed. The first argument names the new column; the bare column names after it are the ones to glue, in order; `sep` is the glue. Picture it as the reverse of the last step: two columns folding back into one.

| order | item | size | ordered_on | | order | product | ordered_on |
|---|---|---|---|---|---|---|---|
| A1 | Sourdough | Large | 2024-03-01 | **->** | A1 | Sourdough**/**Large | 2024-03-01 |
| A2 | Bagel | Small | 2024-03-02 | **->** | A2 | Bagel**/**Small | 2024-03-02 |

[KEY INSIGHT]
`separate()` and `unite()` are inverses: one cuts a column into pieces, the other pastes pieces into a column. You rarely just round-trip them, though. The real use of `unite()` is to **build a key** in the exact shape another table expects, which is precisely the job in the next step.

=== step === tryit
::eyebrow Your turn
## Build a join key

Maya needs a single product code, a `sku`, that pastes the item and size with a dash, like `"Sourdough-Large"`. You already have `tidy_orders` with its `item` and `size` columns. Fill in the verb that glues columns into one, then check it.

```r
tidy_orders %>%
  ____("sku", item, size, sep = "-")
#> a new sku column: Sourdough-Large, Bagel-Small, Croissant-Large
```
::check {"regex":"unite","gate":true,"difficulty":"intermediate","ok":"Exactly: unite() pastes item and size into one sku column with the dash you chose. That is how you forge a key in whatever shape the other table uses.","no":"You want to GLUE several columns into one, which is unite: unite(\"sku\", item, size, sep = \"-\")."}
::solution
```r
tidy_orders %>%
  unite("sku", item, size, sep = "-")
```

=== step === concept
::eyebrow The join that silently fails
## Near-miss keys vanish from an exact join

Now the real task. Maya wants the supplier's `price` next to each of her items, a plain `left`/`inner` join on the item name. But the supplier sheet was typed by hand, so the names only *nearly* agree: `sourdough` is lower-case, and `Croissant` was mistyped as `Croisant`. An exact join matches strings character for character, so those two simply do not line up.

```r
sales <- tibble(
  item  = c("Sourdough", "Bagel", "Croissant", "Pretzel"),
  units = c(20, 38, 15, 12)
)
prices <- tibble(
  item  = c("sourdough", "Bagel", "Croisant", "Pretzel"),  # typed by hand
  price = c(4.5, 1.5, 4.0, 2.0)
)

inner_join(sales, prices, by = "item")
#> # A tibble: 2 x 3
#>   item    units price
#>   <chr>   <dbl> <dbl>
#> 1 Bagel      38   1.5
#> 2 Pretzel    12   2
```

Only **Bagel** and **Pretzel** survived, the two spelled identically on both sides. Sourdough and Croissant were dropped without a word, which is the dangerous part: a silent join looks like it worked. The way to catch this is `anti_join()`, which you met in Lesson 1: it keeps exactly the left rows with **no** match, the keys you need to fix.

```r
anti_join(sales, prices, by = "item")
#> # A tibble: 2 x 2
#>   item      units
#>   <chr>     <dbl>
#> 1 Sourdough    20
#> 2 Croissant    15
```

There is the cleanup list. The widget makes the filter concrete: the two matched rows fade out, and the two unmatched keys, your real problem, stay behind.

::widget table-transform {"code":"anti_join(sales, prices, by = \"item\")","caption":"anti_join keeps only the LEFT rows with no exact match. Bagel and Pretzel matched and drop away; Sourdough and Croissant survive as the cleanup list, the keys the join could not line up.","before":{"cols":["item","units"],"rows":[["Sourdough",20],["Bagel",38],["Croissant",15],["Pretzel",12]]},"after":{"cols":["item","units"],"rows":[["Sourdough",20],["Croissant",15]]}}

=== step === concept
::eyebrow The cheap fix first
## Normalise the keys before anything clever

Before reaching for anything fancy, fix the boring differences. A great share of near-misses are nothing but **case** and **whitespace**: `Sourdough` versus `sourdough`, or a stray trailing space. Lower-case both sides and squeeze the spaces, then join on the cleaned key.

```r
sales_clean <- sales %>%
  mutate(key = str_squish(str_to_lower(item)))
prices_clean <- prices %>%
  mutate(key = str_squish(str_to_lower(item)))

inner_join(sales_clean, prices_clean, by = "key")
#> # A tibble: 3 x 5
#>   item.x    units key       item.y    price
#>   <chr>     <dbl> <chr>     <chr>     <dbl>
#> 1 Sourdough    20 sourdough sourdough   4.5
#> 2 Bagel        38 bagel     Bagel       1.5
#> 3 Pretzel      12 pretzel   Pretzel     2
```

Cleaning recovered **Sourdough**: once both sides are lower-case, `sourdough` matches `sourdough`. We are up to three matches from two. But `Croissant` is still missing, because its problem was never case, it was a real typo: the supplier dropped an `s`. Toggle the widget to **inner** and watch three keys light up green while `croissant` and `croisant` stay stubbornly apart.

`str_to_lower()` and `str_squish()` come from **stringr**: the first lower-cases, the second trims the ends and collapses runs of spaces to one. Reach for them on every key before you join.

::widget join-diagram {"left":{"cols":["key","units"],"rows":[["sourdough",20],["bagel",38],["croissant",15],["pretzel",12]]},"right":{"cols":["key","price"],"rows":[["sourdough",4.5],["bagel",1.5],["croisant",4],["pretzel",2]]},"key":"key","op":"inner"}

=== step === concept
::eyebrow Measuring how close two words are
## Edit distance: a number for "nearly the same"

`Croissant` and `Croisant` are not equal, but they are *close*: one is the other with a single letter dropped. To match them on purpose we need to make "close" a number, and the standard one is **edit distance**.

The **edit distance** (or Levenshtein distance) between two strings \(a\) and \(b\), written \(d(a,b)\), is the smallest number of single-character edits, an insertion, a deletion, or a substitution, needed to turn \(a\) into \(b\). Identical strings have \(d = 0\); the further apart two spellings drift, the larger \(d\) grows. Turning `Croissant` into `Croisant` needs exactly one deletion, drop one `s`, so \(d(\text{Croissant}, \text{Croisant}) = 1\).

Base R computes it for you with `adist()`, no package needed:

```r
adist("Croissant", "Croisant")
#>      [,1]
#> [1,]    1
```

One edit, just as we counted. Now point it at the whole supplier list and ask which spelling is closest to Maya's leftover `croissant`:

```r
d <- adist("croissant", prices_clean$key)  # distance to every supplier key
prices_clean$key[which.min(d)]             # the nearest spelling
#> [1] "croisant"
min(d)                                     # ... and how far off it is
#> [1] 1
```

The nearest supplier key is `croisant`, just **one** edit away, while every other name is many edits off. That single number is the whole idea behind a fuzzy join: match a key to its nearest neighbour, as long as the neighbour is close enough.

=== step === quiz
::eyebrow Check yourself
## Which fix, and how far to reach

After cleaning, `Sourdough` matched but `Croissant` (vs the supplier's `Croisant`) still did not. Maya thinks: "I will set the fuzzy threshold to `max_dist = 4` so nothing ever slips through again." What is the right read?

::quiz {"correct":3,"gate":true,"difficulty":"intermediate"}
- Lower-casing the keys would have fixed `Croissant` too, if she had also trimmed the spaces ::no Lower-casing and trimming only fix case and whitespace. `Croisant` is a genuine missing letter, an edit-distance problem, not a case one. No amount of `str_to_lower()` closes a typo.
- A larger `max_dist` is always safer because it can only find more correct matches ::no It also finds more WRONG ones. A loose threshold is the main hazard of fuzzy joining, not a free safety net.
- `Croissant` needs distance-based matching (it is 1 edit away), but `max_dist = 4` is too loose and risks merging genuinely different products ::ok Right. Distance 1 catches the real typo; a threshold of 4 would also pull in unrelated names that happen to be a few edits apart, silently fusing distinct items. Keep the threshold as tight as the data allows.

=== step === concept
::eyebrow Doing it for real, and where it bites
## The fuzzy join, and its sharp edge

In practice you do not hand-roll `adist()` for every key. The **fuzzyjoin** package adds string-distance versions of the dplyr joins: `stringdist_inner_join()`, `stringdist_left_join()` and friends, each with a `max_dist` threshold. This one needs installing and runs on your own machine rather than here, so treat it as a recipe to copy:

```r-static
# install once with install.packages("fuzzyjoin")
library(fuzzyjoin)

# match keys that are within ONE edit of each other:
stringdist_inner_join(sales_clean, prices_clean,
                      by = "key", max_dist = 1)
#> all four items now match, including croissant <-> croisant
```

With `max_dist = 1`, `croissant` finally meets `croisant` and Maya has her complete price list. But that threshold is a loaded setting.

[WARNING]
Fuzzy matching trades silent **misses** for silent **false matches**. Raise `max_dist` and you will eventually fuse genuinely different things: `Bagel` and `Beigel` are one edit apart but may be two products; `bun` and `ban` differ by one letter and mean nothing alike. Guard yourself: keep `max_dist` as small as the data allows (often 1), eyeball every fuzzy match before you trust it, and for anything ambiguous keep a hand-built lookup table (a crosswalk) instead of guessing. A fuzzy join is a strong first pass, never the final word.

=== step === concept
::eyebrow Go deeper
## References

A few authoritative places to take this further:

- [R for Data Science (2e), Strings](https://r4ds.hadley.nz/strings) - the free, canonical chapter on cleaning and reshaping text, the raw material of every messy key.
- [tidyr: separate_wider_delim()](https://tidyr.tidyverse.org/reference/separate_wider_delim.html) - the current splitting verbs (the modern successors to `separate()`), with every argument explained.
- [tidyr: unite()](https://tidyr.tidyverse.org/reference/unite.html) - gluing columns into one, the inverse move, including how it handles `NA`.
- [van der Loo (2014), The stringdist package for approximate string matching, R Journal 6(1)](https://journal.r-project.org/archive/2014-1/loo.pdf) - the paper behind the distance metrics fuzzy joins use, edit distance included.
- [fuzzyjoin package documentation](https://github.com/dgrtwo/fuzzyjoin) - string-distance and other inexact joins as drop-in dplyr verbs, with `max_dist` worked examples.

=== step === complete
## Lesson 3 complete, and the course with it

You can now clean the two messes that block a join. You **split** a crammed column into tidy pieces with `separate()`, **glued** columns into the key you need with `unite()` (its exact inverse), and learned that an exact join drops near-miss keys silently, so you **surface** them with `anti_join()`, **normalise** away case and whitespace first, and only then reach for a **string-distance fuzzy join**, with the threshold kept tight to avoid false matches.

That closes **Joining and Reshaping Data in R**. Across three lessons you learned to combine two tables with the mutating and filtering joins, reshape one table between long and wide with `pivot_longer()` and `pivot_wider()`, and clean the columns and keys that real data throws at you. You now have the full toolkit for getting scattered, messy data into one analysis-ready table, the step every project depends on before a single chart or model. Next, point that clean data at exploratory analysis and visualisation.

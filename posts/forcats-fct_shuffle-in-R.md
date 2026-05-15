---
title: "forcats fct_shuffle() in R: Randomly Reorder Factor Levels"
slug: "forcats-fct_shuffle-in-R"
description: "Learn forcats fct_shuffle() in R to randomly reorder factor levels. See examples, set.seed for reproducible shuffles, pitfalls, and the fct_rev difference."
keywords: "forcats fct_shuffle, fct_shuffle function R, forcats fct_shuffle examples, randomize factor levels R, shuffle factor order R, fct_shuffle vs fct_rev"
mathjax: false
webr: true
date: "2026-05-15"
post_type: "PSEO"
category_id: "function-deep"
subcategory_id: "forcats-functions"
fr_parent: "Categorical-Data-in-R.html"
auto_link_terms: "fct_shuffle()|forcats fct_shuffle|forcats::fct_shuffle()|shuffle factor levels|randomize factor order"
auto_link_case_sensitive: true
target_keyword: "forcats fct_shuffle"
sibling_block_enabled: true
difficulty: "Beginner"
---

# forcats fct_shuffle() in R: Randomly Reorder Factor Levels

<p class="lead">The <code>fct_shuffle()</code> function in forcats puts a factor's levels into a random order in a single call. It permutes the level sequence without changing any of the underlying data values.</p>

[QUICK ANSWER]
fct_shuffle(f)                       # randomly permute the levels
set.seed(1); fct_shuffle(f)          # reproducible shuffle
fct_shuffle(factor(c("a","b","c")))  # works on a bare factor
fct_shuffle(df$grp)                  # shuffle a data frame column
levels(fct_shuffle(f))               # inspect the new order
fct_shuffle(fct_infreq(f))           # discard a computed order
sample(f)                            # shuffle observations, not levels

[DECISION TREE: Is fct_shuffle() the right tool?]
- put levels in random order: fct_shuffle(f)
- reverse the current order: fct_rev(f)
- set the order by hand: fct_relevel(f, "a", "b")
- order levels by another variable: fct_reorder(f, x)
- order levels by frequency: fct_infreq(f)
- rotate levels by a fixed step: fct_shift(f, n)
- shuffle observations, not levels: sample(f)

## What fct_shuffle() does

**`fct_shuffle()` randomizes the order of a factor's levels and nothing else.** A factor stores its categories as an ordered set of levels, and that order controls how categories appear on chart axes, in legends, and in sorted output. `fct_shuffle()` takes the current order and replaces it with a random permutation.

The function is deliberately small. It has no statistic to compute and no order to specify. If the levels are `Low`, `Medium`, `High`, one call might return `Medium`, `Low`, `High` and the next call a different arrangement, while the data values stay exactly the same.

This is the one forcats ordering function whose result is not deterministic. Every other reordering helper produces the same output each time. `fct_shuffle()` produces a fresh permutation on each call unless you fix the random seed first.

[KEY INSIGHT]
**`fct_shuffle()` shuffles metadata, not data.** A factor is a pair: integer codes for each observation and a lookup table of level labels. `fct_shuffle()` only reorders the lookup table and remaps the codes to match. No observation is added, dropped, relabelled, or moved within the vector itself.

## fct_shuffle() syntax

**`fct_shuffle()` takes a single argument: the factor to shuffle.** The full signature is as short as a forcats function gets:

```
fct_shuffle(f)
```

- `f` is a factor. A character vector is accepted and coerced to a factor first.

There are no other arguments. To control the result, set the random seed with `set.seed()` before the call. Because the randomness comes from R's global random number generator, the same seed always produces the same permutation.

```r title="Shuffle factor levels with fct_shuffle"
library(forcats)

months <- factor(c("Mar", "Jan", "Feb", "Jan", "Mar"))
levels(months)
#> [1] "Feb" "Jan" "Mar"

shuffled <- fct_shuffle(months)
levels(shuffled)
#> [1] "Jan" "Mar" "Feb"
```

The original factor sorts its three levels alphabetically. After `fct_shuffle()` the levels appear in a random order. Run the second call again and you will usually see a different arrangement, because no seed was set.

## Shuffle examples by use case

**Reproducible shuffles are the most common real need.** Pair `set.seed()` with `fct_shuffle()` so a randomized order can be regenerated exactly, which matters for reports, tests, and shared analysis.

```r title="Reproduce a shuffle with set.seed"
set.seed(42)
first <- fct_shuffle(months)

set.seed(42)
second <- fct_shuffle(months)

identical(levels(first), levels(second))
#> [1] TRUE
```

The two shuffles use the same seed, so they produce the same level order. Without the matching `set.seed()` calls, the two results would almost always differ.

**`fct_shuffle()` also works directly on a data frame column.** Wrap it inside `mutate()` to randomize the level order of one factor while leaving the rest of the table untouched.

```r title="Shuffle a column of factor levels"
library(dplyr)

iris_shuffled <- iris |> mutate(Species = fct_shuffle(Species))

nlevels(iris_shuffled$Species)
#> [1] 3
setequal(levels(iris$Species), levels(iris_shuffled$Species))
#> [1] TRUE
```

The level count and the set of level labels are unchanged. Only their order is randomized, which is exactly what you want when shuffling category display order for a chart or a survey.

## fct_shuffle() vs other forcats ordering functions

**`fct_shuffle()` is the only forcats reorderer that returns a random order.** Every other function in the family computes a fixed, repeatable order.

| Function | Sets level order by | Use when |
|---|---|---|
| `fct_shuffle()` | random permutation | you want an unbiased, arbitrary order |
| `fct_rev()` | reversing the current order | you only need to flip the existing order |
| `fct_relevel()` | a manual specification | you know the exact order you want |
| `fct_reorder()` | another numeric variable | order should track a summary value |
| `fct_infreq()` | frequency, most common first | the popular category should lead |
| `fct_shift()` | rotating levels by a step | you need a fixed circular shift |

The decision rule is short: reach for `fct_shuffle()` only when you genuinely want randomness, such as removing presentation order bias or stress-testing code against level order. For any meaningful order, use one of the deterministic functions instead.

[NOTE]
**Shuffling levels is not the same as shuffling rows.** To put the observations themselves in random order, use `sample()` on the vector or `slice_sample()` on the data frame. `fct_shuffle()` never touches row order.

## Common pitfalls

**Pitfall 1: forgetting `set.seed()` and losing reproducibility.** Without a fixed seed, every `fct_shuffle()` call returns a different order, so a result you saw once cannot be regenerated. Set the seed first whenever the shuffle feeds a report or a test.

**Pitfall 2: expecting `fct_shuffle()` to shuffle the data.** It does not reorder the vector of observations, only the level lookup table. The values stay in their original positions, as the comparison below shows.

```r title="Data values stay in place"
ratings <- factor(c("Low", "High", "Med", "Low"))
shuffled_ratings <- fct_shuffle(ratings)

identical(as.character(ratings), as.character(shuffled_ratings))
#> [1] TRUE
all(table(ratings) == table(shuffled_ratings))
#> [1] TRUE
```

The character values and the category counts are identical before and after, because only the level order moved.

[WARNING]
**`fct_shuffle()` returns a new factor and never modifies the original in place.** Call it without assigning the output and the shuffled order is discarded. Always write `f <- fct_shuffle(f)` or assign to a new name.

**Pitfall 3: confusing shuffling with renaming.** `fct_shuffle()` never changes a label, only its position. To rename a level use `fct_recode()`, and to merge several levels into one use `fct_collapse()`.

## Try it yourself

**Try it:** The `ex_drinks` factor has four levels in alphabetical order. Shuffle them into a random order using a fixed seed of `7` and save the result to `ex_shuffled`.

```r title="Your turn: shuffle drink levels"
ex_drinks <- factor(c("Coffee", "Tea", "Juice", "Water", "Tea"))
levels(ex_drinks)
#> [1] "Coffee" "Juice"  "Tea"    "Water"

# Shuffle the level order with seed 7
set.seed(7)
ex_shuffled <- # your code here

nlevels(ex_shuffled)
#> Expected: 4
```

<details>
<summary>Click to reveal solution</summary>

```r title="Solution"
set.seed(7)
ex_shuffled <- fct_shuffle(ex_drinks)
nlevels(ex_shuffled)
#> [1] 4
setequal(levels(ex_drinks), levels(ex_shuffled))
#> [1] TRUE
```

**Explanation:** `fct_shuffle()` randomizes the four levels into a new order. The seed of `7` makes that order reproducible, and `setequal()` confirms the same four labels survive, only their order changed.

</details>

## Related forcats functions

After `fct_shuffle()`, these forcats functions cover the rest of factor-order work:

- `fct_rev()`: reverse the current level order end to end.
- `fct_relevel()`: set the level order by hand from names you supply.
- `fct_reorder()`: order levels by a summary of another variable.
- `fct_infreq()`: order levels from most to least common.
- `fct_shift()`: rotate levels by a fixed number of positions.

For the official argument reference, see the forcats documentation at [forcats.tidyverse.org](https://forcats.tidyverse.org/reference/fct_shuffle.html).

## FAQ

**What does fct_shuffle do in R?**

`fct_shuffle()` randomly reorders the levels of a factor. You pass it a factor and it returns a new factor whose level sequence is a random permutation of the original. The underlying observations are not changed, so counts and computed results are identical before and after. It takes no other arguments, which makes it the simplest random reorderer in the forcats family.

**How do I make fct_shuffle reproducible?**

Call `set.seed()` with a fixed number immediately before `fct_shuffle()`. The function draws its randomness from R's global random number generator, so a fixed seed always yields the same permutation. Running `set.seed(42)` then `fct_shuffle(f)` gives an identical level order every time, which is what you want for reports and automated tests.

**What is the difference between fct_shuffle and fct_rev?**

`fct_shuffle()` produces a random level order, while `fct_rev()` produces a single deterministic order: the exact reverse of the current one. Use `fct_shuffle()` when you want an arbitrary, unbiased arrangement, and `fct_rev()` when you specifically need the mirror image of the existing order. Only `fct_shuffle()` changes its result between runs.

**Does fct_shuffle change the data values?**

No. `fct_shuffle()` only reorders the level labels and remaps the integer codes to match. Every observation keeps the same category, so frequency tables, means, and other summaries are unchanged. This is why it is safe to apply purely for display purposes, such as randomizing the order of bars or survey options.

</content>

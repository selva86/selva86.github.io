---
title: "forcats fct_recode() in R: Rename Factor Levels"
slug: forcats-fct_recode-in-R
description: "forcats fct_recode() renames factor levels by hand in R. Learn the new = old syntax, merge levels, fix typos, and silence the unknown-level warning fast."
keywords: "forcats fct_recode, fct_recode function R, forcats fct_recode examples, rename factor levels R, recode factor levels R, fct_recode tidyverse"
mathjax: false
webr: true
date: 2026-05-16
post_type: PSEO
category_id: function-deep
subcategory_id: forcats-functions
fr_parent: Categorical-Data-in-R.html
auto_link_terms: "fct_recode()|forcats fct_recode|forcats::fct_recode()|rename factor levels|recode factor levels"
auto_link_case_sensitive: true
target_keyword: "forcats fct_recode"
sibling_block_enabled: true
difficulty: Beginner
---

# forcats fct_recode() in R: Rename Factor Levels

<p class="lead">forcats fct_recode() renames the levels of a factor by hand, one mapping at a time. You name each new label and point it at an existing level, leaving every other level untouched.</p>

[QUICK ANSWER]
fct_recode(f, New = "old")               # rename one level
fct_recode(f, A = "x", B = "y")          # rename several levels
fct_recode(f, Big = "L", Big = "XL")     # merge many levels into one
fct_recode(f, "Extra Large" = "XL")      # quote names that have spaces
fct_recode(iris$Species, Iris = "setosa")# works on any factor column
suppressWarnings(fct_recode(f, X = "z")) # silence unknown-level warning

[DECISION TREE: Is fct_recode() the right tool?]
- rename levels by hand: fct_recode(f, New = "old")
- merge levels with a named list: fct_collapse(f, big = c("a", "b"))
- lump rare levels automatically: fct_lump(f, n = 5)
- reorder levels, not rename them: fct_relevel(f, "first")
- recode a plain (non-factor) vector: dplyr::recode(x, a = "A")
- rename from a named vector: fct_recode(f, !!!mapping)

## What fct_recode() does

**fct_recode() is a hand-operated level renamer.** It belongs to the [forcats](forcats-in-R.html) package and changes the *labels* of a factor without touching the underlying data order or the level order. You supply pairs in the form `new_label = "old_level"`, and every level you do not mention is carried through unchanged.

Start with a small factor so the behavior is easy to see.

```r title="Load forcats and build a factor"
library(forcats)

size <- factor(c("S", "M", "L", "S", "XL", "M"))
levels(size)
#> [1] "L"  "M"  "S"  "XL"
```

Now rename every level with one call. The new label sits on the left of the `=`, the existing level (as a quoted string) sits on the right.

```r title="Rename factor levels by hand"
size_named <- fct_recode(size,
  Small         = "S",
  Medium        = "M",
  Large         = "L",
  "Extra Large" = "XL"
)
size_named
#> [1] Small       Medium      Large       Small       Extra Large Medium     
#> Levels: Large Medium Small Extra Large
```

The values stayed in place and the level order is still `L, M, S, XL` order, just relabelled. `fct_recode()` never reorders.

[KEY INSIGHT]
**fct_recode() renames, it does not reorder.** The level order you see after recoding is the order the old levels had. If you need a different order, follow up with `fct_relevel()` or `fct_inorder()`.

## Syntax

**The signature is `fct_recode(.f, ...)`.** The first argument `.f` is the factor (or a character vector, which gets coerced to a factor). The `...` collects any number of `new_label = "old_level"` pairs.

Three rules cover almost every use:

- The **new label is on the left**, unquoted unless it contains spaces or starts with a digit.
- The **old level is on the right**, always a single quoted string.
- Repeat a label to **merge** several old levels into one (shown below).

When the mapping lives in a named vector, splice it into `...` with the `!!!` operator. This is the pattern for programmatic renaming, where labels come from a lookup table rather than being typed by hand.

```r title="Recode from a named vector"
mapping <- c(Small = "S", Medium = "M", Large = "L", "Extra Large" = "XL")
fct_recode(size, !!!mapping)
#> [1] Small       Medium      Large       Small       Extra Large Medium     
#> Levels: Large Medium Small Extra Large
```

## Examples by use case

**Each example below solves a different real task.** They use built-in R data so you can run them as is.

### Rename levels for display

**Recode terse codes into readable labels.** Tidy data often stores levels in lowercase or with terse codes. Recode them to presentation-ready labels right before plotting or printing a table.

```r title="Capitalize iris species labels"
species_display <- fct_recode(iris$Species,
  Setosa     = "setosa",
  Versicolor = "versicolor",
  Virginica  = "virginica"
)
levels(species_display)
#> [1] "Setosa"     "Versicolor" "Virginica"
```

### Merge several levels into one

**Repeat a label to merge levels.** Repeat a label on the left and `fct_recode()` collapses all those old levels into a single new one. Here five letter grades become a Pass/Fail factor.

```r title="Collapse grades into pass and fail"
grade <- factor(c("A", "B", "C", "D", "F"))

fct_recode(grade,
  Pass = "A",
  Pass = "B",
  Pass = "C",
  Fail = "D",
  Fail = "F"
)
#> [1] Pass Pass Pass Fail Fail
#> Levels: Pass Fail
```

### Standardize inconsistent labels

**Map every spelling to one clean level.** Survey exports frequently mix `yes`, `Yes`, and `Y` for the same answer. Map each spelling to one clean level so counts are correct.

```r title="Clean inconsistent survey answers"
raw <- factor(c("yes", "Yes", "Y", "no", "No", "N"),
              levels = c("yes", "Yes", "Y", "no", "No", "N"))

clean <- fct_recode(raw,
  Yes = "yes", Yes = "Yes", Yes = "Y",
  No  = "no",  No  = "No",  No  = "N"
)
clean
#> [1] Yes Yes Yes No  No  No 
#> Levels: Yes No
```

## fct_recode() vs other forcats renamers

**Pick the tool by how the mapping is defined.** `fct_recode()` is best when you type the mapping by hand. For rule-based or automatic merging, reach for a sibling function.

| Function | Use it when | Example |
|---|---|---|
| `fct_recode()` | You rename levels by hand, one pair at a time | `fct_recode(f, New = "old")` |
| `fct_collapse()` | You merge groups of levels with named vectors | `fct_collapse(f, big = c("a", "b"))` |
| `fct_lump()` | You merge rare levels into "Other" automatically | `fct_lump(f, n = 3)` |
| `fct_relevel()` | You change level order, not their names | `fct_relevel(f, "b")` |
| `dplyr::recode()` | You recode a plain vector that is not a factor | `recode(x, a = "A")` |

The decision rule: if you can list every old level explicitly, use `fct_recode()`. If the levels to merge are defined by a count or a group, use `fct_collapse()` or `fct_lump()` instead.

[NOTE]
**Coming from base R?** The classic way to rename levels is `levels(f) <- c(...)`, which forces you to supply every level in exact order. `fct_recode()` is safer because you name each pair, so a reordered factor cannot silently scramble your labels.

## Common pitfalls

**Two mistakes cause almost every fct_recode() problem.** Both produce a warning rather than an error, so they are easy to miss.

The first is getting the direction backwards. The new label goes on the left, the existing level on the right. Swap them and `fct_recode()` cannot find the level you named.

```r title="Direction matters: new equals old"
# Wrong: the existing level is on the left
fct_recode(grade, "A" = "Top")
#> Warning: Unknown levels in `f`: Top

# Right: new label left, existing level (quoted) right
fct_recode(grade, Top = "A")
#> [1] Top B   C   D   F  
#> Levels: Top B C D F
```

The second is naming a level that does not exist, often a typo. `fct_recode()` warns with `Unknown levels in f` and leaves the factor unchanged.

```r title="Unknown level triggers a warning"
fct_recode(grade, Excellent = "A+")
#> Warning: Unknown levels in `f`: A+
#> [1] A B C D F
#> Levels: A B C D F
```

[WARNING]
**An unknown level is a silent no-op.** `fct_recode()` does not stop on a misspelled level, it only warns. Always check `levels()` after recoding, or the typo ships unnoticed.

## Try it yourself

**Try it:** Recode the iris `Species` factor so `"setosa"` becomes `"Iris setosa"` while the other two levels stay unchanged. Save the result to `ex_species`.

```r title="Your turn: recode one iris level"
# Try it: rename a single level
ex_species <- # your code here

levels(ex_species)
#> Expected: "Iris setosa" "versicolor" "virginica"
```

<details>
<summary>Click to reveal solution</summary>

```r title="Solution"
ex_species <- fct_recode(iris$Species, "Iris setosa" = "setosa")
levels(ex_species)
#> [1] "Iris setosa" "versicolor"  "virginica"
```

**Explanation:** Levels you do not mention pass through untouched, so only `"setosa"` changes. The new label needs quotes because it contains a space.

</details>

## Related forcats functions

**fct_recode() is one of several forcats level editors.** Explore these when hand-renaming is not the right fit:

- [fct_collapse()](forcats-fct_collapse-in-R.html) merges groups of levels using named vectors.
- [fct_lump()](forcats-fct_lump-in-R.html) bundles the least common levels into "Other".
- [fct_relevel()](forcats-fct_relevel-in-R.html) changes the order of levels without renaming.
- [fct_other()](forcats-fct_other-in-R.html) keeps or drops named levels, sending the rest to "Other".
- [fct_drop()](forcats-fct_drop-in-R.html) removes unused levels after subsetting.

For the full reference, see the [forcats fct_recode documentation](https://forcats.tidyverse.org/reference/fct_recode.html).

## FAQ

**What is the difference between fct_recode() and dplyr recode()?**

`fct_recode()` works on a factor and preserves its level structure and order, returning a factor. `dplyr::recode()` works on any atomic vector and returns the same type it received. Use `fct_recode()` when the column is already a factor and you want to keep factor semantics. Use `recode()` for character or numeric vectors that are not factors.

**Why does fct_recode() put the new name on the left?**

The pattern `new = "old"` mirrors normal R assignment, where the target is on the left. It also lets you reuse a name to merge levels: writing `Pass = "A", Pass = "B"` reads naturally as "both map to Pass". A left-side old level could not express that merge cleanly.

**Can fct_recode() combine multiple factor levels?**

Yes. Assign the same new label to several old levels and they collapse into one. For example, `fct_recode(f, Big = "L", Big = "XL")` merges `L` and `XL` into `Big`. If the levels to merge are defined by a rule or count rather than an explicit list, `fct_collapse()` or `fct_lump()` is a better fit.

**How do I fix the "Unknown levels in f" warning?**

That warning means a level you named on the right side of `=` does not exist in the factor. Run `levels(f)` to see the exact spelling, including capitalization, and correct your mapping. If you know the level is genuinely optional, wrap the call in `suppressWarnings()` to silence it deliberately.

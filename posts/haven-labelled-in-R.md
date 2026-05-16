---
title: "haven labelled() in R: Create Labelled Survey Vectors"
slug: haven-labelled-in-R
description: "Use haven labelled() in R to attach value labels to coded survey data. Covers the labels and label arguments, labelled_spss(), and conversion to factors."
keywords: "haven labelled, labelled function R, haven labelled examples, R labelled vector, value labels in R, labelled_spss R, create labelled vector R"
mathjax: false
webr: true
date: 2026-05-16
post_type: PSEO
category_id: function-deep
subcategory_id: readr--readxl--haven
fr_parent: Importing-Data-in-R.html
auto_link_terms: "labelled()|haven labelled|haven::labelled()|labelled vector in R|value labels in R"
auto_link_case_sensitive: true
target_keyword: "haven labelled"
sibling_block_enabled: true
difficulty: Beginner
---

# haven labelled() in R: Create Labelled Survey Vectors

<p class="lead">The haven labelled() function builds a labelled vector in R: it stores numeric or character codes alongside the value labels that explain them, mirroring how SPSS, Stata, and SAS keep coded survey data.</p>

[QUICK ANSWER]
labelled(x, c(No = 0, Yes = 1))            # numeric value labels
labelled(x, c(M = "m", F = "f"))           # character value labels
labelled(x, labels, label = "Question 5")  # add a variable label
labelled_spss(x, labels, na_values = 9)    # SPSS user missing values
is.labelled(x)                             # test for the labelled class
print_labels(x)                            # show the value-label map
as_factor(x)                               # convert to an ordinary factor
zap_labels(x)                              # strip labels, keep raw codes

[DECISION TREE: Is labelled() the right tool?]
- attach value labels to coded data: labelled(x, c(No = 0, Yes = 1))
- add SPSS user-defined missing values: labelled_spss(x, labels, na_values = 9)
- read a file that is already labelled: read_sav("survey.sav")
- turn a labelled vector into a factor: as_factor(x)
- strip labels and keep the raw codes: zap_labels(x)
- build a plain factor from text: factor(x)

## What labelled() does

**labelled() pairs raw codes with human-readable labels.** Survey data is usually stored as numbers: a gender column holds `1` and `2`, not `Male` and `Female`. The mapping lives in a separate codebook. `labelled()` attaches that codebook directly to the vector, so the codes and their meaning travel together as a single object of class `haven_labelled`.

This is the same structure `read_sav()`, `read_dta()`, and `read_sas()` produce when they import labelled files. Calling `labelled()` by hand lets you recreate that structure for data you build in R, or for a column you need to recode before exporting back to SPSS or Stata with `write_sav()`.

[KEY INSIGHT]
**A labelled vector is data plus its codebook in one object.** The values stay numeric for storage and round-tripping, while the labels attribute carries the meaning. You decide when to collapse the two by converting to a factor.

## Syntax and key arguments

**labelled() takes a vector and a named labels lookup.** Only `x` and `labels` are needed for most calls; `label` adds a description of the whole variable.

```r title="The labelled signature"
labelled(
  x,             # a numeric or character vector to label
  labels = NULL, # a named vector: names are labels, values are codes
  label = NULL   # a one-line description of the variable itself
)
```

The `labels` argument is the part that trips people up. It is a named vector where the **names become the labels** and the **values become the data codes**. So `c(Male = 1, Female = 2)` means code `1` displays as `Male`. The names and values must be the same type as `x`: numeric labels for a numeric vector, character labels for a character vector.

## Creating a labelled vector

**Start with a numeric vector and a labels lookup.** Load haven, then pass the codes and their meaning to `labelled()`.

```r title="Create a labelled numeric vector"
library(haven)

gender <- labelled(
  c(1, 2, 1, 1, 2),
  labels = c(Male = 1, Female = 2)
)
gender
#> <labelled<double>[5]>
#> [1] 1 2 1 1 2
#>
#> Labels:
#>  value  label
#>      1   Male
#>      2 Female
```

The vector still prints its raw codes, with the label map shown underneath. The `label` argument adds a description of the variable as a whole, separate from the per-value labels.

```r title="Add a variable label"
satisfaction <- labelled(
  c(3, 1, 2, 3, 2),
  labels = c(Low = 1, Medium = 2, High = 3),
  label = "Customer satisfaction rating"
)
attr(satisfaction, "label")
#> [1] "Customer satisfaction rating"
print_labels(satisfaction)
#> Labels:
#>  value  label
#>      1    Low
#>      2 Medium
#>      3   High
```

### Labelling character data

**Character vectors can be labelled too.** The codes are strings, and the labels in `labels` must be strings to match.

```r title="Label a character vector"
region <- labelled(
  c("N", "S", "S", "E"),
  labels = c(North = "N", South = "S", East = "E")
)
is.labelled(region)
#> [1] TRUE
```

### SPSS-style user missing values

**Use labelled_spss() when codes double as missing values.** It extends `labelled()` with `na_values` and `na_range`, the user-defined missing codes SPSS uses for answers like "Refused" or "Not applicable".

```r title="Create an SPSS-style labelled vector"
q5 <- labelled_spss(
  c(1, 2, 1, 9),
  labels = c(Yes = 1, No = 2, Refused = 9),
  na_values = 9
)
q5
#> <labelled_spss<double>[4]>
#> [1] 1 2 1 9
#> Missing values: 9
#>
#> Labels:
#>  value   label
#>      1     Yes
#>      2      No
#>      9 Refused
```

## labelled() vs labelled_spss() vs factor()

**Pick the constructor by what you need to preserve.** A labelled vector keeps the original codes; a factor discards them and keeps only the categories.

| Feature | `labelled()` | `labelled_spss()` | `factor()` |
|---|---|---|---|
| Stores raw codes | Yes | Yes | No, stores levels |
| Keeps value labels | Yes | Yes | Labels become levels |
| User missing values | No | Yes (`na_values`, `na_range`) | No |
| Class produced | `haven_labelled` | `haven_labelled_spss` | `factor` |
| Ready for `table()`, `ggplot()` | No, seen as numbers | No | Yes |
| Best for | Mirroring SPSS or Stata codes | SPSS data with missing codes | Analysis-ready categories |

The rule of thumb: use `labelled()` or `labelled_spss()` while data is being imported, cleaned, or exported, and convert to a factor with `as_factor()` once you start tabulating or plotting.

## Common pitfalls

**Watch the direction of the labels vector.** Three mistakes account for most `labelled()` errors.

- **Reversing names and values.** `c(Male = 1)` is correct: the name is the label, the value is the code. Writing `c(1 = "Male")` is a syntax error because names cannot be bare numbers.
- **Mismatched types.** A numeric `x` needs numeric label values. Passing `labels = c(Male = "1")` against a numeric vector raises an error about incompatible types.
- **Expecting labels everywhere.** `labelled()` does not require a label for every value. Unlabelled codes stay as bare numbers, which is valid but easy to overlook.

[WARNING]
**A labelled column tabulates as numbers, not labels.** `table(gender)` counts `1` and `2`, and `ggplot()` plots the codes. Convert with `as_factor()` before any summary or chart, or your output shows codes instead of categories.

## Try it yourself

**Try it:** Build a labelled vector named `ex_status` from the codes `c(1, 0, 1, 1, 0)` with labels `Active = 1` and `Inactive = 0`, then confirm its class.

```r title="Your turn: build a labelled vector"
# Try it: create a labelled vector
ex_status <- # your code here

is.labelled(ex_status)
#> Expected: TRUE
```

<details>
<summary>Click to reveal solution</summary>

```r title="Solution"
ex_status <- labelled(
  c(1, 0, 1, 1, 0),
  labels = c(Active = 1, Inactive = 0)
)
is.labelled(ex_status)
#> [1] TRUE
```

**Explanation:** `labelled()` returns an object of class `haven_labelled`, so `is.labelled()` reports `TRUE`. The named vector `c(Active = 1, Inactive = 0)` maps each code to its label.

</details>

## Related haven functions

These functions handle the rest of the labelled-data workflow:

- **`as_factor()`** converts a labelled vector into an ordinary factor for analysis and plotting.
- **`zap_labels()`** strips the value labels and returns the raw codes.
- **`zap_formats()`** removes the SPSS or Stata display format attribute.
- **`read_sav()`** imports an SPSS file, producing labelled columns automatically.
- **`print_labels()`** prints the value-label map of any labelled vector.

[NOTE]
**Coming from the labelled package?** That package builds on haven and adds `val_labels()` and `var_label()` helpers for editing labels in place. The underlying `haven_labelled` class is the same one `labelled()` creates here. See the [haven reference](https://haven.tidyverse.org/reference/labelled.html) for the full argument list.

## FAQ

**What is the difference between labelled() and factor() in R?**

`labelled()` keeps the original numeric or character codes and stores the labels as a separate attribute, so the data can round-trip back to SPSS or Stata unchanged. `factor()` discards the codes and keeps only the category levels. Use `labelled()` while importing or exporting data, and convert to a factor with `as_factor()` once you need to tabulate or plot, because most R functions treat a labelled vector as raw numbers.

**How do I create a labelled vector from SPSS value labels?**

Pass your data vector as `x` and a named vector as `labels`, where the names are the labels and the values are the SPSS codes, for example `labelled(x, c(Yes = 1, No = 2))`. If the SPSS file uses user-defined missing values such as `9` for "Refused", use `labelled_spss()` instead and supply `na_values = 9` so those codes are flagged as missing.

**Can labelled() be used on character vectors?**

Yes. `labelled()` accepts both numeric and character vectors. For a character vector, the codes in `x` and the values in `labels` must both be strings, such as `labelled(c("N", "S"), c(North = "N", South = "S"))`. The names of the `labels` vector remain the human-readable labels regardless of the underlying type.

**How do I remove labels from a haven_labelled vector?**

Use `zap_labels()` to drop the value labels and return the bare codes, or `as_factor()` to turn the labels into factor levels. `zap_labels()` is the right choice when you want plain numbers for arithmetic, while `as_factor()` is better when you want readable categories for summaries and charts.

**Why does my labelled column show numbers instead of labels?**

A labelled vector stores codes for storage efficiency and prints them as numbers by design. The labels live in an attribute and only become the visible values once you call `as_factor()`. Functions like `table()` and `ggplot()` see the codes, so convert the column first if you want categories in your output.

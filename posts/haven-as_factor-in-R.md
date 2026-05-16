---
title: "haven as_factor() in R: Convert Labelled Data to Factors"
slug: haven-as_factor-in-R
description: "Use haven as_factor() in R to convert labelled SPSS, Stata, and SAS data into factors. Covers the levels argument, ordered factors, and data frame conversion."
keywords: "haven as_factor, as_factor function R, haven as_factor examples, R labelled to factor, convert labelled variable R, SPSS labels to factor R, haven as_factor vs factor"
mathjax: false
webr: true
date: 2026-05-16
post_type: PSEO
category_id: function-deep
subcategory_id: readr--readxl--haven
fr_parent: Importing-Data-in-R.html
auto_link_terms: "as_factor()|haven as_factor|haven::as_factor()|labelled to factor|convert labelled variable in R"
auto_link_case_sensitive: true
target_keyword: "haven as_factor"
sibling_block_enabled: true
difficulty: Beginner
---

# haven as_factor() in R: Convert Labelled Data to Factors

<p class="lead">The haven as_factor() function converts a labelled vector, the kind read_sav(), read_dta(), and read_sas() produce, into an ordinary R factor. It turns the stored value labels into factor levels.</p>

[QUICK ANSWER]
as_factor(x)                          # labels where available, else values
as_factor(x, levels = "labels")       # use value labels only
as_factor(x, levels = "values")       # keep the raw codes only
as_factor(x, levels = "both")         # combine as "[code] label"
as_factor(x, ordered = TRUE)          # return an ordered factor
as_factor(df)                         # convert every labelled column
as_factor(df, only_labelled = FALSE)  # also convert plain columns

[DECISION TREE: Is as_factor() the right tool?]
- turn a labelled vector into a factor: as_factor(x)
- keep the raw codes, drop the labels: zap_labels(x)
- drop SPSS or Stata display formats: zap_formats(x)
- build a factor from plain text or numbers: factor(x)
- parse a column to a factor on import: parse_factor(x)
- reorder or rename existing factor levels: fct_recode(f, ...)

## What as_factor() does

**as_factor() turns a labelled vector into a factor.** When haven reads an SPSS, Stata, or SAS file, coded columns such as `1 = "Male"` arrive with class `haven_labelled`. They print as numbers but carry the labels as a hidden attribute. as_factor() reads that attribute and builds a proper factor whose levels are the human-readable labels.

This matters because most R functions, from `table()` to `ggplot()`, treat a `haven_labelled` column as raw numbers. A labelled column of survey responses would tabulate as `1, 2, 3` instead of `Male, Female, Other`. Converting with as_factor() makes the labels the visible values, so summaries and plots read correctly.

## Syntax and key arguments

**as_factor() is a generic with methods for a single vector and for a whole data frame.** Most calls need only `x`; the `levels` and `ordered` arguments control how the factor is built.

```r title="The as_factor signature"
as_factor(
  x,                     # a labelled vector or a data frame
  levels = "default",    # "default", "labels", "values", or "both"
  ordered = FALSE,       # TRUE returns an ordered factor
  ...,
  only_labelled = TRUE   # data-frame method: skip non-labelled columns
)
```

The `levels` argument decides what the factor levels become. With `"default"` or `"labels"` the labels are used; `"values"` keeps the raw codes; `"both"` combines them as `[1] Male`. Set `ordered = TRUE` when the categories have a natural rank, such as Low, Medium, High, so comparisons with `<` work.

When `x` is a data frame, as_factor() converts every labelled column at once and leaves the rest alone. The `only_labelled` argument controls that: it defaults to `TRUE`, so plain numeric and character columns pass through untouched.

[NOTE]
**Coming from Python pandas?** pandas stores SPSS-style codes as a `Categorical` with named `.cat.categories`. The haven equivalent of attaching those category names is as_factor(), which bakes the value labels into a base R factor.

## as_factor() examples

**Build a labelled vector with `labelled()`, then convert it.** haven's `labelled()` constructor reproduces the kind of column a `.sav` file holds, so every example below runs without a data file of your own.

```r title="Convert a labelled vector to a factor"
library(haven)

sex <- labelled(
  c(1, 2, 1, 2, 1),
  labels = c(Male = 1, Female = 2)
)
as_factor(sex)
#> [1] Male   Female Male   Female Male
#> Levels: Male Female
```

The result is a factor. Each `1` became `Male` and each `2` became `Female`, because as_factor() read the `labels` attribute.

**Use `levels = "values"` or `"both"` to keep the codes visible.** Survey codebooks often need the raw number alongside the label.

```r title="Keep codes with the values and both modes"
as_factor(sex, levels = "values")
#> [1] 1 2 1 2 1
#> Levels: 1 2

as_factor(sex, levels = "both")
#> [1] [1] Male   [2] Female [1] Male   [2] Female [1] Male
#> Levels: [1] Male [2] Female
```

The `"values"` mode discards the labels entirely, while `"both"` keeps an audit trail by showing the code in brackets before each label.

**Pass `ordered = TRUE` for ranked categories.** An ordered factor lets you compare and sort levels.

```r title="Build an ordered factor"
satisfaction <- labelled(
  c(1, 3, 2, 3),
  labels = c(Low = 1, Medium = 2, High = 3)
)
as_factor(satisfaction, ordered = TRUE)
#> [1] Low    High   Medium High
#> Levels: Low < Medium < High
```

The `<` signs in the printed levels confirm the order, so `satisfaction > "Low"` now returns a logical result instead of an error.

**Call as_factor() on a whole data frame to convert every labelled column at once.** This is the common move right after reading a survey file.

```r title="Convert all labelled columns in a data frame"
survey <- data.frame(respondent = 1:4)
survey$sex   <- labelled(c(1, 2, 2, 1), c(Male = 1, Female = 2))
survey$grade <- labelled(c(3, 1, 2, 3), c(Low = 1, Medium = 2, High = 3))

as_factor(survey)
#>   respondent    sex  grade
#> 1          1   Male   High
#> 2          2 Female    Low
#> 3          3 Female Medium
#> 4          4   Male   High
```

The `respondent` column stays an integer because it was never labelled, while `sex` and `grade` became factors in a single call.

[TIP]
**Convert once, right after import.** Chain the reader and as_factor() together, as in `read_sav("survey.sav") |> as_factor()`, so every downstream summary and plot sees readable labels instead of raw codes.

## as_factor() vs factor() and zap_labels()

**as_factor() is the only one of these that reads value labels.** Base `factor()` and haven's `zap_labels()` solve nearby problems, so the choice depends on whether you want the labels kept, ignored, or discarded.

| Function | Input | Output | Uses value labels? |
|----------|-------|--------|--------------------|
| `as_factor()` (haven) | labelled vector | factor | Yes, labels become levels |
| `factor()` (base R) | any vector | factor | No, uses the raw values |
| `zap_labels()` (haven) | labelled vector | plain vector | No, strips the labels off |
| `as_factor()` (forcats) | character or numeric | factor | No, orders by first appearance |

Reach for `factor()` when a column is already plain text or numbers with no label attribute. Use `zap_labels()` when you want the raw codes as a clean numeric vector, for example before a model that expects numbers. Use as_factor() whenever the labels are the meaning you want to keep.

[KEY INSIGHT]
**A labelled vector is a number with a hidden dictionary.** factor() ignores that dictionary, zap_labels() throws it away, and as_factor() promotes it so the dictionary becomes the factor's levels. Picking the right function is really a choice about what to do with the labels.

## Common pitfalls

**The data frame method skips plain columns by default.** If a column you expected to convert is still numeric or character, it was never labelled. Pass `only_labelled = FALSE` to convert plain columns too.

```r title="Pitfall: plain columns are skipped"
survey$region <- c("N", "S", "S", "N")   # plain character, not labelled

# default keeps region as character
sapply(as_factor(survey), class)
#>  respondent         sex       grade      region
#>   "integer"    "factor"    "factor" "character"

# only_labelled = FALSE converts everything
sapply(as_factor(survey, only_labelled = FALSE), class)
#> respondent        sex      grade     region
#>   "factor"   "factor"   "factor"   "factor"
```

**Unlabelled codes fall back to their raw value.** If a labelled vector holds a code with no matching label, `levels = "default"` uses the bare number as that level. Confirm your codebook is complete before converting, or those rows will read as digits among the words.

[WARNING]
**haven and forcats both define as_factor().** If you load forcats, or the full tidyverse, after haven, `as_factor()` resolves to the forcats version, which cannot read value labels. Call `haven::as_factor()` explicitly whenever both packages are attached.

## Try it yourself

**Try it:** Convert the labelled vector `ex_party` into a factor that shows the codes and labels together, using `levels = "both"`. Save the result to `ex_result`.

```r title="Your turn: convert with both labels and codes"
# Try it: convert ex_party with levels = "both"
ex_party <- labelled(c(1, 2, 3, 1), c(Left = 1, Centre = 2, Right = 3))
ex_result <- # your code here

ex_result
#> Expected: levels shown as [1] Left, [2] Centre, [3] Right
```

<details>
<summary>Click to reveal solution</summary>

```r title="Solution"
ex_party <- labelled(c(1, 2, 3, 1), c(Left = 1, Centre = 2, Right = 3))
ex_result <- as_factor(ex_party, levels = "both")
ex_result
#> [1] [1] Left   [2] Centre [3] Right  [1] Left
#> Levels: [1] Left [2] Centre [3] Right
```

**Explanation:** Passing `levels = "both"` tells as_factor() to build each level from the raw code and its label, so the factor keeps the audit trail from the original codebook.

</details>

## Related haven functions

**as_factor() works alongside a small set of haven label helpers.** Reach for the one that matches what you want to do with the labels and formats.

- `zap_labels()`: strip value labels and keep the raw underlying values.
- `zap_formats()`: drop SPSS and Stata display formats from a column.
- `zap_missing()`: convert tagged user-defined missing values to plain `NA`.
- `labelled()`: build a labelled vector by hand, useful for tests and examples.
- `read_sav()`: read an SPSS `.sav` file, which often returns labelled columns.
- `read_dta()`: read a Stata `.dta` file with its variable and value labels.

For the full argument reference, see the [haven as_factor() documentation](https://haven.tidyverse.org/reference/as_factor.html) on tidyverse.org.

## FAQ

**What does haven as_factor() do?**

as_factor() converts a labelled vector into a base R factor. When haven reads an SPSS, Stata, or SAS file, coded columns arrive with class `haven_labelled`, storing labels such as `1 = "Male"` as an attribute. as_factor() reads that attribute and rebuilds the column as a factor whose levels are the labels. It also works on a whole data frame, converting every labelled column in one call while leaving plain columns alone.

**What is the difference between as_factor() and factor() in R?**

Base `factor()` builds a factor from the values it sees, with no knowledge of value labels. Calling it on a `haven_labelled` column produces a factor with levels `1, 2, 3`. haven's `as_factor()` reads the label attribute first, so the same column becomes a factor with levels `Male, Female, Other`. Use `factor()` for plain vectors and `as_factor()` whenever the column carries labels from a statistical file.

**How do I convert SPSS labelled variables to factors in R?**

Read the file with `read_sav()`, then call `as_factor()` on the resulting tibble. The data frame method converts every labelled column at once and leaves untouched columns alone. A one-line pipeline such as `read_sav("survey.sav") |> as_factor()` gives you a tibble where coded survey responses display as readable categories instead of numbers.

**What does levels = "both" do in as_factor()?**

`levels = "both"` builds each factor level from the raw code and its label together, formatted as `[1] Male`. It is useful for survey work where you want the original numeric code visible alongside the label as an audit trail. The other options are `"labels"` for label text only, `"values"` for the raw codes only, and the `"default"` setting that uses labels where they exist.

**Why does as_factor() behave differently after I load the tidyverse?**

Both haven and forcats export a function named `as_factor()`. Whichever package is attached last masks the other. The forcats version converts character or numeric vectors and orders levels by first appearance; it cannot read haven value labels. If you load the tidyverse after haven, call `haven::as_factor()` with the explicit namespace prefix so you get the labelled-aware version.

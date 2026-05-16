---
title: "haven zap_labels() in R: Remove Value Labels from Data"
slug: haven-zap_labels-in-R
description: "Use haven zap_labels() in R to drop value labels from labelled SPSS, Stata and SAS data. Covers the syntax, data frame use, and zap_labels vs as_factor."
keywords: "haven zap_labels, zap_labels function R, haven zap_labels examples, R remove value labels, strip value labels SPSS, zap_labels vs as_factor"
mathjax: false
webr: true
date: 2026-05-16
post_type: PSEO
category_id: function-deep
subcategory_id: readr--readxl--haven
fr_parent: Importing-Data-in-R.html
auto_link_terms: "zap_labels()|haven zap_labels|haven::zap_labels()|remove value labels|strip value labels in R"
auto_link_case_sensitive: true
target_keyword: "haven zap_labels"
sibling_block_enabled: true
difficulty: Beginner
---

# haven zap_labels() in R: Remove Value Labels from Data

<p class="lead">The haven zap_labels() function removes value labels from a labelled vector, the kind read_sav(), read_dta(), and read_sas() produce. It returns the underlying codes as a plain R vector, ready for analysis.</p>

[QUICK ANSWER]
zap_labels(x)                       # drop value labels from a vector
zap_labels(df)                      # drop value labels from every column
zap_labels(read_sav("survey.sav"))  # strip labels right after import
str(zap_labels(x))                  # confirm the labels are gone
zap_label(x)                        # drop the VARIABLE label instead
zap_formats(x)                      # drop SPSS or Stata display formats
as_factor(x)                        # keep labels, convert to a factor

[DECISION TREE: Is zap_labels() the right tool?]
- drop value labels, keep raw codes: zap_labels(x)
- keep label meaning as a factor: as_factor(x)
- drop the variable-level label: zap_label(x)
- drop SPSS or Stata display formats: zap_formats(x)
- convert user-defined missings to NA: zap_missing(x)
- inspect labels before removing: attr(x, "labels")

## What zap_labels() does

**zap_labels() converts a labelled vector into a plain one.** When haven imports an SPSS, Stata, or SAS file, coded columns arrive as labelled vectors that pair each number with a text label. zap_labels() discards those value labels and hands back the bare codes, which is the form most modelling and summary functions expect.

## zap_labels() syntax and arguments

**zap_labels() takes a single argument.** You pass either one labelled vector or a whole data frame, and it returns the same object with value labels removed.

```r title="zap_labels syntax"
zap_labels(
  x    # a labelled vector, or a data frame of them
)
# returns the same data with value labels removed
```

zap_labels() is an S3 generic. It has methods for labelled vectors, for SPSS-style labelled vectors with user-defined missing values, and for data frames. Plain vectors with no labels pass through untouched, so the function is always safe to call. The full method list is in the [haven reference](https://haven.tidyverse.org/reference/zap_labels.html).

[NOTE]
**zap_labels() is plural for a reason.** It removes the value labels that map codes to text. The singular zap_label() removes the variable label, a different attribute. Mixing them up is the most common haven naming slip.

## Strip value labels with zap_labels()

**Call zap_labels() on a labelled vector to get its codes back.** Build a labelled vector with labelled(), then strip it down to numbers.

```r title="Strip labels from one vector"
library(haven)

education <- labelled(
  c(1, 2, 3, 2, 1),
  labels = c(School = 1, College = 2, Graduate = 3)
)
education
#> <labelled<double>[5]>
#> [1] 1 2 3 2 1
#> Labels:
#>  value    label
#>      1   School
#>      2  College
#>      3 Graduate

zap_labels(education)
#> [1] 1 2 3 2 1
```

Pass a data frame and every labelled column is cleaned in one call. Columns that were never labelled are left as they are.

```r title="Strip labels across a data frame"
survey <- data.frame(id = 1:4)
survey$sex   <- labelled(c(1, 2, 2, 1), c(Male = 1, Female = 2))
survey$grade <- labelled(c(3, 1, 2, 3), c(Low = 1, Medium = 2, High = 3))

clean <- zap_labels(survey)
sapply(clean, class)
#>        id       sex     grade
#> "integer" "numeric" "numeric"
```

zap_labels() keeps the variable label, the short description SPSS and Stata attach to each column. Only the value labels go.

```r title="zap_labels keeps the variable label"
income <- labelled(
  c(1, 2, 3, 2),
  labels = c(Low = 1, Mid = 2, High = 3),
  label  = "Household income band"
)

stripped <- zap_labels(income)
attr(stripped, "label")
#> [1] "Household income band"
```

[KEY INSIGHT]
**zap_labels() removes meaning, not just metadata.** Once the value labels are gone, the codes 1, 2, and 3 carry no record of what they stand for. If readable categories matter, use as_factor() instead, which folds the labels into factor levels.

## zap_labels() vs as_factor and other zap functions

**zap_labels() is one of a family of haven attribute strippers.** Each removes a different piece of the metadata haven attaches to imported columns. Pick the function by what you want gone.

| Function | Removes | Keeps | Use when |
|---|---|---|---|
| `zap_labels()` | value labels | codes, variable label | you need numeric codes for modelling |
| `zap_label()` | variable label | codes, value labels | the variable description clutters output |
| `zap_formats()` | display formats | codes, labels | SPSS or Stata formats break a package |
| `as_factor()` | the labelled class | label meaning, as levels | you want human-readable categories |

The decision rule is short. Use as_factor() when the label text matters for plots or grouped tables, and zap_labels() when you only need the raw numbers and the labels are in the way.

[TIP]
**Strip labels late, not early.** Keep value labels while you explore and check the data, then call zap_labels() only on the columns headed into a model. You lose nothing by waiting until the labels stop being useful.

## Common pitfalls

**Three mistakes catch new haven users.** Each is easy to avoid once you know zap_labels() drops information for good.

**1. Expecting the labels to survive.** zap_labels() deletes them, the codes lose their meaning, and there is no undo.

```r title="Labels are gone for good"
party <- labelled(c(1, 2, 1), c(Labour = 1, Tory = 2))

bare <- zap_labels(party)
bare
#> [1] 1 2 1
```

To keep the meaning, convert with as_factor() before, or instead of, stripping.

**2. Forgetting the variable label stays.** zap_labels() leaves the variable label in place. If a function still prints a description, reach for zap_label() as well.

**3. Assuming it ignores user-missing values.** For SPSS data with user-defined missing values, zap_labels() also converts those tagged values to ordinary NA. Check your missing-value counts after calling it.

## Try it yourself

**Try it:** Build a labelled vector ex_rating with codes 1, 2, and 3 labelled Poor, Fair, and Good, then strip its value labels into ex_clean.

```r title="Your turn: strip value labels"
# Try it: remove the value labels
ex_rating <- labelled(c(1, 3, 2, 1), c(Poor = 1, Fair = 2, Good = 3))
ex_clean <- # your code here

ex_clean
#> Expected: 1 3 2 1 with no labels
```

<details>
<summary>Click to reveal solution</summary>

```r title="Solution"
ex_rating <- labelled(c(1, 3, 2, 1), c(Poor = 1, Fair = 2, Good = 3))
ex_clean <- zap_labels(ex_rating)
ex_clean
#> [1] 1 3 2 1
```

**Explanation:** zap_labels() removes the value labels and returns the underlying numeric codes. The Poor, Fair, and Good text is discarded.

</details>

## Related haven functions

**These functions pair naturally with zap_labels().** Each handles a related part of importing and cleaning labelled data.

- `zap_label()` removes the variable-level label that SPSS and Stata store.
- `zap_formats()` removes the display format string attached to a column.
- `zap_missing()` converts user-defined missing values to plain NA.
- `as_factor()` turns a labelled vector into a factor, keeping the label text.
- `read_sav()` imports the SPSS files whose columns you will be stripping.

## FAQ

**What does zap_labels() do in R?**

zap_labels() removes the value labels from a labelled vector created by haven. A labelled vector pairs each code, such as 1 or 2, with a text label like Male or Female. zap_labels() discards those labels and returns the plain codes. The result is an ordinary numeric or character vector that base R and modelling functions handle without any special treatment.

**What is the difference between zap_labels() and zap_label()?**

They remove different things. zap_labels(), plural, removes the value labels that map codes to text. zap_label(), singular, removes the variable label, the short description of the whole column. A column read from SPSS often carries both. Call zap_labels() to drop the code-to-text mapping and zap_label() to drop the column description. Use both for a completely bare vector.

**Does zap_labels() remove the variable label?**

No. zap_labels() removes only the value labels and leaves the variable label untouched. If you want the variable label gone too, call zap_label() on the result. Many users expect zap_labels() to clear everything, so a description still showing in output is a common surprise.

**How do I remove all labels from a haven data frame?**

Pass the data frame straight to zap_labels(). It applies the labelled-vector method to every column, so one call cleans the whole table. Columns that were never labelled pass through unchanged. To also drop variable labels and display formats, chain zap_label() and zap_formats() over the same data frame.

**Should I use zap_labels() or as_factor()?**

Use as_factor() when the label text matters, such as for axis labels or grouped summaries, because it keeps the meaning as factor levels. Use zap_labels() when you only need the numeric codes, for example before fitting a model that expects numbers. zap_labels() throws the labels away, while as_factor() preserves them in a different form.

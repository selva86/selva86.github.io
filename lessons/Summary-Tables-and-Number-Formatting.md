---
title: "Report-Ready Tables Lesson 2: Summary Tables & Formatting"
catalog_blurb: "Numbers people trust start with tables that are clean and clear."
description: "Build one-line summary tables and regression tables with gtsummary, then format numbers, percentages and units in R so a whole table reads cleanly."
keywords: "gtsummary, tbl_summary, tbl_regression, summary table in R, regression table R, format numbers in R, scales package, signif, round half to even, significant figures"
post_type: "LESSON"
curriculum_id: "2.7.2"
webr: true
mathjax: true
lesson_access: "free"
course_id: "da-tables"
course_title: "Report-Ready Tables in R"
course_lesson: "2"
course_total: "2"
course_landing: "Report-Tables-Course.html"
course_next: ""
course_prev: "Report-Tables-with-gt-and-flextable.html"
---

=== step === cover
::eyebrow Lesson 2 of 2
## Summary Tables & Formatting
In Lesson 1, Maya turned her bakery's product sales into a polished gt table for a loan application. The bank liked it, and asked for two more things: a one-glance summary of *who* actually shops at the bakery, and a short analysis of *what* drives how much each customer spends.

Those are two classic report tables. A **summary table** describes a whole dataset in one block (here, Members versus Guests). A **regression table** shows the effect of each factor on an outcome. This lesson builds both in about one line each, then sweats the details that make any table read cleanly: rounding, percentages, units and separators.

Toggle the table below. This is the customer summary you will be able to produce by the end.

::widget styled-table {"cols":["segment","visits","avg_spend","share"],"rows":[["Member",54,14,0.52],["Guest",66,10,0.48]],"formats":{"visits":"comma","avg_spend":"dollar","share":"pct"},"title":"Bakery customers at a glance","note":"Source: 120 sampled till visits, Q1 2026."}

By the end of this lesson you will be able to:

- Build a one-line summary table with **gtsummary**'s `tbl_summary()`, and read its median (IQR) and n (%) cells
- Turn a fitted model into a report-ready regression table with **broom** and `tbl_regression()`, and read a coefficient correctly
- Format numbers, percentages and units with the **scales** package, and choose significant figures over decimal places when magnitudes vary
- Predict R's surprising `round()` behaviour, so a rounded column never embarrasses you

**Prerequisites:** Lesson 1 of this course (gt, the `fmt_` verbs, and `scales::dollar/percent/comma`) and basic dplyr (`group_by`, `summarise`). Every new term, including the one-line model, is defined as it appears.

=== step === concept
::eyebrow The first table
## What a summary table is

A summary table answers one question at a glance: what is in this dataset? It has one row per variable, the right summary number in each cell, and usually one column per group you want to compare.

Maya pulls a sample of 120 till transactions. Each row is one visit: whether the customer is a loyalty **Member** or a **Guest**, the daypart, how many items were in the basket, and the dollars spent. Each lesson runs in a fresh R session, so we build the sample right here (run this once):

```r
set.seed(7)
n <- 120
visits <- data.frame(
  member  = factor(sample(c("Member", "Guest"), n, replace = TRUE, prob = c(0.45, 0.55))),
  daypart = factor(sample(c("Morning", "Afternoon"), n, replace = TRUE)),
  items   = rpois(n, 3) + 1                              # items in the basket
)
visits$spend <- round(2.4 * visits$items +               # about $2.40 per item, plus...
                      3.5 * (visits$member == "Member") + # members buy a little more
                      1.8 * (visits$daypart == "Afternoon") +
                      rnorm(n, 0, 1.5), 2)                # dollars spent that visit
head(visits)
#>   member   daypart items spend
#> 1 Member   Morning     2 11.59
#> 2  Guest Afternoon     2 10.09
#> 3  Guest Afternoon     7 20.30
#> 4  Guest Afternoon     5 13.51
#> 5  Guest   Morning     5 12.71
#> 6 Member Afternoon     4 14.08
```

Whatever the data, a good summary table follows the same short recipe:

::widget process-flow {"steps":[{"title":"Pick the variables","sub":"the columns worth describing: spend, items, member, daypart"},{"title":"Choose a statistic","sub":"numbers get a median and a spread; categories get a count and a percent"},{"title":"Split by group","sub":"one column per group you compare, here Member vs Guest"},{"title":"One value per cell","sub":"every variable, in every group, lands a single summary number"}]}

=== step === concept
::eyebrow One line does it all
## tbl_summary: the whole Table 1 at once

Doing this by hand is a chore. With dplyr you write a `summarise()` for every statistic you want, one group at a time:

```r
library(dplyr)
visits |>
  group_by(member) |>
  summarise(
    n         = n(),
    med_spend = median(spend),
    iqr_spend = IQR(spend),
    med_items = median(items)
  )
#> # A tibble: 2 × 5
#>   member     n med_spend iqr_spend med_items
#>   <fct>  <int>     <dbl>     <dbl>     <dbl>
#> 1 Guest     66      10.3      4.15         4
#> 2 Member    54      13.9      5.29         4
```

That is useful, but it is still raw output, and you would repeat it for every variable. The **gtsummary** package collapses the whole job into one line. `tbl_summary(by = member)` summarises every column at once, split by membership, and formats it as a publication-ready table:

```r-static
library(gtsummary)

visits |>
  tbl_summary(by = member)   # one column per group; sensible default per column type
```

For a numeric column, gtsummary reports the **median** and, in brackets, the **interquartile range**: the middle value, and the spread of the middle half of the data, \( \text{IQR} = Q_3 - Q_1 \), where \( Q_1 \) and \( Q_3 \) are the 25th and 75th percentiles. For a category, it reports the count and percent, n (%). gtsummary renders rich HTML, more than the interactive R session here draws, so the finished table is pictured below.

::widget styled-table {"cols":["segment","n","med_spend","med_items"],"rows":[["Member",54,13.9,4],["Guest",66,10.3,4]],"formats":{"n":"comma","med_spend":"1dp","med_items":"comma"},"title":"Who shops at the bakery","note":"Median spend (in dollars) and basket size by membership. n = 120 visits."}

[KEY INSIGHT]
One `tbl_summary()` call replaces a page of `summarise()` lines. You choose the grouping with `by =` and override the statistic with `statistic =`; gtsummary picks a sensible default for every column type and formats the whole thing for a reader.

=== step === quiz
::eyebrow Check yourself
## What does tbl_summary show by default?

Maya runs `tbl_summary(by = member)` without setting the `statistic` argument. For the numeric `spend` column, what does each cell show by default?

::quiz {"correct":2,"gate":true,"difficulty":"intermediate"}
- The mean and standard deviation, as mean (SD) ::no A common assumption, but not gtsummary's default. tbl_summary uses median (IQR) for continuous variables because it is robust to the skew and outliers real spend data usually has. You can switch to mean (SD) with the statistic argument.
- The median and interquartile range, as median (IQR) ::ok Correct. tbl_summary reports median (IQR) for continuous variables by default, a robust choice for skewed, outlier-prone data. Ask for mean (SD) explicitly with statistic = list(all_continuous() ~ "{mean} ({sd})").
- The minimum and maximum, the full range ::no The range swings with a single extreme value, so it is rarely a table's headline. tbl_summary defaults to median (IQR): the middle value and the spread of the middle half.

=== step === concept
::eyebrow The second table
## From a model to a regression table

Maya's second question is about cause: what drives spend, the basket size, membership, or the time of day? The tool is a **linear model**. `lm(spend ~ items + member + daypart)` finds the combination of effects that best predicts spend from those three columns. You do not need the math behind the fit to use the result; you need to read its coefficients.

The model estimates one number, a **coefficient**, for each predictor:

\( \widehat{\text{spend}} = \beta_0 + \beta_1\,\text{items} + \beta_2\,\text{member} + \beta_3\,\text{daypart} \)

Each coefficient \( \beta_j \) is the change in predicted spend for a one-unit increase in that predictor, holding the others fixed. The **broom** package turns the fitted model into a tidy data frame, one row per coefficient, with the estimate, a 95% confidence interval (the plausible range for the true effect) and a p-value (small when the effect is unlikely to be noise; below 0.05 is the usual cutoff):

```r
library(broom)
model <- lm(spend ~ items + member + daypart, data = visits)
tidy(model, conf.int = TRUE)
#> # A tibble: 4 × 7
#>   term           estimate std.error statistic  p.value conf.low conf.high
#>   <chr>             <dbl>     <dbl>     <dbl>    <dbl>    <dbl>     <dbl>
#> 1 (Intercept)        3.36    0.432       7.79 3.13e-12     2.51      4.22
#> 2 items              2.04    0.0962     21.2  8.84e-42     1.85      2.23
#> 3 memberMember       3.38    0.284      11.9  8.14e-22     2.82      3.94
#> 4 daypartMorning    -2.07    0.287      -7.23 5.66e-11    -2.64     -1.50
```

`tidy()` is readable but bare. **gtsummary::tbl_regression()** wraps the same model into a report table: clean labels, the coefficient (it labels it **Beta**), the 95% confidence interval and the p-value, formatted and ready to drop into a document:

```r-static
library(gtsummary)

tbl_regression(model)   # the same model, formatted for a reader
```

Read the `items` row: each extra item in the basket is worth about $2.04 more spend, holding membership and daypart fixed. The whole journey from data to readable table is four moves:

::widget process-flow {"steps":[{"title":"Fit","sub":"lm(spend ~ items + member + daypart) estimates each effect"},{"title":"Tidy","sub":"broom::tidy() turns the model into a data frame of coefficients"},{"title":"Report","sub":"gtsummary::tbl_regression() labels and formats it, with confidence intervals"},{"title":"Read","sub":"each row shows how one predictor moves spend, with the others held fixed"}]}

=== step === quiz
::eyebrow Check yourself
## Read the coefficient

In Maya's regression table, the `items` row has an estimate (Beta) of about **2.04**, with a p-value far below 0.05. What does that tell her?

::quiz {"correct":1,"gate":true,"difficulty":"intermediate"}
- Each extra item in the basket is associated with about $2.04 more spend, holding membership and daypart fixed ::ok Exactly. A linear-model coefficient is the change in the predicted outcome per one-unit increase in that predictor, with the others held constant. One more item, about $2.04 more spend.
- Items explain about 2.04% of the variation in spend ::no That would be a measure of fit, like R-squared, not a coefficient. The 2.04 is in dollars per item (the slope), not a share of variance explained.
- A typical basket holds about 2.04 items ::no That confuses the coefficient with an average. 2.04 is the effect of one more item on spend (about $2.04), not the mean basket size, which is about 4 items here.

=== step === concept
::eyebrow Make every number read
## The three jobs of number formatting

A table can have the right structure and still read badly if the numbers are raw. Formatting a number for a reader is really three small jobs:

1. **Round** it to a sensible precision, so `14.6231` does not shout false exactness.
2. **Separate** the thousands, so `218450` becomes `218,450` at a glance.
3. **Add the symbol or unit**, so a bare `0.48` becomes `48%` and `2.4` becomes `$2.40`.

The **scales** package (you met `dollar`, `percent` and `comma` in Lesson 1) does all three. Here it is on Maya's quarter headline figures:

```r
library(scales)
dollar(c(5520, 218450))                        # money, with separators
#> [1] "$5,520"   "$218,450"
percent(0.4823, accuracy = 1)                  # a proportion as a whole percent
#> [1] "48%"
comma(1234567)                                 # plain thousands separators
#> [1] "1,234,567"
number(218450, scale_cut = cut_short_scale())  # a short, human scale
#> [1] "218K"
number(2.4, prefix = "$", suffix = " / item", accuracy = 0.01)  # a custom unit
#> [1] "$2.40 / item"
```

Toggle the table below between the raw print and the report version. The structure is identical; only the formatting changed, and only one of them is something you would hand a bank.

::widget styled-table {"cols":["segment","revenue","share","avg_basket"],"rows":[["Members",105320,0.4823,14.62],["Guests",113130,0.5177,11.2]],"formats":{"revenue":"dollar","share":"pct","avg_basket":"1dp"},"title":"Q1 revenue by membership","note":"Toggle raw vs report: the same numbers, formatted to read at a glance."}

=== step === concept
::eyebrow Precision, done right
## Significant figures, decimals, and a rounding surprise

How many digits should a number show? There are two different rules, and they do not agree:

- **Decimal places**, `round(x, d)`, keeps `d` digits after the point. `round(1287.4, 1)` stays `1287.4`; `round(0.04231, 3)` gives `0.042`.
- **Significant figures**, `signif(x, d)`, keeps the `d` most meaningful digits, wherever the decimal point falls. `signif(0.04231, 3)` gives `0.0423`; `signif(1287.4, 3)` gives `1290`.

When a column mixes large and small numbers, significant figures keep each one equally informative; fixed decimals can crush a small value to `0.000`.

```r
round(0.04231, 3)    # 3 decimal places: only 2 useful digits survive
#> [1] 0.042
signif(0.04231, 3)   # 3 significant figures: keeps 0.0423
#> [1] 0.0423
signif(1287.4, 3)    # 3 significant figures, large number
#> [1] 1290
```

Now the surprise. R does not round halves the way you were taught in school. It uses **round half to even** (banker's rounding): a trailing 5 goes to the nearest *even* digit, which stops rounding from biasing a long column upward.

```r
round(c(0.5, 1.5, 2.5, 3.5))   # NOT 1, 2, 3, 4
#> [1] 0 2 2 4
round(2.675, 2)                # and floating point bites: not 2.68
#> [1] 2.67
```

[WARNING]
`round(2.5)` is `2`, not `3`, and `round(0.5)` is `0`. If a hand-checked total does not match R's rounded column, this is usually why. And `round(2.675, 2)` returns `2.67` because `2.675` cannot be stored exactly in binary (it is really `2.6749...`). Format for display at the very end with `scales`, and never re-round an already-rounded number.

=== step === quiz
::eyebrow Check yourself
## What does round(2.5) return?

In R, what does `round(2.5)` evaluate to?

::quiz {"correct":2,"gate":true,"difficulty":"intermediate"}
- 3, because a trailing .5 always rounds up ::no That is the school rule (round half up), but it is not what R does. Rounding every half upward would bias a long column upward.
- 2, because R rounds a half to the nearest even number ::ok Correct. R uses round half to even (banker's rounding), so 2.5 goes to the even 2, and 0.5 goes to 0. It keeps rounding from systematically inflating a sum.
- 2.5, because round leaves a .5 untouched ::no With no digits argument, round() rounds to a whole number, so it does change 2.5. The result is 2, because halves go to the nearest even digit.

=== step === tryit
::eyebrow Your turn
## Format the report numbers

Maya's headline figures are still raw: total revenue `218450` and the members' share `0.4823`. Turn them into the strings a reader expects. Revenue is already done with `dollar()`; fill in the **scales** helper that turns a proportion like `0.4823` into a whole-number percentage like `48%`.

```r
library(scales)
dollar(218450, accuracy = 1)     # -> "$218,450"
____(0.4823, accuracy = 1)       # -> "48%"
```
::check {"regex":"percent","gate":true,"difficulty":"beginner","ok":"Yes. percent(0.4823, accuracy = 1) returns 48 percent as a string: it multiplies the proportion by 100 and rounds to a whole number. Store proportions (0.4823) and let percent() do the conversion at display time.","no":"You want a proportion shown as a percent. The scales helper is percent(): write percent(0.4823, accuracy = 1)."}
::solution
```r
library(scales)
dollar(218450, accuracy = 1)     # "$218,450"
percent(0.4823, accuracy = 1)    # "48%"
```

=== step === concept
::eyebrow Go deeper
## References

A few authoritative places to take this further:

- [gtsummary: the official site](https://www.danieldsjoberg.com/gtsummary/) - the package behind `tbl_summary` and `tbl_regression`, with a gallery and every customization argument.
- [gtsummary: the tbl_summary vignette](https://www.danieldsjoberg.com/gtsummary/articles/tbl_summary.html) - the defaults you saw (median (IQR), n (%)) and how to change them.
- [scales: formatting numbers and labels](https://scales.r-lib.org/) - `dollar()`, `percent()`, `comma()`, `number()` and the `label_` helpers for clean axes and tables.
- [base R: the round() documentation](https://stat.ethz.ch/R-manual/R-devel/library/base/html/Round.html) - the official word on round half to even (IEC 60559), and how `signif()` differs.

=== step === complete
## Lesson 2 complete

You can now build the two tables a report most often needs, each in about one line. **tbl_summary()** turns a whole dataset into a grouped Table 1 (median (IQR) for numbers, n (%) for categories); **tbl_regression()** turns a fitted model into a clean coefficient table you can actually read. And you can make any table read cleanly: format with **scales**, choose **significant figures** over fixed decimals when magnitudes vary, and you will never again be surprised that `round(2.5)` is `2`.

That completes **Report-Ready Tables in R**. From Lesson 1's first gt table to the summary and regression tables here, you have the full toolkit to turn an analysis into something a reader, or a bank, trusts at a glance.

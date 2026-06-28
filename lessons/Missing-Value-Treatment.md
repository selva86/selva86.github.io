---
title: "Data Wrangling Lesson 4: Find and treat missing data"
description: "Find missing values in R, learn why data goes missing (MCAR, MAR, MNAR), and weigh dropping versus imputing (mean, median, mode) so your numbers stay honest."
keywords: "missing values in R, NA, drop_na, replace_na, coalesce, imputation, mean imputation, median, mode, MCAR, MAR, MNAR, complete.cases, tidyr, dplyr"
post_type: "LESSON"
curriculum_id: "2.1.4"
webr: true
mathjax: true
lesson_access: "free"
course_id: "da-dplyr"
course_title: "Data Wrangling with dplyr"
course_lesson: "4"
course_total: "4"
course_landing: "Data-Wrangling-dplyr-Course.html"
course_next: ""
course_prev: "Group-Summarise-and-Clean-in-dplyr.html"
---

=== step === cover
::eyebrow Lesson 4 of 4
## The holes in your data

In Lesson 3 you met one blank cell, the unlogged Bagel sale, and patched it with `na.rm = TRUE`. Real data is never that tidy. Maya ran a quick exit survey one busy morning, twelve customers, five questions each, and came back with a table full of holes: a spend she never recorded, a rating the tablet ate, tips people simply would not say.

The wrong move is to delete every row with a blank and carry on. As you will see, that throws away two thirds of Maya's survey and quietly biases what is left. This lesson is about treating those holes **honestly**.

By the end you will be able to:

- Find and count missing values, and see how far the damage spreads
- Name why data goes missing (the three mechanisms: MCAR, MAR, MNAR)
- Choose between dropping and filling, and say how each choice bends the answer

**Prerequisites:** Lessons 1 to 3 of this course, so you know [tidy data](Importing-and-Tidy-Data-in-R.html), the [dplyr verbs and the pipe](The-dplyr-Verbs.html), and [group_by / summarise with na.rm](Group-Summarise-and-Clean-in-dplyr.html). Everything new is defined as it appears.

::widget chart-plotter {"data":[{"x":"spend","y":3},{"x":"rating","y":2},{"x":"tip","y":4}],"geoms":["col"],"x":"column","y":"missing values","code":{"col":"survey %>%\n  summarise(across(everything(),\n    ~ sum(is.na(.))))"}}

=== step === concept
::eyebrow First, see it
## Find the holes before you fix them

Here is Maya's survey. Each lesson starts in a fresh R session, so we build the table right here (run this once). A blank answer is stored as `NA`, which R reads as "a value exists but I do not know it". One column carries each kind of hole, and we will return to that on purpose.

```r
library(dplyr)    # the verbs and the pipe
library(tibble)   # tibble()

survey <- tibble(
  customer = c("Ana","Ben","Cara","Dan","Eve","Finn","Gus","Hana","Ivy","Jon","Kim","Leo"),
  payment  = c("card","cash","card","card","cash","card","card","cash","card","cash","card","card"),
  spend    = c(  12,   NA,   18,    9,   NA,   25,   14,    8,   11,   NA,   30,   16),
  rating   = c(   5,    4,   NA,    4,    5,    4,    2,   NA,    5,    3,    4,    3),
  tip      = c(   3,    2,    4,   NA,    5,    6,   NA,    3,    4,   NA,    8,   NA)
)
survey
#> # A tibble: 12 x 5
#>    customer payment spend rating   tip
#>    <chr>    <chr>   <dbl>  <dbl> <dbl>
#>  1 Ana      card       12      5     3
#>  2 Ben      cash       NA      4     2
#>  3 Cara     card       18     NA     4
#>  4 Dan      card        9      4    NA
#>  5 Eve      cash       NA      5     5
#>  6 Finn     card       25      4     6
#>  7 Gus      card       14      2    NA
#>  8 Hana     cash        8     NA     3
#>  9 Ivy      card       11      5     4
#> 10 Jon      cash       NA      3    NA
#> 11 Kim      card       30      4     8
#> 12 Leo      card       16      3    NA
```

`is.na(x)` is the workhorse: it returns `TRUE` wherever a value is missing. Wrap it in `sum()` to count blanks, and `colSums()` to count them per column:

```r
colSums(is.na(survey))
#> customer  payment    spend   rating      tip
#>        0        0        3        2        4
```

So nine cells are blank: three spends, two ratings, four tips. The dplyr way says the same thing, one verb per column:

```r
survey %>% summarise(across(everything(), ~ sum(is.na(.))))
#> # A tibble: 1 x 5
#>   customer payment spend rating   tip
#>      <int>   <int> <int>  <int> <int>
#> 1        0       0     3      2     4
```

Counting per column hides something, though. The real question is how many whole **rows** are usable. `complete.cases()` flags the rows with no blank anywhere:

```r
sum(complete.cases(survey))    # rows with zero missing values
#> [1] 4
mean(complete.cases(survey))   # ... as a share of all 12 rows
#> [1] 0.3333333
```

Only four of the twelve customers, Ana, Finn, Ivy and Kim, answered every question. Nine scattered blanks have spoiled two thirds of the rows.

=== step === quiz
::eyebrow Check yourself
## Where did the rows go?

Only **3** of the 12 spend values are missing, yet `complete.cases()` says only **4** rows are fully complete. Why are eight rows incomplete when one column lost just three values?

::quiz {"correct":1,"gate":true,"difficulty":"beginner"}
- A row is incomplete if it has a blank in ANY column, and the 9 blanks fall in 8 different rows ::ok Right. The three missing columns rarely overlap: spend, rating and tip lost values in mostly different customers, so the holes touch 8 separate rows. Per-column counts always understate how many rows are affected.
- complete.cases() counted each of the 9 blank cells as its own row ::no It counts rows, not cells. It returns one TRUE/FALSE per row, TRUE only when every column in that row is present, so a single blank anywhere makes the whole row incomplete.
- complete.cases() miscounts when the table has text columns ::no It handles every column type. `customer` and `payment` simply have no blanks, so they never cause a row to be dropped here.

=== step === concept
::eyebrow Then, ask why
## Three reasons data goes missing

Before you touch a blank, ask *why it is blank*, because the answer decides whether any fix is safe. Statisticians sort missingness into three mechanisms, and Maya's three leaky columns are one clean example of each.

| Mechanism | Plain meaning | Maya's column | Bias risk |
|---|---|---|---|
| **MCAR** (missing completely at random) | The blank has nothing to do with any value, seen or unseen | `rating`: the tablet battery died for two customers | Low: the survivors still look like everyone else |
| **MAR** (missing at random) | The blank depends on another column you DID record | `spend`: card auto-logs, cash sometimes did not | Medium: fixable if you use the observed driver (`payment`) |
| **MNAR** (missing not at random) | The blank depends on the missing value itself | `tip`: people who tipped little just skipped the question | High: the people who answered are not like the ones who did not |

The names are slippery, so anchor them to the story. The dead tablet did not care who Cara and Hana were or how they would have rated, so `rating` is **MCAR**, the benign case. Cash customers were likelier to have an unrecorded `spend`, and `payment` is right there in the table, so `spend` is **MAR**. The customers who left no tip are exactly the ones who declined to report it, and we never see those values, so `tip` is **MNAR**, the dangerous case.

[KEY INSIGHT]
You can never *prove* the mechanism from the data alone, because MNAR depends on values you cannot see. You reason it out from how the data was collected. That judgement, not the R code, is the hard part of missing-value work.

=== step === quiz
::eyebrow Check yourself
## The tip column

The customers who left little or no tip are the ones who skipped the tip question, so `tip` is missing exactly for the low tippers. Maya thinks of filling every blank tip with the average of the tips she *did* collect ($4.4). Which mechanism is this, and why is that fill dangerous?

::quiz {"correct":1,"gate":true,"difficulty":"advanced"}
- MNAR: the blanks depend on the unseen tip itself, so the customers who answered are not representative and their $4.4 average is already too high ::ok Exactly. The reported tips skew high because the low tippers censored themselves. Filling blanks with that inflated average bakes the bias in deeper, it does not remove it.
- MCAR: the blanks are random, so filling them with the mean is perfectly safe ::no MCAR would mean the missing tips look like the observed ones. They do not: only the small tippers went silent, so the observed mean is not a fair stand-in.
- MAR: the missingness depends only on an observed column, so adjusting for that column removes the bias ::no That is the MAR remedy, but here the missingness depends on the tip value itself, which you never observe, so no observed column can fully correct it.

=== step === concept
::eyebrow Treatment one
## Drop: simple, and quietly expensive

The bluntest fix is to throw away rows with blanks. `drop_na()` from tidyr keeps only the complete rows; with no arguments it drops a row that is blank in *any* column.

```r
library(tidyr)              # drop_na()

survey %>% drop_na()        # keep only fully complete rows
#> # A tibble: 4 x 5     (Ana, Finn, Ivy, Kim)

survey %>% drop_na(spend)   # or drop rows missing one named column
#> # A tibble: 9 x 5
```

Pressing Run below shows the damage from the full `drop_na()`: eight of twelve customers vanish.

::widget table-transform {"code":"survey %>% drop_na()","caption":"drop_na() keeps only rows with no blank anywhere. Eight of twelve customers had at least one missing answer, so listwise deletion discards two thirds of the survey.","before":{"cols":["customer","payment","spend","rating","tip"],"rows":[["Ana","card",12,5,3],["Ben","cash",null,4,2],["Cara","card",18,null,4],["Dan","card",9,4,null],["Eve","cash",null,5,5],["Finn","card",25,4,6],["Gus","card",14,2,null],["Hana","cash",8,null,3],["Ivy","card",11,5,4],["Jon","cash",null,3,null],["Kim","card",30,4,8],["Leo","card",16,3,null]]},"after":{"cols":["customer","payment","spend","rating","tip"],"rows":[["Ana","card",12,5,3],["Finn","card",25,4,6],["Ivy","card",11,5,4],["Kim","card",30,4,8]]}}

Dropping rows like this (called *listwise deletion*) is honest only when the blanks are MCAR. Here they are not, and there is a second cost: the four survivors are all card customers who spent a lot, so the average spend over the complete rows is badly skewed.

```r
survey %>% drop_na() %>% summarise(mean_spend = mean(spend))
#> # A tibble: 1 x 1
#>   mean_spend
#>        <dbl>
#> 1       19.5
```

When too many rows would die for one bad column, the alternative is to **drop that column** instead with `select(-tip)`, keeping every customer. Both moves trade information for tidiness; the skill is knowing which you can afford to lose.

=== step === concept
::eyebrow Treatment two
## Impute: fill the blank with a stand-in

The other option is to *impute*: replace each blank with a plausible value so the row survives. The four common stand-ins:

| Method | Fills the blank with | Best when |
|---|---|---|
| **mean** | the column average | numeric, roughly symmetric, MCAR |
| **median** | the column's middle value | numeric and skewed, or with outliers |
| **mode** | the most common value | a category or a discrete code |
| **LOCF** | the previous value in order | time-ordered data with short gaps |

The mean is the arithmetic average you met in Lesson 3: for values \(x_1, \dots, x_n\), where \(x_i\) is one observed spend and \(n\) the number observed,

\[ \bar{x} = \frac{1}{n}\sum_{i=1}^{n} x_i. \]

`coalesce()` fills a blank with the first non-missing value you give it, so it makes mean or median imputation a one-liner. Maya's spend is right-skewed (one $30 sale), so watch how the two stand-ins differ:

```r
survey %>%
  mutate(spend_mean = coalesce(spend, mean(spend, na.rm = TRUE)),
         spend_med  = coalesce(spend, median(spend, na.rm = TRUE))) %>%
  select(customer, payment, spend, spend_mean, spend_med)
#> # A tibble: 12 x 5  (the three blank rows shown)
#>   customer payment spend spend_mean spend_med
#>   <chr>    <chr>   <dbl>      <dbl>     <dbl>
#> 2 Ben      cash       NA       15.9        14
#> 5 Eve      cash       NA       15.9        14
#> 10 Jon     cash       NA       15.9        14
```

The mean fills each blank with 15.9, the median with the sturdier 14. For a category you would use the **mode** instead, the most frequent level:

```r
sort(table(survey$rating), decreasing = TRUE)   # rating is a discrete 1 to 5 score
#> 4 5 3 2
#> 4 3 2 1
```

Rating 4 is the mode (it appears four times), so it is the natural fill for a missing rating. And for time-ordered data, **last observation carried forward** repeats the previous reading, which only makes sense in row order:

```r-static
# LOCF: only for time-ordered data, e.g. Maya's daily sales from Lesson 3
daily %>% arrange(date) %>% fill(temperature, .direction = "down")
```

[NOTE]
Imputing keeps every row, but it invents data: it shrinks the natural spread of the column and, under MNAR, it cements the bias rather than removing it. A filled value is a guess wearing the costume of a measurement.

=== step === widget
::eyebrow The payoff
## Same data, three different answers

Here is why the choice matters. Below are three honest ways to estimate Maya's average spend from the *same* survey: drop the incomplete rows, keep all observed spends with `na.rm`, or impute each missing cash spend with the average spend of cash customers. Every bar is a real number computed from the data, yet they disagree by six dollars.

::widget chart-plotter {"data":[{"x":"drop rows","y":19.5},{"x":"na.rm only","y":15.9},{"x":"impute by group","y":13.9}],"geoms":["col"],"x":"how we handle the missing spend","y":"estimated mean spend ($)","code":{"col":"# same survey, three defensible estimates\n# drop rows:        complete cases only\n# na.rm only:       average the observed spends\n# impute by group:  fill cash blanks with the cash mean"}}

Dropping rows gives **$19.5**, because the survivors happen to be big-spending card customers. Averaging the observed spends gives **$15.9**. But the blanks are MAR, missing mostly for *cash* customers, who spent far less. Filling each blank with the average of the cash spends Maya *did* record pulls the estimate down to **$13.9**, the most defensible of the three. The lesson is not "imputing is best"; it is that your treatment of the holes can move the headline number more than the real data does, so the choice must be deliberate and disclosed.

=== step === tryit
::eyebrow Your turn
## Impute the honest way

Mean-imputing every blank spend with the overall average ($15.9) overstates Maya's takings, because the missing spends belong to cheaper cash customers. Fix it: group the survey by `payment` first, so each blank is filled with the mean spend of *its own* payment type. Fill in the blank.

```r
survey %>%
  group_by(______) %>%
  mutate(spend_filled = coalesce(spend, mean(spend, na.rm = TRUE))) %>%
  ungroup()
```
::check {"regex":"group_by\\(\\s*payment","gate":true,"difficulty":"intermediate","ok":"That is the MAR fix: grouping by payment fills the cash blanks with the cash average (about $8), not the inflated $15.9 overall mean, so the estimate stops overstating spend. Conditioning on the observed driver is what makes MAR repairable.","no":"Group by the column that explains the missingness: group_by(payment). Then coalesce() fills each blank with its own group's mean."}
::solution
```r
survey %>%
  group_by(payment) %>%
  mutate(spend_filled = coalesce(spend, mean(spend, na.rm = TRUE))) %>%
  ungroup()
```

=== step === concept
::eyebrow Go deeper
## References

A few authoritative places to take this further:

- [R for Data Science (2e), Missing values](https://r4ds.hadley.nz/missing-values) - the canonical, free chapter on explicit and implicit `NA`s and how to handle them in the tidyverse.
- [tidyr: replace_na() and fill() reference](https://tidyr.tidyverse.org/reference/replace_na.html) - the official docs for the imputation verbs you used here.
- [van Buuren, Flexible Imputation of Missing Data (free online)](https://stefvanbuuren.name/fimd/) - the standard modern text; chapter 1 explains MCAR/MAR/MNAR carefully and why single-value imputation understates uncertainty.
- [naniar: tidy tools for missing data](https://naniar.njtierney.com/) - an R package for visualising and exploring missingness patterns before you treat them.
- [Rubin (1976), Inference and missing data, Biometrika 63(3)](https://doi.org/10.1093/biomet/63.3.581) - the paper that defined the three mechanisms you used to reason about Maya's columns.

=== step === complete
## Lesson 4 complete, and the course with it

You can now treat missing data honestly. You **found** it with `is.na`, `colSums` and `complete.cases`; you asked **why** it was missing (MCAR, MAR, MNAR) before touching it; you weighed **dropping** rows or columns against **imputing** with the mean, median, mode or LOCF; and you saw how the same survey yields three different averages depending on that one choice, so you now know to make it deliberately and write it down.

That closes **Data Wrangling with dplyr**. Across four lessons you went from a raw CSV to tidy data, learned the one-table verbs and the pipe, grouped and summarised, and now clean missing values with judgement. Two natural next courses build straight on this: **Joining and Reshaping** (combining several tables and pivoting between long and wide), and **Exploratory Data Analysis** (turning these skills loose on a brand-new dataset). Maya can run her bakery on numbers she trusts, and so can you.

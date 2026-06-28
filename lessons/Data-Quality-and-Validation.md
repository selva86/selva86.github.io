---
title: "Exploratory Data Analysis Lesson 8: Data Quality & Validation"
catalog_blurb: "Check data against expectations so problems surface early."
description: "Validate a data export before you trust it: check column types, ranges, consistency and key integrity in R, then codify the checks as reusable validation rules."
keywords: "data quality, data validation in R, check column types, parse_number, impossible values, duplicate rows, primary key, validation rules, stopifnot, pointblank, readr, dplyr"
post_type: "LESSON"
curriculum_id: "2.3.8"
webr: true
mathjax: true
lesson_access: "free"
course_id: "da-eda"
course_title: "Exploratory Data Analysis in R"
course_lesson: "8"
course_total: "8"
course_landing: "EDA-Course.html"
course_next: ""
course_prev: "Multivariate-EDA-with-Pairs-and-PCA.html"
---

=== step === cover
::eyebrow Lesson 8 of 8
## Data Quality & Validation
In Lesson 7 you compressed six of Maya's bakery columns into two clean PCA components. Every method in this course, the histogram in Lesson 1, the correlation in Lesson 2, the outlier rules in Lesson 3, the PCA in Lesson 7, quietly assumed one thing: that the numbers it was handed were real. This lesson questions that assumption before you ever plot a thing.

Maya has stopped typing her numbers in by hand. Her till now emails her a spreadsheet every Monday, `bakery_week.csv`, and she wants to run the same analysis on it automatically each week. The trouble is that an automatic export is a **promise, not a fact**: a stray dollar sign, a sensor that misfires, a day logged twice, and your tidy pipeline produces a confident, wrong answer.

Below is the export that just landed: ten rows for two weeks of trading. It looks fine at a glance. In fact it hides five different problems, one for each check you are about to learn, and any one of them would poison a mean, a correlation or a PCA. By the end of this lesson you will catch every one in seconds, every week, without looking.

By the end of this lesson you will be able to:

- Run a repeatable **five-point quality pass** on a fresh export before trusting it
- Spot and fix wrong column **types** (text that should be a number)
- Catch impossible values with **range** and cross-field **consistency** checks, and tell an impossible value apart from a genuine outlier
- Verify **uniqueness and key integrity**, finding duplicate rows and a broken primary key
- **Codify** every check as a reusable rule that re-runs itself on next week's export

**Prerequisites:** you can run R and load a package with `library()`. It helps to have met the [EDA framework](An-EDA-Framework-and-One-Variable.html) (Lesson 1), [correlation](Two-Variables-and-Correlation-in-R.html) (Lesson 2), and especially [outliers and the outlier-versus-error distinction](Outliers-and-Automated-EDA.html) (Lesson 3, the $905 festival day). Every new term is defined as it appears.

::widget styled-table {"cols":["date","foot_traffic","transactions","revenue","temp_f","pastries"],"rows":[["2026-03-02",170,132,"$510",71,88],["2026-03-03",196,157,"$600",70,95],["2026-03-04",146,110,"$435",68,72],["2026-03-05",99,157,"$588",66,101],["2026-03-06",228,184,"$1,250",65,130],["2026-03-09",113,90,"$377",74,64],["2026-03-10",90,70,"$300",75,"NA"],["2026-03-11",154,121,"$455",203,96],["2026-03-11",154,121,"$455",203,96],["2026-03-12",163,128,"$522",59,85]],"title":"bakery_week.csv (latest export)","note":"Ten rows came in. Several are quietly wrong. Which ones?"}

=== step === concept
::eyebrow What we are checking
## Data quality is "fitness for use"

**Data quality** is not about perfection, it is about **fitness for use**: is this table good enough to answer the question you are about to ask of it? A festival day of $1,250 is unusual but perfectly real and usable; a temperature reading of 203 degrees is not a hot day, it is a broken thermometer, and it will wreck any average it touches.

The good news is that almost every real defect falls into one of **five buckets**. Walk a fresh export through these five checks, in order, and you will catch the overwhelming majority of problems before they reach your analysis:

- **Types**: is each column the *kind* of thing it should be (a number stored as a number, not as text)?
- **Ranges**: is every value physically possible (no 203-degree day, no negative count)?
- **Completeness**: are the values that should be there actually present, or are some missing?
- **Consistency**: do related columns agree with each other (you cannot ring up more sales than people who walked in)?
- **Keys**: is each row a distinct thing, one row per day, with no duplicates?

::widget process-flow {"steps":[{"title":"Types","sub":"is each column the kind it should be"},{"title":"Ranges","sub":"is every value physically possible"},{"title":"Completeness","sub":"are any required values missing"},{"title":"Consistency","sub":"do related columns agree"},{"title":"Keys","sub":"one row per thing, no duplicates"}]}

[KEY INSIGHT]
The whole point of this lesson is the last word in each bucket: a **check**. A check is just a yes/no question you can write as code. Once it is code, it costs nothing to run it again on next week's export, and the week after that. You do the thinking once; the computer does the watching forever.

=== step === concept
::eyebrow Check 1 of 5
## Types: a number hiding as text

The first thing to verify is that each column holds the **type** you expect. A column's type is the kind of value it stores: a `<dbl>` (a double, that is, a number you can do arithmetic on), a `<chr>` (character, plain text), a `<date>`, and so on. Get this wrong and nothing downstream works: you cannot average text.

Each lesson runs in its own interactive R session, so let us load Maya's export right here. We hold the raw CSV as a block of text and read it with `read_csv()`, which guesses a type for every column:

```r
library(readr)
library(dplyr)

raw_csv <- "date,weekday,foot_traffic,transactions,revenue,temp_f,pastries
2026-03-02,Mon,170,132,$510,71,88
2026-03-03,Tue,196,157,$600,70,95
2026-03-04,Wed,146,110,$435,68,72
2026-03-05,Thu,99,157,$588,66,101
2026-03-06,Fri,228,184,\"$1,250\",65,130
2026-03-09,Mon,113,90,$377,74,64
2026-03-10,Tue,90,70,$300,75,NA
2026-03-11,Wed,154,121,$455,203,96
2026-03-11,Wed,154,121,$455,203,96
2026-03-12,Thu,163,128,$522,59,85"

raw <- read_csv(I(raw_csv), show_col_types = FALSE)
raw
#> # A tibble: 10 x 7
#>    date       weekday foot_traffic transactions revenue temp_f pastries
#>    <date>     <chr>          <dbl>        <dbl> <chr>    <dbl>    <dbl>
#>  1 2026-03-02 Mon              170          132 $510        71       88
#>  2 2026-03-03 Tue              196          157 $600        70       95
#>  3 2026-03-04 Wed              146          110 $435        68       72
#>  4 2026-03-05 Thu               99          157 $588        66      101
#>  5 2026-03-06 Fri              228          184 $1,250      65      130
#>  6 2026-03-09 Mon              113           90 $377        74       64
#>  7 2026-03-10 Tue               90           70 $300        75       NA
#>  8 2026-03-11 Wed              154          121 $455       203       96
#>  9 2026-03-11 Wed              154          121 $455       203       96
#> 10 2026-03-12 Thu              163          128 $522        59       85
```

Read the type printed under each column name. `foot_traffic`, `transactions`, `temp_f` and `pastries` came in as `<dbl>`, good. But look at `revenue`: it is `<chr>`, **text**, not a number. The dollar signs and the comma in `$1,250` told `read_csv()` "this column is not purely numeric," so it stored every value as a string. Confirm it directly:

```r
class(raw$revenue)
#> [1] "character"
```

That single fact is a silent landmine. Ask R for `mean(raw$revenue)` and it does not compute the average, it warns and returns `NA`. Every revenue calculation in your pipeline would quietly fail.

=== step === tryit
::eyebrow Your turn
## Turn the text back into numbers

To fix a text-number you **coerce** it: convert it to the right type. `readr`'s `parse_number()` is built for exactly this, it reads through a string, ignores currency symbols and thousands separators, and returns the number inside. Fill in the blank to coerce `revenue`, then check the column's type:

```r
clean <- raw |> mutate(revenue = ____(revenue))
class(clean$revenue)   # should now read "numeric"
```
::check {"regex":"parse_number","gate":true,"difficulty":"beginner","ok":"That strips the $ and the comma and returns the number, so $1,250 becomes 1250 and the column is numeric. Now you can average it.","no":"Use parse_number(): mutate(revenue = parse_number(revenue))."}
::solution
```r
clean <- raw |> mutate(revenue = parse_number(revenue))
class(clean$revenue)
#> [1] "numeric"
```

=== step === concept
::eyebrow Checks 2 and 3 of 5
## Ranges and completeness: possible, and present?

With the types fixed, ask the next question of every numeric column: **is each value even possible?** This is the **range check**. You declare a plausible lower bound \(\ell\) and upper bound \(u\) for a column from what you know about the world, and call a value \(x\) valid when

\[ \ell \le x \le u \]

For a temperature in Maya's town, no real day is below \(\ell = 20\) or above \(u = 110\) degrees. Scan `temp_f` against that range and the broken thermometer falls right out:

```r
# a value is impossible if it lands outside a range you know to be real
clean |> filter(temp_f < 20 | temp_f > 110)
#> # A tibble: 2 x 7
#>   date       weekday foot_traffic transactions revenue temp_f pastries
#>   <date>     <chr>          <dbl>        <dbl>   <dbl>  <dbl>    <dbl>
#> 1 2026-03-11 Wed              154          121     455    203       96
#> 2 2026-03-11 Wed              154          121     455    203       96
```

Two rows report 203 degrees. That is not weather, it is a sensor glitch, and it would drag the average temperature far above any real day.

The same first pass answers the **completeness** check: are any required values **missing**? In R a missing value is `NA`. The completeness of a table is the share of its cells that are filled in,

\[ \text{completeness} = 1 - \frac{m}{n \times p} \]

where \(m\) is the number of missing cells, \(n\) the number of rows and \(p\) the number of columns. Count the gaps per column with one line:

```r
colSums(is.na(clean))
#>         date      weekday foot_traffic transactions      revenue       temp_f     pastries
#>            0            0            0            0            0            0            1
```

One value is missing, a `pastries` count on 2026-03-10. Finding it is this lesson's job; deciding what to do with it (drop the row, or fill it in) is its own craft, covered in [Missing-Value Treatment](Missing-Value-Treatment.html).

[NOTE]
A range is a judgement you supply, not something R can know. "Between 20 and 110 degrees" comes from you understanding the data. The check only catches what you thought to bound, which is exactly why writing the bounds down, as code, is the whole game.

=== step === concept
::eyebrow Check 4 of 5
## Consistency: do the columns agree?

A value can be the right type and inside its own range and *still* be wrong, because it contradicts another column. That is a **consistency** (or cross-field) check: a rule that ties two or more columns together.

Maya's bakery has an obvious one. `transactions` is the number of sales rung up, and `foot_traffic` is the number of people who came through the door. You cannot make more sales than you had customers, so every honest row must satisfy `transactions <= foot_traffic`. Test it:

```r
clean |> filter(transactions > foot_traffic)
#> # A tibble: 1 x 7
#>   date       weekday foot_traffic transactions revenue temp_f pastries
#>   <date>     <chr>          <dbl>        <dbl>   <dbl>  <dbl>    <dbl>
#> 1 2026-03-05 Thu               99          157     588     66      101
```

One row breaks the rule: 157 sales from only 99 customers. Each value on its own looked fine (99 is a plausible footfall, 157 a plausible sale count); only by **relating** them did the error surface. It is almost certainly a typo, perhaps `foot_traffic` should read 199. Run the rule below and watch the impossible row get struck out of the valid set:

::widget table-transform {"code":"clean |> filter(transactions <= foot_traffic)","caption":"The rule keeps only rows where sales do not exceed footfall. The 2026-03-05 row (157 sales, 99 customers) is impossible, so it is struck out of the valid set.","before":{"cols":["date","foot_traffic","transactions"],"rows":[["2026-03-02",170,132],["2026-03-03",196,157],["2026-03-04",146,110],["2026-03-05",99,157],["2026-03-06",228,184]]},"after":{"cols":["date","foot_traffic","transactions"],"rows":[["2026-03-02",170,132],["2026-03-03",196,157],["2026-03-04",146,110],["2026-03-06",228,184]]}}

=== step === quiz
::eyebrow Check yourself
## Bad data, or just unusual?

Two values in Maya's export stand out: the festival day with **$1,250** in revenue, and the day reading **203 degrees**. A beginner is tempted to treat any extreme number as an error and delete it. Which one is a genuine data-quality defect, and which check catches it?

::quiz {"correct":2,"gate":true,"difficulty":"intermediate"}
- Both are errors: any value far from the rest should be removed before analysis ::no Not so. The $1,250 is a real, rare festival day, a genuine outlier you met in Lesson 3, and you handle it (keep, cap, or transform), you do not silently delete it. Deleting real data to tidy a chart is how an analysis becomes fiction.
- The 203-degree reading is the defect, caught by the range check; the $1,250 is a real outlier, not a quality error ::ok Exactly. 203 degrees is physically impossible, so the range check flags it as broken data to fix or drop. $1,250 is unusual but possible, a real festival day, so it is an outlier to handle thoughtfully, not a quality defect. An impossible value and a large value are not the same thing.
- The $1,250 is the defect, because revenue should never be that high ::no Being the largest value does not make it wrong. The festival genuinely happened, $1,250 is real money, and a range check would only flag revenue that is impossible (say, negative), not merely big. The impossible reading here is the 203-degree temperature.

=== step === concept
::eyebrow Check 5 of 5
## Keys: one row per thing

The last bucket is the one people forget. A clean table has a **primary key**: a column (or set of columns) whose value uniquely identifies each row. For a daily log, the key is `date`, because there should be exactly **one row per day**. A column is a valid key precisely when it has as many distinct values as the table has rows:

\[ \text{date is a key} \iff n_{\text{distinct}} = n_{\text{rows}} \]

where \(n_{\text{distinct}}\) is the number of different dates and \(n_{\text{rows}}\) the number of rows. Compare the two counts:

```r
nrow(clean)
#> [1] 10
n_distinct(clean$date)
#> [1] 9
```

Ten rows but only nine distinct dates: the key is broken, so some day appears twice. Find the culprit by counting rows per date and keeping the ones that repeat:

```r
clean |> count(date) |> filter(n > 1)
#> # A tibble: 1 x 2
#>   date           n
#>   <date>     <int>
#> 1 2026-03-11     2
```

2026-03-11 was logged twice, an exact duplicate, probably the till exporting one day's row twice. A duplicate row silently double-counts: it would inflate that day in any total and weight it twice in any average. Drop exact duplicates with `distinct()`:

```r
deduped <- distinct(clean)
nrow(deduped)
#> [1] 9
```

[WARNING]
`distinct()` only removes rows that are identical in *every* column. If the till had exported the same day with one different value (say a corrected pastry count), both rows would survive and you would have to decide which is authoritative. Always check your key with the `n_distinct` test; do not assume `distinct()` made it unique.

=== step === concept
::eyebrow The whole point
## Codify the checks so they run themselves

You have now run all five checks by hand. The real payoff is that **a check is just a logical test**, so you can write every one as code and re-run the whole pass on next week's export with a single command. Collect them into a small report:

```r
report <- data.frame(
  check = c("revenue is numeric", "temp_f within 20 to 110",
            "transactions <= foot_traffic", "date is a unique key",
            "no missing values"),
  pass = c(
    is.numeric(deduped$revenue),
    all(deduped$temp_f >= 20 & deduped$temp_f <= 110),
    all(deduped$transactions <= deduped$foot_traffic),
    n_distinct(deduped$date) == nrow(deduped),
    sum(is.na(deduped)) == 0
  )
)
report
#>                          check  pass
#> 1           revenue is numeric  TRUE
#> 2      temp_f within 20 to 110 FALSE
#> 3 transactions <= foot_traffic FALSE
#> 4         date is a unique key  TRUE
#> 5            no missing values FALSE
```

::widget styled-table {"cols":["check","status"],"rows":[["revenue is numeric","pass"],["temp_f within 20 to 110","fail"],["sales not over footfall","fail"],["date is a unique key","pass"],["no missing values","fail"]],"title":"Quality report for the latest export","note":"Two checks pass, three still fail. Re-run this on every refresh."}

Better still, wrap the hard rules in a function that **refuses to continue** when the data is unfit. `stopifnot()` errors out the moment a named condition is false, so a broken export can never sneak into your analysis unnoticed:

```r
validate_log <- function(df) {
  stopifnot(
    "revenue must be numeric"      = is.numeric(df$revenue),
    "temp_f must be 20 to 110"     = all(df$temp_f >= 20 & df$temp_f <= 110),
    "sales cannot exceed footfall" = all(df$transactions <= df$foot_traffic),
    "date must be a unique key"    = n_distinct(df$date) == nrow(df)
  )
  "all checks passed"
}

# the deduped data still has the 203-degree reading, so a rule fires:
tryCatch(validate_log(deduped), error = function(e) conditionMessage(e))
#> [1] "temp_f must be 20 to 110"
```

The function stops at the first failing rule and tells you which one. Fix that defect, run it again, and it walks to the next, until it returns "all checks passed" and your pipeline is safe to proceed.

[NOTE]
At scale you do not hand-roll this. Dedicated packages let you declare rules once and get a tidy pass/fail report. This runs locally, not in your browser:

```r-static
library(pointblank)
agent <- create_agent(deduped) |>
  col_is_numeric(vars(revenue)) |>
  col_vals_between(vars(temp_f), 20, 110) |>
  col_vals_lte(vars(transactions), vars(foot_traffic)) |>
  rows_distinct() |>
  interrogate()
agent
```

[WARNING]
Validation is not truth. These rules catch values that are impossible, missing, mistyped or duplicated. They cannot catch a value that is wrong but plausible, a real-looking $480 day that should have been $840. A passing report means "nothing obviously broken," never "every number is correct."

=== step === tryit
::eyebrow Your turn
## Write the key check

Make the key check from the last section reusable. A column is a valid key when it has as many distinct values as the table has rows. Fill in the function that counts the rows of `deduped`:

```r
# date is a key when distinct dates equal the number of rows
n_distinct(deduped$date) == ____(deduped)
```
::check {"regex":"nrow","gate":true,"difficulty":"intermediate","ok":"Right. After de-duplicating there are 9 distinct dates and nrow(deduped) is 9, so the two match and date is now a valid key (TRUE).","no":"Use nrow(): the number of rows must equal the number of distinct dates, so n_distinct(deduped$date) == nrow(deduped)."}
::solution
```r
n_distinct(deduped$date) == nrow(deduped)
#> [1] TRUE
```

=== step === concept
::eyebrow Go deeper
## References

A few authoritative places to take data validation further:

- [R for Data Science (2e), Data import](https://r4ds.hadley.nz/data-import) - how `read_csv()` guesses column types, the parsing snags you saw, and `parse_number()`.
- [pointblank documentation](https://rstudio.github.io/pointblank/) - the production tool for declaring data-quality rules and getting an interrogation report on every refresh.
- [validate: data validation infrastructure (Statistics Netherlands)](https://data-cleaning.github.io/validate/) - a rules-as-data approach used by national statistics offices to validate large datasets.
- [Wickham (2014), Tidy Data, Journal of Statistical Software](https://doi.org/10.18637/jss.v059.i10) - one row per observation, the principle behind the primary-key check you ran.

=== step === complete
## Course complete

You now run a quality pass before you trust any export. You checked column **types** and coerced a text-number with `parse_number()`; flagged an impossible value with a **range** check and a missing one with a **completeness** count; caught a contradiction with a cross-field **consistency** rule; verified the primary **key** with the `n_distinct` test and removed a duplicate; and, the real win, **codified** all five as a reusable report and a `validate_log()` function that stops a broken export before it can poison your analysis. You also kept the crucial distinction clear: an impossible value is a defect to fix, a genuine outlier is a real story to handle.

That completes **Exploratory Data Analysis in R**. Across eight lessons you went from one variable to many, from a single histogram to PCA, and finally to the quality pass that makes any of it trustworthy. Validation is the quiet habit that separates an analysis people can act on from one that merely looks finished. From here, the visualization and modelling courses build on clean, validated data, exactly the kind you now know how to guarantee.

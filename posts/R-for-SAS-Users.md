---
title: "R for SAS Users: MAP Every SAS Procedure to Its R Equivalent"
slug: "R-for-SAS-Users"
description: "Translate SAS to R: every common PROC mapped to base R + dplyr. Side-by-side runnable code for DATA step, MEANS, FREQ, REG, LOGISTIC, SORT, and 15+ more."
keywords: "R for SAS users, SAS to R, SAS DATA step in R, PROC means R equivalent, PROC freq R, PROC reg R, SAS macros R functions, convert SAS to R, SAS R migration"
auto_link_terms: "R for SAS users|SAS to R|convert SAS to R|SAS DATA step|PROC equivalents in R"
auto_link_case_sensitive: false
mathjax: false
webr: true
date: "2026-04-14"
curriculum_id: "CAR10"
post_type: "FR"
fr_parent: "Is-R-Worth-Learning-in-2026.html"
difficulty: "Intermediate"
---

# R for SAS Users: MAP Every SAS Procedure to Its R Equivalent

<p class="lead">If you've spent years writing DATA steps and PROC calls, switching to R can feel like learning to write left-handed. This guide gives you a direct, runnable translation for every common SAS construct — DATA steps, PROCs, macros, merges, and formats — so you can read R code as fluently as you read SAS today.</p>

## What's the fastest way to reproduce PROC MEANS in R?

Most SAS-to-R guides start with philosophy. We'll start with the procedure you run a hundred times a week. Here's `PROC MEANS DATA=mtcars; CLASS cyl; VAR mpg; RUN;` rewritten in R using base R's `aggregate()` — same grouping, same statistics, same output shape. Run it. If the result looks like the PROC MEANS output you'd see in SAS, you already know more R than you think.

```r
# SAS:  PROC MEANS DATA=mtcars MEAN STD N; CLASS cyl; VAR mpg; RUN;
proc_means <- aggregate(
  mpg ~ cyl,
  data = mtcars,
  FUN  = function(x) c(N = length(x), Mean = round(mean(x), 2), SD = round(sd(x), 2))
)
proc_means
#>   cyl mpg.N mpg.Mean mpg.SD
#> 1   4 11.00    26.66   4.51
#> 2   6  7.00    19.74   1.45
#> 3   8 14.00    15.10   2.56
```

Three lines of R reproduced an entire PROC MEANS call. `aggregate()` takes a formula (`outcome ~ grouping`), the data frame, and a function applied per group. The function returns a named numeric vector and `aggregate()` stitches the results into a tidy table. Read this as: *for each level of `cyl`, compute N, Mean, and SD of `mpg`* — exactly what `CLASS cyl; VAR mpg;` says in SAS.

[TIP]
**Tidyverse fans can write the same thing as a top-to-bottom pipeline.** The dplyr equivalent — `mtcars |> group_by(cyl) |> summarise(...)` — produces the same table and is the dialect most modern R books teach. Pick whichever reads better to you.

```r
# Same result, dplyr style
library(dplyr)
proc_means_dplyr <- mtcars |>
  group_by(cyl) |>
  summarise(N = n(), Mean = round(mean(mpg), 2), SD = round(sd(mpg), 2))
proc_means_dplyr
#> # A tibble: 3 × 4
#>     cyl     N  Mean    SD
#>   <dbl> <int> <dbl> <dbl>
#> 1     4    11  26.7  4.51
#> 2     6     7  19.7  1.45
#> 3     8    14  15.1  2.56
```

Same numbers, two dialects. Pick whichever reads better to you — most teams settle on dplyr for new code and keep `aggregate()` for one-liners in scripts.

**Try it:** Reproduce `PROC MEANS DATA=mtcars; CLASS am; VAR hp; RUN;` in R. Save the result to `ex_means`.

```r
# Try it: PROC MEANS for hp grouped by am
ex_means <- aggregate(
  # your code here
)
ex_means
#> Expected: two rows (am = 0 and am = 1), each with N, Mean, SD of hp
```

<details>
<summary>Click to reveal solution</summary>

```r
ex_means <- aggregate(
  hp ~ am,
  data = mtcars,
  FUN  = function(x) c(N = length(x), Mean = round(mean(x), 1), SD = round(sd(x), 1))
)
ex_means
#>   am hp.N hp.Mean hp.SD
#> 1  0 19.0  160.30 53.91
#> 2  1 13.0  126.85 84.06
```

**Explanation:** Swap `mpg ~ cyl` for `hp ~ am`. The formula is the only thing that changes — the rest of the call is boilerplate you'll reuse for every PROC MEANS translation.

</details>

## How does the SAS DATA step map to R?

The DATA step is the heart of SAS — it reads a row, modifies it, writes a row, repeats. R doesn't think in rows; it thinks in columns. Once you internalise that one swap, every DATA step starts looking like a sequence of column assignments.

| SAS DATA step | R equivalent |
|---|---|
| `data new; set old; run;` | `new <- old` |
| `x = a + b;` | `df$x <- df$a + df$b` |
| `if age >= 18 then adult = "Y"; else adult = "N";` | `df$adult <- ifelse(df$age >= 18, "Y", "N")` |
| `length name $50;` | (auto — character columns size themselves) |
| `drop var1 var2;` | `df$var1 <- NULL; df$var2 <- NULL` |
| `keep var1 var2;` | `df <- df[, c("var1", "var2")]` |
| `rename old=new;` | `names(df)[names(df) == "old"] <- "new"` |
| `where age > 18;` | `df <- subset(df, age > 18)` |
| `retain total 0; total + x;` | `df$total <- cumsum(df$x)` |
| `by group; first.group` | `!duplicated(df$group)` |
| `by group; last.group` | `!duplicated(df$group, fromLast = TRUE)` |

Let's build the same table in code. We'll start with a small students data frame, derive `adult` with `ifelse`, then add a multi-branch `grade` with `case_when` (the dplyr equivalent of nested `IF/ELSE IF`).

```r
# DATA step equivalent: derive adult flag and a grade column
students <- data.frame(
  name  = c("Alice", "Bob", "Carol", "Dave", "Eve"),
  age   = c(25, 17, 32, 15, 28),
  score = c(88, 92, 75, 95, 82)
)

students$adult <- ifelse(students$age >= 18, "Y", "N")
students$grade <- case_when(
  students$score >= 90 ~ "A",
  students$score >= 80 ~ "B",
  students$score >= 70 ~ "C",
  TRUE                 ~ "D"
)
students
#>    name age score adult grade
#> 1 Alice  25    88     Y     B
#> 2   Bob  17    92     N     A
#> 3 Carol  32    75     Y     C
#> 4  Dave  15    95     N     A
#> 5   Eve  28    82     Y     B
```

Two assignments built two new columns across the entire data frame at once. `ifelse()` is the binary case (`IF/ELSE`); `case_when()` is the SAS `IF/ELSE IF/ELSE IF` chain, written from most to least specific. The trailing `TRUE ~ "D"` is the catch-all branch — the `ELSE` that runs when nothing above matched.

Now the housekeeping verbs: drop, keep, rename. In SAS these are statements inside the DATA step; in R they're plain assignments to the data frame.

```r
# drop / keep / rename — three one-liners
students2 <- students                      # data new; set students;
students2$adult <- NULL                    # drop adult;
students2 <- students2[, c("name", "score", "grade")]   # keep name score grade;
names(students2)[names(students2) == "score"] <- "exam_score"  # rename score = exam_score;
students2
#>    name exam_score grade
#> 1 Alice         88     B
#> 2   Bob         92     A
#> 3 Carol         75     C
#> 4  Dave         95     A
#> 5   Eve         82     B
```

Three statements, three column edits. Setting a column to `NULL` deletes it; subsetting with a vector of names keeps only those columns; reassigning into `names()` renames in place. None of this requires looping over rows.

[NOTE]
**SAS processes one row at a time; R processes whole columns at once.** That's why R loops feel slower than vectorised expressions — every time you write `df$x <- df$a + df$b`, R hands the work to compiled C code that walks the column without leaving its inner loop.

**Try it:** Add a `bonus` column equal to 10% of `score` to `students`, then keep only the rows where `score > 80`. Save the result to `ex_filter`.

```r
# Try it: derive bonus, then filter score > 80
ex_filter <- students
# your code here

ex_filter
#> Expected: 3 rows (Alice, Bob, Eve), with a numeric bonus column
```

<details>
<summary>Click to reveal solution</summary>

```r
ex_filter <- students
ex_filter$bonus <- ex_filter$score * 0.1
ex_filter <- subset(ex_filter, score > 80)
ex_filter
#>    name age score adult grade bonus
#> 1 Alice  25    88     Y     B   8.8
#> 2   Bob  17    92     N     A   9.2
#> 5   Eve  28    82     Y     B   8.2
```

**Explanation:** First the column derivation (`bonus = score * 0.1`), then the filter (`subset()` is base R's WHERE clause). The same job in dplyr would be `students |> mutate(bonus = score * 0.1) |> filter(score > 80)`.

</details>

## Which R functions replace PROC FREQ, PROC SORT, and PROC TRANSPOSE?

Three of the most common PROCs after PROC MEANS — and all three have one-line replacements in R.

| SAS | R |
|---|---|
| `proc freq data=df; tables x; run;` | `table(df$x)` |
| `proc freq; tables x*y / chisq;` | `table(df$x, df$y)` + `chisq.test()` |
| `proc sort data=df; by x;` | `df[order(df$x), ]` or `arrange(df, x)` |
| `proc sort; by descending x;` | `df[order(-df$x), ]` or `arrange(df, desc(x))` |
| `proc transpose; by id; var v; id key;` | `reshape()` or `tidyr::pivot_wider()` |

Let's run all three. Start with PROC FREQ — a one-way frequency table, then a cross-tab with a chi-square test.

```r
# PROC FREQ DATA=mtcars; TABLES cyl; RUN;
freq1 <- table(mtcars$cyl)
freq1
#> 4  6  8
#> 11  7 14

# PROC FREQ DATA=mtcars; TABLES cyl*am / chisq; RUN;
cross_tab <- table(Cylinders = mtcars$cyl, Transmission = mtcars$am)
cross_tab
#>          Transmission
#> Cylinders  0  1
#>         4  3  8
#>         6  4  3
#>         8 12  2
chisq.test(cross_tab)$p.value
#> [1] 0.01288965
```

`table()` builds the contingency table; `chisq.test()` runs the same chi-square test SAS would have produced. The named arguments to `table()` become the row and column labels. Two functions cover what PROC FREQ does in a dozen lines.

PROC SORT next. Base R uses `order()`, which returns the row indices in sorted order; dplyr's `arrange()` reads more naturally for multi-key sorts.

```r
# PROC SORT DATA=mtcars; BY cyl DESCENDING mpg; RUN;
sorted_df <- mtcars[order(mtcars$cyl, -mtcars$mpg), c("cyl", "mpg", "hp")]
head(sorted_df, 6)
#>                cyl  mpg  hp
#> Toyota Corolla   4 33.9  65
#> Fiat 128         4 32.4  66
#> Honda Civic      4 30.4  52
#> Lotus Europa     4 30.4 113
#> Fiat X1-9        4 27.3  66
#> Porsche 914-2    4 26.0  91
```

`order()` accepts multiple columns; prefix a column with `-` to reverse its direction. Three keys deep, this still works, and the result is a logical translation of `BY cyl DESCENDING mpg`.

Now PROC TRANSPOSE. Long-to-wide reshaping is the one place where SAS's syntax is famously confusing — and R's tidyr makes the same operation almost trivial.

```r
# PROC TRANSPOSE DATA=long OUT=wide; BY id; ID measure; VAR value; RUN;
library(tidyr)
long_df <- data.frame(
  id      = c(1, 1, 2, 2),
  measure = c("height", "weight", "height", "weight"),
  value   = c(170, 65, 180, 80)
)
wide_df <- pivot_wider(long_df, names_from = measure, values_from = value)
wide_df
#> # A tibble: 2 × 3
#>      id height weight
#>   <dbl>  <dbl>  <dbl>
#> 1     1    170     65
#> 2     2    180     80
```

`pivot_wider()` reads top-to-bottom: take `long_df`, use the values in `measure` as new column names, fill them with values from `value`. Anyone reading this six months from now will understand it. The same can rarely be said of a PROC TRANSPOSE call.

[WARNING]
**Base R drops missing values from frequency tables by default.** SAS's PROC FREQ shows missings when you add `MISSING`; in R's `table()` you have to opt in with `useNA = "ifany"` or `useNA = "always"`. Forgetting this is the #1 reason an R frequency table disagrees with the SAS output your reviewer is expecting.

**Try it:** Build a cross-tabulation of `mtcars$cyl` against `mtcars$gear` and pull the chi-square p-value into a variable called `ex_freq`.

```r
# Try it: cross-tab cyl x gear, save chi-square p-value
ex_freq <- # your code here
ex_freq
#> Expected: a single numeric p-value
```

<details>
<summary>Click to reveal solution</summary>

```r
ex_freq <- chisq.test(table(mtcars$cyl, mtcars$gear))$p.value
ex_freq
#> [1] 0.0007115422
```

**Explanation:** Nest `table()` inside `chisq.test()`, then pull out `$p.value`. R's chi-square will warn about small expected counts on `mtcars` — that's the same warning PROC FREQ would issue.

</details>

## How do you translate PROC REG, PROC LOGISTIC, and PROC GLM?

Every linear model in R uses the same formula interface: `outcome ~ predictor1 + predictor2 + ...`. Once you've seen one, you've seen them all. PROC REG, PROC LOGISTIC, PROC GLM, and PROC MIXED collapse into `lm()`, `glm()`, `aov()`, and `lme4::lmer()` respectively.

PROC REG first — ordinary least squares regression.

```r
# PROC REG DATA=mtcars; MODEL mpg = wt hp qsec; RUN;
reg_model <- lm(mpg ~ wt + hp + qsec, data = mtcars)
summary(reg_model)
#> Call:
#> lm(formula = mpg ~ wt + hp + qsec, data = mtcars)
#>
#> Coefficients:
#>             Estimate Std. Error t value Pr(>|t|)
#> (Intercept) 27.61053    8.41993   3.279  0.00278 **
#> wt          -4.35880    0.75270  -5.791 3.22e-06 ***
#> hp          -0.01782    0.01498  -1.190  0.24418
#> qsec         0.51083    0.43922   1.163  0.25463
#>
#> Multiple R-squared:  0.8348,  Adjusted R-squared:  0.8171
```

The output is the same set of numbers PROC REG would print: estimates, standard errors, t-values, p-values, and R-squared. The formula `mpg ~ wt + hp + qsec` is character-for-character what `MODEL mpg = wt hp qsec;` says in SAS, just with `~` swapped for `=` and `+` between predictors.

PROC LOGISTIC next. Same idea, different family.

```r
# PROC LOGISTIC DATA=mtcars; MODEL am = mpg wt hp; RUN;
logit_model <- glm(am ~ mpg + wt + hp, data = mtcars, family = binomial)
round(coef(summary(logit_model)), 3)
#>             Estimate Std. Error z value Pr(>|z|)
#> (Intercept)   25.879     16.527   1.566    0.117
#> mpg            0.244      0.397   0.615    0.539
#> wt            -9.149      4.153  -2.203    0.028
#> hp             0.041      0.034   1.184    0.236
round(exp(coef(logit_model)), 3)        # odds ratios
#> (Intercept)         mpg          wt          hp
#> 1.748e+11      1.276e+00   1.060e-04   1.042e+00
```

`glm()` with `family = binomial` is logistic regression. `exp(coef(...))` converts the log-odds coefficients to odds ratios, which is what the `ODDSRATIO` option in PROC LOGISTIC prints. One line covers what SAS spreads across an option list.

PROC GLM gives you ANOVA. R's `aov()` does the same job.

```r
# PROC GLM DATA=mtcars; CLASS cyl; MODEL mpg = cyl; RUN;
aov_model <- aov(mpg ~ factor(cyl), data = mtcars)
summary(aov_model)
#>             Df Sum Sq Mean Sq F value   Pr(>F)
#> factor(cyl)  2  824.8   412.4   39.70 4.98e-09 ***
#> Residuals   29  301.3    10.4
```

Wrapping `cyl` in `factor()` is the equivalent of declaring it on a `CLASS` statement — it tells R to treat it as categorical instead of numeric. The F-statistic and p-value match the PROC GLM output exactly.

[KEY INSIGHT]
**The SAS MODEL statement and the R formula are the same idea written two ways.** `MODEL y = x1 x2;` in SAS becomes `y ~ x1 + x2` in R — same predictors, same outcome, swap `=` for `~` and join predictors with `+`. Once you spot that, every R modelling function reads as PROC syntax with the keywords stripped: `lm()`, `glm()`, `aov()`, `coxph()`, `lmer()`, even `randomForest()` all use it.

**Try it:** Fit `lm(mpg ~ wt + cyl)` on `mtcars` and pull the coefficient on `wt` into `ex_lm`.

```r
# Try it: fit a model and extract one coefficient
ex_lm <- # your code here
ex_lm
#> Expected: a single numeric value, around -3.19
```

<details>
<summary>Click to reveal solution</summary>

```r
ex_lm <- coef(lm(mpg ~ wt + cyl, data = mtcars))["wt"]
ex_lm
#>        wt
#> -3.190972
```

**Explanation:** `coef()` returns the named coefficient vector; bracket-indexing by name pulls the one you want. This is how you'd grab a single estimate to drop into a downstream calculation.

</details>

## How does R handle SAS MERGE and BY-group processing?

`MERGE a b; BY id;` is the SAS join. R has two equivalent paths: base R's `merge()` (closest to the SAS syntax) and dplyr's `inner_join()` / `left_join()` family (closer to SQL).

| SAS | R (base) | R (dplyr) |
|---|---|---|
| `merge a b; by id;` (inner) | `merge(a, b, by = "id")` | `inner_join(a, b, by = "id")` |
| `merge a (in=x) b; by id; if x;` | `merge(a, b, by = "id", all.x = TRUE)` | `left_join(a, b, by = "id")` |
| `merge a b (in=y); by id; if y;` | `merge(a, b, by = "id", all.y = TRUE)` | `right_join(a, b, by = "id")` |
| `merge a b; by id;` (outer) | `merge(a, b, by = "id", all = TRUE)` | `full_join(a, b, by = "id")` |
| `set a b;` (stack) | `rbind(a, b)` | `bind_rows(a, b)` |

Let's run them on a small customers/orders pair so you can see the row counts change with each join type.

```r
# Two small tables to join
customers <- data.frame(id = 1:4, name = c("Alice", "Bob", "Carol", "Dave"))
orders    <- data.frame(id = c(1, 2, 2, 4), amount = c(100, 250, 75, 300))

# Left join: keep all customers, attach matching orders (Carol gets NA)
joined_left <- merge(customers, orders, by = "id", all.x = TRUE)
joined_left
#>   id  name amount
#> 1  1 Alice    100
#> 2  2   Bob    250
#> 3  2   Bob     75
#> 4  3 Carol     NA
#> 5  4  Dave    300
```

Five rows, because Bob has two orders and Carol has none. `all.x = TRUE` is the flag that says "keep every row from the left side even if there's no match on the right" — that's the `IF a;` line you'd write in a SAS MERGE.

The dplyr version reads the same way, just with the join verb in front of the data frames.

```r
# Same job, dplyr style
joined_inner <- inner_join(customers, orders, by = "id")
joined_inner
#>   id  name amount
#> 1  1 Alice    100
#> 2  2   Bob    250
#> 3  2   Bob     75
#> 4  4  Dave    300
```

Carol is gone — `inner_join()` keeps only the rows where `id` exists in both tables. Same result you'd get from `merge a (in=x) b (in=y); by id; if x and y;` in SAS, in eight characters.

[TIP]
**SAS demands sorted input for MERGE; R does not.** Both `merge()` and dplyr joins handle unsorted keys natively, so you can drop the `PROC SORT` step entirely. One fewer thing to remember when you're translating a SAS program over.

**Try it:** Left-join `customers` and `orders` keeping only rows where `amount > 100`. Save the result to `ex_join`.

```r
# Try it: left-join then filter
ex_join <- # your code here
ex_join
#> Expected: 2 rows (Bob 250, Dave 300)
```

<details>
<summary>Click to reveal solution</summary>

```r
ex_join <- left_join(customers, orders, by = "id") |>
  filter(amount > 100)
ex_join
#>   id name amount
#> 1  2  Bob    250
#> 2  4 Dave    300
```

**Explanation:** Pipe the join into `filter()`. This is the canonical dplyr pattern — chain verbs left-to-right with `|>` and read each step as one English sentence.

</details>

## How do SAS macros become R functions?

SAS macros are text generators — they paste code together at compile time, with `&var` references swapped for actual symbols before the SAS compiler ever sees the program. R doesn't need any of that. Functions in R take inputs, return outputs, and live in the same namespace as everything else. Most SAS macros become *shorter* once translated.

| SAS macro | R function |
|---|---|
| `%let var = value;` | `var <- "value"` |
| `%macro name(param); ... %mend;` | `name <- function(param) { ... }` |
| `%do i = 1 %to 10;` | `for (i in 1:10) { ... }` or `lapply(1:10, ...)` |
| `%if &cond %then ...;` | `if (cond) { ... }` |
| `%include "file.sas";` | `source("file.R")` |
| `&var` (macro variable) | `var` (regular R variable) |
| `%put &var;` | `cat(var, "\n")` |

Here's a real macro you've probably written some version of: a reusable summary procedure that takes a dataset, a variable, and a class column.

```r
# SAS:
# %macro summarize(data=, var=, group=);
#   PROC MEANS DATA=&data; CLASS &group; VAR &var; RUN;
# %mend;
# %summarize(data=mtcars, var=mpg, group=cyl);

summarize_proc <- function(data, var, group) {
  formula <- as.formula(paste(var, "~", group))
  aggregate(
    formula,
    data = data,
    FUN  = function(x) c(N = length(x), Mean = round(mean(x), 1), SD = round(sd(x), 1))
  )
}

summarize_proc(mtcars, "mpg", "cyl")
#>   cyl mpg.N mpg.Mean mpg.SD
#> 1   4    11     26.7    4.5
#> 2   6     7     19.7    1.5
#> 3   8    14     15.1    2.6
```

The R version is shorter, easier to debug, and gives you a real return value you can pipe into the next step. `as.formula(paste(...))` is how you build a formula from string inputs — that's the only piece that looks unusual at first, and you'll use the same pattern every time you turn a macro into a function.

[KEY INSIGHT]
**A SAS macro is a code-text generator; an R function is a value.** That's why most SAS macros shrink when translated — there's no quoting, no `&var.` resolution, no `%let`/`%put` plumbing. You write what you want to compute, R computes it, and the result is just another object you can store, pass around, or print.

**Try it:** Write a function `ex_func(df, col, n)` that returns the top `n` rows of `df` ordered by descending `col`. Test it on `mtcars`, `"mpg"`, `3`.

```r
# Try it: top-n function
ex_func <- function(df, col, n) {
  # your code here
}

ex_func(mtcars, "mpg", 3)
#> Expected: the 3 rows of mtcars with the highest mpg
```

<details>
<summary>Click to reveal solution</summary>

```r
ex_func <- function(df, col, n) {
  df[order(-df[[col]]), ][1:n, ]
}

ex_func(mtcars, "mpg", 3)
#>                 mpg cyl  disp hp drat    wt qsec vs am gear carb
#> Toyota Corolla 33.9   4  71.1 65 4.22 1.835 19.9  1  1    4    1
#> Fiat 128       32.4   4  78.7 66 4.08 2.200 19.5  1  1    4    1
#> Honda Civic    30.4   4  75.7 52 4.93 1.615 18.5  1  1    4    2
```

**Explanation:** `df[[col]]` extracts the column by name (note the double brackets — single brackets would return a one-column data frame, not a vector). The `-` reverses the sort, and `[1:n, ]` keeps the top n rows.

</details>

## What's the complete PROC → R cheat sheet?

Bookmark this section. It covers the 20 procedures that account for most of the SAS code you'll ever need to translate.

| SAS Procedure | R equivalent | Package |
|---|---|---|
| PROC MEANS | `aggregate()`, `summary()`, `dplyr::summarise()` | base, dplyr |
| PROC FREQ | `table()`, `prop.table()`, `chisq.test()` | base |
| PROC UNIVARIATE | `summary()`, `quantile()`, `shapiro.test()` | base |
| PROC SORT | `order()`, `dplyr::arrange()` | base, dplyr |
| PROC TRANSPOSE | `reshape()`, `tidyr::pivot_wider()` | base, tidyr |
| PROC PRINT | `print()`, `head()`, `View()` | base |
| PROC IMPORT | `read.csv()`, `haven::read_sas()` | base, haven |
| PROC EXPORT | `write.csv()`, `haven::write_sas()` | base, haven |
| PROC SQL | `sqldf::sqldf()`, `dplyr` verbs | sqldf, dplyr |
| PROC REG | `lm()` | base |
| PROC LOGISTIC | `glm(family = binomial)` | base |
| PROC GLM | `lm()`, `aov()` | base |
| PROC MIXED | `lme4::lmer()` | lme4 |
| PROC GLIMMIX | `lme4::glmer()` | lme4 |
| PROC PHREG | `survival::coxph()` | survival |
| PROC LIFETEST | `survival::survfit()` | survival |
| PROC FACTOR | `factanal()`, `psych::fa()` | base, psych |
| PROC CLUSTER | `hclust()`, `kmeans()` | base |
| PROC PRINCOMP | `prcomp()` | base |
| PROC ARIMA | `forecast::Arima()` | forecast |
| PROC SGPLOT | `ggplot2::ggplot()` | ggplot2 |
| PROC FORMAT | `factor()`, `cut()`, `dplyr::case_when()` | base, dplyr |
| PROC SURVEYSELECT | `sample()`, `dplyr::slice_sample()` | base, dplyr |

[NOTE]
**SAS Viya 2026.03 added a built-in PROC for running R code from inside SAS.** If you can't migrate everything in one go, you don't have to — the new `PROC R` lets you call R for the pieces that already work in R while keeping the surrounding SAS program intact. It's the official escape hatch announced earlier this year on the SAS Procedures Guide.

**Try it:** Pick any unfamiliar PROC from the table above, look up its R equivalent, and run it on `iris`. Save whatever you compute to `ex_proc`. (No fixed answer — this one is for muscle memory.)

```r
# Try it: pick a PROC and translate it
ex_proc <- # your code here
ex_proc
```

<details>
<summary>Click to reveal solution</summary>

```r
# Example: PROC PRINCOMP on iris
ex_proc <- prcomp(iris[, 1:4], scale. = TRUE)
summary(ex_proc)
#> Importance of components:
#>                           PC1    PC2     PC3     PC4
#> Standard deviation     1.7084 0.9560 0.38309 0.14393
#> Proportion of Variance 0.7296 0.2285 0.03669 0.00518
#> Cumulative Proportion  0.7296 0.9581 0.99482 1.00000
```

**Explanation:** `prcomp()` is base R's principal-components routine — feed it the numeric columns, set `scale. = TRUE` to standardise, and it returns rotation, scores, and variance explained. Same job as PROC PRINCOMP, no extra package required.

</details>

## Practice Exercises

These combine multiple concepts from the tutorial. Use distinct variable names so your work doesn't overwrite the tutorial state.

### Exercise 1: PROC MEANS + filter in one pipeline

Take `airquality`, keep only rows where `Month == 5`, then compute the mean and SD of `Ozone` (ignoring `NA` values). Save the result to `my_summary`.

```r
# Exercise 1: filter + summarise in one step
# Hint: filter() + summarise() in dplyr, or subset() + sapply() in base R

# Write your code below:

```

<details>
<summary>Click to reveal solution</summary>

```r
my_summary <- airquality |>
  filter(Month == 5) |>
  summarise(
    Mean_Ozone = mean(Ozone, na.rm = TRUE),
    SD_Ozone   = sd(Ozone, na.rm = TRUE),
    N          = sum(!is.na(Ozone))
  )
my_summary
#>   Mean_Ozone SD_Ozone  N
#> 1   23.61538 22.22445 26
```

**Explanation:** `filter()` is the WHERE clause; `summarise()` is the PROC MEANS body. `na.rm = TRUE` does what SAS does silently — skip missings rather than propagate them.

</details>

### Exercise 2: DATA step + PROC MEANS combined

You have an employees data frame. Compute a `bonus` column equal to 10% of `salary` for employees earning more than 50000, then aggregate the average bonus by `dept`. Save the result to `my_bonus`.

```r
# Exercise 2: DATA step logic + PROC MEANS in one pipeline
employees <- data.frame(
  name   = c("Ana", "Ben", "Cara", "Dan", "Eli", "Faye"),
  dept   = c("Eng", "Eng", "Sales", "Sales", "Eng", "Sales"),
  salary = c(72000, 48000, 95000, 51000, 60000, 45000)
)

# Write your code below:

```

<details>
<summary>Click to reveal solution</summary>

```r
my_bonus <- employees |>
  filter(salary > 50000) |>
  mutate(bonus = salary * 0.10) |>
  group_by(dept) |>
  summarise(avg_bonus = mean(bonus), n = n())
my_bonus
#> # A tibble: 2 × 3
#>   dept  avg_bonus     n
#>   <chr>     <dbl> <int>
#> 1 Eng       6600.     2
#> 2 Sales     7300.     2
```

**Explanation:** Four verbs, four steps: filter the rows (DATA-step `IF`), derive `bonus` (DATA-step assignment), group by `dept` (`CLASS`), aggregate (`PROC MEANS`). Same logic as a SAS program with one DATA step and one PROC, written as a single readable pipeline.

</details>

### Exercise 3: SAS macro → R function

Translate the macro below to an R function called `lm_fit(data, dv, iv)` that fits a simple regression and returns the model object. Call it on `mtcars` with `dv = "mpg"`, `iv = "wt"`. Save the model to `my_model`.

```sas
%macro lm_fit(data=, dv=, iv=);
  proc reg data=&data;
    model &dv = &iv;
  run;
%mend;
```

```r
# Exercise 3: convert a SAS macro to an R function

# Write your function and call it below:

```

<details>
<summary>Click to reveal solution</summary>

```r
lm_fit <- function(data, dv, iv) {
  formula <- as.formula(paste(dv, "~", iv))
  lm(formula, data = data)
}

my_model <- lm_fit(mtcars, "mpg", "wt")
coef(my_model)
#> (Intercept)          wt
#>   37.285126   -5.344472
```

**Explanation:** `as.formula(paste(dv, "~", iv))` is the equivalent of SAS's `&dv` and `&iv` substitution — except it happens at runtime, with real R values, and you get a real formula object back. `lm()` does the rest.

</details>

## Complete Example: A Full SAS → R Rewrite

Here's a realistic SAS program you might inherit from a colleague. It reads sales data, derives a few columns, computes per-region summaries, and fits a regression model.

```sas
/* The original SAS program */
DATA sales_clean;
  SET sales;
  IF revenue > 0;                    /* drop refunds */
  margin = revenue - cost;
  margin_pct = margin / revenue;
RUN;

PROC MEANS DATA=sales_clean MEAN N;
  CLASS region;
  VAR margin margin_pct;
RUN;

PROC REG DATA=sales_clean;
  MODEL margin = units price;
RUN;
```

Three SAS steps, three R steps. Watch how the DATA step, PROC MEANS, and PROC REG fold into a single readable pipeline.

```r
# The same program in R
sales <- data.frame(
  region  = c("N", "N", "S", "S", "E", "E", "W", "W"),
  units   = c(120, 80, 200, 150, 95, 110, 175, 60),
  price   = c(20, 25, 18, 22, 30, 28, 15, 35),
  cost    = c(15, 18, 14, 17, 22, 20, 12, 28),
  revenue = c(2400, 2000, 3600, 3300, 2850, 3080, 2625, 2100)
)

# Step 1: DATA step → mutate + filter
sales_clean <- sales |>
  filter(revenue > 0) |>
  mutate(
    margin     = revenue - cost,
    margin_pct = margin / revenue
  )

# Step 2: PROC MEANS → group_by + summarise
sales_summary <- sales_clean |>
  group_by(region) |>
  summarise(
    N             = n(),
    Mean_Margin   = round(mean(margin), 2),
    Mean_MarginPc = round(mean(margin_pct), 3)
  )
sales_summary
#> # A tibble: 4 × 4
#>   region     N Mean_Margin Mean_MarginPc
#>   <chr>  <int>       <dbl>         <dbl>
#> 1 E          2     1484.          0.503
#> 2 N          2     2183.          0.984
#> 3 S          2     3236.          0.939
#> 4 W          2     2293.          0.974

# Step 3: PROC REG → lm()
sales_model <- lm(margin ~ units + price, data = sales_clean)
round(coef(sales_model), 2)
#> (Intercept)       units       price
#>     -242.16       16.45       11.39
```

Two things worth noticing. First, the entire DATA step shrank to a `filter()` + `mutate()` chain — no `IF` statement, no `RUN;`, no semicolons. Second, the three SAS steps you'd run sequentially in a SAS session became three R objects (`sales_clean`, `sales_summary`, `sales_model`) you can pass around, save, or feed into a report. Each step's output is a real value, not just printed text.

## Summary

The translation reduces to a small set of one-line mappings you'll use over and over:

- **PROC MEANS** → `aggregate()` or `dplyr::summarise()`
- **PROC FREQ** → `table()` and `prop.table()`
- **PROC SORT** → `order()` or `dplyr::arrange()`
- **PROC TRANSPOSE** → `tidyr::pivot_wider()` (or `pivot_longer()` for the other direction)
- **PROC REG** → `lm(y ~ x1 + x2, data = df)`
- **PROC LOGISTIC** → `glm(y ~ x, family = binomial)`
- **PROC GLM / ANOVA** → `aov(y ~ factor(group))`
- **MERGE BY id** → `merge(a, b, by = "id", all.x = TRUE)` or `dplyr::left_join()`
- **DATA step assignment** → `df$x <- df$a + df$b` or `mutate(x = a + b)`
- **SAS macro** → ordinary R function

The biggest mental shift is row-at-a-time → column-at-a-time. Once that clicks, the rest is vocabulary. Read the [parent guide on whether R is worth learning in 2026](Is-R-Worth-Learning-in-2026.html) for the bigger-picture case, and use this page as your translation cheat sheet whenever you hit a PROC you haven't migrated yet.

## References

1. Muenchen, R.A. — *R for SAS and SPSS Users*, 2nd ed., Springer (2011). The definitive book-length translation reference. [Link](https://link.springer.com/book/10.1007/978-1-4614-0685-3)
2. r4stats.com — Comparison of SAS, SPSS, and R, with add-on package mappings. [Link](https://r4stats.com/articles/add-ons/)
3. Appsilon — *Transitioning from SAS to R: How to Import, Process, and Export*. [Link](https://www.appsilon.com/post/transitioning-from-sas-to-r)
4. R Core Team — *An Introduction to R*. The official R manual. [Link](https://cran.r-project.org/doc/manuals/r-release/R-intro.html)
5. dplyr documentation — `summarise()`, `group_by()`, `mutate()`, joins. [Link](https://dplyr.tidyverse.org/reference/index.html)
6. tidyr documentation — `pivot_wider()` and `pivot_longer()`. [Link](https://tidyr.tidyverse.org/reference/pivot_wider.html)
7. haven package — read and write SAS, SPSS, and Stata files. [Link](https://haven.tidyverse.org/)
8. R Validation Hub (pharmaR) — validating R for FDA-regulated work. [Link](https://www.pharmar.org/)
9. Clinical Standards Hub — *PROC R: SAS Viya 2026.03 announcement*. [Link](https://www.clinstandards.org/blog/proc-r-a-new-era-for-sas-r-interoperability-in-clinical-statistical-programming-1775575901979)

## Continue Learning

- [Is R Worth Learning in 2026?](Is-R-Worth-Learning-in-2026.html) — The full case for picking up R if you already know SAS.
- [R for Stata Users](R-for-Stata-Users.html) — Sister guide for Stata migrants, with the same PROC-equivalent treatment for Stata commands.
- [R for SPSS Users](R-for-SPSS-Users.html) — Sister guide for SPSS users covering syntax and data manipulation.

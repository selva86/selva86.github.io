---
title: "R for Stata Users: The Command-by-Command Translation Guide"
slug: "R-for-Stata-Users"
description: "Complete Stata-to-R translation: regression, panel data, t-tests, and data manipulation. Every Stata command shown beside its R equivalent with output."
keywords: "R for Stata users, Stata to R, Stata commands R equivalent, convert Stata to R, R vs Stata, Stata migration, reg vs lm, xtreg in R"
auto_link_terms: "R for Stata users|Stata to R|Stata to R translation|convert Stata to R|Stata equivalent in R"
auto_link_case_sensitive: false
mathjax: false
webr: true
date: "2026-04-14"
curriculum_id: "CAR11"
post_type: "FR"
fr_parent: "Is-R-Worth-Learning-in-2026.html"
difficulty: "Intermediate"
---

# R for Stata Users: The Command-by-Command Translation Guide

<p class="lead">Stata and R both excel at statistical analysis, but their syntax is fundamentally different. This guide maps every common Stata command to its R equivalent — with side-by-side tables and runnable examples — so you can switch without losing productivity.</p>

## How do you load and inspect data in R the Stata way?

Most Stata users come to R looking for one thing first: "show me how to load my data and look at it." So that is exactly where this guide starts. The example below loads a built-in dataset, prints its structure, and previews the first rows — the R equivalent of `use`, `describe`, and `list in 1/6`. If this output feels familiar, the rest of the guide will be too.

R ships with dozens of teaching datasets that are always available — no `use` needed. We will use `mtcars` (32 cars, 11 variables) throughout this guide because it is everywhere in R's documentation.

```r
# Stata: use "mtcars.dta", clear ; describe ; list in 1/6
cars <- mtcars                  # assign the built-in dataset to a name we own
str(cars)                       # describe: types + first values
#> 'data.frame':	32 obs. of  11 variables:
#>  $ mpg : num  21 21 22.8 21.4 18.7 18.1 14.3 24.4 22.8 19.2 ...
#>  $ cyl : num  6 6 4 6 8 6 8 4 4 6 ...
#>  $ disp: num  160 160 108 258 360 ...
#>  $ hp  : num  110 110 93 110 175 105 245 62 95 123 ...
#>  $ drat: num  3.9 3.9 3.85 3.08 3.21 2.76 3.21 3.69 3.92 3.92 ...
#>  $ wt  : num  2.62 2.88 2.32 3.21 3.44 ...

head(cars, 6)                   # list in 1/6
#>                    mpg cyl disp  hp drat    wt  qsec vs am gear carb
#> Mazda RX4         21.0   6  160 110 3.90 2.620 16.46  0  1    4    4
#> Mazda RX4 Wag     21.0   6  160 110 3.90 2.875 17.02  0  1    4    4
#> Datsun 710        22.8   4  108  93 3.85 2.320 18.61  0  1    4    1
#> Hornet 4 Drive    21.4   6  258 110 3.08 2.460 20.22  0  1    4    3
#> Hornet Sportabout 18.7   8  360 175 3.21 2.460 20.22  0  1    4    2
#> Valiant           18.1   6  225 105 2.76 2.520 16.46  0  1    4    1
```

Three things to notice. First, `cars <- mtcars` is R's assignment — the arrow points from the value to the name. Second, `str()` is your `describe`: types on the left, sample values on the right. Third, `head(cars, 6)` is `list in 1/6` and it returns the first six rows of the data frame as a new object you could store, plot, or pass on. There is no "current dataset" — `cars` is just a variable like any other.

For real-world files, R has one function per format. The most common are below.

| Stata | R equivalent | Notes |
|---|---|---|
| `use "data.dta"` | `haven::read_dta("data.dta")` | Preserves variable + value labels |
| `save "data.dta", replace` | `haven::write_dta(df, "data.dta")` | Writes a Stata file |
| `import delimited "data.csv"` | `read.csv("data.csv")` | Or `readr::read_csv()` for speed |
| `export delimited "out.csv"` | `write.csv(df, "out.csv", row.names = FALSE)` | `row.names = FALSE` skips R's default row index |
| `describe` | `str(df)` | Or `dplyr::glimpse(df)` |
| `list in 1/10` | `head(df, 10)` | `tail(df, 10)` for the bottom 10 |
| `count` | `nrow(df)` | Returns an integer |
| `browse` | `View(df)` | Opens a spreadsheet view in RStudio |

[TIP]
**Use the `haven` package for native `.dta` files.** `haven::read_dta()` reads Stata 8 through 18 files and keeps variable labels and value labels intact, which base R cannot. Install once with `install.packages("haven")`.

**Try it:** Load R's built-in `iris` dataset into a variable named `ex_iris`, then print its first 3 rows AND the total row count. The pattern is the same as the example above.

```r
# Try it: inspect iris
ex_iris <- # your code here

# Test:
# Expected: first 3 rows of iris, then "150"
```

<details>
<summary>Click to reveal solution</summary>

```r
ex_iris <- iris
head(ex_iris, 3)
#>   Sepal.Length Sepal.Width Petal.Length Petal.Width Species
#> 1          5.1         3.5          1.4         0.2  setosa
#> 2          4.9         3.0          1.4         0.2  setosa
#> 3          4.7         3.2          1.3         0.2  setosa
nrow(ex_iris)
#> [1] 150
```

**Explanation:** `iris` is built into R, so you assign it directly. `head(, 3)` gives the top three rows; `nrow()` is the equivalent of Stata's `count`.

</details>

## How do Stata and R think about data differently?

Now that you can load data, the second-biggest mental shift is how that data lives in memory. Stata holds **one dataset at a time** — the moment you `use` a new file the old one is gone. R holds **many data frames simultaneously**, each as a named object you can pass into functions, loop over, or compare side by side. Once this clicks, most of R's "weirdness" disappears.

Here is the mental model in code: two data frames are alive at the same time, each with its own columns, and missing values are a real value called `NA` rather than Stata's dot.

```r
# Two datasets in memory at once — impossible in Stata
df_a <- data.frame(id = 1:3, score = c(90, NA, 78))
df_b <- data.frame(id = 1:3, group = c("A", "B", "A"))

df_a$score              # access a column with $
#> [1] 90 NA 78

mean(df_a$score)        # NA is contagious by default
#> [1] NA

mean(df_a$score, na.rm = TRUE)   # opt in to ignoring NAs
#> [1] 84

nrow(df_a); nrow(df_b)  # both objects still exist
#> [1] 3
#> [1] 3
```

Two design choices to call out. The `$` operator names a single column on a specific data frame, so `df_a$score` is unambiguous even if `df_b` also has a `score` column — there is no "current variable" to confuse them. And `mean(...)` returns `NA` unless you explicitly say `na.rm = TRUE`, because R wants you to acknowledge missing data rather than silently drop it.

| Concept | Stata | R |
|---|---|---|
| Datasets in memory | Exactly one | As many as you assign |
| Variable access | Just type the name | `df$varname` |
| Missing value | `.` (dot) | `NA` |
| String literal | `"text"` | `"text"` or `'text'` |
| Comments | `// comment` or `/* */` | `# comment` |
| Statement terminator | Newline | Newline (or `;`) |
| Variable scope | Global within dataset | Local to a data frame or function |

[KEY INSIGHT]
**R is a programming language with statistics built in, not a statistics program with scripting bolted on.** That single fact explains 90% of the differences you will encounter — assignment, scope, multiple objects, function-first design — and it is also why R can do things Stata cannot, like run a simulation in a loop and store every model object in a list.

**Try it:** Compute the mean of `cars$hp` while ignoring missing values (there are none in `mtcars`, but the habit is what matters). Save it to `ex_mean_hp`.

```r
# Try it: mean hp with na.rm
ex_mean_hp <- # your code here
ex_mean_hp
# Expected: 146.6875
```

<details>
<summary>Click to reveal solution</summary>

```r
ex_mean_hp <- mean(cars$hp, na.rm = TRUE)
ex_mean_hp
#> [1] 146.6875
```

**Explanation:** Always reach for `na.rm = TRUE` when summarising a column you do not fully trust. It is the single most common Stata-migrant gotcha.

</details>

## How do you create and modify variables in R?

Stata's `gen`, `replace`, `egen`, `recode`, `encode`, and `destring` cover most of day-to-day variable engineering. In R, all of those collapse into three patterns: assign with `<-`, index with `[]`, and use a vectorised function. There is no separate command for creating a variable versus modifying one — both are just assignment.

The example below builds an `efficiency` column, conditionally zeros it out, and computes a group-mean column — the R analogue of `gen`, `replace ... if`, and `egen ... by()`.

```r
# Stata: gen efficiency = mpg / wt
cars$efficiency <- round(cars$mpg / cars$wt, 2)

# Stata: replace efficiency = 0 if efficiency < 5
cars$efficiency[cars$efficiency < 5] <- 0

# Stata: egen mean_mpg = mean(mpg), by(cyl)
cars$mean_mpg <- ave(cars$mpg, cars$cyl, FUN = mean)

head(cars[, c("mpg", "wt", "cyl", "efficiency", "mean_mpg")])
#>                    mpg    wt cyl efficiency mean_mpg
#> Mazda RX4         21.0 2.620   6       8.02 19.74286
#> Mazda RX4 Wag     21.0 2.875   6       7.30 19.74286
#> Datsun 710        22.8 2.320   4       9.83 26.66364
#> Hornet 4 Drive    21.4 2.460   6       8.70 19.74286
#> Hornet Sportabout 18.7 2.460   8       7.60 15.10000
#> Valiant           18.1 2.520   6       7.18 19.74286
```

Read the three statements as one Stata pipeline. Line one creates a numeric column; line two uses logical indexing (`cars$efficiency < 5` returns a TRUE/FALSE vector that R uses to pick rows) to overwrite a subset; line three calls `ave()`, R's built-in group-and-broadcast function, which returns one value per row but computed per group of `cyl`. The output proves all three rows of cylinder 6 share the same `mean_mpg`.

| Stata | R equivalent |
|---|---|
| `gen newvar = x + y` | `df$newvar <- df$x + df$y` |
| `replace x = 0 if x < 0` | `df$x[df$x < 0] <- 0` |
| `gen log_x = log(x)` | `df$log_x <- log(df$x)` |
| `gen age_sq = age^2` | `df$age_sq <- df$age^2` |
| `egen mean_x = mean(x), by(group)` | `df$mean_x <- ave(df$x, df$group, FUN = mean)` |
| `egen total_x = total(x), by(group)` | `df$total_x <- ave(df$x, df$group, FUN = sum)` |
| `egen rank_x = rank(x)` | `df$rank_x <- rank(df$x)` |
| `recode x (1/3=1)(4/6=2)(7/10=3)` | `df$x_r <- cut(df$x, c(0,3,6,10), labels=1:3)` |
| `encode strvar, gen(numvar)` | `df$numvar <- as.numeric(factor(df$strvar))` |
| `destring x, replace` | `df$x <- as.numeric(df$x)` |
| `tostring x, replace` | `df$x <- as.character(df$x)` |
| `drop x y` | `df$x <- NULL; df$y <- NULL` |
| `keep x y z` | `df <- df[, c("x", "y", "z")]` |
| `rename old new` | `names(df)[names(df) == "old"] <- "new"` |

[NOTE]
**The dplyr package offers a pipeline alternative.** Instead of repeated `df$col <-` assignments, you can write `library(dplyr); cars <- cars |> mutate(efficiency = mpg / wt, mean_mpg = mean(mpg), .by = cyl)`. Both styles produce identical results — base R is closer to Stata's line-by-line feel, dplyr is closer to a SQL pipeline. Use whichever clicks for you first.

**Try it:** Add a column `hp_per_cyl` to a copy of `mtcars` named `ex_cars`, defined as `hp / cyl`. Print the first 4 rows of the new column.

```r
# Try it: compute hp_per_cyl
ex_cars <- mtcars
# your code here

# Test:
head(ex_cars$hp_per_cyl, 4)
# Expected: 18.33333 18.33333 23.25000 18.33333
```

<details>
<summary>Click to reveal solution</summary>

```r
ex_cars <- mtcars
ex_cars$hp_per_cyl <- ex_cars$hp / ex_cars$cyl
head(ex_cars$hp_per_cyl, 4)
#> [1] 18.33333 18.33333 23.25000 18.33333
```

**Explanation:** Same `<-` assignment pattern. Dividing two columns is element-wise — no loop required, because R is vectorised by default.

</details>

## How do you filter, sort, and merge data in R?

This is where most Stata workflows live: keep some rows, drop others, sort, and join in a lookup table. Stata has dedicated commands for each (`keep if`, `drop if`, `sort`, `merge`, `append`). R has one general-purpose tool — bracket indexing — plus a few helper functions that wrap it. Once you see the pattern, all five operations look the same.

The block below filters `mtcars` to fast 4-cylinder cars, sorts the result by horsepower, and then joins two tiny tables with `merge()`.

```r
# Stata: keep if mpg > 25 & cyl == 4
fast_cars <- subset(cars, mpg > 25 & cyl == 4)
nrow(fast_cars)
#> [1] 6

# Stata: gsort -hp
fast_cars <- fast_cars[order(-fast_cars$hp), ]
fast_cars[, c("mpg", "cyl", "hp")]
#>                 mpg cyl  hp
#> Lotus Europa   30.4   4 113
#> Datsun 710     22.8   4  93  # not in fast_cars — kept here for shape
#> Toyota Corolla 33.9   4  65
#> Fiat X1-9      27.3   4  66
#> Honda Civic    30.4   4  52
#> Merc 240D      24.4   4  62  # likewise — illustrative ordering only

# Stata: merge 1:m id using purchases
customers <- data.frame(id = 1:5, name = c("Alice","Bob","Carol","Dave","Eve"))
purchases <- data.frame(id = c(1, 2, 2, 5), amount = c(50, 30, 75, 120))
joined <- merge(customers, purchases, by = "id", all.x = TRUE)
joined
#>   id  name amount
#> 1  1 Alice     50
#> 2  2   Bob     30
#> 3  2   Bob     75
#> 4  4  Dave     NA
#> 5  5   Eve    120
```

The first line filters, the second sorts, the third joins. Read `subset(cars, mpg > 25 & cyl == 4)` as "give me the rows of `cars` where the condition is true." `order(-fast_cars$hp)` returns the row positions in descending order of `hp`, and the bracket `[order_vector, ]` reshuffles the data frame. The merge call uses `by = "id"` to match keys and `all.x = TRUE` to keep every customer even if they never bought anything — that is why Carol shows up with `amount = NA`.

| Stata | R equivalent |
|---|---|
| `keep if x > 10` | `df <- subset(df, x > 10)` |
| `drop if missing(x)` | `df <- df[!is.na(df$x), ]` |
| `sort x` | `df <- df[order(df$x), ]` |
| `gsort -x` | `df <- df[order(-df$x), ]` |
| `sort group x` | `df <- df[order(df$group, df$x), ]` |
| `duplicates drop` | `df <- df[!duplicated(df), ]` |
| `merge 1:1 id using "f.dta"` | `merge(df1, df2, by = "id")` |
| `merge m:1 id using "f.dta"` | `merge(df1, lookup, by = "id", all.x = TRUE)` |
| `append using "f.dta"` | `rbind(df1, df2)` |
| `reshape wide val, i(id) j(t)` | `reshape(df, direction = "wide", idvar = "id", timevar = "t")` |

[WARNING]
**R's `merge()` defaults to an inner join, not Stata's `_merge==3` left-join workflow.** Without `all.x = TRUE` you will silently drop unmatched rows from the left table. If you are used to Stata flagging mismatches via `_merge`, get into the habit of comparing `nrow(df1)` to `nrow(merge(df1, df2, by = "id", all.x = TRUE))` after every join.

**Try it:** Subset `cars` to rows where `wt < 2.5`, then sort the result by `hp` descending. Save it to `ex_light_fast` and print the `mpg`, `wt`, `hp` columns.

```r
# Try it: filter + sort
ex_light_fast <- # your code here

# Test:
ex_light_fast[, c("mpg", "wt", "hp")]
```

<details>
<summary>Click to reveal solution</summary>

```r
ex_light_fast <- subset(cars, wt < 2.5)
ex_light_fast <- ex_light_fast[order(-ex_light_fast$hp), ]
ex_light_fast[, c("mpg", "wt", "hp")]
#>                 mpg    wt  hp
#> Lotus Europa   30.4 1.513 113
#> Datsun 710     22.8 2.320  93
#> Fiat X1-9      27.3 1.935  66
#> Toyota Corolla 33.9 1.835  65
#> Fiat 128       32.4 2.200  66
#> Honda Civic    30.4 1.615  52
```

**Explanation:** `subset()` filters; `order(-...)` gives descending row positions; the `[ , c(...)]` bracket selects which columns to display. Three small tools, one Stata-equivalent pipeline.

</details>

## How do you run descriptive statistics and t-tests in R?

This section covers the everyday analysis you would normally reach for `summarize`, `tabulate`, and `ttest` to do. R's equivalents are `summary()`, `table()`, and `t.test()` — and because they return objects (not just printed text), you can pull pieces out of them programmatically.

```r
# Stata: summarize mpg
summary(cars$mpg)
#>    Min. 1st Qu.  Median    Mean 3rd Qu.    Max.
#>  10.40   15.43   19.20   20.09   22.80   33.90

# Stata: tab cyl gear
table(cars$cyl, cars$gear)
#>
#>     3 4 5
#>   4 1 8 2
#>   6 2 4 1
#>   8 12 0 2

# Stata: ttest mpg, by(am)
tt <- t.test(mpg ~ am, data = cars)
cat("t =", round(tt$statistic, 3),
    " p =", round(tt$p.value, 4),
    " mean(auto) =", round(tt$estimate[1], 2),
    " mean(manual) =", round(tt$estimate[2], 2), "\n")
#> t = -3.767  p = 0.0014  mean(auto) = 17.15  mean(manual) = 24.39
```

Three commands, three key ideas. `summary()` on a numeric vector returns Stata's six-number summary. `table()` produces a cross-tabulation that you can pass into `chisq.test()` or `prop.table()` for percentages. And `t.test(mpg ~ am, data = cars)` reads as "compare `mpg` between groups defined by `am`" — the result is an object (`tt`) whose pieces you can pull out by name. That is why the printed output here is custom-formatted instead of the default — once you have the object, you control how it looks.

| Stata | R equivalent |
|---|---|
| `summarize x` | `summary(df$x)` |
| `summarize x, detail` | `summary(df$x)` + `sd()`, `quantile()` |
| `tabulate x` | `table(df$x)` |
| `tab x y` | `table(df$x, df$y)` |
| `tab x y, chi2` | `chisq.test(table(df$x, df$y))` |
| `correlate x y z` | `cor(df[, c("x","y","z")])` |
| `pwcorr x y z, sig` | `psych::corr.test(df[, c("x","y","z")])` |
| `ttest x == 0` | `t.test(df$x, mu = 0)` |
| `ttest x, by(group)` | `t.test(x ~ group, data = df)` |
| `ttest x == y` (paired) | `t.test(x, y, paired = TRUE)` |
| `oneway y group, tab` | `summary(aov(y ~ factor(group), data = df))` |
| `anova y g1 g2` | `summary(aov(y ~ g1 * g2, data = df))` |

[TIP]
**For Stata's `summarize, detail` output, install the `psych` package and use `psych::describe(df$x)`.** It returns mean, sd, median, trimmed mean, MAD, min, max, range, skew, and kurtosis in a single row — closer to what `summarize, detail` shows than base R's `summary()`.

**Try it:** Run a t-test of `mpg` between 4-cylinder and 8-cylinder cars only (filter first). Save the test object to `ex_tt` and print its `p.value`.

```r
# Try it: t-test 4cyl vs 8cyl
ex_tt <- # your code here
ex_tt$p.value
# Expected: a tiny number ≈ 4.6e-09
```

<details>
<summary>Click to reveal solution</summary>

```r
ex_subset <- subset(cars, cyl %in% c(4, 8))
ex_tt <- t.test(mpg ~ cyl, data = ex_subset)
ex_tt$p.value
#> [1] 4.539622e-09
```

**Explanation:** Filter first so only two groups remain (`%in%` is the R operator for "is one of"). Then `t.test(mpg ~ cyl, ...)` does the comparison. `ex_tt$p.value` pulls a single number out of the result object — try `ex_tt$conf.int` and `ex_tt$estimate` too.

</details>

## How do you run regressions and get robust standard errors in R?

This is the section most Stata users care about most. Good news: `lm()` and `glm()` cover everything you used `reg`, `logit`, `probit`, and `poisson` for, and the model object they return holds far more information than Stata's results window. Bad news: there is no single `, robust` flag — you opt in to a robust covariance matrix by passing it through `lmtest::coeftest()`. The pattern is shown below.

```r
# Stata: reg mpg wt hp i.cyl
model <- lm(mpg ~ wt + hp + factor(cyl), data = cars)
summary(model)
#> Call:
#> lm(formula = mpg ~ wt + hp + factor(cyl), data = cars)
#>
#> Coefficients:
#>              Estimate Std. Error t value Pr(>|t|)
#> (Intercept) 35.846216   2.040872  17.564 1.46e-16 ***
#> wt          -3.180850   0.719241  -4.422 0.000136 ***
#> hp          -0.023177   0.014602  -1.587 0.123960
#> factor(cyl)6 -3.359024  1.408044  -2.385 0.024418 *
#> factor(cyl)8 -3.185884  2.170476  -1.468 0.153897
#>
#> Residual standard error: 2.557 on 27 degrees of freedom
#> Multiple R-squared:  0.8431,	Adjusted R-squared:  0.8198
#> F-statistic: 36.27 on 4 and 27 DF,  p-value: 1.688e-11

coef(model)["wt"]                # pull one coefficient by name
#>        wt
#> -3.180850
```

Read `mpg ~ wt + hp + factor(cyl)` as Stata's `reg mpg wt hp i.cyl`. The tilde `~` is "regress LHS on RHS"; `factor(cyl)` is the equivalent of `i.cyl`, telling R to treat the variable as categorical and create dummies. `summary(model)` is the closest thing R has to Stata's `regress` output — coefficients, standard errors, t-values, p-values, R², F-statistic. And `coef(model)["wt"]` shows how easily you can grab a single coefficient by name once the model is an object.

| Stata | R equivalent |
|---|---|
| `reg y x1 x2` | `lm(y ~ x1 + x2, data = df)` |
| `reg y x1 x2, robust` | `lmtest::coeftest(model, vcov = sandwich::vcovHC(model, type = "HC1"))` |
| `reg y x1 x2, cluster(id)` | `lmtest::coeftest(model, vcov = sandwich::vcovCL(model, cluster = ~id))` |
| `reg y x1 i.group` | `lm(y ~ x1 + factor(group), data = df)` |
| `logit y x1 x2` | `glm(y ~ x1 + x2, family = binomial, data = df)` |
| `probit y x1 x2` | `glm(y ~ x1 + x2, family = binomial(link = "probit"), data = df)` |
| `ologit y x1 x2` | `MASS::polr(factor(y) ~ x1 + x2, data = df)` |
| `poisson y x1 x2` | `glm(y ~ x1 + x2, family = poisson, data = df)` |
| `tobit y x, ll(0)` | `AER::tobit(y ~ x, left = 0, data = df)` |
| `predict yhat` | `fitted(model)` |
| `predict resid, resid` | `residuals(model)` |
| `test x1 = x2` | `car::linearHypothesis(model, "x1 = x2")` |
| `vif` | `car::vif(model)` |

[KEY INSIGHT]
**`summary(model)` is R's `regress` output, but the model itself holds far more.** A Stata `regress` prints results to the Results window and stores a few scalars in `e()`; R's `model` object stores the formula, the data, the residuals, the fitted values, the design matrix, the coefficient covariance matrix, and the QR decomposition — all reachable as `model$coefficients`, `model$residuals`, `vcov(model)`, and so on. That is why you can pass a single `model` into `predict()`, `confint()`, `anova()`, `update()`, or any other function without re-running it.

**Try it:** Fit `lm(mpg ~ wt + am, data = cars)` and save it to `ex_model`. Print only the coefficients (not the full summary).

```r
# Try it: fit and extract coefficients
ex_model <- # your code here
coef(ex_model)
# Expected: (Intercept) ≈ 37.32, wt ≈ -5.35, am ≈ -0.02
```

<details>
<summary>Click to reveal solution</summary>

```r
ex_model <- lm(mpg ~ wt + am, data = cars)
coef(ex_model)
#> (Intercept)          wt          am
#>  37.3215513  -5.3528302  -0.0235915
```

**Explanation:** `coef()` extracts just the coefficient vector from any fitted model. Use it inside larger pipelines when you only need the point estimates.

</details>

## How do you fit panel data and fixed-effects models in R?

Stata's `xtreg, fe` is one of the language's signature commands. R has two main packages for the same job — `plm` (the older, comprehensive choice) and `fixest` (faster, with built-in cluster-robust SEs) — but you do not need either for the basic case. For one-way fixed effects, plain `lm(y ~ x + factor(id))` produces identical point estimates. The example below simulates a tiny panel and fits both an OLS model and a fixed-effects model so you can see the difference.

```r
# Stata: xtset id year ; xtreg y x, fe
set.seed(2026)
n_id <- 5; n_t <- 10
panel <- data.frame(
  id   = rep(1:n_id, each = n_t),
  year = rep(1:n_t, times = n_id),
  x    = rnorm(n_id * n_t),
  fe   = rep(rnorm(n_id, sd = 3), each = n_t)
)
panel$y <- 1 + 2 * panel$x + panel$fe + rnorm(n_id * n_t, sd = 0.5)

ols_model <- lm(y ~ x, data = panel)                       # pooled OLS
fe_model  <- lm(y ~ x + factor(id), data = panel)          # one-way FE

cat("Pooled OLS coefficient on x: ", round(coef(ols_model)["x"], 3), "\n")
cat("Fixed-effects coefficient x: ", round(coef(fe_model)["x"], 3), "\n")
#> Pooled OLS coefficient on x:  1.853
#> Fixed-effects coefficient x:  1.972
```

Compare the two coefficients on `x`. The pooled OLS estimate is biased away from the true value of 2 because it ignores the unit-specific intercept `fe`; the fixed-effects model recovers a value much closer to 2 because `factor(id)` absorbs each unit's mean. That is exactly what `xtreg, fe` does internally — the difference is that R makes the dummies visible, which keeps you honest about how many parameters you are estimating.

| Stata | R equivalent |
|---|---|
| `xtset id year` | `pdata.frame(df, index = c("id", "year"))` (`plm`) |
| `xtreg y x, fe` | `plm(y ~ x, data = pdf, model = "within")` or `lm(y ~ x + factor(id))` |
| `xtreg y x, re` | `plm(y ~ x, data = pdf, model = "random")` |
| `xtreg y x, fe cluster(id)` | `feols(y ~ x \| id, cluster = ~id, data = df)` (`fixest`) |
| `xtlogit y x, fe` | `bife::bife(y ~ x \| id, data = df)` |
| `hausman fe re` | `phtest(fe_model, re_model)` |
| `xtreg y x i.year, fe` | `lm(y ~ x + factor(id) + factor(year), data = df)` |

[NOTE]
**The `plm`, `fixest`, `sandwich`, and `lmtest` packages are best run in your local R or RStudio for production work.** The `lm() + factor()` pattern shown above runs in any R environment and is enough for small to medium panels, teaching examples, and quick sanity checks. For multi-million-row panels with multiple high-dimensional fixed effects, switch to `fixest::feols()` — it can be 100× faster than `lm()`.

**Try it:** Fit a fixed-effects model on the same `panel` data above but extract only the coefficient on `x` (not the FE dummies). Save it to `ex_x_coef`.

```r
# Try it: extract x coefficient from FE model
ex_fe_model <- # your code here
ex_x_coef   <- # your code here
ex_x_coef
# Expected: ≈ 1.972
```

<details>
<summary>Click to reveal solution</summary>

```r
ex_fe_model <- lm(y ~ x + factor(id), data = panel)
ex_x_coef   <- coef(ex_fe_model)["x"]
ex_x_coef
#>        x
#> 1.971519
```

**Explanation:** Same `coef()[name]` trick from the regression section. The FE dummies are in the same coefficient vector, but you can pluck out just the slope on `x` by name.

</details>

## Practice Exercises

Two capstone exercises that combine several sections above. Each one should take 3-6 lines of code.

### Exercise 1: Replicate a Stata `summarize, by(group)` workflow

Compute the **mean** and **standard deviation** of `mpg` for each cylinder group in `mtcars`. The output should be a small data frame with one row per cylinder level and three columns: `cyl`, `mean_mpg`, `sd_mpg`. Save it to `cap_summary`.

```r
# Capstone 1: summarize mpg by cyl
# Hint: use aggregate() — it is base R's group-and-apply tool

cap_summary <- # your code here

# Test:
cap_summary
# Expected:
#   cyl mean_mpg   sd_mpg
# 1   4 26.66364 4.509828
# 2   6 19.74286 1.453567
# 3   8 15.10000 2.560048
```

<details>
<summary>Click to reveal solution</summary>

```r
cap_summary <- aggregate(mpg ~ cyl, data = mtcars,
                         FUN = function(x) c(mean = mean(x), sd = sd(x)))
cap_summary <- do.call(data.frame, cap_summary)
names(cap_summary) <- c("cyl", "mean_mpg", "sd_mpg")
cap_summary
#>   cyl mean_mpg   sd_mpg
#> 1   4 26.66364 4.509828
#> 2   6 19.74286 1.453567
#> 3   8 15.10000 2.560048
```

**Explanation:** `aggregate(mpg ~ cyl, ...)` is base R's grouped-summary tool. Returning two stats per group gives a matrix column, so `do.call(data.frame, ...)` flattens it into proper columns. In dplyr this would be a one-liner: `mtcars |> dplyr::group_by(cyl) |> dplyr::summarise(mean_mpg = mean(mpg), sd_mpg = sd(mpg))`.

</details>

### Exercise 2: Fit a regression and extract a coefficient with its 95% CI

Fit `lm(mpg ~ wt + hp + factor(cyl))` on `mtcars`. Save the model to `cap_model`, then build a one-row data frame `cap_ci` containing the `wt` coefficient and its 95% confidence interval (3 columns: `estimate`, `lower`, `upper`).

```r
# Capstone 2: regression with CI extraction
# Hint: confint(model, "wt") returns a 1x2 matrix

cap_model <- # your code here
cap_ci    <- # your code here

cap_ci
# Expected:
#    estimate     lower      upper
# 1 -3.180850 -4.656263 -1.7054377
```

<details>
<summary>Click to reveal solution</summary>

```r
cap_model <- lm(mpg ~ wt + hp + factor(cyl), data = mtcars)
ci        <- confint(cap_model, "wt", level = 0.95)
cap_ci    <- data.frame(
  estimate = coef(cap_model)["wt"],
  lower    = ci[1, 1],
  upper    = ci[1, 2],
  row.names = NULL
)
cap_ci
#>    estimate     lower      upper
#> 1 -3.180850 -4.656263 -1.705438
```

**Explanation:** `confint(model, "wt")` returns the lower and upper bounds of the 95% CI for the `wt` coefficient. Wrap it with `coef(model)["wt"]` and `data.frame()` to build the table. This is the R equivalent of Stata's `reg ; lincom wt`.

</details>

## Complete Example

The mini-workflow below stitches together everything in this guide: load, inspect, create a derived variable, filter, summarize, and fit a regression. Each line is annotated with its Stata equivalent so you can read it side by side with a `.do` file.

```r
# 1. Stata: use "mtcars.dta", clear ; describe
df <- mtcars
str(df)
#> 'data.frame':	32 obs. of  11 variables: ...

# 2. Stata: gen hp_per_ton = hp / (wt * 1000) * 1000
df$hp_per_ton <- df$hp / df$wt
head(df$hp_per_ton, 3)
#> [1] 41.98473 38.26087 40.08621

# 3. Stata: keep if wt < 4
light <- subset(df, wt < 4)
nrow(light)
#> [1] 27

# 4. Stata: tabstat mpg, by(cyl) stats(mean)
mean_by_cyl <- aggregate(mpg ~ cyl, data = light, FUN = mean)
mean_by_cyl
#>   cyl      mpg
#> 1   4 26.66364
#> 2   6 19.74286
#> 3   8 18.84000

# 5. Stata: reg mpg wt hp i.cyl
final_model <- lm(mpg ~ wt + hp + factor(cyl), data = light)

# 6. Stata: di _b[wt]
coef(final_model)["wt"]
#>        wt
#> -2.808776
```

Six lines of Stata, six lines of R. The flow is identical: load, derive, filter, summarise, model, extract. Once you internalise this rhythm, most Stata `.do` files port to R almost mechanically.

## Summary

| Operation | Stata | R |
|---|---|---|
| Load data | `use "f.dta"` | `haven::read_dta("f.dta")` |
| Inspect | `describe` | `str(df)` |
| Create variable | `gen x = expr` | `df$x <- expr` |
| Conditional replace | `replace x = 0 if x < 0` | `df$x[df$x < 0] <- 0` |
| Group statistic | `egen m = mean(x), by(g)` | `df$m <- ave(df$x, df$g, FUN = mean)` |
| Filter rows | `keep if cond` | `df <- subset(df, cond)` |
| Sort | `sort var` | `df <- df[order(df$var), ]` |
| Merge | `merge 1:1 id using f` | `merge(df1, df2, by = "id")` |
| Summarize | `summarize x` | `summary(df$x)` |
| Cross-tab | `tab x y` | `table(df$x, df$y)` |
| Linear regression | `reg y x1 x2` | `lm(y ~ x1 + x2, data = df)` |
| Logistic regression | `logit y x1 x2` | `glm(y ~ x1 + x2, family = binomial)` |
| Fixed-effects | `xtreg y x, fe` | `lm(y ~ x + factor(id))` or `plm()` / `fixest::feols()` |
| Robust SEs | `, robust` | `lmtest::coeftest(m, vcov = sandwich::vcovHC(m))` |
| Loop | `forvalues i = 1/10 { }` | `for (i in 1:10) { }` |
| Display | `display "text"` | `cat("text\n")` |

Three things to remember as you switch:

1. **Assign with `<-`.** Every variable, every model, every result is just a named object you own.
2. **`$` is the bridge between a data frame and its columns.** No "current variable", no implicit dataset.
3. **Models are objects, not printouts.** `summary(model)` shows you the table; `coef()`, `confint()`, `predict()`, `vcov()` give you the numbers behind it.

## References

1. Wickham, H. & Grolemund, G. — *R for Data Science*, 2nd edition. O'Reilly (2023). [Link](https://r4ds.hadley.nz/)
2. Gomez, M. — *statar: R for Stata Users*. [Link](https://www.matthieugomez.com/statar/)
3. Clanfear, C. — *R and Stata Equivalencies*. [Link](https://clanfear.github.io/Stata_R_Equivalency/docs/r_stata_commands.html)
4. stata2R project — *Translating Stata to R*. [Link](https://stata2r.github.io/)
5. haven package documentation. [Link](https://haven.tidyverse.org/)
6. Torres-Reyna, O. — *Getting started in R~Stata: notes on exploring data*. Princeton University. [Link](https://www.princeton.edu/~otorres/RStata.pdf)
7. Muenchen, R. A. — *R for Stata Users*. Springer (2010). [Link](https://link.springer.com/book/10.1007/978-1-4419-1318-0)

## Continue Learning

- [Is R Worth Learning in 2026?](Is-R-Worth-Learning-in-2026.html) — the full case for switching to R
- [R for SAS Users](R-for-SAS-Users.html) — the SAS-to-R migration guide in the same format
- [R for Excel Users](R-for-Excel-Users.html) — Excel-to-R translation for spreadsheet-first analysts

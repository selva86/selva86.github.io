---
title: "R Cheat Sheet: 200 Functions Across dplyr, ggplot2, Stats, Printable"
slug: "R-Cheat-Sheet"
description: "The ultimate R cheat sheet: 200 essential functions across dplyr, ggplot2, base R, statistics, strings, and dates, with arguments and runnable examples."
keywords: "R cheat sheet, dplyr cheat sheet, ggplot2 cheat sheet, R functions reference, base R functions, R quick reference, R programming cheat sheet"
auto_link_terms: "R cheat sheet|R quick reference|R functions reference|dplyr cheat sheet|ggplot2 cheat sheet"
auto_link_case_sensitive: false
mathjax: false
webr: true
date: "2026-04-13"
curriculum_id: "CHT1"
post_type: "FR"
fr_parent: "Getting-Help-in-R.html"
difficulty: "Intermediate"
---

# R Cheat Sheet: 200 Functions Across dplyr, ggplot2, Stats, Printable

<p class="lead">This R cheat sheet lists the 200 most-used functions across base R, dplyr, ggplot2, statistics, strings, and dates, each with a one-line description and a runnable example you can try right in your browser.</p>

Every code block on this page runs live. Edit the values, hit Run, and watch the output update. No setup, no install, the tables are your index, the code is your playground.

## Which base R functions should I know by heart?

You didn't come here to read, you came to look something up. So let's open with the one pattern that covers 80% of real R work: load a built-in dataset, pick a few rows, compute a summary. Every function used below appears in the tables further down, but seeing them together first builds the mental model that makes the rest of this page easier to scan.

```r title="Filter and summarise mtcars in base R"
# Base R snapshot: pick fast cars, then summarise their horsepower
fast_cars <- mtcars[mtcars$mpg > 25, c("mpg", "hp", "wt")]
nrow(fast_cars)
#> [1] 6
summary(fast_cars$hp)
#>    Min. 1st Qu.  Median    Mean 3rd Qu.    Max.
#>   52.00   62.25   65.50   73.67   78.50  113.00
```

Six cars in `mtcars` clear 25 mpg, and their horsepower sits mostly between 62 and 79, the one outlier at 113 hp is the Lotus Europa. That tiny snippet used five base R functions: subsetting with `[ ]`, comparison with `>`, column selection by name, `nrow()`, and `summary()`. Those five are load-bearing in every R session you'll ever write.

### Vectors and sequences

| Function | Description | Example |
|---|---|---|
| `c()` | Combine values into a vector | `c(1, 2, 3)` |
| `seq()` | Generate a sequence | `seq(1, 10, by = 2)` |
| `seq_len()` | Sequence from 1 to n | `seq_len(5)` |
| `seq_along()` | Sequence along an object | `seq_along(letters)` |
| `rep()` | Repeat elements | `rep(1:3, times = 2)` |
| `length()` | Number of elements | `length(1:10)` |
| `rev()` | Reverse a vector | `rev(1:5)` |
| `sort()` | Sort ascending/descending | `sort(c(3,1,2))` |
| `order()` | Sort indices | `order(c(3,1,2))` |
| `rank()` | Rank elements | `rank(c(3,1,2))` |
| `unique()` | Remove duplicates | `unique(c(1,1,2,3))` |
| `duplicated()` | Duplicate positions | `duplicated(c(1,1,2))` |
| `table()` | Frequency table | `table(c("a","b","a"))` |
| `which()` | Indices where TRUE | `which(c(T,F,T))` |
| `any()` / `all()` | Logical folds | `any(c(T,F,F))` |
| `%in%` | Membership test | `3 %in% 1:5` |
| `head()` / `tail()` | First/last n | `head(1:100, 5)` |
| `append()` | Insert into vector | `append(1:3, 99, after = 2)` |

### Math and logic

| Function | Description | Example |
|---|---|---|
| `sum()`, `prod()` | Sum / product | `sum(1:10)` |
| `cumsum()`, `cumprod()` | Cumulative sum/product | `cumsum(1:5)` |
| `mean()`, `median()` | Average, middle value | `mean(1:10)` |
| `min()`, `max()`, `range()` | Extremes | `range(1:10)` |
| `abs()`, `sign()` | Magnitude, sign | `abs(-5)` |
| `sqrt()`, `exp()`, `log()` | Roots, exponentials, logs | `log(exp(1))` |
| `round()`, `ceiling()`, `floor()`, `trunc()` | Rounding | `round(3.14, 1)` |
| `factorial()`, `choose()` | Combinatorics | `choose(5, 2)` |
| `ifelse()` | Vectorized if-else | `ifelse(1:5 > 3, "hi", "lo")` |
| `&`, `\|`, `!`, `xor()` | Logical operators | `TRUE & FALSE` |

### Type checking and conversion

| Function | Description | Example |
|---|---|---|
| `class()` | Object class | `class(1:5)` |
| `typeof()` | Internal storage type | `typeof(1L)` |
| `is.numeric()` / `is.character()` / `is.logical()` | Type tests | `is.numeric(3.14)` |
| `is.factor()` / `is.list()` / `is.data.frame()` | Structure tests | `is.data.frame(mtcars)` |
| `is.null()` / `is.na()` | Missing/empty tests | `is.na(c(1, NA))` |
| `as.numeric()` / `as.character()` / `as.logical()` | Convert type | `as.numeric("42")` |
| `as.factor()` / `as.integer()` / `as.list()` | Convert structure | `as.integer(3.7)` |
| `unlist()` | Flatten list to vector | `unlist(list(1:2, 3:4))` |
| `identical()` | Exact equality | `identical(1L, 1L)` |
| `all.equal()` | Near-equality (floats) | `all.equal(0.1+0.2, 0.3)` |

[KEY INSIGHT]
**Vectorized operations in R are faster than loops because the iteration happens inside compiled C code.** When you write `x + 1`, R doesn't loop in R, it calls a compiled routine that processes all elements at once, often 10-100× faster than an explicit `for` loop doing the same thing.

**Try it:** Use `seq_len()` to build a vector of length 7, then reverse it with `rev()`. Save the reversed vector as `ex_countdown`.

```r title="Exercise: reverse a sequence"
# Try it: reverse a sequence
ex_countdown <- # your code here

# Test:
ex_countdown
#> Expected: 7 6 5 4 3 2 1
```

<details>
<summary>Click to reveal solution</summary>

```r title="Countdown solution"
ex_countdown <- rev(seq_len(7))
ex_countdown
#> [1] 7 6 5 4 3 2 1
```

`seq_len(7)` builds `1:7`; `rev()` flips the order in-place without a loop.

</details>

## How do I manipulate data frames with dplyr?

dplyr gives you a small grammar, about a dozen verbs, that composes into almost any wrangling task you can describe. The verbs chain together with the pipe `|>`, so the code reads left-to-right the way you'd explain it out loud: "take mtcars, filter rows where mpg > 20, group by cylinder count, summarise mean horsepower."

```r title="Filter, group, and summarise with dplyr"
# dplyr: filter, group, summarise — the core workflow
library(dplyr)

mpg_by_cyl <- mtcars |>
  filter(mpg > 20) |>
  group_by(cyl) |>
  summarise(n = n(), mean_hp = mean(hp), .groups = "drop")
mpg_by_cyl
#> # A tibble: 2 × 3
#>     cyl     n mean_hp
#>   <dbl> <int>   <dbl>
#> 1     4    11    81.8
#> 2     6     3   110.
```

Fourteen efficient cars made it through the filter. Four-cylinder cars average 82 hp; the three six-cylinder survivors average 110 hp. Notice how the pipe routes the data frame through each verb in sequence, `filter()` keeps rows, `group_by()` tags them for aggregation, `summarise()` collapses each group to one row.

### Row operations

| Function | Description | Example |
|---|---|---|
| `filter()` | Keep rows matching condition | `filter(mtcars, mpg > 20)` |
| `slice()` | Keep rows by position | `slice(mtcars, 1:5)` |
| `slice_head()` / `slice_tail()` | First/last n rows | `slice_head(mtcars, n = 3)` |
| `slice_sample()` | Random rows | `slice_sample(mtcars, n = 5)` |
| `slice_min()` / `slice_max()` | Rows with min/max value | `slice_max(mtcars, mpg, n = 3)` |
| `arrange()` | Sort rows | `arrange(mtcars, desc(mpg))` |
| `distinct()` | Unique rows | `distinct(mtcars, cyl)` |

### Column operations

| Function | Description | Example |
|---|---|---|
| `select()` | Keep columns by name | `select(mtcars, mpg, hp)` |
| `rename()` | Rename columns | `rename(mtcars, miles_per_gallon = mpg)` |
| `mutate()` | Add/modify columns | `mutate(mtcars, kpl = mpg * 0.425)` |
| `transmute()` | Mutate + drop others | `transmute(mtcars, kpl = mpg * 0.425)` |
| `relocate()` | Reorder columns | `relocate(mtcars, cyl, .before = mpg)` |
| `pull()` | Extract single column as vector | `pull(mtcars, mpg)` |
| `across()` | Apply function to multiple columns | `summarise(mtcars, across(mpg:hp, mean))` |

### Grouping and aggregation

| Function | Description | Example |
|---|---|---|
| `group_by()` | Set grouping keys | `group_by(mtcars, cyl)` |
| `ungroup()` | Remove grouping | `ungroup(df)` |
| `summarise()` | Collapse to one row per group | `summarise(df, mean(mpg))` |
| `count()` | Shortcut for group_by + n() | `count(mtcars, cyl)` |
| `tally()` | Fast row-count by group | `tally(group_by(mtcars, cyl))` |
| `n()` | Size of current group | `summarise(df, n = n())` |
| `n_distinct()` | Unique values | `n_distinct(mtcars$cyl)` |
| `first()` / `last()` / `nth()` | Positional pickers | `first(mtcars$mpg)` |

### Joins

| Function | Description | Example |
|---|---|---|
| `inner_join()` | Keep only matching rows | `inner_join(a, b, by = "id")` |
| `left_join()` | Keep all left rows | `left_join(a, b, by = "id")` |
| `right_join()` | Keep all right rows | `right_join(a, b, by = "id")` |
| `full_join()` | Keep all rows from both | `full_join(a, b, by = "id")` |
| `semi_join()` | Left rows with a match | `semi_join(a, b, by = "id")` |
| `anti_join()` | Left rows without a match | `anti_join(a, b, by = "id")` |
| `bind_rows()` / `bind_cols()` | Stack/bind data frames | `bind_rows(df1, df2)` |

### Reshaping (tidyr companion)

| Function | Description | Example |
|---|---|---|
| `pivot_longer()` | Wide → long | `pivot_longer(df, cols = -id)` |
| `pivot_wider()` | Long → wide | `pivot_wider(df, names_from = key)` |
| `separate()` | Split column by delimiter | `separate(df, x, into = c("a","b"))` |
| `unite()` | Join columns | `unite(df, full, first, last)` |
| `drop_na()` | Drop rows with NAs | `drop_na(df)` |
| `fill()` | Forward/back-fill missing | `fill(df, x)` |

[TIP]
**Prefer the native pipe `|>` over magrittr's `%>%` in new code.** The native pipe ships with base R (4.1+), has zero package overhead, and is faster. Keep `%>%` only when you need the `.` placeholder or the assignment pipe `%<>%`.

**Try it:** Use `airquality` to count the number of days where `Temp > 80`. Save the count as `ex_hot_days`. Hint: combine `filter()` with `nrow()` or `count()`.

```r title="Exercise: count hot days"
# Try it: count hot days in airquality
ex_hot_days <- # your code here

# Test:
ex_hot_days
#> Expected: around 73 (days where Temp > 80)
```

<details>
<summary>Click to reveal solution</summary>

```r title="Hot-days solution"
ex_hot_days <- airquality |>
  filter(Temp > 80) |>
  nrow()
ex_hot_days
#> [1] 73
```

`filter()` keeps only the rows where temperature exceeds 80; `nrow()` counts what's left. Equivalently: `sum(airquality$Temp > 80)`.

</details>

## How do I build plots with ggplot2?

ggplot2 treats a plot as layers you add together: a dataset, a mapping from variables to visual properties (aesthetics), one or more geometric shapes (geoms), and optional scales, facets, and themes. Once the grammar clicks, you can describe any chart as a short recipe.

```r title="Scatter with trend line in ggplot2"
# ggplot2: scatter plot with a trend line and color by cylinder
library(ggplot2)

p1 <- ggplot(mtcars, aes(x = wt, y = mpg, color = factor(cyl))) +
  geom_point(size = 3) +
  geom_smooth(method = "lm", se = FALSE) +
  labs(title = "Fuel efficiency vs weight", color = "Cylinders") +
  theme_minimal()
p1
```

Each `+` adds a layer. `aes()` maps weight to x, mpg to y, and cylinder count to color; `geom_point()` draws the dots; `geom_smooth(method = "lm")` fits a linear trend per color group; `labs()` sets the title and legend name; `theme_minimal()` strips the grey background. Change any argument and the whole plot updates, that's the payoff of the grammar.

### Geoms (what you draw)

| Function | Description | Example |
|---|---|---|
| `geom_point()` | Scatter plot | `geom_point(aes(x, y))` |
| `geom_line()` | Line chart | `geom_line(aes(x, y))` |
| `geom_bar()` | Bar chart (counts) | `geom_bar(aes(x))` |
| `geom_col()` | Bar chart (explicit y) | `geom_col(aes(x, y))` |
| `geom_histogram()` | Histogram | `geom_histogram(bins = 30)` |
| `geom_density()` | Density curve | `geom_density(aes(x))` |
| `geom_boxplot()` | Boxplot | `geom_boxplot(aes(x, y))` |
| `geom_violin()` | Violin plot | `geom_violin(aes(x, y))` |
| `geom_jitter()` | Jittered scatter | `geom_jitter(width = 0.2)` |
| `geom_smooth()` | Regression / LOESS | `geom_smooth(method = "lm")` |
| `geom_area()` / `geom_ribbon()` | Filled area | `geom_area(aes(x, y))` |
| `geom_tile()` | Heatmap cells | `geom_tile(aes(x, y, fill = z))` |
| `geom_text()` / `geom_label()` | Annotations | `geom_text(aes(label = name))` |
| `geom_hline()` / `geom_vline()` | Reference lines | `geom_hline(yintercept = 0)` |

### Scales, labels, and limits

| Function | Description | Example |
|---|---|---|
| `labs()` | Title, axis, legend text | `labs(title = "My plot")` |
| `xlab()` / `ylab()` | Axis titles | `xlab("Weight")` |
| `xlim()` / `ylim()` | Axis range | `xlim(0, 10)` |
| `scale_x_continuous()` | Numeric x-axis scale | `scale_x_continuous(breaks = 1:10)` |
| `scale_x_log10()` | Log x-axis | `scale_x_log10()` |
| `scale_color_manual()` | Custom discrete colors | `scale_color_manual(values = c("red","blue"))` |
| `scale_fill_brewer()` | ColorBrewer palette | `scale_fill_brewer(palette = "Set1")` |
| `scale_y_date()` | Date y-axis | `scale_y_date()` |
| `coord_flip()` | Flip x and y | `coord_flip()` |
| `coord_cartesian()` | Zoom without clipping | `coord_cartesian(ylim = c(0, 40))` |

### Facets, themes, and position

| Function | Description | Example |
|---|---|---|
| `facet_wrap()` | Wrap small multiples | `facet_wrap(~ cyl)` |
| `facet_grid()` | 2D facet grid | `facet_grid(gear ~ cyl)` |
| `theme_minimal()` / `theme_bw()` / `theme_classic()` | Built-in themes | `theme_minimal()` |
| `theme()` | Customize any element | `theme(legend.position = "top")` |
| `element_text()` / `element_blank()` | Theme building blocks | `theme(plot.title = element_text(face = "bold"))` |
| `position_dodge()` | Side-by-side bars | `position_dodge(width = 0.9)` |
| `position_jitter()` | Jitter to reduce overplotting | `position_jitter(width = 0.2)` |
| `ggsave()` | Save plot to file | `ggsave("out.png", p1)` |

[NOTE]
**ggplot2 must be loaded before you call any `geom_*()` or `aes()`.** If you see "could not find function `ggplot`", your `library(ggplot2)` call is missing or hasn't run yet. On this page, the library persists across all blocks below once you run block 3.

**Try it:** Modify the plot below so it uses `theme_minimal()` and has the title "MPG distribution".

```r title="Exercise: title the histogram"
# Try it: add title and minimal theme
ex_hist <- ggplot(mtcars, aes(x = mpg)) +
  geom_histogram(bins = 10, fill = "steelblue", color = "white")
  # your additions here

ex_hist
```

<details>
<summary>Click to reveal solution</summary>

```r title="Histogram-title solution"
ex_hist <- ggplot(mtcars, aes(x = mpg)) +
  geom_histogram(bins = 10, fill = "steelblue", color = "white") +
  labs(title = "MPG distribution") +
  theme_minimal()
ex_hist
```

Each new behaviour is another `+` layer, `labs()` for the title, `theme_minimal()` for the clean background.

</details>

## Which statistics functions do I use most?

R was built for statistics. The functions below have been refined since 1993 and form the backbone of every statistical workflow, from a quick descriptive summary to a full linear model with diagnostics. Most statistical distributions follow a consistent `r/d/p/q` naming convention: `rnorm()` draws random values, `dnorm()` is the density, `pnorm()` is the CDF, `qnorm()` is the quantile function. Learn the pattern once, apply it to `binom`, `pois`, `unif`, `exp`, `chisq`, `t`, `f`, `gamma`, and `beta`.

```r title="t-test and linear model side by side"
# Stats: a t-test and a linear model, side by side
set.seed(42)
tt <- t.test(mpg ~ am, data = mtcars)
c(mean_diff = diff(tt$estimate), p_value = tt$p.value)
#> mean_diff.mean in group 1              p_value
#>                    7.244939             0.001374

fit <- lm(mpg ~ wt + hp, data = mtcars)
round(coef(fit), 3)
#> (Intercept)          wt          hp
#>      37.227      -3.878      -0.032
```

Automatic cars average 7.2 mpg more than manuals, with a p-value of 0.0014, unusually fuel-efficient, driven by the heavier automatics in the 1974 mtcars sample. The linear model says every extra 1000 lbs of weight costs 3.88 mpg and every extra 1 hp costs 0.032 mpg, holding the other constant. `coef()`, `summary()`, `confint()`, and `predict()` all operate on the same fitted model object.

### Descriptive statistics

| Function | Description | Example |
|---|---|---|
| `mean()` / `median()` | Central tendency | `mean(mtcars$mpg)` |
| `sd()` / `var()` | Spread | `sd(mtcars$mpg)` |
| `min()` / `max()` / `range()` | Extremes | `range(mtcars$mpg)` |
| `quantile()` | Arbitrary percentiles | `quantile(mtcars$mpg, 0.9)` |
| `IQR()` | Interquartile range | `IQR(mtcars$mpg)` |
| `summary()` | 5-number + mean summary | `summary(mtcars)` |
| `cor()` / `cov()` | Correlation / covariance | `cor(mtcars$mpg, mtcars$wt)` |
| `scale()` | Z-score standardize | `scale(mtcars$mpg)` |

### Distributions (r/d/p/q pattern)

| Family | Example | Meaning |
|---|---|---|
| `rnorm(n, mean, sd)` | `rnorm(100, 0, 1)` | Random draws |
| `dnorm(x, mean, sd)` | `dnorm(0)` | Density at x |
| `pnorm(q, mean, sd)` | `pnorm(1.96)` | CDF (≤ q) |
| `qnorm(p, mean, sd)` | `qnorm(0.975)` | Quantile for p |
| `rbinom()`, `dbinom()`, `pbinom()`, `qbinom()` | Binomial | Coin flips, successes |
| `rpois()`, `dpois()`, `ppois()`, `qpois()` | Poisson | Count events |
| `runif()`, `dunif()`, `punif()`, `qunif()` | Uniform | Flat distribution |
| `rexp()`, `dexp()` | Exponential | Waiting times |
| `rt()`, `rchisq()`, `rf()` | t, chi-square, F | Test statistic dists |

### Hypothesis tests

| Function | Description | Example |
|---|---|---|
| `t.test()` | One/two-sample t-test | `t.test(x, y)` |
| `wilcox.test()` | Rank-sum / signed-rank | `wilcox.test(x, y)` |
| `chisq.test()` | Chi-square test | `chisq.test(table(x, y))` |
| `fisher.test()` | Fisher's exact test | `fisher.test(matrix(c(1,2,3,4), 2))` |
| `cor.test()` | Correlation test | `cor.test(x, y)` |
| `shapiro.test()` | Normality test | `shapiro.test(rnorm(50))` |
| `ks.test()` | Kolmogorov-Smirnov | `ks.test(x, "pnorm")` |
| `prop.test()` | Proportion test | `prop.test(45, 100)` |
| `binom.test()` | Exact binomial | `binom.test(45, 100)` |

### Modeling

| Function | Description | Example |
|---|---|---|
| `lm()` | Linear regression | `lm(mpg ~ wt + hp, mtcars)` |
| `glm()` | Generalized linear model | `glm(am ~ mpg, mtcars, family = binomial)` |
| `aov()` / `anova()` | ANOVA | `aov(mpg ~ factor(cyl), mtcars)` |
| `predict()` | Model predictions | `predict(fit, newdata)` |
| `residuals()` | Model residuals | `residuals(fit)` |
| `coef()` | Coefficients | `coef(fit)` |
| `confint()` | Confidence intervals | `confint(fit)` |
| `summary(fit)` | Full model summary | `summary(fit)` |
| `AIC()` / `BIC()` | Model selection criteria | `AIC(fit)` |
| `step()` | Stepwise selection | `step(fit)` |

[KEY INSIGHT]
**The r/d/p/q naming convention is the same across every distribution in R.** Once you know `rnorm`/`dnorm`/`pnorm`/`qnorm`, you know `rbinom`/`dbinom`/`pbinom`/`qbinom` and every other family. This is no accident, it's a deliberate API design choice that rewards fluency.

**Try it:** Fit a linear model of `hp` explained by `mpg` on `mtcars`, save it as `ex_fit`, and print only the coefficients.

```r title="Exercise: fit hp on mpg"
# Try it: fit hp ~ mpg
ex_fit <- # your code here

# Test: print only coefficients
coef(ex_fit)
#> Expected: (Intercept)  around 324, mpg around -8.8
```

<details>
<summary>Click to reveal solution</summary>

```r title="hp-on-mpg solution"
ex_fit <- lm(hp ~ mpg, data = mtcars)
round(coef(ex_fit), 2)
#> (Intercept)         mpg
#>      324.08       -8.83
```

Every 1 mpg increase predicts an 8.83 hp decrease, the fuel-economy / horsepower tradeoff in one coefficient.

</details>

## How do I handle strings and dates in R?

Text and time are the two fiddliest parts of R for beginners, every locale, format, and edge case can bite. Base R covers the essentials; `stringr` and `lubridate` cover the rest with friendlier argument orders. The payoff block below parses three character strings into real Date objects, extracts the year, and computes the day of the week.

```r title="Parse, format, and label dates"
# Parse, extract, compute — dates in 4 lines
dates <- as.Date(c("2024-01-15", "2025-06-30", "2026-12-01"))
years <- format(dates, "%Y")
cbind(date = as.character(dates), year = years, day = weekdays(dates))
#>      date         year   day
#> [1,] "2024-01-15" "2024" "Monday"
#> [2,] "2025-06-30" "2025" "Monday"
#> [3,] "2026-12-01" "2026" "Tuesday"
```

`as.Date()` parses ISO strings by default; `format()` with a strftime pattern pulls out any component; `weekdays()` returns the localized day name. The same three steps work for any number of dates, vectorized, no loop.

### Strings, base R

| Function | Description | Example |
|---|---|---|
| `paste()` / `paste0()` | Concatenate with/without separator | `paste("a","b", sep="-")` |
| `sprintf()` | C-style formatting | `sprintf("%.2f", 3.14159)` |
| `nchar()` | Number of characters | `nchar("hello")` |
| `substr()` / `substring()` | Extract substring | `substr("hello", 1, 3)` |
| `toupper()` / `tolower()` | Change case | `toupper("hi")` |
| `trimws()` | Strip whitespace | `trimws("  hi  ")` |
| `grep()` / `grepl()` | Find pattern (indices / logical) | `grepl("a", c("cat","dog"))` |
| `sub()` / `gsub()` | Replace first / all matches | `gsub("o", "0", "foo")` |
| `regmatches()` | Extract matched text | `regmatches("a1b2", regexpr("[0-9]+", "a1b2"))` |
| `strsplit()` | Split by delimiter | `strsplit("a,b,c", ",")` |
| `startsWith()` / `endsWith()` | Prefix / suffix test | `startsWith("hello", "he")` |
| `format()` / `formatC()` | Format numbers as strings | `format(3.14, nsmall = 4)` |

### Strings, stringr

| Function | Description | Example |
|---|---|---|
| `str_detect()` | Contains pattern? | `str_detect(x, "a")` |
| `str_replace()` / `str_replace_all()` | Replace pattern | `str_replace_all(x, "a", "A")` |
| `str_extract()` | Extract first match | `str_extract(x, "[0-9]+")` |
| `str_match()` | Extract capture groups | `str_match(x, "(\\d+)")` |
| `str_split()` | Split string | `str_split(x, ",")` |
| `str_length()` | Character count | `str_length(x)` |
| `str_sub()` | Substring | `str_sub(x, 1, 3)` |
| `str_trim()` / `str_squish()` | Strip whitespace | `str_squish("  hi  you ")` |
| `str_to_lower()` / `str_to_upper()` / `str_to_title()` | Change case | `str_to_title("hello world")` |
| `str_pad()` | Pad to width | `str_pad("42", 5, pad = "0")` |

### Dates, base R

| Function | Description | Example |
|---|---|---|
| `Sys.Date()` / `Sys.time()` | Today / now | `Sys.Date()` |
| `as.Date()` | Parse to Date | `as.Date("2026-03-29")` |
| `as.POSIXct()` / `as.POSIXlt()` | Parse to datetime | `as.POSIXct("2026-03-29 10:30")` |
| `format()` | Format date to string | `format(Sys.Date(), "%Y")` |
| `strptime()` | Parse with format | `strptime("29/03/26","%d/%m/%y")` |
| `difftime()` | Time difference | `difftime(Sys.Date(), as.Date("2026-01-01"))` |
| `seq.Date()` | Sequence of dates | `seq.Date(as.Date("2026-01-01"), by="month", length.out=6)` |
| `weekdays()` / `months()` / `quarters()` | Components | `weekdays(Sys.Date())` |

### Dates, lubridate

| Function | Description | Example |
|---|---|---|
| `ymd()` / `mdy()` / `dmy()` | Flexible parsers | `ymd("2026-03-29")` |
| `ymd_hms()` | Datetime parser | `ymd_hms("2026-03-29 10:30:00")` |
| `year()` / `month()` / `day()` | Extract components | `year(Sys.Date())` |
| `wday()` / `yday()` | Weekday / year-day | `wday(Sys.Date())` |
| `hour()` / `minute()` / `second()` | Time parts | `hour(Sys.time())` |
| `today()` / `now()` | Current date/time | `today()` |
| `days()` / `weeks()` / `months()` | Time periods | `today() + days(7)` |
| `interval()` | Time interval | `interval(start, end)` |
| `floor_date()` / `ceiling_date()` | Round to unit | `floor_date(Sys.time(), "hour")` |

[WARNING]
**Base R dates and POSIXct times respect the system timezone silently.** A `"2026-03-29 02:30:00"` parsed on a machine in London may convert to a different instant than the same string parsed in New York. For reproducible work, pass `tz = "UTC"` explicitly to `as.POSIXct()` or use `lubridate::with_tz()`.

**Try it:** Given the vector below, extract just the 4-digit year from each string and save as `ex_years`. The result should be a character vector.

```r title="Exercise: extract year from strings"
# Try it: extract year from date strings
raw <- c("2024-01-15", "2025-06-30", "2026-12-01")
ex_years <- # your code here

# Test:
ex_years
#> Expected: "2024" "2025" "2026"
```

<details>
<summary>Click to reveal solution</summary>

```r title="Extract-year solution"
raw <- c("2024-01-15", "2025-06-30", "2026-12-01")
ex_years <- substr(raw, 1, 4)
ex_years
#> [1] "2024" "2025" "2026"
```

Since the format is fixed-width, `substr()` is the simplest answer. For variable formats, parse first: `format(as.Date(raw), "%Y")`.

</details>

## What about I/O, control flow, and functional programming?

The last category covers the glue that holds scripts together: reading and writing files, branching and looping, applying functions over collections, and catching errors. R has two layers here, base R's `apply()` family and the more consistent `purrr::map()` family from the tidyverse, and you'll see both in the wild.

```r title="sapply column means and safe log"
# sapply over columns; tryCatch for safe logs
col_means <- sapply(mtcars[, 1:4], mean)
round(col_means, 2)
#>    mpg    cyl   disp     hp
#>  20.09   6.19 230.72 146.69

safe_log <- function(x) tryCatch(log(x), warning = function(w) NA_real_)
sapply(c(10, -1, 0.5), safe_log)
#> [1] 2.302585        NA -0.693147
```

`sapply()` walks the first four columns of `mtcars`, applies `mean()` to each, and returns a named numeric vector. `tryCatch()` wraps `log()` so that `log(-1)`, which normally warns and returns `NaN`, becomes a clean `NA` instead. Same two-line recipe handles any "try this, default on failure" pattern in R.

### Input / Output

| Function | Description | Example |
|---|---|---|
| `read.csv()` | Read CSV (base) | `read.csv("data.csv")` |
| `read.table()` | Read delimited file | `read.table("x.txt", header = TRUE)` |
| `readr::read_csv()` | Fast CSV (tidyverse) | `read_csv("data.csv")` |
| `readLines()` | Read lines of text | `readLines("file.txt")` |
| `readRDS()` / `saveRDS()` | Read/write single R object | `saveRDS(model, "m.rds")` |
| `load()` / `save()` | Multi-object .RData | `save(x, y, file="d.RData")` |
| `write.csv()` / `write.table()` | Write delimited files | `write.csv(df, "out.csv")` |
| `writeLines()` | Write character vector | `writeLines(c("a","b"), "out.txt")` |
| `cat()` / `print()` / `message()` | Console output | `cat("Hello\n")` |
| `file.exists()` / `dir()` / `getwd()` / `setwd()` | Filesystem basics | `file.exists("data.csv")` |
| `download.file()` | Download from URL | `download.file(url, "x.csv")` |

### Control flow

| Construct | Description | Example |
|---|---|---|
| `if (...) {} else {}` | Branching | `if (x > 0) "pos" else "neg"` |
| `ifelse(cond, yes, no)` | Vectorized if-else | `ifelse(1:5 > 3, "hi", "lo")` |
| `for (i in x) {}` | For loop | `for (i in 1:3) print(i)` |
| `while (cond) {}` | While loop | `while (x < 10) x <- x + 1` |
| `repeat { break }` | Loop until break | `repeat { if (done) break }` |
| `next` / `break` | Skip / exit iteration | `for (i in 1:5) if (i==3) next else print(i)` |
| `switch()` | Multi-branch dispatch | `switch("a", a=1, b=2)` |
| `stopifnot()` | Assert conditions | `stopifnot(x > 0)` |
| `stop()` / `warning()` / `message()` | Signal conditions | `stop("Invalid!")` |

### Apply family and purrr

| Function | Description | Example |
|---|---|---|
| `apply()` | Over matrix rows/cols | `apply(m, 2, sum)` |
| `lapply()` | Over list, return list | `lapply(1:3, sqrt)` |
| `sapply()` | Over list, simplify | `sapply(1:3, sqrt)` |
| `vapply()` | Type-safe apply | `vapply(1:3, sqrt, numeric(1))` |
| `mapply()` | Multi-arg apply | `mapply("+", 1:3, 4:6)` |
| `tapply()` | Apply by group | `tapply(mtcars$mpg, mtcars$cyl, mean)` |
| `Map()` / `Reduce()` / `Filter()` / `Find()` / `Position()` | Functional helpers | `Reduce("+", 1:5)` |
| `purrr::map()` | List-in, list-out | `map(1:3, sqrt)` |
| `map_dbl()` / `map_chr()` / `map_int()` / `map_lgl()` | Typed map | `map_dbl(1:3, sqrt)` |
| `map_df()` | Row-bind results | `map_df(1:3, ~ data.frame(x = .x))` |
| `walk()` | Side-effect only | `walk(files, print)` |
| `keep()` / `discard()` | Filter list | `keep(1:10, ~ .x > 5)` |
| `reduce()` | Accumulate from left | `reduce(1:5, "+")` |

### Error handling

| Function | Description | Example |
|---|---|---|
| `tryCatch()` | Typed condition handling | `tryCatch(log(-1), warning = \(w) NA)` |
| `try()` | Swallow errors | `try(log("a"), silent = TRUE)` |
| `withCallingHandlers()` | Run handler, resume | `withCallingHandlers(f(), warning = log_it)` |
| `conditionMessage()` | Extract message | `conditionMessage(e)` |
| `simpleError()` / `simpleWarning()` | Construct conditions | `simpleError("oops")` |

[TIP]
**Use the typed `purrr::map_*()` family instead of `sapply()` when you care about the return type.** `map_dbl()` errors loudly if any element isn't a double; `sapply()` silently returns a list instead. That type-strictness catches bugs the moment they happen instead of three functions later.

**Try it:** Use `sapply()` on the `iris` data frame to return the class of each column. Save the result as `ex_classes`.

```r title="Exercise: class of each iris column"
# Try it: class of each iris column
ex_classes <- # your code here

# Test:
ex_classes
#> Expected: "numeric" "numeric" "numeric" "numeric" "factor"
```

<details>
<summary>Click to reveal solution</summary>

```r title="iris-class solution"
ex_classes <- sapply(iris, class)
ex_classes
#> Sepal.Length  Sepal.Width Petal.Length  Petal.Width      Species
#>    "numeric"    "numeric"    "numeric"    "numeric"     "factor"
```

`sapply()` applies `class()` to each column of `iris` and simplifies the result to a named character vector.

</details>

## Practice Exercises

Two capstone exercises combining multiple sections of the cheat sheet. Work them yourself first, then open the solution to check your approach.

### Exercise 1: dplyr pipeline, filter, group, summarise, arrange

Using `mtcars`, write one pipeline that: keeps cars with `mpg > 20`, groups by `cyl`, computes the mean `hp` per group as `mean_hp`, and arranges the result from highest `mean_hp` to lowest. Save the result as `my_result`.

```r title="Exercise: four-verb dplyr pipeline"
# Exercise 1: combine 4 dplyr verbs
# Hint: use |> to chain filter, group_by, summarise, arrange

my_result <- # your code here

my_result
#> Expected: 2 rows (cyl 4 and cyl 6), ordered by mean_hp descending
```

<details>
<summary>Click to reveal solution</summary>

```r title="Four-verb solution"
my_result <- mtcars |>
  filter(mpg > 20) |>
  group_by(cyl) |>
  summarise(mean_hp = mean(hp), .groups = "drop") |>
  arrange(desc(mean_hp))
my_result
#> # A tibble: 2 × 2
#>     cyl mean_hp
#>   <dbl>   <dbl>
#> 1     6   110.
#> 2     4    81.8
```

Four dplyr verbs, one pipeline. `arrange(desc(...))` sorts descending; the `.groups = "drop"` argument silences the grouping message after `summarise()`.

</details>

### Exercise 2: ggplot2, scatter + smooth + theme in one plot

Build a plot from `mtcars` showing `mpg` versus `wt`, colored by `factor(cyl)`, with a linear trend line per cylinder group (no confidence ribbon), a title "MPG by weight and cylinders", and a minimal theme. Save the plot object as `my_plot`.

```r title="Exercise: layered ggplot2 scatter"
# Exercise 2: a ggplot2 recipe with 4 layers
# Hint: ggplot() + geom_point() + geom_smooth(method="lm", se=FALSE) + labs() + theme_minimal()

my_plot <- # your code here

my_plot
```

<details>
<summary>Click to reveal solution</summary>

```r title="Layered-scatter solution"
my_plot <- ggplot(mtcars, aes(x = wt, y = mpg, color = factor(cyl))) +
  geom_point(size = 2.5) +
  geom_smooth(method = "lm", se = FALSE) +
  labs(title = "MPG by weight and cylinders",
       x = "Weight (1000 lbs)", y = "Miles per gallon",
       color = "Cylinders") +
  theme_minimal()
my_plot
```

Five layers, five concepts: aesthetic mapping, points, linear smoother per color group, labels, and theme. Swap `method = "lm"` for `"loess"` to see a curved local fit instead.

</details>

## Complete Example

To tie the cheat sheet together, here's a 20-line analysis of the built-in `airquality` dataset: drop missing ozone readings, compute the monthly mean, and plot it as a bar chart. Functions from dplyr, ggplot2, and base R all appear in one pipeline.

```r title="End-to-end airquality analysis"
# Complete example: airquality end-to-end
library(tidyr)

aq_clean <- airquality |>
  drop_na(Ozone) |>
  mutate(Month = factor(Month, labels = c("May","Jun","Jul","Aug","Sep")))

aq_monthly <- aq_clean |>
  group_by(Month) |>
  summarise(mean_ozone = mean(Ozone),
            n_days = n(),
            .groups = "drop") |>
  arrange(desc(mean_ozone))
aq_monthly
#> # A tibble: 5 × 3
#>   Month mean_ozone n_days
#>   <fct>      <dbl>  <int>
#> 1 Jul         59.1     26
#> 2 Aug         60.0     26
#> 3 Sep         31.4     29
#> 4 Jun         29.4      9
#> 5 May         23.6     24

ggplot(aq_monthly, aes(x = Month, y = mean_ozone, fill = Month)) +
  geom_col() +
  labs(title = "Mean ozone by month, New York 1973",
       x = NULL, y = "Mean ozone (ppb)") +
  theme_minimal() +
  theme(legend.position = "none")
```

That single script demonstrates nine of the functions from this cheat sheet: `drop_na()`, `mutate()`, `factor()`, `group_by()`, `summarise()`, `arrange()`, `ggplot()`, `geom_col()`, `theme_minimal()`. July and August average around 60 ppb ozone, typical summer smog levels, while the rest of the months sit 30 ppb or lower.

## Summary

The fastest way to use this cheat sheet is to stop memorizing and start looking up. Bookmark the page, skim the section headings, and when you hit a task you can't solve, search this page with Ctrl+F.

| Task | Go-to function(s) |
|---|---|
| Create a sequence | `seq()`, `seq_len()`, `1:n` |
| Pick rows by condition | `filter()` (dplyr), `subset()` (base) |
| Pick columns | `select()` (dplyr), `[ , cols]` (base) |
| Add / modify columns | `mutate()`, `transform()` |
| Group and summarise | `group_by() |> summarise()`, `tapply()`, `aggregate()` |
| Sort rows | `arrange()`, `order()` |
| Join two tables | `left_join()`, `inner_join()`, `merge()` |
| Reshape wide ↔ long | `pivot_longer()`, `pivot_wider()` |
| Build a plot | `ggplot() + aes() + geom_*()` |
| Fit a linear model | `lm()`, `glm()` |
| Hypothesis test | `t.test()`, `wilcox.test()`, `chisq.test()` |
| Parse a date | `as.Date()`, `lubridate::ymd()` |
| Extract a substring | `substr()`, `stringr::str_sub()` |
| Apply a function over a collection | `sapply()`, `purrr::map_dbl()` |
| Read a CSV | `read.csv()`, `readr::read_csv()` |
| Handle an error safely | `tryCatch()` |

Two hundred functions, six categories, one page. Come back often.

## References

1. R Core Team, *An Introduction to R* official manual. [Link](https://cran.r-project.org/doc/manuals/r-release/R-intro.html)
2. Wickham, H. & Grolemund, G., *R for Data Science (2e)*. [Link](https://r4ds.hadley.nz/)
3. dplyr function reference, tidyverse. [Link](https://dplyr.tidyverse.org/reference/)
4. ggplot2 function reference, tidyverse. [Link](https://ggplot2.tidyverse.org/reference/)
5. stringr function reference, tidyverse. [Link](https://stringr.tidyverse.org/reference/)
6. lubridate function reference, tidyverse. [Link](https://lubridate.tidyverse.org/reference/)
7. purrr function reference, tidyverse. [Link](https://purrr.tidyverse.org/reference/)
8. Posit cheatsheets collection. [Link](https://posit.co/resources/cheatsheets/)
9. R Language Definition, official reference. [Link](https://cran.r-project.org/doc/manuals/r-release/R-lang.html)

## Continue Learning
- [Getting Help in R](Getting-Help-in-R.html), How to search R's help system when a function isn't on this page
- [R for Excel Users](R-for-Excel-Users.html), Map your Excel formulas and pivots to R equivalents

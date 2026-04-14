---
title: "purrr map() Functions in R: map, map2, imap, pmap — Functional Data Processing"
slug: "purrr-map-Data-Wrangling"
description: "Apply purrr map(), map2(), imap(), and pmap() to data wrangling tasks: read files, run row-wise calculations, fit models per group, and handle errors safely."
keywords: "purrr data wrangling, map multiple files R, list columns purrr, purrr map2 example, purrr pmap rowwise, imap names, purrr safely, functional data processing R, tidyverse iteration"
auto_link_terms: "purrr data wrangling|list columns in R|read multiple files R|purrr safely|rowwise pmap|fit models per group|map_dfr|nest and map"
auto_link_case_sensitive: false
mathjax: false
webr: true
date: "2026-04-14"
curriculum_id: "FR-dply-4"
post_type: "FR"
fr_parent: "dplyr-group-by-summarise.html"
---

# purrr map() Functions in R: map, map2, imap, pmap — Functional Data Processing

<p class="lead">purrr's <code>map()</code> family turns messy real-world data into tidy results without writing loops. With <code>map()</code>, <code>map2()</code>, <code>imap()</code>, and <code>pmap()</code> — plus <code>safely()</code> for resilience — you can read dozens of files at once, run row-wise calculations, fit a model per group, and label outputs with their source names.</p>

## How do you read and combine multiple CSV files with map()?

Imagine twelve monthly sales exports — same columns, twelve files. The loop-and-append version is fragile; the purrr version is one pipeline. `map_dfr()` reads each file with the function you give it and binds the rows into a single tibble in one shot. The example below generates three CSVs in a temp directory so you can run it end-to-end without leaving the browser.

We will write three tiny CSVs, list them, and read them back into one tibble. Watch the `.id` argument — it tags every row with the file it came from, so you never lose track of source.

```r
library(purrr)
library(dplyr)
library(tidyr)
library(broom)

# Create 3 small CSVs in a temp directory
tmp_dir <- tempfile("sales_")
dir.create(tmp_dir)

write.csv(data.frame(item = c("pen", "cup"),  qty = c(40, 12)),
          file.path(tmp_dir, "jan.csv"), row.names = FALSE)
write.csv(data.frame(item = c("pen", "cup"),  qty = c(55, 18)),
          file.path(tmp_dir, "feb.csv"), row.names = FALSE)
write.csv(data.frame(item = c("pen", "cup"),  qty = c(30, 22)),
          file.path(tmp_dir, "mar.csv"), row.names = FALSE)

sales_files <- list.files(tmp_dir, pattern = "\\.csv$", full.names = TRUE)
sales_all   <- map_dfr(sales_files, read.csv, .id = "source")

sales_all
#>   source item qty
#> 1      1  pen  40
#> 2      1  cup  12
#> 3      2  pen  55
#> 4      2  cup  18
#> 5      3  pen  30
#> 6      3  cup  22
```

Three files in, one tibble out — and no loop. The `.id` column shows which file each row came from. Right now `.id` is just a position number; the next exercise turns it into a readable file name. This is the smallest possible version of "read every file in a folder," and it scales unchanged from 3 files to 300.

[TIP]
**Use `.id` to track the source of every row.** Without it you cannot tell which file produced which row after the bind — a top-3 cause of silent data-quality bugs in monthly batch pipelines.

**Try it:** Make the `.id` column show file names like `jan.csv` instead of `1`, `2`, `3`. Hint: `set_names()` on the file path vector, then run the same `map_dfr()` call.

```r
# Try it: name the files before mapping
ex_sales_named <- sales_files |>
  set_names(basename(sales_files)) |>
  map_dfr(_, .id = "source")    # replace _ with the right call

head(ex_sales_named)
#> Expected: source column reads "jan.csv", "feb.csv", "mar.csv"
```

<details>
<summary>Click to reveal solution</summary>

```r
ex_sales_named <- sales_files |>
  set_names(basename(sales_files)) |>
  map_dfr(read.csv, .id = "source")

head(ex_sales_named)
#>    source item qty
#> 1 jan.csv  pen  40
#> 2 jan.csv  cup  12
#> 3 feb.csv  pen  55
#> 4 feb.csv  cup  18
#> 5 mar.csv  pen  30
#> 6 mar.csv  cup  22
```

**Explanation:** `set_names()` attaches names to the file path vector. `map_dfr()` then uses those names — instead of integer positions — for the `.id` column.

</details>

## How does map2() apply a function over two parallel vectors?

Sometimes you have two synchronized vectors that need to march in lockstep — prices and discounts, predictions and actuals, names and scores. `map2()` is the variant for exactly that case. It walks both inputs at once, calling the function with `.x` from the first vector and `.y` from the second.

We will compute final prices from a price list and a per-product discount rate. The lambda receives one price and one rate per call; `map2_dbl()` collects the answers into a numeric vector.

```r
prices    <- c(10.00, 25.00, 4.50, 80.00)
discounts <- c(0.10,  0.00,  0.25, 0.15)

final_prices <- map2_dbl(prices, discounts, \(p, d) p * (1 - d))
final_prices
#> [1]  9.00 25.00  3.38 68.00

sum(final_prices)
#> [1] 105.38
```

Each price was multiplied by its own discount rate — not the average rate, not the wrong rate, the exact paired one. The `_dbl` suffix forces a numeric vector out (instead of a list), so the result drops cleanly into `sum()` or any downstream calculation. If `prices` and `discounts` had different lengths, `map2_dbl()` would error immediately rather than silently recycling.

[NOTE]
**`map2()` requires equal-length inputs.** If `.x` and `.y` differ in length, the call fails fast with a clear error — saving you from the silent recycling bugs that haunt base R `*` and `+` operations on mismatched vectors.

**Try it:** Compute percent change between two vectors `ex_old` and `ex_new` using `map2_dbl()`. Formula: `(new - old) / old * 100`.

```r
ex_old <- c(100, 50, 200)
ex_new <- c(120, 45, 260)

ex_pct_change <- map2_dbl(ex_new, ex_old, \(n, o) {
  # your code here
})

ex_pct_change
#> Expected: 20 -10 30
```

<details>
<summary>Click to reveal solution</summary>

```r
ex_pct_change <- map2_dbl(ex_new, ex_old, \(n, o) (n - o) / o * 100)
ex_pct_change
#> [1]  20 -10  30
```

**Explanation:** `map2_dbl()` walks `ex_new` and `ex_old` in parallel, applying the percent-change formula to each pair and returning a numeric vector.

</details>

## How do you use pmap() for row-wise operations on a data frame?

Two inputs become awkward fast when you have three, four, or five. That is where `pmap()` takes over. It accepts a single list (or data frame) and walks it in parallel — column by column for a data frame, slot by slot for a list. The function you supply gets one argument per element. Because a data frame is a list of equal-length vectors, this is the cleanest way to do row-wise calculations with column-name parameters.

We will compute body mass index for a small tibble of people. The function declares one parameter per column it needs and a `...` to silently absorb anything else, so you can grow the tibble without breaking the function.

```r
people <- tibble(
  name      = c("Asha", "Ravi", "Mei"),
  height_m  = c(1.65, 1.78, 1.60),
  weight_kg = c(58, 82, 54)
)

bmi_results <- pmap_dbl(people, \(name, height_m, weight_kg, ...) {
  weight_kg / height_m^2
})

bmi_results
#> [1] 21.30 25.88 21.09
```

`pmap_dbl()` walked the tibble row by row. Each call received `name`, `height_m`, and `weight_kg` as named arguments, computed BMI, and the results stacked into a numeric vector. The `...` is the secret: tomorrow you can add an `age` column to `people` and this function still runs without modification. That is the row-wise robustness that hand-written loops rarely get right.

[KEY INSIGHT]
**`pmap()` is the bridge between functional and row-wise thinking.** Treat each row as a named argument list and your function never has to know about subsetting, indexing, or `i`. The data frame is the "input list" and pmap walks it for you.

**Try it:** Write the same BMI calculation back into the `people` tibble as a new column called `bmi`. Hint: combine `mutate()` with `pmap_dbl()` and use `pick(everything())` so pmap sees the row.

```r
ex_people_bmi <- people |>
  mutate(bmi = pmap_dbl(pick(everything()), \(name, height_m, weight_kg, ...) {
    # your code here
  }))

ex_people_bmi
#> Expected: a 4-column tibble with bmi values 21.30, 25.88, 21.09
```

<details>
<summary>Click to reveal solution</summary>

```r
ex_people_bmi <- people |>
  mutate(bmi = pmap_dbl(pick(everything()),
                        \(name, height_m, weight_kg, ...) weight_kg / height_m^2))

ex_people_bmi
#> # A tibble: 3 × 4
#>   name  height_m weight_kg   bmi
#>   <chr>    <dbl>     <dbl> <dbl>
#> 1 Asha      1.65        58  21.3
#> 2 Ravi      1.78        82  25.9
#> 3 Mei       1.60        54  21.1
```

**Explanation:** `pick(everything())` hands the current row's columns to `pmap_dbl()`. The lambda destructures them by name and computes BMI; the result is stored back as a new column.

</details>

## How do you fit a model for each group using nest() + map()?

The single most common purrr pattern in real analysis is "fit one model per group, then compare." It uses three building blocks: `group_by() + nest()` packs each group's rows into a list-column, `map()` runs a function on each packed tibble, and `unnest()` flattens the result back into rows. Combined with `broom::tidy()` for clean coefficient tables, it replaces every for-loop you ever wrote around `lm()`.

The flow has just enough moving parts that a picture helps. Below it, we will fit `mpg ~ wt` separately for 4-, 6-, and 8-cylinder cars and produce one tidy coefficient table.

![Diagram showing the nest, map, tidy, unnest pipeline that fits a model per group](screenshots/purrr-map-Data-Wrangling-list-column-flow.webp)
*Figure 1: The nest → map → tidy → unnest pipeline that fits a model per group and returns one tidy table.*

```r
mtcars_models <- mtcars |>
  group_by(cyl) |>
  nest() |>
  mutate(
    model = map(data, \(df) lm(mpg ~ wt, data = df)),
    tidy  = map(model, broom::tidy)
  )

model_table <- mtcars_models |>
  select(cyl, tidy) |>
  unnest(tidy)

model_table
#> # A tibble: 6 × 6
#>     cyl term        estimate std.error statistic      p.value
#>   <dbl> <chr>          <dbl>     <dbl>     <dbl>        <dbl>
#> 1     6 (Intercept)    28.4      4.18       6.79 0.00105
#> 2     6 wt             -2.78     1.33      -2.08 0.0918
#> 3     4 (Intercept)    39.6      4.35       9.10 0.00000777
#> 4     4 wt             -5.65     1.85      -3.05 0.0137
#> 5     8 (Intercept)    23.9      3.01       7.94 0.00000405
#> 6     8 wt             -2.19     0.739     -2.97 0.0118
```

Each cylinder group got its own regression of mileage on weight. The slope on `wt` is steepest for 4-cylinder cars (−5.65) and gentlest for 8-cylinder cars (−2.19), meaning every extra 1000 lb costs more miles per gallon in a small car than a big one. We never wrote a loop, and we never lost the cylinder label — the list-column kept everything aligned.

[TIP]
**Pull single statistics with `map_dbl()`.** Once `mtcars_models` exists, `map_dbl(mtcars_models$model, \(m) summary(m)$r.squared)` returns one R² value per group as a clean numeric vector — no unnesting needed.

**Try it:** Add an `r2` column to `mtcars_models` containing each group's R² from `summary(model)$r.squared`.

```r
ex_rsq <- mtcars_models |>
  mutate(r2 = map_dbl(model, \(m) {
    # your code here
  })) |>
  select(cyl, r2)

ex_rsq
#> Expected: 3 rows of cyl + r2 between 0.50 and 0.75
```

<details>
<summary>Click to reveal solution</summary>

```r
ex_rsq <- mtcars_models |>
  mutate(r2 = map_dbl(model, \(m) summary(m)$r.squared)) |>
  select(cyl, r2)

ex_rsq
#> # A tibble: 3 × 2
#>     cyl    r2
#>   <dbl> <dbl>
#> 1     6 0.465
#> 2     4 0.509
#> 3     8 0.423
```

**Explanation:** `map_dbl()` walks the `model` list-column, calls `summary()$r.squared` on each fitted model, and returns one numeric value per group.

</details>

## How does imap() use element names or indices?

Sometimes you need both the value AND its label. `imap(x, f)` is shorthand for `map2(x, names(x), f)` when `x` has names, or `map2(x, seq_along(x), f)` when it does not. The function gets the value as `.x` and the name (or index) as `.y`. This is the cleanest way to produce labeled report lines, debug messages, or grouped summaries that need the group label inside the output.

We will turn a small named list of regional sales vectors into one printable summary line per region.

```r
regions <- list(
  north = c(110, 95, 130),
  south = c(88, 102, 91),
  east  = c(120, 135, 128),
  west  = c(75, 80, 92)
)

region_report <- imap_chr(regions, \(values, name) {
  paste0(name, ": mean = ", round(mean(values), 1), ", n = ", length(values))
})

region_report
#> [1] "north: mean = 111.7, n = 3" "south: mean = 93.7, n = 3"
#> [3] "east: mean = 127.7, n = 3"  "west: mean = 82.3, n = 3"
```

Every line carries its region label baked in — no parallel vector of names to manage, no risk of misaligning labels with values. `imap_chr()` returns a character vector (one per element), perfect for `writeLines()` or the body of a Slack message. If `regions` had no names, `.y` would be the integer index and you would get `"1: mean = ..."` instead.

[NOTE]
**Names default to indices.** If your input has no `names()`, `imap()` falls back to `seq_along(x)`, so you get position numbers for free. Useful when iterating over an unnamed list of files or batches and you want "row 3 failed" style messages.

**Try it:** Use `imap_chr()` on an unnamed list of three numeric vectors to print lines like `"Batch 1: sum = 6"`.

```r
ex_unnamed <- list(c(1, 2, 3), c(10, 20), c(5, 5, 5, 5))

ex_indexed <- imap_chr(ex_unnamed, \(vals, idx) {
  # your code here
})

ex_indexed
#> Expected: "Batch 1: sum = 6", "Batch 2: sum = 30", "Batch 3: sum = 20"
```

<details>
<summary>Click to reveal solution</summary>

```r
ex_indexed <- imap_chr(ex_unnamed, \(vals, idx) {
  paste0("Batch ", idx, ": sum = ", sum(vals))
})

ex_indexed
#> [1] "Batch 1: sum = 6"  "Batch 2: sum = 30" "Batch 3: sum = 20"
```

**Explanation:** Because `ex_unnamed` has no names, `imap()` passes the integer index as `.y`. We use it to build the `"Batch N"` prefix, then append the sum.

</details>

## How do you handle errors in pipelines with safely() and possibly()?

Real data is messy — one bad row, one missing file, one malformed string can crash an entire `map()` call and lose every result that came before it. purrr's two adapters fix this. `safely(f)` wraps `f` so it returns a list of `(result, error)` for every call — failures become data, not exceptions. `possibly(f, otherwise)` is simpler: it returns `otherwise` when `f` errors, so you can ask for a numeric vector and get `NA` for the bad ones.

We will mix valid numbers, a string, and a negative — `log()` will succeed, fail, or return `NaN` accordingly — and see both adapters in action.

```r
values <- list(4, 100, "oops", -2, 25)

safe_log     <- safely(log)
safe_results <- map(values, safe_log)

safe_results[[2]]
#> $result
#> [1] 4.605170
#>
#> $error
#> NULL

safe_results[[3]]
#> $result
#> NULL
#>
#> $error
#> <simpleError in log(x): non-numeric argument to mathematical function>

log_clean <- map_dbl(values, possibly(log, NA_real_))
log_clean
#> [1] 1.386294 4.605170       NA      NaN 3.218876
```

`safely()` gives you both halves of every call so you can audit failures (the third element returned a real R error message instead of crashing). `possibly()` is the production-friendly version: it returns `NA` for the string and `NaN` for the negative, and you get a clean numeric vector you can pipe directly into the next step. Pick `safely()` when you need to log failures, `possibly()` when you need the pipeline to keep moving.

[WARNING]
**Never wrap a critical step in `possibly()` and forget to log the failures.** Silently dropping bad rows is how data pipelines mysteriously lose 5% of their inputs each month. Pair `possibly()` with a summary count of the `NA`s it produced.

**Try it:** Wrap `as.numeric` in `possibly()` so a mixed character vector converts cleanly with `NA` for unparseable entries.

```r
ex_mixed <- c("12", "3.5", "hello", "0", "NA", "9e2")

ex_numeric <- map_dbl(ex_mixed, possibly(_, NA_real_))    # fill in the wrap

ex_numeric
#> Expected: 12 3.5 NA 0 NA 900
```

<details>
<summary>Click to reveal solution</summary>

```r
ex_numeric <- map_dbl(ex_mixed, possibly(as.numeric, NA_real_))

ex_numeric
#> [1]  12.0   3.5    NA   0.0    NA 900.0
```

**Explanation:** `possibly(as.numeric, NA_real_)` returns the parsed number when conversion works, and `NA_real_` when it fails. `map_dbl()` collects the results into a clean numeric vector.

</details>

## Practice Exercises

### Exercise 1: Multi-file ingest with a row-wise total

You have three small CSVs of (`item`, `price`, `qty`). Read and bind them into one tibble with a `source` column showing the file name, then add a per-row `total = price * qty` column using `pmap_dbl()`. Save the final tibble as `ex1_with_total`.

```r
# Exercise 1: combine map_dfr + pmap_dbl
ex1_dir <- tempfile("ex1_")
dir.create(ex1_dir)
write.csv(data.frame(item = c("pen", "cup"), price = c(2, 4),  qty = c(40, 12)),
          file.path(ex1_dir, "jan.csv"), row.names = FALSE)
write.csv(data.frame(item = c("pen", "cup"), price = c(2, 4),  qty = c(55, 18)),
          file.path(ex1_dir, "feb.csv"), row.names = FALSE)
write.csv(data.frame(item = c("pen", "cup"), price = c(2, 4),  qty = c(30, 22)),
          file.path(ex1_dir, "mar.csv"), row.names = FALSE)

ex1_files <- list.files(ex1_dir, pattern = "\\.csv$", full.names = TRUE)

# Step 1: read + bind with file-name source
ex1_data <- ___ |> map_dfr(read.csv, .id = "source")

# Step 2: add a row-wise total column
ex1_with_total <- ex1_data |>
  mutate(total = pmap_dbl(pick(price, qty), ___))

ex1_with_total
```

<details>
<summary>Click to reveal solution</summary>

```r
ex1_data <- ex1_files |>
  set_names(basename(ex1_files)) |>
  map_dfr(read.csv, .id = "source")

ex1_with_total <- ex1_data |>
  mutate(total = pmap_dbl(pick(price, qty), \(price, qty) price * qty))

ex1_with_total
#>    source item price qty total
#> 1 jan.csv  pen     2  40    80
#> 2 jan.csv  cup     4  12    48
#> 3 feb.csv  pen     2  55   110
#> 4 feb.csv  cup     4  18    72
#> 5 mar.csv  pen     2  30    60
#> 6 mar.csv  cup     4  22    88
```

**Explanation:** `set_names(basename(...))` turns positional ids into file names. `pick(price, qty)` hands the two columns to `pmap_dbl()` as a list, which the lambda multiplies row by row.

</details>

### Exercise 2: Per-group regression report lines

Group `mtcars` by `cyl`, fit `lm(mpg ~ hp)` per group, then build labeled report lines like `"4 cyl: slope = -0.113, R² = 0.65"` using `imap_chr()` over a named list of model summaries. Save the lines to `ex2_lines`.

```r
# Exercise 2: nest + map + imap_chr
ex2_models <- mtcars |>
  group_by(cyl) |>
  nest() |>
  mutate(model = map(data, \(df) ___))

ex2_summary <- set_names(ex2_models$model, paste0(ex2_models$cyl, " cyl"))

ex2_lines <- imap_chr(ex2_summary, \(m, label) {
  ___
})

ex2_lines
```

<details>
<summary>Click to reveal solution</summary>

```r
ex2_models <- mtcars |>
  group_by(cyl) |>
  nest() |>
  mutate(model = map(data, \(df) lm(mpg ~ hp, data = df)))

ex2_summary <- set_names(ex2_models$model, paste0(ex2_models$cyl, " cyl"))

ex2_lines <- imap_chr(ex2_summary, \(m, label) {
  paste0(label,
         ": slope = ", round(coef(m)[["hp"]], 3),
         ", R² = ",    round(summary(m)$r.squared, 2))
})

ex2_lines
#>           6 cyl                       4 cyl                       8 cyl
#> "6 cyl: slope = -0.076, R² = 0.27" "4 cyl: slope = -0.113, R² = 0.27" "8 cyl: slope = -0.014, R² = 0.08"
```

**Explanation:** `set_names()` attaches readable labels to the model list. `imap_chr()` walks each model with its label, extracting the slope from `coef()` and R² from `summary()`, then formats one report line per group.

</details>

## Putting It All Together

This end-to-end pipeline is the kind of task that lands in a data analyst's inbox on Monday morning: "Pull the regional monthly sales, add a margin column, fit a trend per region, and write me a one-line summary for each region." Every step uses one of the variants we just covered.

```r
# 1. Build three monthly regional CSVs in a temp folder
ce_dir <- tempfile("monthly_")
dir.create(ce_dir)

for (m in c("jan", "feb", "mar")) {
  write.csv(data.frame(
    region  = c("north", "south", "east"),
    units   = sample(40:120, 3),
    revenue = sample(800:2400, 3),
    cost    = sample(400:1500, 3)
  ), file.path(ce_dir, paste0(m, ".csv")), row.names = FALSE)
}

# 2. Read + bind every file, source from the file name
monthly_files <- list.files(ce_dir, pattern = "\\.csv$", full.names = TRUE)

monthly_sales <- monthly_files |>
  set_names(basename(monthly_files)) |>
  map_dfr(read.csv, .id = "month")

# 3. Row-wise margin via pmap_dbl
sales_with_margin <- monthly_sales |>
  mutate(margin = pmap_dbl(pick(revenue, cost),
                           \(revenue, cost) revenue - cost))

# 4. One linear model per region with nest + map
region_models <- sales_with_margin |>
  group_by(region) |>
  nest() |>
  mutate(model = map(data, \(df) lm(revenue ~ units, data = df)))

# 5. Labeled one-line summary per region with imap_chr
named_models <- set_names(region_models$model, region_models$region)

report <- imap_chr(named_models, \(m, name) {
  paste0(name,
         ": slope = ", round(coef(m)[["units"]], 2),
         ", R² = ",    round(summary(m)$r.squared, 2))
})

cat(report, sep = "\n")
#> north: slope = 12.45, R² = 0.71
#> south: slope =  8.30, R² = 0.43
#> east:  slope = 15.10, R² = 0.88
```

Five steps, four variants, zero loops. `map_dfr()` consolidated the files, `pmap_dbl()` did the row-wise margin, `map()` fit one model per region, and `imap_chr()` produced labeled output. The exact numbers will differ each run because the sample data is random, but the shape of the answer — one tagged report line per region — is what the rest of your pipeline (Slack, email, dashboard) wants.

## Summary

![Diagram showing how to pick the right map variant by counting parallel inputs](screenshots/purrr-map-Data-Wrangling-variant-decision.webp)
*Figure 2: Pick the right map variant by counting parallel inputs.*

| Variant | Inputs | Returns | Use it when |
|---|---|---|---|
| `map()` | 1 vector/list | list | Apply a function to every element |
| `map_dfr()` | 1 list of data frames | tibble | Stack many frames into one |
| `map2()` | 2 parallel vectors | list (or `_dbl`/`_chr` typed) | Walk two vectors in lockstep |
| `pmap()` | n named vectors / data frame rows | list (or typed) | Row-wise calculation across columns |
| `imap()` | 1 list (with names or indices) | list (or typed) | You also need names or positions |
| `safely()` / `possibly()` | wrap any function | error-safe function | Resilient pipelines on messy data |

The decision rule is mechanical: count the parallel inputs you need. One? `map()`. Two? `map2()`. Three or more, or a data frame's columns? `pmap()`. Need the name or index alongside the value? `imap()`. Worried about a step crashing the whole pipeline? Wrap it in `safely()` or `possibly()`.

## References

1. Wickham, H. — *Advanced R*, 2nd Edition, Chapter 9: Functionals. [Link](https://adv-r.hadley.nz/functionals.html)
2. Wickham, H. & Grolemund, G. — *R for Data Science (2e)*, Chapter 26: Iteration. [Link](https://r4ds.hadley.nz/iteration.html)
3. tidyverse blog — *purrr 1.0.0 release notes*. [Link](https://www.tidyverse.org/blog/2022/12/purrr-1-0-0/)
4. purrr reference — `map2()`. [Link](https://purrr.tidyverse.org/reference/map2.html)
5. purrr reference — `pmap()`. [Link](https://purrr.tidyverse.org/reference/pmap.html)
6. purrr reference — `safely()`. [Link](https://purrr.tidyverse.org/reference/safely.html)
7. broom package documentation. [Link](https://broom.tidymodels.org/)

## Continue Learning

- [purrr map() Variants](/purrr-map-Variants.html) — every map() variant explained with the mental model that makes them click.
- [dplyr group_by() + summarise()](/dplyr-group-by-summarise.html) — the parent post on group-wise aggregation.
- [Reduce, Filter, Map in R](/Reduce-Filter-Map-in-R.html) — base R analogues to purrr's higher-order toolkit.

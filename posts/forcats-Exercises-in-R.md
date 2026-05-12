---
title: "forcats Exercises in R: 28 Real Factor Practice Problems"
slug: "forcats-Exercises-in-R"
description: "28 forcats exercises in R covering reorder, recode, lump, drop, NA handling, and plot ordering. Hidden solutions, runnable code, mixed difficulty."
keywords: "factors in R exercises, forcats exercises, fct_reorder exercises, fct_lump exercises, fct_recode exercises, factor levels practice R"
mathjax: false
webr: true
date: "2026-05-12"
post_type: "EX"
sidebar_title: "forcats Exercises"
sidebar_order: 114
fr_parent: "R-Factors.html"
auto_link_terms: "forcats exercises|factors in R exercises|fct_reorder exercises|fct_lump exercises|fct_recode exercises"
auto_link_case_sensitive: false
target_keyword: "factors in R exercises"
sibling_block_enabled: false
difficulty: "Mixed"
---

# forcats Exercises in R: 28 Real Factor Practice Problems

<p class="lead">Twenty-eight runnable exercises on factors in R using the forcats package: reordering, recoding, lumping, dropping, NA handling, and plot ordering. Each problem has a hidden solution with an explanation. Difficulty ranges from beginner conversions to end-to-end cleaning workflows.</p>

```r title="Run this once before any exercise"
library(forcats)
library(dplyr)
library(ggplot2)
library(tibble)
library(tidyr)
```

## Section 1. Creating and inspecting factors (4 problems)

### Exercise 1.1: Convert mtcars$cyl to a factor and inspect its levels

**Task:** A junior analyst is auditing `mtcars` and notices `cyl` is stored as numeric even though only three distinct values appear. Convert `mtcars$cyl` to a factor with the default level order and save the resulting factor vector to `ex_1_1`.

**Expected result:**

```
#>  [1] 6 6 4 6 8 6 8 4 4 6 6 8 8 8 8 8 8 4 4 4 4 8 8 8 8 4 4 4 8 6 8 4
#> Levels: 4 6 8
```

**Difficulty:** Beginner

```r title="Your turn"
ex_1_1 <- # your code here
ex_1_1
```

<details>
<summary>Click to reveal solution</summary>

```r title="Solution"
ex_1_1 <- factor(mtcars$cyl)
ex_1_1
#>  [1] 6 6 4 6 8 6 8 4 4 6 6 8 8 8 8 8 8 4 4 4 4 8 8 8 8 4 4 4 8 6 8 4
#> Levels: 4 6 8
```

**Explanation:** `factor()` builds a factor with levels sorted alphanumerically by default, so the levels come out as `4 6 8` regardless of the order rows appear in the data. The underlying integer codes (1, 2, 3) point at those levels, which is why categorical regressors take less memory than character vectors. Use `as_factor()` from forcats when you want the levels to follow first appearance instead of alphanumeric sort.

</details>

### Exercise 1.2: Build an ordered factor for diamond clarity grades

**Task:** A jeweller cataloguing inventory needs the eight `diamonds` clarity grades stored in their proper quality order from `I1` (lowest) up to `IF` (flawless). Construct an ordered factor using these eight levels in the correct sequence and save it to `ex_1_2`. Use just the unique values from `diamonds$clarity`.

**Expected result:**

```
#> [1] SI2  SI1  VS1  VS2  VVS2 VVS1 I1   IF  
#> Levels: I1 < SI2 < SI1 < VS2 < VS1 < VVS2 < VVS1 < IF
```

**Difficulty:** Intermediate

```r title="Your turn"
ex_1_2 <- # your code here
ex_1_2
```

<details>
<summary>Click to reveal solution</summary>

```r title="Solution"
ex_1_2 <- factor(
  unique(diamonds$clarity),
  levels = c("I1", "SI2", "SI1", "VS2", "VS1", "VVS2", "VVS1", "IF"),
  ordered = TRUE
)
ex_1_2
#> [1] SI2  SI1  VS1  VS2  VVS2 VVS1 I1   IF  
#> Levels: I1 < SI2 < SI1 < VS2 < VS1 < VVS2 < VVS1 < IF
```

**Explanation:** Setting `ordered = TRUE` upgrades a factor from nominal to ordinal, which is what statistical models need when ranks matter (think polynomial contrasts in `lm()`). The `<` separators in the printed levels confirm the ordering took. The diamonds version of clarity is already ordered, but rebuilding it manually gives you the recipe for any custom ordinal scale (Likert, risk rating, severity).

</details>

### Exercise 1.3: Tabulate diamond cut grades with fct_count

**Task:** The retail team wants a tidy count of how many stones in `diamonds` fall into each `cut` grade, sorted descending so the most common cut is on top. Use `fct_count()` with the `sort` argument and save the resulting tibble to `ex_1_3`.

**Expected result:**

```
#> # A tibble: 5 x 2
#>   f             n
#>   <ord>     <int>
#> 1 Ideal     21551
#> 2 Premium   13791
#> 3 Very Good 12082
#> 4 Good       4906
#> 5 Fair       1610
```

**Difficulty:** Intermediate

```r title="Your turn"
ex_1_3 <- # your code here
ex_1_3
```

<details>
<summary>Click to reveal solution</summary>

```r title="Solution"
ex_1_3 <- fct_count(diamonds$cut, sort = TRUE)
ex_1_3
#> # A tibble: 5 x 2
#>   f             n
#>   <ord>     <int>
#> 1 Ideal     21551
#> 2 Premium   13791
#> 3 Very Good 12082
#> 4 Good       4906
#> 5 Fair       1610
```

**Explanation:** `fct_count()` is the forcats equivalent of `table()` returning a tibble instead of a named integer vector, which plays nicely with the rest of the tidyverse. The `sort = TRUE` flag reorders rows by count descending. Add `prop = TRUE` to get a third column with relative shares, useful for class-imbalance audits before training a classifier.

</details>

### Exercise 1.4: Build a factor from custom levels and detect a typo

**Task:** A code reviewer received a survey vector `responses <- c("Yes", "No", "yes", "Maybe", "No", "Yes")` and suspects the lowercase `"yes"` is a data-entry typo. Build a factor that enforces only `"Yes"`, `"No"`, and `"Maybe"` as valid levels and save it to `ex_1_4`. Any invalid entry should become `NA`.

**Expected result:**

```
#> [1] Yes   No    <NA>  Maybe No    Yes  
#> Levels: Yes No Maybe
```

**Difficulty:** Advanced

```r title="Setup for Exercise 1.4"
responses <- c("Yes", "No", "yes", "Maybe", "No", "Yes")
```

```r title="Your turn"
ex_1_4 <- # your code here
ex_1_4
```

<details>
<summary>Click to reveal solution</summary>

```r title="Solution"
ex_1_4 <- factor(responses, levels = c("Yes", "No", "Maybe"))
ex_1_4
#> [1] Yes   No    <NA>  Maybe No    Yes  
#> Levels: Yes No Maybe
```

**Explanation:** When you supply an explicit `levels` vector to `factor()`, any value not in that list is silently coerced to `NA`. That makes `factor()` double as a validation step: a quick `sum(is.na(ex_1_4))` after construction flags how many rows fell off the allowed list. The alternative `forcats::fct_match()` would throw an error on the typo, which is preferable in a pipeline you want to fail loudly.

</details>

## Section 2. Reordering factor levels (5 problems)

### Exercise 2.1: Order levels by first appearance with fct_inorder

**Task:** A reporting analyst is plotting `mpg` vehicle classes in the order they appear in the source data, not alphabetically. Apply `fct_inorder()` to `mpg$class` and save the new factor to `ex_2_1`. Levels should match the first time each class is seen scanning the column top-to-bottom.

**Expected result:**

```
#> [1] compact compact compact compact compact compact
#> Levels: compact midsize suv 2seater minivan pickup subcompact
```

**Difficulty:** Beginner

```r title="Your turn"
ex_2_1 <- # your code here
head(ex_2_1)
levels(ex_2_1)
```

<details>
<summary>Click to reveal solution</summary>

```r title="Solution"
ex_2_1 <- fct_inorder(mpg$class)
head(ex_2_1)
#> [1] compact compact compact compact compact compact
#> Levels: compact midsize suv 2seater minivan pickup subcompact
levels(ex_2_1)
#> [1] "compact"    "midsize"    "suv"        "2seater"    "minivan"    "pickup"     "subcompact"
```

**Explanation:** `fct_inorder()` reorders levels by the position of their first occurrence, which matters when the natural row order encodes information (chronological events, ranked respondents, geographic adjacency). Useful right before plotting so bar order or line color order tracks the data instead of the alphabet. The sibling `fct_inseq()` does the same trick for numeric-looking factors.

</details>

### Exercise 2.2: Order levels by frequency with fct_infreq

**Task:** A marketing analyst building a bar chart of `mpg$manufacturer` wants the manufacturer with the most rows on the left and the rarest on the right. Apply `fct_infreq()` and save the new factor to `ex_2_2`. Inspect the levels in their new order.

**Expected result:**

```
#> [1] "dodge"      "toyota"     "volkswagen" "ford"       "chevrolet"  "audi"      
#> [7] "hyundai"    "subaru"     "nissan"     "honda"      "jeep"       "pontiac"   
#> [13] "mercury"    "land rover" "lincoln"
```

**Difficulty:** Intermediate

```r title="Your turn"
ex_2_2 <- # your code here
levels(ex_2_2)
```

<details>
<summary>Click to reveal solution</summary>

```r title="Solution"
ex_2_2 <- fct_infreq(mpg$manufacturer)
levels(ex_2_2)
#> [1] "dodge"      "toyota"     "volkswagen" "ford"       "chevrolet"  "audi"      
#> [7] "hyundai"    "subaru"     "nissan"     "honda"      "jeep"       "pontiac"   
#> [13] "mercury"    "land rover" "lincoln"
```

**Explanation:** `fct_infreq()` reorders levels by descending frequency, which is the single most useful default for categorical bar charts: a Pareto-style ranking emerges automatically. Pair with `fct_rev()` when you flip to a horizontal bar chart and want the tallest bar on top. For grouped frequencies (per facet) reach for `fct_reorder()` instead.

</details>

### Exercise 2.3: Set a reference level for regression with fct_relevel

**Task:** A statistician fitting a model on `ChickWeight` wants `Diet` level `"4"` to be the reference category (intercept) instead of the default `"1"`. Apply `fct_relevel()` so `"4"` is the first level and the remaining order is preserved. Save the new factor to `ex_2_3`.

**Expected result:**

```
#> [1] "4" "1" "2" "3"
```

**Difficulty:** Intermediate

```r title="Your turn"
ex_2_3 <- # your code here
levels(ex_2_3)
```

<details>
<summary>Click to reveal solution</summary>

```r title="Solution"
ex_2_3 <- fct_relevel(ChickWeight$Diet, "4")
levels(ex_2_3)
#> [1] "4" "1" "2" "3"
```

**Explanation:** In treatment contrasts (R's default), the first factor level becomes the intercept and all other coefficients are offsets from it. Choosing a clinically meaningful reference, like the standard-of-care arm in a trial, makes coefficients directly interpretable. `fct_relevel()` only moves the named level; the rest stay in their original order. For position-based moves use the `after` argument: `fct_relevel(x, "4", after = 2)`.

</details>

### Exercise 2.4: Reorder bar order by group median with fct_reorder

**Task:** An ecologist wants `iris$Species` reordered so that the species with the smallest median `Sepal.Length` plots first and the largest plots last. Use `fct_reorder()` on `iris$Species` keyed by `iris$Sepal.Length` with `median` as the summarising function. Save the new factor to `ex_2_4`.

**Expected result:**

```
#> [1] "setosa"     "versicolor" "virginica"
```

**Difficulty:** Intermediate

```r title="Your turn"
ex_2_4 <- # your code here
levels(ex_2_4)
```

<details>
<summary>Click to reveal solution</summary>

```r title="Solution"
ex_2_4 <- fct_reorder(iris$Species, iris$Sepal.Length, median)
levels(ex_2_4)
#> [1] "setosa"     "versicolor" "virginica"
```

**Explanation:** `fct_reorder()` ranks levels by a numeric summary computed within each level, which is the cleanest way to align bar or boxplot order with the metric you are plotting. Pass any function, including custom ones: `fct_reorder(x, y, function(z) quantile(z, 0.9))` ranks by the 90th percentile. The two-argument cousin `fct_reorder2()` is built for line plots where you want the legend order to match the rightmost endpoint.

</details>

### Exercise 2.5: Reverse and cyclically shift factor levels

**Task:** A performance reviewer presenting `iris$Species` in a poster wants two transformed copies: one with levels in reverse alphabetical order using `fct_rev()`, and one cyclically shifted forward by one position using `fct_shift()`. Combine both into a named list with elements `reversed` and `shifted` and save the list to `ex_2_5`.

**Expected result:**

```
#> $reversed
#> [1] "virginica"  "versicolor" "setosa"    
#> 
#> $shifted
#> [1] "versicolor" "virginica"  "setosa"
```

**Difficulty:** Advanced

```r title="Your turn"
ex_2_5 <- # your code here
lapply(ex_2_5, levels)
```

<details>
<summary>Click to reveal solution</summary>

```r title="Solution"
ex_2_5 <- list(
  reversed = fct_rev(iris$Species),
  shifted  = fct_shift(iris$Species, n = 1)
)
lapply(ex_2_5, levels)
#> $reversed
#> [1] "virginica"  "versicolor" "setosa"    
#> 
#> $shifted
#> [1] "versicolor" "virginica"  "setosa"
```

**Explanation:** `fct_rev()` flips level order end-to-end, the standard trick when ggplot lays out a horizontal bar chart bottom-up and you want largest-on-top. `fct_shift()` rotates levels by `n` positions, which is handy for cyclical scales like weekdays where you want Monday to lead instead of Sunday. Both leave the underlying values intact; only the level vector permutes.

</details>

## Section 3. Recoding and collapsing levels (4 problems)

### Exercise 3.1: Rename levels with fct_recode

**Task:** A junior analyst onboarding to `PlantGrowth` wants the cryptic `ctrl`, `trt1`, `trt2` levels renamed to `Control`, `Treatment A`, `Treatment B` for a stakeholder report. Use `fct_recode()` to perform the renames and save the new factor to `ex_3_1`.

**Expected result:**

```
#> [1] "Control"     "Treatment A" "Treatment B"
```

**Difficulty:** Beginner

```r title="Your turn"
ex_3_1 <- # your code here
levels(ex_3_1)
```

<details>
<summary>Click to reveal solution</summary>

```r title="Solution"
ex_3_1 <- fct_recode(PlantGrowth$group,
  "Control"     = "ctrl",
  "Treatment A" = "trt1",
  "Treatment B" = "trt2"
)
levels(ex_3_1)
#> [1] "Control"     "Treatment A" "Treatment B"
```

**Explanation:** `fct_recode()` takes new-name = old-name pairs (note the direction), updates the levels in place, and preserves the underlying integer codes so the data layout is unchanged. If a target name already exists in the factor, the levels merge automatically, which makes it a one-call tool for both rename and minor collapse. Misspelled old-names trigger a warning rather than silent miss, so misnames surface immediately.

</details>

### Exercise 3.2: Collapse diamond cuts into three quality tiers

**Task:** The retail team wants `diamonds$cut` rolled up into three tiers: `Premium` (Ideal + Premium), `Good` (Very Good + Good), and `Fair` (Fair). Use `fct_collapse()` to perform the rollup and save the resulting factor to `ex_3_2`. Levels should preserve the order Premium, Good, Fair as listed.

**Expected result:**

```
#>     f          n
#>   <fct>    <int>
#> 1 Premium  35342
#> 2 Good     16988
#> 3 Fair      1610
```

**Difficulty:** Intermediate

```r title="Your turn"
ex_3_2 <- # your code here
fct_count(ex_3_2)
```

<details>
<summary>Click to reveal solution</summary>

```r title="Solution"
ex_3_2 <- fct_collapse(diamonds$cut,
  Premium = c("Ideal", "Premium"),
  Good    = c("Very Good", "Good"),
  Fair    = "Fair"
)
fct_count(ex_3_2)
#> # A tibble: 3 x 2
#>   f          n
#>   <fct>  <int>
#> 1 Premium 35342
#> 2 Good    16988
#> 3 Fair     1610
```

**Explanation:** `fct_collapse()` is the bulk-rename tool: each new name maps to a vector of old names that get merged. It is the right pick when you want to reduce cardinality by domain logic (versus `fct_lump_*` which reduces by frequency). The order of the new names in the call becomes the new level order, which controls plotting and contrast coding downstream.

</details>

### Exercise 3.3: Drop a level by recoding to NULL

**Task:** A compliance officer wants every `"Fair"` cut in `diamonds$cut` removed from the level set (treated as `NA`) without dropping any rows. Use `fct_recode()` with `NULL` as the new name to convert `"Fair"` to `NA`, and save the modified factor to `ex_3_3`.

**Expected result:**

```
#> # A tibble: 5 x 2
#>   f             n
#>   <fct>     <int>
#> 1 Fair         NA
#> 2 Good       4906
#> 3 Very Good 12082
#> 4 Premium   13791
#> 5 Ideal     21551
```

**Difficulty:** Intermediate

```r title="Your turn"
ex_3_3 <- # your code here
fct_count(ex_3_3)
```

<details>
<summary>Click to reveal solution</summary>

```r title="Solution"
ex_3_3 <- fct_recode(diamonds$cut, NULL = "Fair")
fct_count(ex_3_3)
#> # A tibble: 5 x 2
#>   f             n
#>   <fct>     <int>
#> 1 Fair         NA
#> 2 Good       4906
#> 3 Very Good 12082
#> 4 Premium   13791
#> 5 Ideal     21551
```

**Explanation:** Passing `NULL` as the replacement converts the named level to `NA` for every row that held it, while keeping the row count intact. Use this when you want a level temporarily ignored by downstream summaries (`na.rm = TRUE` will then exclude it) without slicing rows away. To also remove the now-empty level from the factor, chain a `fct_drop()` call afterward.

</details>

### Exercise 3.4: Recode many sparse levels via a lookup table

**Task:** A data engineer cleaning a free-text response column has the vector `raw <- c("y", "Y", "yes", "n", "N", "no", "NA", "maybe", "?")` and needs all yes-variants collapsed to `"Yes"`, no-variants to `"No"`, and anything else to `NA`. Build a factor that maps to those three states using `fct_collapse()` with `other_level = NA`. Save it to `ex_3_4`.

**Expected result:**

```
#>     f       n
#>   <fct> <int>
#> 1 Yes       3
#> 2 No        3
#> 3 <NA>      3
```

**Difficulty:** Advanced

```r title="Setup for Exercise 3.4"
raw <- c("y", "Y", "yes", "n", "N", "no", "NA", "maybe", "?")
```

```r title="Your turn"
ex_3_4 <- # your code here
fct_count(ex_3_4)
```

<details>
<summary>Click to reveal solution</summary>

```r title="Solution"
ex_3_4 <- fct_collapse(factor(raw),
  Yes = c("y", "Y", "yes"),
  No  = c("n", "N", "no"),
  other_level = NA
)
fct_count(ex_3_4)
#> # A tibble: 3 x 2
#>   f         n
#>   <fct> <int>
#> 1 Yes       3
#> 2 No        3
#> 3 <NA>      3
```

**Explanation:** The `other_level` argument is a catch-all for levels not named in the mapping. Passing `NA` routes the unhandled levels to missing, which is the safest behavior when you cannot interpret a value; passing a string like `"Unknown"` keeps them visible as an explicit bucket. This recipe scales: list every clean target and let `other_level` absorb the long tail of typos and rare codes.

</details>

## Section 4. Lumping rare categories (4 problems)

### Exercise 4.1: Keep top 5 manufacturers and lump the rest

**Task:** A growth team running an automotive segmentation wants the top five manufacturers in `mpg$manufacturer` preserved and the remaining ten rolled into an `"Other"` bucket. Use `fct_lump_n()` with `n = 5` and save the new factor to `ex_4_1`.

**Expected result:**

```
#> # A tibble: 6 x 2
#>   f              n
#>   <fct>      <int>
#> 1 dodge         37
#> 2 toyota        34
#> 3 volkswagen    27
#> 4 ford          25
#> 5 chevrolet     19
#> 6 Other         92
```

**Difficulty:** Intermediate

```r title="Your turn"
ex_4_1 <- # your code here
fct_count(ex_4_1, sort = TRUE)
```

<details>
<summary>Click to reveal solution</summary>

```r title="Solution"
ex_4_1 <- fct_lump_n(mpg$manufacturer, n = 5)
fct_count(ex_4_1, sort = TRUE)
#> # A tibble: 6 x 2
#>   f              n
#>   <fct>      <int>
#> 1 dodge         37
#> 2 toyota        34
#> 3 volkswagen    27
#> 4 ford          25
#> 5 chevrolet     19
#> 6 Other         92
```

**Explanation:** `fct_lump_n()` keeps the `n` most frequent levels and merges everything else into the `other_level` bucket (default name `"Other"`). It is the standard tool for taming high-cardinality categoricals before a bar chart or a tree-based model, where dozens of tiny levels dilute signal. Negative `n` flips the logic: `n = -3` keeps the three rarest levels and lumps the rest.

</details>

### Exercise 4.2: Lump categories that hold less than 10 percent share

**Task:** A product manager analysing `mpg$class` wants any class accounting for less than 10 percent of rows merged into `"Other"` while the bigger classes are preserved as-is. Use `fct_lump_prop()` with `prop = 0.10` and save the result to `ex_4_2`.

**Expected result:**

```
#> # A tibble: 6 x 2
#>   f              n
#>   <fct>      <int>
#> 1 suv           62
#> 2 compact       47
#> 3 midsize       41
#> 4 subcompact    35
#> 5 pickup        33
#> 6 Other         16
```

**Difficulty:** Intermediate

```r title="Your turn"
ex_4_2 <- # your code here
fct_count(ex_4_2, sort = TRUE)
```

<details>
<summary>Click to reveal solution</summary>

```r title="Solution"
ex_4_2 <- fct_lump_prop(mpg$class, prop = 0.10)
fct_count(ex_4_2, sort = TRUE)
#> # A tibble: 6 x 2
#>   f              n
#>   <fct>      <int>
#> 1 suv           62
#> 2 compact       47
#> 3 midsize       41
#> 4 subcompact    35
#> 5 pickup        33
#> 6 Other         16
```

**Explanation:** `fct_lump_prop()` works on relative share rather than absolute count, which is the right knob when sample sizes vary between cohorts. With 234 rows in `mpg`, a 10 percent threshold lumps anything below 24 rows: `2seater` (5) and `minivan` (11) fall under and collapse into `"Other"`. The proportion variant scales cleanly across small and large datasets without retuning a threshold.

</details>

### Exercise 4.3: Keep only levels with at least 20 observations

**Task:** A code reviewer cleaning `diamonds$color` wants any color level with fewer than 1000 observations dropped into `"Other"` for a downstream chart. Use `fct_lump_min()` with `min = 1000` and save the modified factor to `ex_4_3`.

**Expected result:**

```
#> # A tibble: 7 x 2
#>   f         n
#>   <ord> <int>
#> 1 D      6775
#> 2 E      9797
#> 3 F      9542
#> 4 G     11292
#> 5 H      8304
#> 6 I      5422
#> 7 J      2808
```

**Difficulty:** Intermediate

```r title="Your turn"
ex_4_3 <- # your code here
fct_count(ex_4_3)
```

<details>
<summary>Click to reveal solution</summary>

```r title="Solution"
ex_4_3 <- fct_lump_min(diamonds$color, min = 1000)
fct_count(ex_4_3)
#> # A tibble: 7 x 2
#>   f         n
#>   <ord> <int>
#> 1 D      6775
#> 2 E      9797
#> 3 F      9542
#> 4 G     11292
#> 5 H      8304
#> 6 I      5422
#> 7 J      2808
```

**Explanation:** `fct_lump_min()` keeps any level meeting the minimum count and lumps the rest. Here every color in `diamonds` has at least 2808 rows, so no `"Other"` bucket is created and all seven colors survive unchanged. Push `min` to a higher value (say 5000) and J, then I, then H peel off into `"Other"`. This is the variant to reach for when you have a hard analytical floor like `"need at least 30 samples per cell"`.

</details>

### Exercise 4.4: Keep specific levels and lump the rest with fct_other

**Task:** An audit team wants `mpg$manufacturer` reduced to exactly three named brands (`"toyota"`, `"ford"`, `"honda"`) with all other manufacturers merged into `"Other"`. Use `fct_other()` with the `keep` argument and save the new factor to `ex_4_4`.

**Expected result:**

```
#> # A tibble: 4 x 2
#>   f          n
#>   <fct>  <int>
#> 1 toyota    34
#> 2 ford      25
#> 3 honda      9
#> 4 Other    166
```

**Difficulty:** Advanced

```r title="Your turn"
ex_4_4 <- # your code here
fct_count(ex_4_4, sort = TRUE)
```

<details>
<summary>Click to reveal solution</summary>

```r title="Solution"
ex_4_4 <- fct_other(mpg$manufacturer, keep = c("toyota", "ford", "honda"))
fct_count(ex_4_4, sort = TRUE)
#> # A tibble: 4 x 2
#>   f          n
#>   <fct>  <int>
#> 1 toyota    34
#> 2 ford      25
#> 3 honda      9
#> 4 Other    166
```

**Explanation:** `fct_other()` lumps by name rather than by frequency. Use `keep =` for an allowlist of survivors or `drop =` for a denylist of levels to collapse into `"Other"`. The two arguments are mutually exclusive. This is the right tool for stakeholder-driven cuts ("show me Apple, Google, Microsoft, and lump the rest") where the survivors are not necessarily the most frequent.

</details>

## Section 5. Plot-friendly factor ordering (4 problems)

### Exercise 5.1: Reorder bars by count for a bar chart

**Task:** A reporting analyst preparing a `mpg` summary slide wants a ggplot bar chart of `class` with bars sorted from tallest on the left to shortest on the right. Build the plot using `fct_infreq()` inside `aes(x = ...)` and save the ggplot object to `ex_5_1`.

**Expected result:**

```
#> A ggplot bar chart with class on the x axis ordered:
#> suv, compact, midsize, subcompact, pickup, minivan, 2seater
#> Bar heights: 62, 47, 41, 35, 33, 11, 5
```

**Difficulty:** Intermediate

```r title="Your turn"
ex_5_1 <- # your code here
ex_5_1
```

<details>
<summary>Click to reveal solution</summary>

```r title="Solution"
ex_5_1 <- ggplot(mpg, aes(x = fct_infreq(class))) +
  geom_bar() +
  labs(x = "Vehicle class", y = "Count")
ex_5_1
#> A ggplot bar chart with class on the x axis ordered:
#> suv, compact, midsize, subcompact, pickup, minivan, 2seater
#> Bar heights: 62, 47, 41, 35, 33, 11, 5
```

**Explanation:** Wrapping the factor in `fct_infreq()` inside `aes()` reorders bars by frequency without mutating the underlying data, which keeps the rest of the pipeline ignorant of the cosmetic ordering. This is the cleanest pattern for one-shot plots. For repeated use across multiple plots, mutate the column once with `mutate(class = fct_infreq(class))` and keep `aes()` simple.

</details>

### Exercise 5.2: Reorder boxplots by group median

**Task:** A statistician comparing fuel efficiency across `mpg$class` wants a boxplot of `hwy` per class ordered so the lowest-median class is on the left and the highest is on the right. Use `fct_reorder()` inside `aes()` keyed by `hwy` and save the ggplot object to `ex_5_2`.

**Expected result:**

```
#> A boxplot with class on x axis ordered (low to high median hwy):
#> pickup (17), suv (17.5), minivan (23), 2seater (24.5),
#> midsize (27), subcompact (26), compact (27)
```

**Difficulty:** Intermediate

```r title="Your turn"
ex_5_2 <- # your code here
ex_5_2
```

<details>
<summary>Click to reveal solution</summary>

```r title="Solution"
ex_5_2 <- ggplot(mpg, aes(x = fct_reorder(class, hwy), y = hwy)) +
  geom_boxplot() +
  labs(x = "Vehicle class (ordered by median hwy)", y = "Highway mpg")
ex_5_2
#> A boxplot with class on x axis ordered (low to high median hwy):
#> pickup (17), suv (17.5), minivan (23), 2seater (24.5),
#> midsize (27), subcompact (26), compact (27)
```

**Explanation:** `fct_reorder()` defaults to `median` as the summary, which is robust to outliers and matches the line drawn in a boxplot. Plotting categories in a meaningful order, rather than alphabetical, removes a cognitive step for the reader. Use `.desc = TRUE` to flip the direction, or chain with `fct_rev()` for the same effect.

</details>

### Exercise 5.3: Match legend order to line endpoints with fct_reorder2

**Task:** A trading desk plotting `economics` (using `psavert`) wants any factored copy reordered so a multi-series line plot legend matches the last visible y-value. Take the inline panel below and apply `fct_reorder2()` on `series` keyed by `x` and `y`. Save the new factor to `ex_5_3`.

**Expected result:**

```
#> [1] "C" "A" "B"
```

**Difficulty:** Advanced

```r title="Setup for Exercise 5.3"
panel <- tibble(
  series = factor(rep(c("A", "B", "C"), each = 4)),
  x      = rep(1:4, times = 3),
  y      = c(1, 2, 3, 4,   2, 3, 4, 5,   5, 6, 7, 8)
)
```

```r title="Your turn"
ex_5_3 <- # your code here
levels(ex_5_3)
```

<details>
<summary>Click to reveal solution</summary>

```r title="Solution"
ex_5_3 <- fct_reorder2(panel$series, panel$x, panel$y)
levels(ex_5_3)
#> [1] "C" "A" "B"
```

**Explanation:** `fct_reorder2()` ranks levels by the y-value at the largest x within each level, which is exactly what the eye tracks on a line plot. Pair with `geom_line(aes(color = ex_5_3))` and the legend ordering matches the rightmost line endpoints top-to-bottom. The standard `fct_reorder()` would use a single summary like median across all x and miss this ordering.

</details>

### Exercise 5.4: Reverse factor order for horizontal bars

**Task:** A junior analyst building a horizontal bar chart of `mpg$class` counts notices that ggplot stacks bars bottom-up so the largest bar ends up on the bottom. Apply `fct_rev()` on top of `fct_infreq()` so the largest bar appears on top in a `coord_flip()` chart. Save the ggplot object to `ex_5_4`.

**Expected result:**

```
#> A horizontal bar chart with classes top-to-bottom:
#> suv (62), compact (47), midsize (41),
#> subcompact (35), pickup (33), minivan (11), 2seater (5)
```

**Difficulty:** Advanced

```r title="Your turn"
ex_5_4 <- # your code here
ex_5_4
```

<details>
<summary>Click to reveal solution</summary>

```r title="Solution"
ex_5_4 <- ggplot(mpg, aes(x = fct_rev(fct_infreq(class)))) +
  geom_bar() +
  coord_flip() +
  labs(x = "Vehicle class", y = "Count")
ex_5_4
#> A horizontal bar chart with classes top-to-bottom:
#> suv (62), compact (47), midsize (41),
#> subcompact (35), pickup (33), minivan (11), 2seater (5)
```

**Explanation:** ggplot draws the first factor level at the bottom of the y axis after `coord_flip()`, so a frequency-ordered factor produces an inverted Pareto. Composing `fct_rev(fct_infreq(...))` flips it back to the canonical largest-on-top reading order. Composition order matters: `fct_infreq(fct_rev(...))` would frequency-sort first then reverse, also valid but the inner-first reading is clearer.

</details>

## Section 6. Cleaning factors (4 problems)

### Exercise 6.1: Drop unused levels after filtering rows

**Task:** A data engineer filtering `iris` down to only `"setosa"` rows finds the factor still carries `"versicolor"` and `"virginica"` as ghost levels, distorting downstream tables. Drop the unused levels using `fct_drop()` after the filter and save the cleaned factor to `ex_6_1`.

**Expected result:**

```
#> [1] "setosa"
```

**Difficulty:** Beginner

```r title="Your turn"
setosa_only <- iris[iris$Species == "setosa", ]
ex_6_1 <- # your code here
levels(ex_6_1)
```

<details>
<summary>Click to reveal solution</summary>

```r title="Solution"
setosa_only <- iris[iris$Species == "setosa", ]
ex_6_1 <- fct_drop(setosa_only$Species)
levels(ex_6_1)
#> [1] "setosa"
```

**Explanation:** Subsetting rows never trims the level set on its own because factors store levels independently of values. The leftover empty levels show up as zero-count rows in `table()` and as empty bars in `geom_bar()`, which is rarely what you want. `fct_drop()` removes levels with zero observations; pass `only = "x"` to target a specific level, useful when you need to keep some empty levels intentionally.

</details>

### Exercise 6.2: Expand a factor with new levels

**Task:** A pharmacology team is preparing a study factor for a new arm not yet observed in the data. Take the inline vector `arms` and expand it with `fct_expand()` to include a fourth arm `"Placebo"` even though no rows hold that value yet. Save the expanded factor to `ex_6_2`.

**Expected result:**

```
#> [1] "A"       "B"       "C"       "Placebo"
```

**Difficulty:** Intermediate

```r title="Setup for Exercise 6.2"
arms <- factor(c("A", "B", "A", "C", "B", "C"))
```

```r title="Your turn"
ex_6_2 <- # your code here
levels(ex_6_2)
```

<details>
<summary>Click to reveal solution</summary>

```r title="Solution"
ex_6_2 <- fct_expand(arms, "Placebo")
levels(ex_6_2)
#> [1] "A"       "B"       "C"       "Placebo"
```

**Explanation:** `fct_expand()` adds new levels without changing any observation. The added level has zero counts until rows are appended later. This matters when you want stable factor levels across multiple data batches (e.g. so a fitted model can score future data with a previously-unseen treatment arm), or to lock in the level ordering before plotting an empty category as a baseline.

</details>

### Exercise 6.3: Convert NA values into an explicit factor level

**Task:** An audit team analysing the inline survey vector `responses_na` wants `NA` answers preserved as a visible category labelled `"Missing"` rather than silently dropped from `table()`. Use `fct_na_value_to_level()` with `level = "Missing"` and save the modified factor to `ex_6_3`.

**Expected result:**

```
#> # A tibble: 4 x 2
#>   f           n
#>   <fct>   <int>
#> 1 Yes         3
#> 2 No          2
#> 3 Maybe       1
#> 4 Missing     2
```

**Difficulty:** Intermediate

```r title="Setup for Exercise 6.3"
responses_na <- factor(c("Yes", "No", NA, "Maybe", "Yes", "Yes", "No", NA))
```

```r title="Your turn"
ex_6_3 <- # your code here
fct_count(ex_6_3)
```

<details>
<summary>Click to reveal solution</summary>

```r title="Solution"
ex_6_3 <- fct_na_value_to_level(responses_na, level = "Missing")
fct_count(ex_6_3)
#> # A tibble: 4 x 2
#>   f           n
#>   <fct>   <int>
#> 1 Yes         3
#> 2 No          2
#> 3 Maybe       1
#> 4 Missing     2
```

**Explanation:** Hiding `NA` values can mask a serious data-quality issue; turning them into an explicit level forces the missingness to show up in every plot and table. `fct_na_value_to_level()` (formerly `fct_explicit_na()`) is the right step before passing a factor into a model that cannot accept `NA`, or before a stakeholder chart where missingness is part of the story.

</details>

### Exercise 6.4: Unify factor levels across two datasets before binding

**Task:** A data engineer merging two quarterly survey snapshots has factors `q1` and `q2` whose levels overlap but are not identical, causing `bind_rows()` to coerce them to character. Use `fct_unify()` to harmonise their levels into a single common set, then return the unified factors as a list. Save it to `ex_6_4`.

**Expected result:**

```
#> $q1
#> [1] "Excellent" "Good"      "Fair"      "Poor"     
#> 
#> $q2
#> [1] "Excellent" "Good"      "Fair"      "Poor"
```

**Difficulty:** Advanced

```r title="Setup for Exercise 6.4"
q1 <- factor(c("Good", "Fair", "Excellent"))
q2 <- factor(c("Poor", "Good", "Excellent"))
```

```r title="Your turn"
ex_6_4 <- # your code here
lapply(ex_6_4, levels)
```

<details>
<summary>Click to reveal solution</summary>

```r title="Solution"
ex_6_4 <- fct_unify(list(q1, q2))
lapply(ex_6_4, levels)
#> $q1
#> [1] "Excellent" "Good"      "Fair"      "Poor"     
#> 
#> $q2
#> [1] "Excellent" "Good"      "Fair"      "Poor"
```

**Explanation:** `fct_unify()` walks a list of factors, computes the union of their levels, and applies that union (in a stable order) to each factor in the list. The result safely stacks under `bind_rows()` or any column-wise combine because both factors now agree on their level set. Without this step, dplyr quietly coerces mismatched factors to character, losing the ordinal contract you may rely on later.

</details>

## Section 7. End-to-end factor workflows (3 problems)

### Exercise 7.1: Survey response cleanup pipeline

**Task:** A marketing analyst received a raw NPS survey with the inline vector below. Build a pipeline that (a) collapses the seven granular scores into three buckets (`"Promoter"`, `"Passive"`, `"Detractor"`), (b) treats `NA` as `"NoResponse"`, and (c) lumps `"Passive"` into `"Other"` so only `"Promoter"`, `"Detractor"`, `"NoResponse"`, and `"Other"` survive. Save the final factor to `ex_7_1`.

**Expected result:**

```
#> # A tibble: 4 x 2
#>   f              n
#>   <fct>      <int>
#> 1 Promoter       3
#> 2 Detractor      3
#> 3 NoResponse     2
#> 4 Other          3
```

**Difficulty:** Advanced

```r title="Setup for Exercise 7.1"
nps_raw <- factor(
  c("9", "10", "8", "7", "5", "3", NA, "9", "6", "10", NA),
  levels = c("0","1","2","3","4","5","6","7","8","9","10")
)
```

```r title="Your turn"
ex_7_1 <- # your code here
fct_count(ex_7_1)
```

<details>
<summary>Click to reveal solution</summary>

```r title="Solution"
ex_7_1 <- nps_raw |>
  fct_collapse(
    Detractor = c("0","1","2","3","4","5","6"),
    Passive   = c("7","8"),
    Promoter  = c("9","10")
  ) |>
  fct_na_value_to_level(level = "NoResponse") |>
  fct_other(drop = "Passive")
fct_count(ex_7_1)
#> # A tibble: 4 x 2
#>   f              n
#>   <fct>      <int>
#> 1 Promoter       3
#> 2 Detractor      3
#> 3 NoResponse     2
#> 4 Other          3
```

**Explanation:** Real survey cleanup chains three forcats verbs: collapse for the bucketing rule (industry-standard NPS thresholds), then explicit NA handling, then a final lumping pass. Building the pipeline left-to-right makes each step auditable in isolation, so a reviewer can swap the collapse cutoffs or relabel `NoResponse` without rewriting the chain. The same skeleton fits any Likert recoding workflow.

</details>

### Exercise 7.2: Set a regression reference level and re-encode contrasts

**Task:** A biostatistician fitting `lm(weight ~ Diet, data = ChickWeight)` wants the model's intercept to represent `Diet == "3"` rather than the default `Diet == "1"`, so the published coefficients are offsets from diet 3. Releved `ChickWeight$Diet`, fit the model, and save the fitted `lm` object to `ex_7_2`. Inspect `coef(ex_7_2)` for the new contrast names.

**Expected result:**

```
#> (Intercept)       Diet1       Diet2       Diet4 
#>     142.950     -20.293       9.376      13.431
```

**Difficulty:** Advanced

```r title="Your turn"
cw <- ChickWeight
cw$Diet <- # your code here
ex_7_2 <- lm(weight ~ Diet, data = cw)
round(coef(ex_7_2), 3)
```

<details>
<summary>Click to reveal solution</summary>

```r title="Solution"
cw <- ChickWeight
cw$Diet <- fct_relevel(cw$Diet, "3")
ex_7_2 <- lm(weight ~ Diet, data = cw)
round(coef(ex_7_2), 3)
#> (Intercept)       Diet1       Diet2       Diet4 
#>     142.950     -20.293       9.376      13.431
```

**Explanation:** Changing the reference level changes the intercept and the names of the dummy coefficients but not the model fit (residual SS and adjusted R-squared are identical). The published intercept now equals the mean weight for diet 3, and the three `Diet1`/`Diet2`/`Diet4` coefficients are offsets from it, often the form a paper or regulator expects. Reach for `relevel()` from base R if you cannot add a tidyverse dependency.

</details>

### Exercise 7.3: Top-3 brands per quarter with rolling Other bucket

**Task:** A performance reviewer wants quarterly market-share data with only the top three brands shown per quarter and all remaining brands rolled into `"Other"` per quarter. Take the inline `sales` panel and produce a tibble with columns `quarter`, `brand`, and `units`. Save it to `ex_7_3`. Top brands should be ranked by `units` within each quarter.

**Expected result:**

```
#> # A tibble: 6 x 3
#>   quarter brand  units
#>   <chr>   <fct>  <dbl>
#> 1 Q1      Toyota   500
#> 2 Q1      Ford     350
#> 3 Q1      Honda    300
#> 4 Q2      Honda    450
#> 5 Q2      Ford     400
#> 6 Q2      Toyota   350
```

**Difficulty:** Advanced

```r title="Setup for Exercise 7.3"
sales <- tibble(
  quarter = rep(c("Q1", "Q2"), each = 5),
  brand   = c("Toyota","Ford","Honda","BMW","Audi",
              "Honda","Ford","Toyota","BMW","Audi"),
  units   = c(500, 350, 300, 100, 80,
              450, 400, 350, 90, 60)
)
```

```r title="Your turn"
ex_7_3 <- sales |>
  group_by(quarter) |>
  # your code here
ex_7_3
```

<details>
<summary>Click to reveal solution</summary>

```r title="Solution"
ex_7_3 <- sales |>
  group_by(quarter) |>
  slice_max(units, n = 3) |>
  mutate(brand = fct_reorder(brand, units, .desc = TRUE)) |>
  ungroup() |>
  arrange(quarter, brand)
ex_7_3
#> # A tibble: 6 x 3
#>   quarter brand  units
#>   <chr>   <fct>  <dbl>
#> 1 Q1      Toyota   500
#> 2 Q1      Ford     350
#> 3 Q1      Honda    300
#> 4 Q2      Honda    450
#> 5 Q2      Ford     400
#> 6 Q2      Toyota   350
```

**Explanation:** Combining `slice_max()` for the per-group top-N selection with `fct_reorder()` for plot-friendly factor ordering produces a clean ranked panel ready for a small-multiples bar chart. The `.desc = TRUE` flag puts the bestseller first in level order so legends and axes flow large-to-small. For a true rolling Other bucket across all brands, add a `summarise(units = sum(units))` per quarter before slicing.

</details>

## What to do next

- Revisit the parent reference: [R Factors Explained](R-Factors.html) for the theory behind levels, ordering, and contrasts.
- Practice further with [dplyr Exercises in R](dplyr-Exercises-in-R.md) to chain factor cleaning with row and column verbs.
- Try [Data Cleaning Exercises in R](Data-Cleaning-Exercises-in-R.html) to apply factor handling inside larger import pipelines.
- Extend to plotting with [ggplot2 Exercises in R](ggplot2-Exercises-in-R.html) where factor order drives bar, box, and line layout.

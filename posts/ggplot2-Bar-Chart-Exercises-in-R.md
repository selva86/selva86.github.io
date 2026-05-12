---
title: "ggplot2 Bar Chart Exercises in R: 25 Practice Problems"
slug: "ggplot2-Bar-Chart-Exercises-in-R"
description: "Twenty-five graded ggplot2 bar chart exercises in R: counts, geom_col, stacks, dodges, percentages, labels, facets, lollipops, pyramids."
keywords: "ggplot2 bar chart exercises, geom_bar exercises R, geom_col practice, stacked bar R exercises, ggplot bar chart tutorial"
mathjax: false
webr: true
date: "2026-05-12"
post_type: "EX"
sidebar_title: "ggplot2 Bar Chart Exercises"
sidebar_order: 127
fr_parent: "Top50-Ggplot2-Visualizations-MasterList-R-Code.html"
auto_link_terms: "ggplot2 bar chart exercises|geom_bar exercises|geom_col practice|stacked bar chart R|dodged bar chart R|lollipop chart R"
auto_link_case_sensitive: false
target_keyword: "ggplot2 bar chart exercises"
sibling_block_enabled: false
difficulty: "Mixed"
---

# ggplot2 Bar Chart Exercises in R: 25 Practice Problems

<p class="lead">Twenty-five graded practice problems on ggplot2 bar charts in R: counts and explicit heights, stacking and dodging, percentage fills, labels and palettes, summarised bars with error bars, facets, lollipops, population pyramids, and highlighted bars. Solutions are hidden so you can try first.</p>

```r title="Run this once before any exercise"
library(ggplot2)
library(dplyr)
library(forcats)
library(scales)
library(tidyr)
library(tibble)
```

## Section 1. Bar basics: counts and explicit heights (5 problems)

### Exercise 1.1: Build a count bar chart of diamond cut quality

**Task:** A jeweller preparing inventory reports wants a single chart that shows how many stones fall into each `cut` category in the `diamonds` dataset. Use `geom_bar()` so ggplot counts the rows for you, map `cut` to the x axis, and save the resulting plot object to `ex_1_1`.

**Expected result:**

```
#> Bar chart with 5 vertical bars on the x-axis: Fair, Good, Very Good, Premium, Ideal.
#> y-axis is "count" automatically computed by stat_count.
#> Ideal is tallest (~21551 stones); Fair is shortest (~1610).
#> Default gray fill, no legend.
```

**Difficulty:** Beginner

```r title="Your turn"
ex_1_1 <- # your code here
ex_1_1
```

<details>
<summary>Click to reveal solution</summary>

```r title="Solution"
ex_1_1 <- ggplot(diamonds, aes(x = cut)) +
  geom_bar()
ex_1_1
#> A vertical bar chart with one bar per cut grade.
```

**Explanation:** `geom_bar()` carries its own statistic, `stat_count`, which counts rows for each unique value of the mapped variable. That is why you do not pass a y aesthetic. If you already have a tibble of pre-aggregated totals, switch to `geom_col()` instead, which expects an explicit `y`. Mapping `cut` (an ordered factor) preserves the natural quality order on the axis.

</details>

### Exercise 1.2: Plot brand revenue from a pre-summarised tibble using geom_col

**Task:** A retail analyst has already computed total quarterly revenue per product line and stored it in the tibble built below. Use `geom_col()` (not `geom_bar`) to draw one bar per `product` with bar height equal to the `revenue_k` value in thousands of dollars, and save the chart to `ex_1_2`.

```r title="Run before the exercise"
revenue_tbl <- tibble::tibble(
  product   = c("Alpha", "Bravo", "Charlie", "Delta", "Echo"),
  revenue_k = c(412, 268, 591, 124, 347)
)
```

**Expected result:**

```
#> 5 vertical bars (Alpha, Bravo, Charlie, Delta, Echo) ordered alphabetically.
#> y-axis = revenue_k, bar heights: 412, 268, 591, 124, 347.
#> Charlie tallest, Delta shortest.
```

**Difficulty:** Intermediate

```r title="Your turn"
ex_1_2 <- # your code here
ex_1_2
```

<details>
<summary>Click to reveal solution</summary>

```r title="Solution"
ex_1_2 <- ggplot(revenue_tbl, aes(x = product, y = revenue_k)) +
  geom_col()
ex_1_2
#> One bar per product, height drawn from revenue_k.
```

**Explanation:** `geom_col()` is shorthand for `geom_bar(stat = "identity")`: it draws each row as a bar of height `y`. Use it whenever the heights are already computed (means, totals, percentages). A common mistake is calling `geom_bar()` here and getting bars of height 1 because every product appears exactly once in the summary tibble.

</details>

### Exercise 1.3: Reorder cut bars from most to least frequent with fct_infreq

**Task:** Returning to the `diamonds` count chart, your stakeholder wants the bars sorted by frequency so the busiest cut sits on the left and the rarest on the right rather than the default quality order. Wrap `cut` in `fct_infreq()` inside `aes()` and save the reordered chart to `ex_1_3`.

**Expected result:**

```
#> 5 bars in descending order of count from left to right:
#> Ideal (21551), Premium (13791), Very Good (12082), Good (4906), Fair (1610).
```

**Difficulty:** Intermediate

```r title="Your turn"
ex_1_3 <- # your code here
ex_1_3
```

<details>
<summary>Click to reveal solution</summary>

```r title="Solution"
ex_1_3 <- ggplot(diamonds, aes(x = fct_infreq(cut))) +
  geom_bar()
ex_1_3
#> Bars from tallest to shortest: Ideal, Premium, Very Good, Good, Fair.
```

**Explanation:** `fct_infreq()` releveles a factor by descending count, so the resulting x-axis is ranked rather than ordinal. This is one of the highest-leverage moves for categorical bar charts: ranked bars let a reader extract the ordering in one glance. To flip the direction (rarest first), chain `fct_rev()` after `fct_infreq()`.

</details>

### Exercise 1.4: Flip long categorical labels onto a horizontal axis

**Task:** Working with the built-in `mpg` dataset, a code reviewer needs the `manufacturer` names readable without rotation, so the bars should run horizontally instead of vertically. Build a count bar chart of manufacturers with `geom_bar()` and produce horizontal bars by mapping `manufacturer` to the y aesthetic, then save it to `ex_1_4`.

**Expected result:**

```
#> Horizontal bar chart with one bar per manufacturer on the y-axis.
#> 15 manufacturers listed top to bottom in alphabetical order.
#> dodge has the longest bar (~37 cars); lincoln the shortest (~3).
```

**Difficulty:** Beginner

```r title="Your turn"
ex_1_4 <- # your code here
ex_1_4
```

<details>
<summary>Click to reveal solution</summary>

```r title="Solution"
ex_1_4 <- ggplot(mpg, aes(y = manufacturer)) +
  geom_bar()
ex_1_4
#> Horizontal count bars by manufacturer.
```

**Explanation:** Modern ggplot2 (3.3+) supports flipping by simply moving the discrete variable from `x` to `y` rather than appending `coord_flip()`. The advantage: axis labels, scales, and limits all keep their natural meaning, while `coord_flip()` confuses downstream code that references `xlim`/`ylim`. Reserve `coord_flip()` for retrofitting old code.

</details>

### Exercise 1.5: Force a custom day-of-week order with factor levels

**Task:** You have a small weekday traffic table built below. R sorts character strings alphabetically by default, which puts Friday before Monday on the axis. Convert `day` to a factor with the correct Mon to Sun order, then draw a `geom_col()` chart of visits, and save the chart to `ex_1_5`.

```r title="Run before the exercise"
traffic_tbl <- tibble::tibble(
  day    = c("Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"),
  visits = c(820, 905, 870, 950, 1120, 1480, 1310)
)
```

**Expected result:**

```
#> 7 bars in calendar order along the x-axis: Mon, Tue, Wed, Thu, Fri, Sat, Sun.
#> Heights: 820, 905, 870, 950, 1120, 1480, 1310.
#> Sat is the tallest; Mon is the shortest.
```

**Difficulty:** Intermediate

```r title="Your turn"
ex_1_5 <- # your code here
ex_1_5
```

<details>
<summary>Click to reveal solution</summary>

```r title="Solution"
ex_1_5 <- traffic_tbl |>
  mutate(day = factor(day, levels = c("Mon","Tue","Wed","Thu","Fri","Sat","Sun"))) |>
  ggplot(aes(x = day, y = visits)) +
  geom_col()
ex_1_5
#> Bars in Mon-to-Sun order.
```

**Explanation:** ggplot inherits axis order from the variable's factor levels, so the fix happens at the data step, not the plot step. `factor(..., levels = ...)` is the canonical move; `forcats::fct_relevel(day, "Mon","Tue",...)` does the same thing more readably for partial reorderings. Without this step the x-axis becomes Fri, Mon, Sat, Sun, Thu, Tue, Wed.

</details>

## Section 2. Stacked, dodged, and filled bars (5 problems)

### Exercise 2.1: Stack diamond clarity within each cut for a single-bar inventory view

**Task:** A jeweller wants a single bar per `cut` with internal segments showing how that cut breaks down by `clarity` grade. Build a stacked bar chart of `diamonds` with `cut` on x and `clarity` mapped to `fill`, leaving the default `position = "stack"` so segments stack vertically, and save to `ex_2_1`.

**Expected result:**

```
#> 5 vertical stacked bars (one per cut).
#> Each bar split into 8 colored segments corresponding to clarity grades I1..IF.
#> Ideal bar tallest overall (~21551); Fair shortest (~1610).
#> Legend on the right labelled "clarity".
```

**Difficulty:** Intermediate

```r title="Your turn"
ex_2_1 <- # your code here
ex_2_1
```

<details>
<summary>Click to reveal solution</summary>

```r title="Solution"
ex_2_1 <- ggplot(diamonds, aes(x = cut, fill = clarity)) +
  geom_bar()
ex_2_1
#> Stacked bars by clarity within each cut.
```

**Explanation:** Stacking is the default position for `geom_bar()` whenever a `fill` aesthetic is set, so you do not need to specify `position = "stack"` explicitly. Stacked bars communicate totals well but make within-group comparisons hard because the segments do not share a baseline. If readers must compare segment sizes across cuts, switch to dodged or filled bars.

</details>

### Exercise 2.2: Compare cut counts side by side across diamond colors using dodge

**Task:** A buyer wants to compare the count of each `cut` across the seven `color` grades, with side-by-side bars rather than stacked segments so each cut has its own baseline within every color group. Map `color` to x, `cut` to fill, and use `position = "dodge"` in `geom_bar()`, then save to `ex_2_2`.

**Expected result:**

```
#> 7 groups along x (color grades D to J), each containing 5 colored bars (one per cut).
#> Bars within a group sit shoulder to shoulder, not stacked.
#> Tallest cluster overall sits at color G; Fair bars are uniformly shortest.
```

**Difficulty:** Intermediate

```r title="Your turn"
ex_2_2 <- # your code here
ex_2_2
```

<details>
<summary>Click to reveal solution</summary>

```r title="Solution"
ex_2_2 <- ggplot(diamonds, aes(x = color, fill = cut)) +
  geom_bar(position = "dodge")
ex_2_2
#> Dodged bars, 5 cuts per color group.
```

**Explanation:** `position = "dodge"` offsets bars within the same x value so they share the baseline. This is the right choice when within-group comparison matters more than the total. A subtle pitfall: dodge keeps bars from missing fill levels invisible, which can make groups look unequally wide. Use `position_dodge2(preserve = "single")` to force consistent bar widths.

</details>

### Exercise 2.3: Convert stacked bars into 100 percent filled bars to compare composition

**Task:** A marketing analyst wants to see the proportion of each `cut` within every `color`, not the absolute counts, so all bars should reach the top of the panel and segments should show shares. Modify the dodged setup from the previous exercise: map `color` to x and `cut` to fill, but use `position = "fill"` to stack to 100 percent, and save to `ex_2_3`.

**Expected result:**

```
#> 7 vertical bars (color D to J), each reaching height 1.0.
#> Each bar split into 5 cut segments whose lengths sum to 1.
#> y-axis displayed 0.00 to 1.00; legend on the right titled "cut".
```

**Difficulty:** Intermediate

```r title="Your turn"
ex_2_3 <- # your code here
ex_2_3
```

<details>
<summary>Click to reveal solution</summary>

```r title="Solution"
ex_2_3 <- ggplot(diamonds, aes(x = color, fill = cut)) +
  geom_bar(position = "fill") +
  scale_y_continuous(labels = percent_format())
ex_2_3
#> 100% stacked bars; y-axis formatted as percentages.
```

**Explanation:** `position = "fill"` rescales each bar to length 1, exposing the within-bar share of every category. This makes composition comparable across groups of very different size. Pair it with `scale_y_continuous(labels = percent_format())` from the scales package so the axis reads as percentages, not 0.00..1.00. A 100 percent stacked bar is also called a Marimekko-style chart in finance.

</details>

### Exercise 2.4: Reverse the stack order so the legend matches the bar from top to bottom

**Task:** The default ggplot2 stack ends up with the legend in the opposite order from the visual stack, which audit reviewers find confusing. Take the stacked diamonds chart, wrap `clarity` in `fct_rev()` inside the fill aesthetic so legend order tracks visual order, and save to `ex_2_4`.

**Expected result:**

```
#> Same 5 stacked bars as Exercise 2.1, one per cut.
#> Legend entries now appear in reverse order compared to the default (IF at top, I1 at bottom).
#> The order of colored segments inside each bar visually matches the legend top to bottom.
```

**Difficulty:** Advanced

```r title="Your turn"
ex_2_4 <- # your code here
ex_2_4
```

<details>
<summary>Click to reveal solution</summary>

```r title="Solution"
ex_2_4 <- ggplot(diamonds, aes(x = cut, fill = fct_rev(clarity))) +
  geom_bar() +
  labs(fill = "clarity")
ex_2_4
#> Legend and stack order now match visually.
```

**Explanation:** `geom_bar()` draws the first factor level at the bottom of each stack but lists the first level at the top of the legend. Reversing the factor with `fct_rev()` aligns the two so the topmost segment in the bar is the topmost legend entry. The explicit `labs(fill = "clarity")` restores a clean legend title because `fct_rev(clarity)` would otherwise show up verbatim.

</details>

### Exercise 2.5: Plot diverging bars for satisfaction scores around a zero baseline

**Task:** A product manager has the post-launch survey table built below where each feature has a net score that can be positive or negative. Draw a diverging horizontal bar chart with the `geom_col()` geometry, mapping positive bars one color and negative bars another via `fill = score > 0`, and save to `ex_2_5`.

```r title="Run before the exercise"
nps_tbl <- tibble::tibble(
  feature = c("Search", "Checkout", "Login", "Filters", "Notifications", "Pricing"),
  score   = c(28, -14, 41, -7, 12, -33)
)
```

**Expected result:**

```
#> Horizontal bar chart with 6 bars (one per feature) extending left or right of x = 0.
#> Positive bars (Search, Login, Notifications) extend right in one color.
#> Negative bars (Checkout, Filters, Pricing) extend left in another color.
```

**Difficulty:** Advanced

```r title="Your turn"
ex_2_5 <- # your code here
ex_2_5
```

<details>
<summary>Click to reveal solution</summary>

```r title="Solution"
ex_2_5 <- nps_tbl |>
  mutate(feature = fct_reorder(feature, score)) |>
  ggplot(aes(x = score, y = feature, fill = score > 0)) +
  geom_col() +
  scale_fill_manual(values = c("TRUE" = "#2c7bb6", "FALSE" = "#d7191c"),
                    guide  = "none") +
  geom_vline(xintercept = 0, color = "grey30")
ex_2_5
#> Diverging horizontal bars around x = 0, colored by sign.
```

**Explanation:** Diverging bars exploit the fact that `geom_col()` accepts negative `x` values and draws the bar to the left of zero. Mapping a boolean (`score > 0`) to `fill` partitions the bars by sign; `scale_fill_manual()` assigns a deliberate pair of colors and `guide = "none"` suppresses the redundant legend. `fct_reorder()` sorts features by score so the chart reads as a ranked deviation plot.

</details>

## Section 3. Labels, colors, and theming (5 problems)

### Exercise 3.1: Annotate bar tops with their count values using geom_text

**Task:** A reporting analyst preparing a slide deck needs the count above each bar so executives do not have to read the y axis. Take the `diamonds` cut count bar chart and add `geom_text()` with `stat = "count"` to place the count label above each bar, then save to `ex_3_1`.

**Expected result:**

```
#> 5 vertical bars by cut.
#> Each bar carries a numeric label just above its top edge: 1610, 4906, 12082, 13791, 21551.
```

**Difficulty:** Intermediate

```r title="Your turn"
ex_3_1 <- # your code here
ex_3_1
```

<details>
<summary>Click to reveal solution</summary>

```r title="Solution"
ex_3_1 <- ggplot(diamonds, aes(x = cut)) +
  geom_bar() +
  geom_text(stat = "count", aes(label = after_stat(count)), vjust = -0.3)
ex_3_1
#> Count value printed above every bar.
```

**Explanation:** `geom_text()` defaults to `stat = "identity"`, so for a count chart you must reuse `stat_count` and pull the computed value with `after_stat(count)`. `vjust = -0.3` nudges labels above the bar tops; positive `vjust` would push them inside. For `geom_col()` charts where heights are explicit, you instead pass `aes(label = y)` directly without `after_stat()`.

</details>

### Exercise 3.2: Apply a ColorBrewer Set2 palette to colored bars

**Task:** Switching to the `mpg` dataset, a junior analyst wants the count bars of vehicle `class` colored by `drv` (drivetrain) and dressed in a ColorBrewer Set2 palette to make the chart presentation ready. Build a stacked count bar chart with `class` on x and `drv` on fill, then add `scale_fill_brewer(palette = "Set2")`, and save to `ex_3_2`.

**Expected result:**

```
#> 7 stacked bars (one per class: 2seater, compact, midsize, minivan, pickup, subcompact, suv).
#> Segments in soft pastel colors from ColorBrewer Set2 (green, orange, blue) for drv values 4, f, r.
#> Default theme; legend on the right.
```

**Difficulty:** Beginner

```r title="Your turn"
ex_3_2 <- # your code here
ex_3_2
```

<details>
<summary>Click to reveal solution</summary>

```r title="Solution"
ex_3_2 <- ggplot(mpg, aes(x = class, fill = drv)) +
  geom_bar() +
  scale_fill_brewer(palette = "Set2")
ex_3_2
#> Stacked class bars colored by drv using ColorBrewer Set2.
```

**Explanation:** `scale_fill_brewer()` lives in ggplot2 itself (no separate package import needed at the user level) and exposes the qualitative, sequential, and diverging palettes from ColorBrewer. Set2 is a good default for low-saturation categorical fills because the colors are colorblind-safe and they print well in grayscale. Use `display.brewer.all()` from RColorBrewer to preview palettes.

</details>

### Exercise 3.3: Hardcode brand-aligned colors per category with scale_fill_manual

**Task:** A growth team has a brand book that forces the colors blue (#1f77b4) for "Web", orange (#ff7f0e) for "Mobile", and green (#2ca02c) for "Email" on every chart. Using the inline tibble below, draw a `geom_col()` chart of conversions per channel and force the exact palette via `scale_fill_manual()`, then save to `ex_3_3`.

```r title="Run before the exercise"
channels_tbl <- tibble::tibble(
  channel     = c("Web", "Mobile", "Email"),
  conversions = c(412, 580, 263)
)
```

**Expected result:**

```
#> 3 vertical bars in this exact color order: Web=blue, Mobile=orange, Email=green.
#> Bar heights: Web 412, Mobile 580, Email 263.
#> Legend on the right with the same three named colors.
```

**Difficulty:** Intermediate

```r title="Your turn"
ex_3_3 <- # your code here
ex_3_3
```

<details>
<summary>Click to reveal solution</summary>

```r title="Solution"
ex_3_3 <- ggplot(channels_tbl, aes(x = channel, y = conversions, fill = channel)) +
  geom_col() +
  scale_fill_manual(values = c("Web"    = "#1f77b4",
                               "Mobile" = "#ff7f0e",
                               "Email"  = "#2ca02c"))
ex_3_3
#> Brand-locked colors per channel.
```

**Explanation:** A named vector passed to `scale_fill_manual(values = ...)` binds factor levels to colors by name rather than by position, so the chart stays correct even if the order of `channel` changes later. This is the standard approach for brand books or accessibility-mandated palettes. If you supply an unnamed vector, ggplot maps colors to factor levels in level order, which is fragile.

</details>

### Exercise 3.4: Rotate x axis labels 45 degrees for long category names

**Task:** When you draw a `manufacturer` count bar chart from `mpg` the default horizontal labels overlap badly because some brand names are long. Build the count chart with `geom_bar()`, then rotate the x axis text 45 degrees using `theme(axis.text.x = element_text(angle = 45, hjust = 1))`, and save it to `ex_3_4`.

**Expected result:**

```
#> 15 vertical bars (one per manufacturer) along the x-axis.
#> Manufacturer labels rotated 45 degrees, right-anchored under the bars so the labels do not overlap.
```

**Difficulty:** Beginner

```r title="Your turn"
ex_3_4 <- # your code here
ex_3_4
```

<details>
<summary>Click to reveal solution</summary>

```r title="Solution"
ex_3_4 <- ggplot(mpg, aes(x = manufacturer)) +
  geom_bar() +
  theme(axis.text.x = element_text(angle = 45, hjust = 1))
ex_3_4
#> Rotated x-axis labels at 45 degrees.
```

**Explanation:** Pair `angle = 45` with `hjust = 1` so the labels right-justify under the tick mark instead of dangling to the right. For full-vertical labels use `angle = 90, hjust = 1, vjust = 0.5`. If the categories are long and numerous, flipping the axis (mapping the variable to `y`) is usually a cleaner answer than rotation.

</details>

### Exercise 3.5: Strip gridlines and dress the chart in theme_minimal for print

**Task:** A reporting analyst is exporting bar charts for a black and white printed report and wants a clean look with no panel background and only horizontal gridlines. Start from the `diamonds` cut count chart, then apply `theme_minimal()` and turn off panel borders plus major x gridlines via additional `theme()` arguments, and save to `ex_3_5`.

**Expected result:**

```
#> 5 cut bars on a white panel background.
#> No outer border around the panel.
#> Horizontal gridlines visible; vertical gridlines suppressed.
```

**Difficulty:** Intermediate

```r title="Your turn"
ex_3_5 <- # your code here
ex_3_5
```

<details>
<summary>Click to reveal solution</summary>

```r title="Solution"
ex_3_5 <- ggplot(diamonds, aes(x = cut)) +
  geom_bar() +
  theme_minimal() +
  theme(panel.grid.major.x = element_blank(),
        panel.grid.minor.x = element_blank(),
        panel.border       = element_blank())
ex_3_5
#> Minimal theme, only horizontal gridlines retained.
```

**Explanation:** Themes layer cumulatively: `theme_minimal()` strips the gray background and panel border, and the subsequent `theme()` call blanks out the vertical major and minor gridlines that the minimal theme still draws. The element_blank trick is also how you remove axis titles, legends, or strip backgrounds piecewise. For an even cleaner print look, consider `theme_classic()` which adds axis lines automatically.

</details>

## Section 4. Aggregations and computed bars (5 problems)

### Exercise 4.1: Plot mean miles per gallon for each cylinder count

**Task:** A data engineer profiling the `mtcars` dataset wants a bar chart of mean `mpg` per `cyl` group instead of a count of cars. First compute the means with `dplyr` grouping, then draw a `geom_col()` chart with `cyl` on x as a factor and mean MPG on y, and save to `ex_4_1`.

**Expected result:**

```
#> Tibble of means used to draw the chart:
#> # A tibble: 3 x 2
#>     cyl mpg_mean
#>   <dbl>    <dbl>
#> 1     4     26.7
#> 2     6     19.7
#> 3     8     15.1
#>
#> 3 vertical bars labelled 4, 6, 8 on the x-axis.
#> Bar heights: 26.7, 19.7, 15.1. y-axis labelled mpg_mean.
```

**Difficulty:** Intermediate

```r title="Your turn"
ex_4_1 <- # your code here
ex_4_1
```

<details>
<summary>Click to reveal solution</summary>

```r title="Solution"
ex_4_1 <- mtcars |>
  group_by(cyl) |>
  summarise(mpg_mean = mean(mpg)) |>
  ggplot(aes(x = factor(cyl), y = mpg_mean)) +
  geom_col()
ex_4_1
#> Bars of mean mpg by cylinder.
```

**Explanation:** Bar charts of group means almost always go through `geom_col()`, not `geom_bar()`, because the heights are now explicit numbers from your summary. Casting `cyl` with `factor()` keeps the axis discrete (three labelled bars) rather than treating 4, 6, 8 as continuous values, which would space the bars unevenly along a numeric axis.

</details>

### Exercise 4.2: Show the top 5 manufacturers by car count with slice_max

**Task:** A retail analyst writing a quarterly review wants only the five busiest `manufacturer` entries from `mpg` plotted as a ranked horizontal bar chart. Count rows per manufacturer, keep the top five with `slice_max()`, reorder the factor, and draw horizontal `geom_col()` bars before saving to `ex_4_2`.

**Expected result:**

```
#> # A tibble: 5 x 2
#>   manufacturer     n
#>   <chr>        <int>
#> 1 dodge           37
#> 2 toyota          34
#> 3 volkswagen      27
#> 4 ford            25
#> 5 chevrolet       19
#>
#> Horizontal bar chart with 5 bars in descending count order top to bottom.
```

**Difficulty:** Advanced

```r title="Your turn"
ex_4_2 <- # your code here
ex_4_2
```

<details>
<summary>Click to reveal solution</summary>

```r title="Solution"
ex_4_2 <- mpg |>
  count(manufacturer) |>
  slice_max(n, n = 5) |>
  mutate(manufacturer = fct_reorder(manufacturer, n)) |>
  ggplot(aes(x = n, y = manufacturer)) +
  geom_col()
ex_4_2
#> Ranked horizontal bars for the top 5 manufacturers.
```

**Explanation:** `count()` is the idiomatic shortcut for `group_by() |> summarise(n = n())`. `slice_max(n, n = 5)` keeps the top five rows ranked by `n`. The crucial step is `fct_reorder(manufacturer, n)`, which reorders the factor by `n` so the horizontal bars come out sorted from longest at the top to shortest at the bottom rather than alphabetical.

</details>

### Exercise 4.3: Overlay error bars on mean temperature bars by month

**Task:** A climatologist wants monthly mean temperatures from `airquality` plotted as `geom_col()` bars, with an error bar showing one standard error above and below each mean. Summarise mean and standard error by month, draw the bars, and add `geom_errorbar()` using the precomputed `lo` and `hi` columns, then save to `ex_4_3`.

**Expected result:**

```
#> # A tibble: 5 x 4
#>   Month  temp_mean    lo    hi
#>   <int>      <dbl> <dbl> <dbl>
#> 1     5       65.5  63.5  67.5
#> 2     6       79.1  77.4  80.7
#> 3     7       83.9  82.3  85.5
#> 4     8       84.0  82.4  85.6
#> 5     9       76.9  75.4  78.4
#>
#> 5 vertical bars (May to September) with vertical T-shaped error bars centered on each bar top.
```

**Difficulty:** Advanced

```r title="Your turn"
ex_4_3 <- # your code here
ex_4_3
```

<details>
<summary>Click to reveal solution</summary>

```r title="Solution"
temp_tbl <- airquality |>
  group_by(Month) |>
  summarise(
    temp_mean = mean(Temp),
    se        = sd(Temp) / sqrt(n()),
    lo        = temp_mean - se,
    hi        = temp_mean + se
  )

ex_4_3 <- ggplot(temp_tbl, aes(x = factor(Month), y = temp_mean)) +
  geom_col(fill = "grey70") +
  geom_errorbar(aes(ymin = lo, ymax = hi), width = 0.2)
ex_4_3
#> Mean temperature bars with one-SE error bars by month.
```

**Explanation:** Compute the interval bounds in the summary step rather than inside `aes()` so the math is visible in the data. `geom_errorbar()` needs `ymin` and `ymax`; the `width` argument controls the length of the horizontal caps. For asymmetric intervals (such as confidence intervals on log-transformed counts), compute `lo` and `hi` separately. Always cast `Month` to a factor so the x-axis stays discrete.

</details>

### Exercise 4.4: Plot within-group percentages of car class for each drive type

**Task:** A marketing analyst studying the `mpg` dataset wants, for each drivetrain `drv`, the share of cars in each `class` so the bars within a drv group sum to 100 percent. Use `count(drv, class)` then `group_by(drv)` and compute `pct = n / sum(n)`, draw dodged `geom_col()` bars with `pct` on y, and save to `ex_4_4`.

**Expected result:**

```
#> # A tibble (head shown):
#>   drv   class          n    pct
#>   <chr> <chr>      <int>  <dbl>
#> 1 4     compact       12 0.121
#> 2 4     midsize        3 0.030
#> 3 4     pickup        33 0.333
#> 4 4     subcompact     4 0.040
#> 5 4     suv           48 0.485
#>
#> Dodged bar chart: 3 drv groups (4, f, r) along the x-axis.
#> Bars within each group sum to 1.0 on the y-axis (percent_format applied).
```

**Difficulty:** Advanced

```r title="Your turn"
ex_4_4 <- # your code here
ex_4_4
```

<details>
<summary>Click to reveal solution</summary>

```r title="Solution"
ex_4_4 <- mpg |>
  count(drv, class) |>
  group_by(drv) |>
  mutate(pct = n / sum(n)) |>
  ggplot(aes(x = drv, y = pct, fill = class)) +
  geom_col(position = "dodge") +
  scale_y_continuous(labels = percent_format())
ex_4_4
#> Dodged percentage bars within each drv group.
```

**Explanation:** Computing percentages in the data step (rather than letting `position = "fill"` do it) gives you full control over the denominator, which is critical when you want within-group rather than within-bar shares. Grouping by `drv` before the mutate sets the denominator correctly. If you grouped by `class` instead the bars would represent column percentages rather than row percentages.

</details>

### Exercise 4.5: Compare counts of two groups overlaid with stat_count

**Task:** A junior analyst onboarding wants to see, on the same axes, how many of each `class` in `mpg` are 4-wheel-drive versus front-wheel-drive. Filter to those two `drv` values, then draw a dodged count bar chart with `stat = "count"` letting ggplot do the tallying, and save to `ex_4_5`.

**Expected result:**

```
#> 7 dodged bar pairs (one pair per class).
#> Each pair has a 4WD bar and an FWD bar sitting side by side.
#> SUV pair: 4WD ~48, FWD ~0; compact pair: 4WD ~12, FWD ~35.
```

**Difficulty:** Intermediate

```r title="Your turn"
ex_4_5 <- # your code here
ex_4_5
```

<details>
<summary>Click to reveal solution</summary>

```r title="Solution"
ex_4_5 <- mpg |>
  filter(drv %in% c("4", "f")) |>
  ggplot(aes(x = class, fill = drv)) +
  geom_bar(position = "dodge")
ex_4_5
#> Dodged class bars comparing 4 vs f drive types.
```

**Explanation:** `geom_bar()` with `position = "dodge"` automatically uses `stat_count`, so no manual counting is needed. Filtering to two `drv` values upstream is cleaner than coloring all three and asking the reader to mentally ignore the third. A common alternative for this pattern is `geom_col()` after `count(class, drv)` if you also want to label the bars with their values.

</details>

## Section 5. Facets, lollipops, and advanced layouts (5 problems)

### Exercise 5.1: Facet diamond cut bars by clarity to break out each segment

**Task:** A senior analyst comparing diamond inventories across clarity grades wants each clarity grade in its own panel, with the five `cut` bars repeated inside every panel. Build a `geom_bar()` count chart on `cut`, then add `facet_wrap(~ clarity, ncol = 4)`, and save the faceted chart to `ex_5_1`.

**Expected result:**

```
#> Grid of 8 panels arranged 4 columns x 2 rows, one per clarity grade (I1, SI2, SI1, VS2, VS1, VVS2, VVS1, IF).
#> Each panel contains 5 vertical bars (one per cut) with its own y-axis.
#> Strip labels at the top of every panel name the clarity grade.
```

**Difficulty:** Intermediate

```r title="Your turn"
ex_5_1 <- # your code here
ex_5_1
```

<details>
<summary>Click to reveal solution</summary>

```r title="Solution"
ex_5_1 <- ggplot(diamonds, aes(x = cut)) +
  geom_bar() +
  facet_wrap(~ clarity, ncol = 4)
ex_5_1
#> Faceted bar chart, one panel per clarity.
```

**Explanation:** `facet_wrap()` produces small multiples by wrapping panels into rows; `ncol = 4` forces four panels per row. Each panel shares the same x scale by default but can be freed with `scales = "free_y"` if the counts differ by orders of magnitude between panels. Use `facet_grid()` when you want a strict rows-and-columns split by two categorical variables.

</details>

### Exercise 5.2: Convert bars into lollipops using geom_segment and geom_point

**Task:** A reporting analyst wants the diamond cut counts drawn as lollipops (a thin stem from zero to the count, ending in a dot) instead of solid bars because lollipops carry less ink and read cleaner. Aggregate counts per cut with `count()`, then add `geom_segment()` and `geom_point()`, and save to `ex_5_2`.

**Expected result:**

```
#> 5 thin vertical stems on the x-axis (Fair, Good, Very Good, Premium, Ideal).
#> Each stem ends in a filled circle marking the count (1610, 4906, 12082, 13791, 21551).
#> No filled bar bodies.
```

**Difficulty:** Advanced

```r title="Your turn"
ex_5_2 <- # your code here
ex_5_2
```

<details>
<summary>Click to reveal solution</summary>

```r title="Solution"
ex_5_2 <- diamonds |>
  count(cut) |>
  ggplot(aes(x = cut, y = n)) +
  geom_segment(aes(xend = cut, y = 0, yend = n)) +
  geom_point(size = 3)
ex_5_2
#> Lollipop chart: thin stems from y=0 to count, dot on top.
```

**Explanation:** A lollipop is constructed manually because ggplot2 has no `geom_lollipop()`. The segment runs from (cut, 0) to (cut, n) and the point sits at (cut, n). Lollipops are a stronger choice than bars when you have many categories or when the bar fills dominate the visual budget. The same idiom flipped (segments along y, points at the tip) produces a dot plot.

</details>

### Exercise 5.3: Build a population pyramid with mirrored bars for two sexes

**Task:** A demographer wants a population pyramid: age groups on the y axis, male counts extending left of zero as negative bars, female counts extending right as positive bars. Using the inline tibble below, negate the male count, then draw two `geom_col()` layers and save to `ex_5_3`.

```r title="Run before the exercise"
pyramid_tbl <- tibble::tibble(
  age_group = factor(c("0-9","10-19","20-29","30-39","40-49","50-59","60-69","70+"),
                     levels = c("0-9","10-19","20-29","30-39","40-49","50-59","60-69","70+")),
  male      = c(82, 95, 110, 120, 105, 88, 60, 42),
  female    = c(80, 92, 108, 124, 110, 95, 75, 58)
)
```

**Expected result:**

```
#> Horizontal population pyramid.
#> y-axis: 8 age groups stacked youngest at bottom, oldest at top.
#> Male bars extend left (negative x); female bars extend right.
#> x-axis tick labels formatted as positive numbers on both sides.
```

**Difficulty:** Advanced

```r title="Your turn"
ex_5_3 <- # your code here
ex_5_3
```

<details>
<summary>Click to reveal solution</summary>

```r title="Solution"
ex_5_3 <- pyramid_tbl |>
  pivot_longer(c(male, female), names_to = "sex", values_to = "count") |>
  mutate(count = if_else(sex == "male", -count, count)) |>
  ggplot(aes(x = count, y = age_group, fill = sex)) +
  geom_col() +
  scale_x_continuous(labels = function(x) abs(x)) +
  scale_fill_manual(values = c(male = "#3b8ec2", female = "#e07b54"))
ex_5_3
#> Population pyramid with mirrored bars, absolute-valued x-axis labels.
```

**Explanation:** The pyramid trick is to feed negative values for one group so `geom_col()` draws those bars to the left of zero, then relabel the x-axis as absolute values so the reader sees the population count, not the sign. Pivoting long with `pivot_longer()` is necessary because ggplot needs sex as a single column to map to fill, not two separate columns.

</details>

### Exercise 5.4: Highlight a single selected bar against a muted gray background

**Task:** A performance reviewer presenting the `mpg` class counts wants every bar in light gray except `compact`, which should pop in a brand orange so the audience focuses there immediately. Build the count chart, map `fill` to `class == "compact"`, then assign manual colors and suppress the legend, and save to `ex_5_4`.

**Expected result:**

```
#> 7 bars (one per class).
#> 6 bars in muted gray (#cccccc).
#> The compact bar in brand orange (#e07b54).
#> No legend visible because the boolean mapping is suppressed.
```

**Difficulty:** Intermediate

```r title="Your turn"
ex_5_4 <- # your code here
ex_5_4
```

<details>
<summary>Click to reveal solution</summary>

```r title="Solution"
ex_5_4 <- ggplot(mpg, aes(x = class, fill = class == "compact")) +
  geom_bar() +
  scale_fill_manual(values = c("TRUE" = "#e07b54", "FALSE" = "#cccccc"),
                    guide  = "none")
ex_5_4
#> Compact bar highlighted; all other bars in gray.
```

**Explanation:** Mapping `fill` to a logical comparison (`class == "compact"`) yields a two-level factor that you can color via `scale_fill_manual()`. Setting `guide = "none"` suppresses the otherwise-confusing TRUE/FALSE legend. This technique scales to any "one bar matters" narrative: highlight a peer benchmark, a regulatory threshold, or a target client.

</details>

### Exercise 5.5: Overlay an overall mean reference line on grouped bars

**Task:** A QA analyst wants the mean MPG per cylinder bars from `mtcars` annotated with a dashed horizontal line at the overall mean MPG across all cars so reviewers can spot which groups sit above or below the global average. Build the bars, compute the overall mean separately, and add `geom_hline()`, saving to `ex_5_5`.

**Expected result:**

```
#> 3 vertical bars at cyl = 4, 6, 8 with heights ~26.7, ~19.7, ~15.1.
#> A dashed horizontal reference line drawn across the panel at y ~20.09 (the overall mpg mean).
#> Bars for cyl=4 sit above the line; bars for cyl=6 and 8 sit below.
```

**Difficulty:** Intermediate

```r title="Your turn"
ex_5_5 <- # your code here
ex_5_5
```

<details>
<summary>Click to reveal solution</summary>

```r title="Solution"
overall_mean <- mean(mtcars$mpg)

ex_5_5 <- mtcars |>
  group_by(cyl) |>
  summarise(mpg_mean = mean(mpg)) |>
  ggplot(aes(x = factor(cyl), y = mpg_mean)) +
  geom_col(fill = "grey60") +
  geom_hline(yintercept = overall_mean, linetype = "dashed", color = "firebrick")
ex_5_5
#> Group-mean bars with an overall-mean dashed reference line.
```

**Explanation:** Reference lines are a fast win for grouped bars because they let the reader judge each bar against a baseline without doing mental arithmetic. Computing `overall_mean` outside the ggplot pipeline keeps it visible as a number you can also print in a caption. `geom_hline()` takes a `yintercept` scalar; for category-level references use `geom_segment()` with explicit x ranges instead.

</details>

## What to do next

- Practice the parent tutorial: <a href="ggplot2-Bar-Charts.html">ggplot2 Bar Charts in R</a>.
- Drill the underlying geom: <a href="ggplot2-geom_bar-in-R.html">geom_bar() and geom_col() in R</a>.
- Layer error bars on means: <a href="ggplot2-geom_errorbar-in-R.html">geom_errorbar() in R</a>.
- Move on to other ggplot2 hubs: <a href="ggplot2-Heatmap-Exercises-in-R.html">ggplot2 Heatmap Exercises in R</a>.

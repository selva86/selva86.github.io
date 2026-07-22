---
title: "Time Series Features with feasts: Fingerprint Thousands of Series"
slug: "Time-Series-Features-in-R"
description: "Time series features in R with feasts: collapse thousands of series into one tidy table, read trend and seasonal strength, and route each series to a model."
keywords: "time series features in R, feasts package, features() R, feat_stl, trend strength, seasonal strength, tsibble features, feature extraction time series, spectral entropy, time series clustering R"
auto_link_terms: "time series features|time series features in R|feasts package|feasts|features() feasts|feat_stl|feat_acf|trend strength|seasonal strength|seasonal_strength_year|feature_set()|spectral entropy|time series feature extraction"
auto_link_case_sensitive: false
mathjax: true
webr: true
date: "2026-07-22"
curriculum_id: "TS2-2.5"
post_type: "C"
sidebar_section: "Time Series"
sidebar_title: "Time Series Features"
sidebar_order: "37"
difficulty: "Intermediate"
---

<p class="lead">A time series feature is a single number that summarises a whole series, like how strongly it trends or how seasonal it is. The feasts package computes dozens of them in one call, which turns a pile of thousands of series into one ordinary table you can sort, filter, plot and cluster. This tutorial builds that idea from scratch, and every code block on this page runs in your browser.</p>

## What is a time series feature, and why turn a whole series into one number?

The `tourism` dataset that ships with the tsibble package holds 304 separate Australian tourism series, 24,320 numbers in total. Nobody can look at 304 charts and remember what they saw. So instead of looking at the series, we are going to measure them, one row of numbers per series. That single move is what this whole page is about, and it takes one function call.

```r title="Summarise 304 series in one call"
library(tsibble)
library(feasts)
library(dplyr)
library(ggplot2)

tourism |> features(Trips, feat_stl)
#> # A tibble: 304 × 12
#>    Region         State             Purpose trend_strength seasonal_strength_year seasonal_peak_year
#>    <chr>          <chr>             <chr>            <dbl>                  <dbl>              <dbl>
#>  1 Adelaide       South Australia   Busine…          0.464                  0.407                  3
#>  2 Adelaide       South Australia   Holiday          0.554                  0.619                  1
#>  3 Adelaide       South Australia   Other            0.746                  0.202                  2
#>  4 Adelaide       South Australia   Visiti…          0.435                  0.452                  1
#>  5 Adelaide Hills South Australia   Busine…          0.464                  0.179                  3
#>  6 Adelaide Hills South Australia   Holiday          0.528                  0.296                  2
#>  7 Adelaide Hills South Australia   Other            0.593                  0.404                  2
#>  8 Adelaide Hills South Australia   Visiti…          0.488                  0.254                  0
#>  9 Alice Springs  Northern Territo… Busine…          0.534                  0.251                  0
#> 10 Alice Springs  Northern Territo… Holiday          0.381                  0.832                  3
#> # ℹ 294 more rows
#> # ℹ 6 more variables: seasonal_trough_year <dbl>, spikiness <dbl>, linearity <dbl>,
#> #   curvature <dbl>, stl_e_acf1 <dbl>, stl_e_acf10 <dbl>
```
Here is what those lines did. `tourism` is the dataset, `Trips` is the column being measured, and `feat_stl` is a recipe that says which numbers to compute. The `features()` function walked through all 304 series, applied the recipe to each one, and stacked the answers into a table. The pipe `|>` just passes the thing on its left into the function on its right.

Read the shape of the result and the whole idea clicks. Going in: 24,320 rows of quarterly observations. Coming out: 304 rows, exactly one per series, with 9 measurements each. The `Region`, `State` and `Purpose` columns are still there so you always know which row describes which series.

![Diagram showing 304 time series collapsing into 304 rows of features](screenshots/Time-Series-Features-in-R-flattening.webp)

*Figure 1: features() collapses every series into a single row, turning a time series problem into an ordinary table problem.*

That output table is the point of the whole exercise. It is a plain data frame, and everything the rest of this page does is built on that one fact.

`feat_stl` is not special. `features()` will run any summary function you hand it, including ones you already know.

```r title="Use any summary function as a feature"
tourism |> features(Trips, list(avg = mean, spread = sd))
#> # A tibble: 304 × 5
#>    Region         State              Purpose     avg spread
#>    <chr>          <chr>              <chr>     <dbl>  <dbl>
#>  1 Adelaide       South Australia    Business 156.    35.6
#>  2 Adelaide       South Australia    Holiday  157.    27.1
#>  3 Adelaide       South Australia    Other     56.6   17.3
#>  4 Adelaide       South Australia    Visiting 205.    32.5
#>  5 Adelaide Hills South Australia    Business   2.66   4.30
#>  6 Adelaide Hills South Australia    Holiday   10.5    6.37
#>  7 Adelaide Hills South Australia    Other      1.40   1.65
#>  8 Adelaide Hills South Australia    Visiting  14.2   10.7
#>  9 Alice Springs  Northern Territory Business  14.6    7.20
#> 10 Alice Springs  Northern Territory Holiday   31.9   18.1
#> # ℹ 294 more rows
```
The `list()` wrapper names the outputs. `avg = mean` means "run `mean()` on each series and call the resulting column `avg`". You get one column per named function, and the column names are yours to choose.

A feature function does not have to return a single number either. If it returns several values, you get several columns.

```r title="One function can produce many columns"
tourism |> features(Trips, quantile)
#> # A tibble: 304 × 8
#>    Region         State              Purpose     `0%`  `25%`   `50%`  `75%` `100%`
#>    <chr>          <chr>              <chr>      <dbl>  <dbl>   <dbl>  <dbl>  <dbl>
#>  1 Adelaide       South Australia    Business  68.7   134.   153.    177.   242.
#>  2 Adelaide       South Australia    Holiday  108.    135.   154.    172.   224.
#>  3 Adelaide       South Australia    Other     25.9    43.9   53.8    62.5  107.
#>  4 Adelaide       South Australia    Visiting 137.    179.   206.    229.   270.
#>  5 Adelaide Hills South Australia    Business   0       0      1.26    3.92  28.6
#>  6 Adelaide Hills South Australia    Holiday    0       5.77   8.52   14.1   35.8
#>  7 Adelaide Hills South Australia    Other      0       0      0.908   2.09   8.95
#>  8 Adelaide Hills South Australia    Visiting   0.778   8.91  12.2    16.8   81.1
#>  9 Alice Springs  Northern Territory Business   1.01    9.13  13.3    18.5   34.1
#> 10 Alice Springs  Northern Territory Holiday    2.81   16.9   31.5    44.8   76.5
#> # ℹ 294 more rows
```
`quantile()` returns five numbers (the minimum, the three quartiles and the maximum), so `features()` created five columns and named them after the percentages. This is exactly how the built-in recipes like `feat_stl` work under the hood: they are just functions that return several named numbers at once.

[KEY INSIGHT]
**A feature table converts a time series problem into an ordinary table problem.** Once each series is one row, ranking series, filtering them, grouping them by behaviour and spotting the strange ones are all things you already know how to do with dplyr.

**Try it:** Compute the median number of trips for every series and call the resulting column `ex_median`. Show the first 5 rows.

```r title="Your turn: median trips per series"
# This recipe computes the mean. Change it to compute the median instead.
tourism |>
  features(Trips, list(ex_median = mean)) |>
  head(5)
#> # A tibble: 5 × 4
#>   Region         State           Purpose  ex_median
#>   <chr>          <chr>           <chr>        <dbl>
#> 1 Adelaide       South Australia Business    156.
#> 2 Adelaide       South Australia Holiday     157.
#> 3 Adelaide       South Australia Other        56.6
#> 4 Adelaide       South Australia Visiting    205.
#> 5 Adelaide Hills South Australia Business      2.66
```
<details>
<summary>Click to reveal solution</summary>

```r title="Median trips per series solution"
tourism |>
  features(Trips, list(ex_median = median)) |>
  head(5)
#> # A tibble: 5 × 4
#>   Region         State           Purpose  ex_median
#>   <chr>          <chr>           <chr>        <dbl>
#> 1 Adelaide       South Australia Business    153.
#> 2 Adelaide       South Australia Holiday     154.
#> 3 Adelaide       South Australia Other        53.8
#> 4 Adelaide       South Australia Visiting    206.
#> 5 Adelaide Hills South Australia Business      1.26
```
**Explanation:** Any function that takes a numeric vector and returns a number works as a feature. `median` needs no special treatment.

</details>

## How does features() know where one series ends and the next begins?

The last section quietly assumed something big: that R knows the 24,320 rows of `tourism` are 304 separate series rather than one long one. That knowledge does not come from `features()`. It comes from the data structure the rows live in, called a tsibble.

A tsibble is a data frame with two extra pieces of information attached. The **index** is the column holding time. The **key** is the set of columns that identify which series a row belongs to. Print a tsibble and both are written in the header.

```r title="Print the tsibble and read its header"
tourism
#> # A tsibble: 24,320 x 5 [1Q]
#> # Key:       Region, State, Purpose [304]
#>    Quarter Region   State           Purpose  Trips
#>      <qtr> <chr>    <chr>           <chr>    <dbl>
#>  1 1998 Q1 Adelaide South Australia Business  135.
#>  2 1998 Q2 Adelaide South Australia Business  110.
#>  3 1998 Q3 Adelaide South Australia Business  166.
#>  4 1998 Q4 Adelaide South Australia Business  127.
#>  5 1999 Q1 Adelaide South Australia Business  137.
#>  6 1999 Q2 Adelaide South Australia Business  200.
#>  7 1999 Q3 Adelaide South Australia Business  169.
#>  8 1999 Q4 Adelaide South Australia Business  134.
#>  9 2000 Q1 Adelaide South Australia Business  154.
#> 10 2000 Q2 Adelaide South Australia Business  169.
#> # ℹ 24,310 more rows
```
Two lines of that header carry all the meaning. `[1Q]` says the index column steps forward one quarter at a time, so the time spacing is quarterly. `Key: Region, State, Purpose [304]` says a series is defined by a unique combination of those three columns, and there are 304 such combinations in the data.

So "Adelaide, South Australia, Business" is one series of 80 quarters. "Adelaide, South Australia, Holiday" is a different series of 80 quarters. When `features()` runs, it splits on the key, applies your recipe to each group's `Trips` values, and returns one row per group. The count in the header is the number of rows you will get back.

You can ask for that count directly rather than reading it off the print output.

```r title="Count the series in a tsibble"
n_keys(tourism)
#> [1] 304
```
Most of your own data will not arrive as a tsibble, so you build one. `as_tsibble()` takes a normal data frame and tells it which column is time and which columns identify a series.

```r title="Build a tsibble from a plain data frame"
visits <- data.frame(
  month = rep(yearmonth("2023 Jan") + 0:11, 2),
  shop  = rep(c("north", "south"), each = 12),
  sales = c(100:111, 200:211)
)

visits_ts <- visits |> as_tsibble(index = month, key = shop)
visits_ts
#> # A tsibble: 24 x 3 [1M]
#> # Key:       shop [2]
#>       month shop  sales
#>       <mth> <chr> <int>
#>  1 2023 Jan north   100
#>  2 2023 Feb north   101
#>  3 2023 Mar north   102
#>  4 2023 Apr north   103
#>  5 2023 May north   104
#>  6 2023 Jun north   105
#>  7 2023 Jul north   106
#>  8 2023 Aug north   107
#>  9 2023 Sep north   108
#> 10 2023 Oct north   109
#> # ℹ 14 more rows
```
`yearmonth("2023 Jan") + 0:11` generates twelve consecutive months, and `rep(..., 2)` repeats them so both shops have the same calendar. `index = month` names the time column and `key = shop` says each shop is its own series. The header confirms it: `[1M]` for monthly spacing, and `shop [2]` for two series.

Now `features()` will treat those two shops separately without being told anything extra.

```r title="Run features on your own tsibble"
visits_ts |> features(sales, list(ex_avg = mean))
#> # A tibble: 2 × 2
#>   shop  ex_avg
#>   <chr>  <dbl>
#> 1 north   106.
#> 2 south   206.
```
Two rows out, one per shop, exactly as the key promised. Had you left `key = shop` off, `as_tsibble()` would have complained that the month values are duplicated, because without a key it expects one row per time point.

[WARNING]
**Getting the key wrong silently changes what a series means.** If you set the key to fewer columns than you should, unrelated series get merged and every feature you compute describes a blend of them. Always check the count in brackets after the key in the header matches the number of series you expect.

**Try it:** Build a tsibble from the data frame below, using `week` as the index and `store` as the key, then compute each store's average `units` in a column called `ex_avg`.

```r title="Your turn: build a weekly tsibble"
ex_sales <- data.frame(
  week  = rep(as.Date("2024-01-01") + 7 * 0:9, 2),
  store = rep(c("a", "b"), each = 10),
  units = c(10:19, 50:41)
)

# Your turn: convert ex_sales to a tsibble, then compute each store's mean units
head(ex_sales, 3)
#>         week store units
#> 1 2024-01-01     a    10
#> 2 2024-01-08     a    11
#> 3 2024-01-15     a    12
```
<details>
<summary>Click to reveal solution</summary>

```r title="Weekly tsibble solution"
ex_sales <- data.frame(
  week  = rep(as.Date("2024-01-01") + 7 * 0:9, 2),
  store = rep(c("a", "b"), each = 10),
  units = c(10:19, 50:41)
)

ex_ts <- ex_sales |> as_tsibble(index = week, key = store)
ex_ts |> features(units, list(ex_avg = mean))
#> # A tibble: 2 × 2
#>   store ex_avg
#>   <chr>  <dbl>
#> 1 a       14.5
#> 2 b       45.5
```
**Explanation:** The index and key are passed as bare column names, not strings. Store "b" counts down from 50 to 41, so its mean is 45.5.

</details>

## What do trend strength and seasonal strength actually measure?

`feat_stl` gave us `trend_strength` and `seasonal_strength_year` back in the first section without explaining them. Both are built on a technique called STL decomposition, short for seasonal and trend decomposition using loess, loess being the smoothing method it uses internally. Let's see that technique first on a single series before returning to the numbers.

The idea behind decomposition is that most series are three things added together. There is a slow underlying drift called the **trend**. There is a repeating within-year pattern called the **season**. And there is whatever is left over, called the **remainder**. STL is an algorithm that estimates those three parts from the observed series.

Start by pulling out one series and looking at it. `filter()` works on a tsibble the same way it works on any data frame.

```r title="Plot a single tourism series"
snowy <- tourism |>
  filter(Region == "Snowy Mountains", Purpose == "Holiday")

ggplot(snowy, aes(x = Quarter, y = Trips)) +
  geom_line() +
  labs(title = "Snowy Mountains holiday trips", y = "Trips (thousands)")
```
The Snowy Mountains are Australia's ski fields, and the chart shows it: a tall spike every winter with quiet quarters either side, repeating for twenty years. That is about as seasonal as a real series gets.

Now let STL split it into its three parts. `model(STL(Trips))` runs the decomposition and `components()` returns the pieces as columns.

```r title="Split the series into trend, season and remainder"
snowy_parts <- snowy |>
  model(STL(Trips)) |>
  components()

snowy_parts
#> # A dable: 80 x 10 [1Q]
#> # Key:     Region, State, Purpose, .model [1]
#> # :        Trips = trend + season_year + remainder
#>    Region          State      Purpose .model Quarter Trips trend season_year remainder season_adjust
#>    <chr>           <chr>      <chr>   <chr>    <qtr> <dbl> <dbl>       <dbl>     <dbl>         <dbl>
#>  1 Snowy Mountains New South… Holiday STL(T… 1998 Q1 101.   144.       -33.6    -9.28           135.
#>  2 Snowy Mountains New South… Holiday STL(T… 1998 Q2 112.   149.       -33.6    -3.15           146.
#>  3 Snowy Mountains New South… Holiday STL(T… 1998 Q3 310.   153.       132.     25.8            179.
#>  4 Snowy Mountains New South… Holiday STL(T… 1998 Q4  89.8  156.       -64.5    -1.40           154.
#>  5 Snowy Mountains New South… Holiday STL(T… 1999 Q1 112.   147.       -33.2    -0.912          146.
#>  6 Snowy Mountains New South… Holiday STL(T… 1999 Q2 103.   137.       -34.0    -0.658          137.
#>  7 Snowy Mountains New South… Holiday STL(T… 1999 Q3 254.   135.       131.    -13.1            122.
#>  8 Snowy Mountains New South… Holiday STL(T… 1999 Q4  74.9  138.       -64.3     0.744          139.
#>  9 Snowy Mountains New South… Holiday STL(T… 2000 Q1 118.   145.       -32.9     5.72           150.
#> 10 Snowy Mountains New South… Holiday STL(T… 2000 Q2 114.   149.       -34.3    -0.446          148.
#> # ℹ 70 more rows
```
What came back is a dable, short for decomposition table. It is a tsibble with the three estimated parts added as columns and one extra header line, and that third header line spells out the arithmetic: `Trips = trend + season_year + remainder`. Look at row 3, the winter quarter of 1998. Trips were 310, the trend at that moment was 153, the seasonal effect added 132 on top, and the remainder of 25.8 covers the rest. Add the three and you get back the observed 310.

Two things stand out in that table. The `season_year` values are enormous, swinging from about -65 to +132. The `remainder` values are tiny by comparison, mostly single digits. That imbalance is the whole story of this series, and it is exactly what the strength numbers are going to put a figure on.

Seeing all three parts drawn separately makes the imbalance obvious.

```r title="Draw the three components separately"
library(tidyr)

parts_long <- snowy_parts |>
  as_tibble() |>
  select(Quarter, trend, season_year, remainder) |>
  pivot_longer(-Quarter, names_to = "part", values_to = "value")

ggplot(parts_long, aes(x = Quarter, y = value)) +
  geom_line() +
  facet_wrap(~part, ncol = 1, scales = "free_y") +
  labs(title = "STL decomposition of Snowy Mountains holiday trips")
```
`as_tibble()` drops the tsibble machinery so the data behaves like a plain table, `select()` keeps the time column plus the three parts, and `pivot_longer()` stacks those three columns into one long column with a `part` label, which is the shape `facet_wrap()` needs to draw one panel per part. Note `scales = "free_y"`, which lets each panel use its own vertical scale. Without it the remainder panel would be a flat line squashed against the axis.

### Turning the decomposition into a number

Now the definition. **Seasonal strength** asks: of the wiggle that the seasonal part and the remainder create together, how much of it is the season? If the season explains nearly all of it, strength is close to 1. If the season is drowned out by noise, strength is close to 0.

"Amount of wiggle" is measured with variance, which is the average squared distance of values from their own mean. Bigger swings mean bigger variance. So the definition becomes a ratio of variances:

$$F_S = \max\left(0,\; 1 - \frac{\operatorname{Var}(R_t)}{\operatorname{Var}(S_t + R_t)}\right)$$

Where:

- $F_S$ = seasonal strength, reported as `seasonal_strength_year`
- $S_t$ = the seasonal component at time $t$
- $R_t$ = the remainder at time $t$
- $\operatorname{Var}$ = the variance of a set of numbers

Read the fraction as "the share of the seasonal-plus-noise wiggle that is only noise". Subtracting it from 1 leaves the share that is genuinely seasonal. The `max(0, ...)` just stops the result dipping below zero when the season adds nothing at all.

Trend strength is the same idea with the trend in place of the season:

$$F_T = \max\left(0,\; 1 - \frac{\operatorname{Var}(R_t)}{\operatorname{Var}(T_t + R_t)}\right)$$

Where $T_t$ is the trend component at time $t$ and the other symbols mean what they did above.

You do not have to take the formulas on faith. The components are sitting in `snowy_parts`, so compute both numbers by hand and compare them to what `feat_stl` reported.

```r title="Reproduce the strength numbers by hand"
r <- snowy_parts$remainder
s <- snowy_parts$season_year
t <- snowy_parts$trend

c(
  seasonal_strength = max(0, 1 - var(r) / var(s + r)),
  trend_strength    = max(0, 1 - var(r) / var(t + r))
)
#> seasonal_strength    trend_strength
#>         0.9674524         0.5946509
```
The `$` operator pulls a single column out as a plain numeric vector, so `r`, `s` and `t` are just lists of 80 numbers. Then the two lines are the formulas typed out literally, and `c()` bundles the results into a named vector so both print together.

Those are the same 0.967 and 0.595 that `feat_stl` produced for this series in the very first code block. The features are not a black box. They are short arithmetic recipes run over the decomposition.

Now the numbers mean something concrete. 0.967 says the winter spike accounts for about 97 percent of the non-trend wiggle, which is why the ski season is visible from across the room. 0.595 says the slow drift is real but far less dominant, which matches a trend line that wanders rather than climbing steadily.

[KEY INSIGHT]
**Strength is a share of variance, not a slope.** A series can have high trend strength while barely moving, as long as the movement it does have is smooth rather than noisy. Strength answers "how cleanly is this pattern visible", not "how big is it".

### Ranking every series by seasonality

The payoff of one-number-per-series is that ranking is now trivial. Sort the feature table by seasonal strength and the most seasonal series in the country is the first row.

```r title="Find the most seasonal series"
stl_feats <- tourism |> features(Trips, feat_stl)

stl_feats |>
  select(Region, Purpose, trend_strength, seasonal_strength_year) |>
  arrange(desc(seasonal_strength_year)) |>
  head(6)
#> # A tibble: 6 × 4
#>   Region           Purpose trend_strength seasonal_strength_year
#>   <chr>            <chr>            <dbl>                  <dbl>
#> 1 Snowy Mountains  Holiday          0.595                  0.967
#> 2 Great Ocean Road Holiday          0.542                  0.956
#> 3 South Coast      Holiday          0.526                  0.952
#> 4 Peninsula        Holiday          0.684                  0.928
#> 5 Phillip Island   Holiday          0.437                  0.907
#> 6 Central Coast    Holiday          0.524                  0.903
```
`arrange(desc(...))` sorts largest first and `head(6)` keeps the top of the list. Nothing here is time series specific, it is the same dplyr you would use on a table of customers.

The result reads like a map of Australian tourism. Every single one of the top six is a `Holiday` series, and every one is a beach or a mountain. Nobody visits the ski fields in summer or the surf coast in winter, so those series are dominated by their calendar. You did not have to know any of that in advance. The features found it.

Flip the sort to see the other end of the scale.

```r title="Find the least seasonal series"
stl_feats |>
  select(Region, Purpose, trend_strength, seasonal_strength_year) |>
  arrange(seasonal_strength_year) |>
  head(6)
#> # A tibble: 6 × 4
#>   Region                     Purpose  trend_strength seasonal_strength_year
#>   <chr>                      <chr>             <dbl>                  <dbl>
#> 1 Goulburn                   Other             0.326                 0.0543
#> 2 Melbourne East             Other             0.464                 0.0548
#> 3 Outback                    Other             0.454                 0.111
#> 4 Australia's Golden Outback Visiting          0.491                 0.112
#> 5 Great Ocean Road           Other             0.461                 0.124
#> 6 Australia's South West     Other             0.576                 0.124
```
At the bottom the pattern reverses: mostly `Other` trips to inland regions, with seasonal strength near 0.05. Travel for reasons like business relocation or medical appointments does not care what month it is, so there is no calendar signal to find. Practically, a seasonal forecasting model would be wasted effort on these six.

`feat_stl` returns two more seasonal columns that are easy to misread, so let's look at them directly.

```r title="Check when each season peaks and troughs"
stl_feats |>
  select(Region, Purpose, seasonal_peak_year, seasonal_trough_year) |>
  head(6)
#> # A tibble: 6 × 4
#>   Region         Purpose  seasonal_peak_year seasonal_trough_year
#>   <chr>          <chr>                 <dbl>                <dbl>
#> 1 Adelaide       Business                  3                    1
#> 2 Adelaide       Holiday                   1                    2
#> 3 Adelaide       Other                     2                    1
#> 4 Adelaide       Visiting                  1                    3
#> 5 Adelaide Hills Business                  3                    0
#> 6 Adelaide Hills Holiday                   2                    1
```
These say which quarter the seasonal component is largest in and which quarter it is smallest in. The counting starts at 0, so 0 means Q1, 1 means Q2, 2 means Q3 and 3 means Q4. Adelaide business travel peaks at 3, which is Q4, and bottoms out at 1, which is Q2. Adelaide holidays run the opposite way, peaking in Q2.

[NOTE]
**The peak and trough columns are zero-indexed positions, not quarter numbers.** On monthly data the same two columns run from 0 to 11 for January through December. Add 1 before showing either number to anyone who has not read the documentation.

Here is the full set of columns `feat_stl` returns, in plain language.

| Column | What it measures |
|---|---|
| `trend_strength` | Share of trend-plus-noise variation explained by the trend, 0 to 1 |
| `seasonal_strength_year` | Share of season-plus-noise variation explained by the season, 0 to 1 |
| `seasonal_peak_year` | Which season position the seasonal effect is highest in, counting from 0 |
| `seasonal_trough_year` | Which season position the seasonal effect is lowest in, counting from 0 |
| `spikiness` | How much the remainder is dominated by a few extreme points |
| `linearity` | Slope of a straight line fitted to the trend, so overall direction and steepness |
| `curvature` | How much the trend bends, positive for a U shape, negative for an arch |
| `stl_e_acf1` | Correlation of the remainder with itself one step back, leftover structure the model missed |
| `stl_e_acf10` | Sum of the first ten squared remainder autocorrelations, the same check over a longer window |

The last two are quality checks on the decomposition itself. If the remainder is genuinely random noise, both should sit near zero. Large values mean predictable structure is still hiding in the leftovers.

**Try it:** Find the 5 series with the *lowest* `trend_strength`, showing `Region`, `Purpose` and `trend_strength`.

```r title="Your turn: find the flattest series"
# This sorts largest first. Make it sort smallest first instead.
tourism |>
  features(Trips, feat_stl) |>
  select(Region, Purpose, trend_strength) |>
  arrange(desc(trend_strength)) |>
  head(5)
#> # A tibble: 5 × 3
#>   Region                 Purpose  trend_strength
#>   <chr>                  <chr>             <dbl>
#> 1 Australia's North West Business          0.934
#> 2 Melbourne              Holiday           0.864
#> 3 Australia's South West Holiday           0.848
#> 4 Melbourne              Other             0.826
#> 5 Experience Perth       Visiting          0.799
```
<details>
<summary>Click to reveal solution</summary>

```r title="Flattest series solution"
tourism |>
  features(Trips, feat_stl) |>
  select(Region, Purpose, trend_strength) |>
  arrange(trend_strength) |>
  head(5)
#> # A tibble: 5 × 3
#>   Region       Purpose  trend_strength
#>   <chr>        <chr>             <dbl>
#> 1 East Coast   Other             0.157
#> 2 Murray East  Business          0.229
#> 3 Outback NSW  Holiday           0.231
#> 4 High Country Other             0.250
#> 5 Murraylands  Business          0.257
```
**Explanation:** `arrange()` sorts ascending by default, so no `desc()` is needed. These five series are essentially noise around a flat level.

</details>

## What do the ACF features say about a series' memory?

Trend and season describe a series' shape. The next family describes its **memory**: how much today's value tells you about tomorrow's.

The tool for that is autocorrelation. Take the series, make a copy, slide the copy forward by some number of steps, and measure how well the two line up. That number of steps is called the **lag**, and the correlation you get is the autocorrelation at that lag. Do it for lag 1, lag 2, lag 3 and so on and you get the autocorrelation function, or ACF.

Run it on the ski series, where you can predict the answer before you see it.

```r title="Compute the ACF of one series"
snowy_acf <- snowy |> ACF(Trips, lag_max = 8)
snowy_acf
#> # A tsibble: 8 x 5 [1Q]
#> # Key:       Region, State, Purpose [1]
#>   Region          State           Purpose      lag     acf
#>   <chr>           <chr>           <chr>   <cf_lag>   <dbl>
#> 1 Snowy Mountains New South Wales Holiday       1Q -0.382
#> 2 Snowy Mountains New South Wales Holiday       2Q -0.0691
#> 3 Snowy Mountains New South Wales Holiday       3Q -0.370
#> 4 Snowy Mountains New South Wales Holiday       4Q  0.869
#> 5 Snowy Mountains New South Wales Holiday       5Q -0.368
#> 6 Snowy Mountains New South Wales Holiday       6Q -0.0618
#> 7 Snowy Mountains New South Wales Holiday       7Q -0.344
#> 8 Snowy Mountains New South Wales Holiday       8Q  0.789
```
`ACF()` computes the correlation at each lag and `lag_max = 8` stops after eight. Each row is one lag: `1Q` means shifted by one quarter, `4Q` by four quarters, and so on.

Read down the `acf` column and the ski season shows up directly. Lags 1, 2 and 3 are negative, because a busy winter quarter is followed by three quiet ones. Lag 4 rises to 0.869, because four quarters later it is winter again. Lag 8 is 0.789, two years on and still winter. So a value from four quarters back predicts today's value far better than the value from one quarter back does.

The same numbers are easier to take in as a chart.

```r title="Plot the autocorrelation by lag"
snowy_acf |>
  as_tibble() |>
  ggplot(aes(x = as.numeric(lag), y = acf)) +
  geom_col(width = 0.15) +
  geom_hline(yintercept = 0) +
  labs(x = "Lag (quarters)", y = "Autocorrelation",
       title = "Snowy Mountains holiday trips: ACF")
```
The spikes at lag 4 and lag 8 tower over everything else, which is the visual signature of yearly seasonality in quarterly data. `as.numeric(lag)` converts the special lag class into ordinary numbers so ggplot can put them on a continuous axis.

`feat_acf` boils that whole picture down into seven numbers, for every series at once.

```r title="Compute ACF features for all series"
acf_feats <- tourism |> features(Trips, feat_acf)
acf_feats
#> # A tibble: 304 × 10
#>    Region     State Purpose     acf1 acf10 diff1_acf1 diff1_acf10 diff2_acf1 diff2_acf10 season_acf1
#>    <chr>      <chr> <chr>      <dbl> <dbl>      <dbl>       <dbl>      <dbl>       <dbl>       <dbl>
#>  1 Adelaide   Sout… Busine…  0.0333  0.131     -0.520       0.463     -0.676       0.741      0.201
#>  2 Adelaide   Sout… Holiday  0.0456  0.372     -0.343       0.614     -0.487       0.558      0.351
#>  3 Adelaide   Sout… Other    0.517   1.15      -0.409       0.383     -0.675       0.792      0.342
#>  4 Adelaide   Sout… Visiti…  0.0684  0.294     -0.394       0.452     -0.518       0.447      0.345
#>  5 Adelaide … Sout… Busine…  0.0709  0.134     -0.580       0.415     -0.750       0.746     -0.0628
#>  6 Adelaide … Sout… Holiday  0.131   0.313     -0.536       0.500     -0.716       0.906      0.208
#>  7 Adelaide … Sout… Other    0.261   0.330     -0.253       0.317     -0.457       0.392      0.0745
#>  8 Adelaide … Sout… Visiti…  0.139   0.117     -0.472       0.239     -0.626       0.408      0.170
#>  9 Alice Spr… Nort… Busine…  0.217   0.367     -0.500       0.381     -0.658       0.587      0.315
#> 10 Alice Spr… Nort… Holiday -0.00660 2.11      -0.153       2.11      -0.274       1.55       0.729
#> # ℹ 294 more rows
```
Here is what each of the seven means.

| Column | What it measures |
|---|---|
| `acf1` | Autocorrelation at lag 1, how much one period predicts the next |
| `acf10` | Sum of the first ten squared autocorrelations, total memory across all short lags |
| `diff1_acf1` | Same as `acf1` but after differencing once, so after removing the trend |
| `diff1_acf10` | Same as `acf10` after differencing once |
| `diff2_acf1` | `acf1` after differencing twice, for series with a bending trend |
| `diff2_acf10` | `acf10` after differencing twice |
| `season_acf1` | Autocorrelation at the seasonal lag, 4 for quarterly data and 12 for monthly |

Differencing means replacing each value with the change from the previous value. It strips out level and trend and leaves the wiggle, so the `diff1_` and `diff2_` columns describe a series' memory once its drift has been removed. That matters because ARIMA models work on differenced data, so those columns speak directly to how an ARIMA would see the series.

[TIP]
**season_acf1 is the fastest seasonality detector in the package.** It is a single correlation at the seasonal lag, so it costs almost nothing to compute compared with running a full STL decomposition, and it agrees with seasonal strength on the strongly seasonal cases.

Sorting by it confirms that agreement.

```r title="Rank series by seasonal autocorrelation"
acf_feats |>
  select(Region, Purpose, acf1, season_acf1) |>
  arrange(desc(season_acf1)) |>
  head(5)
#> # A tibble: 5 × 4
#>   Region           Purpose    acf1 season_acf1
#>   <chr>            <chr>     <dbl>       <dbl>
#> 1 Snowy Mountains  Holiday -0.382        0.869
#> 2 South Coast      Holiday -0.0443       0.861
#> 3 Great Ocean Road Holiday -0.105        0.847
#> 4 Central Coast    Holiday -0.0343       0.791
#> 5 Darwin           Holiday -0.0271       0.789
```
Four of these five also appeared in the seasonal strength ranking, reached by completely different arithmetic. The `acf1` column shows the flip side: strongly seasonal series have *negative* lag-1 correlation, because a peak quarter is reliably followed by a quiet one.

**Try it:** Find the 5 series with the most negative `acf1`, showing `Region`, `Purpose` and `acf1`.

```r title="Your turn: find the strongest reversals"
# This gives the largest acf1 values. You want the most negative ones.
tourism |>
  features(Trips, feat_acf) |>
  select(Region, Purpose, acf1) |>
  arrange(desc(acf1)) |>
  head(5)
#> # A tibble: 5 × 3
#>   Region                 Purpose   acf1
#>   <chr>                  <chr>    <dbl>
#> 1 Australia's North West Business 0.840
#> 2 Melbourne              Other    0.674
#> 3 Melbourne              Holiday  0.664
#> 4 Brisbane               Visiting 0.608
#> 5 Melbourne East         Visiting 0.595
```
<details>
<summary>Click to reveal solution</summary>

```r title="Strongest reversals solution"
tourism |>
  features(Trips, feat_acf) |>
  select(Region, Purpose, acf1) |>
  arrange(acf1) |>
  head(5)
#> # A tibble: 5 × 3
#>   Region          Purpose   acf1
#>   <chr>           <chr>    <dbl>
#> 1 Snowy Mountains Holiday -0.382
#> 2 East Coast      Other   -0.298
#> 3 Barossa         Holiday -0.235
#> 4 High Country    Other   -0.164
#> 5 Murraylands     Other   -0.151
```
**Explanation:** "Most negative" means ascending order, so plain `arrange()` is right. A negative `acf1` means high quarters are followed by low ones.

</details>

## What is inside the full 48-feature fingerprint?

So far we have used two of the package's built-in recipes, `feat_stl` and `feat_acf`. feasts ships many more, and `feature_set()` grabs all of them at once. This is the fingerprint the title of this page promises.

```r title="Compute all 48 features at once"
all_feats <- tourism |> features(Trips, feature_set(pkgs = "feasts"))
dim(all_feats)
#> [1] 304  51
```
`feature_set(pkgs = "feasts")` collects every feature function the package registers. `dim()` reports rows then columns: 304 rows as always, and 51 columns, which is the 3 key columns plus 48 features. Every series in the dataset now has a 48-number fingerprint.

```r title="List every feature name"
setdiff(names(all_feats), c("Region", "State", "Purpose"))
#>  [1] "trend_strength"         "seasonal_strength_year" "seasonal_peak_year"
#>  [4] "seasonal_trough_year"   "spikiness"              "linearity"
#>  [7] "curvature"              "stl_e_acf1"             "stl_e_acf10"
#> [10] "acf1"                   "acf10"                  "diff1_acf1"
#> [13] "diff1_acf10"            "diff2_acf1"             "diff2_acf10"
#> [16] "season_acf1"            "pacf5"                  "diff1_pacf5"
#> [19] "diff2_pacf5"            "season_pacf"            "zero_run_mean"
#> [22] "nonzero_squared_cv"     "zero_start_prop"        "zero_end_prop"
#> [25] "lambda_guerrero"        "kpss_stat"              "kpss_pvalue"
#> [28] "pp_stat"                "pp_pvalue"              "ndiffs"
#> [31] "nsdiffs"                "bp_stat"                "bp_pvalue"
#> [34] "lb_stat"                "lb_pvalue"              "var_tiled_var"
#> [37] "var_tiled_mean"         "shift_level_max"        "shift_level_index"
#> [40] "shift_var_max"          "shift_var_index"        "shift_kl_max"
#> [43] "shift_kl_index"         "spectral_entropy"       "n_crossing_points"
#> [46] "longest_flat_spot"      "coef_hurst"             "stat_arch_lm"
```
`setdiff()` removes the three key columns from the name list so only the features remain. Forty-eight names is a lot to face at once, but they are not forty-eight unrelated ideas. They fall into six families, and once you know the families you can find what you need.

![Diagram grouping the 48 feasts features into six families](screenshots/Time-Series-Features-in-R-feature-families.webp)

*Figure 2: The 48 feasts features group into six families, each answering a different question about a series.*

| Family | Question it answers | Headline columns |
|---|---|---|
| Shape | Does it trend? Does it repeat? Is it spiky? | `trend_strength`, `seasonal_strength_year`, `spikiness`, `curvature` |
| Memory | How much does the past predict the future? | `acf1`, `acf10`, `season_acf1`, `pacf5` |
| Stationarity | Do I need to difference it before modelling? | `kpss_stat`, `pp_stat`, `ndiffs`, `nsdiffs`, `lambda_guerrero` |
| Stability | Does its level or spread jump partway through? | `shift_level_max`, `shift_var_max`, `var_tiled_var` |
| Randomness | Is there any signal here at all? | `spectral_entropy`, `coef_hurst`, `lb_pvalue`, `stat_arch_lm` |
| Sparsity | Is it full of zeros or flat stretches? | `zero_run_mean`, `zero_start_prop`, `longest_flat_spot` |

One name in that table has not come up yet. `pacf5` and `season_pacf` come from the partial autocorrelation function, which is the ACF with the indirect effects taken out: the partial autocorrelation at lag 3 measures what lag 3 tells you beyond what lags 1 and 2 already told you. `pacf5` adds up the first five squared partial autocorrelations, and `season_pacf` reports the one at the seasonal lag.

Two of these families deserve a closer look, because they answer questions you will actually ask on the job.

### How forecastable is each series?

`spectral_entropy` scores how close a series is to pure random noise, on a scale from 0 to 1. Low means there is strong structure to lock onto. High means there is nothing but noise, and no model will beat a simple average.

```r title="Find the most predictable series"
all_feats |>
  select(Region, Purpose, spectral_entropy) |>
  arrange(spectral_entropy) |>
  head(5)
#> # A tibble: 5 × 3
#>   Region                          Purpose spectral_entropy
#>   <chr>                           <chr>              <dbl>
#> 1 South Coast                     Holiday            0.209
#> 2 Launceston, Tamar and the North Holiday            0.271
#> 3 Hobart and the South            Holiday            0.281
#> 4 North West                      Holiday            0.281
#> 5 Great Ocean Road                Holiday            0.289
```
Every one of these five is a `Holiday` series, and two of them, South Coast and Great Ocean Road, also appeared in the seasonal strength ranking earlier. Strong seasonality is strong structure, so the beach and mountain holiday series score lowest on entropy and are the easiest in the dataset to forecast.

```r title="Find the least predictable series"
all_feats |>
  select(Region, Purpose, spectral_entropy) |>
  arrange(desc(spectral_entropy)) |>
  head(5)
#> # A tibble: 5 × 3
#>   Region                     Purpose  spectral_entropy
#>   <chr>                      <chr>               <dbl>
#> 1 Adelaide Hills             Visiting                1
#> 2 Alice Springs              Other                   1
#> 3 Alice Springs              Visiting                1
#> 4 Australia's Golden Outback Other                   1
#> 5 Australia's North West     Other                   1
```
An entropy of exactly 1.0 is the maximum: these series are statistically indistinguishable from noise. That is genuinely useful to know before you spend an afternoon tuning an ARIMA on them.

[KEY INSIGHT]
**Spectral entropy is a forecastability budget you can compute before modelling anything.** Sorting thousands of series by it tells you where accurate forecasts are even possible, so you can spend modelling effort where it can pay off instead of spreading it evenly.

### What preparation does each series need?

`ndiffs` and `nsdiffs` are recommendations, not descriptions. They report how many times a series should be differenced (regular and seasonal) to make it stationary, which is the flat, stable form that ARIMA models require.

```r title="Count the differencing each series needs"
all_feats |> count(ndiffs, nsdiffs)
#> # A tibble: 4 × 3
#>   ndiffs nsdiffs     n
#>    <int>   <int> <int>
#> 1      0       0   162
#> 2      0       1    24
#> 3      1       0   105
#> 4      1       1    13
```
`count()` tallies how many series fall into each combination. 162 series need no differencing at all, 105 need one regular difference to remove a trend, 24 need one seasonal difference, and 13 need both. That single table is a preparation plan for the entire portfolio, computed in a second.

[WARNING]
**Do not throw all 48 features into a clustering algorithm without thinking.** Many of them are strongly correlated with each other (the `acf` and `diff1_acf` columns, for example), and 80 quarterly observations is not much data to support 48 measurements. Pick the handful that match your question, or reduce the dimensions first as we do in the next section.

**Try it:** Count how many series need seasonal differencing, using the `nsdiffs` column.

```r title="Your turn: count seasonal differencing"
# The nsdiffs column is here. Replace the select/head with count(nsdiffs).
tourism |>
  features(Trips, feature_set(pkgs = "feasts")) |>
  select(Region, Purpose, nsdiffs) |>
  head(5)
#> # A tibble: 5 × 3
#>   Region         Purpose  nsdiffs
#>   <chr>          <chr>      <int>
#> 1 Adelaide       Business       0
#> 2 Adelaide       Holiday        0
#> 3 Adelaide       Other          0
#> 4 Adelaide       Visiting       0
#> 5 Adelaide Hills Business       0
```
<details>
<summary>Click to reveal solution</summary>

```r title="Seasonal differencing count solution"
tourism |>
  features(Trips, feature_set(pkgs = "feasts")) |>
  count(nsdiffs)
#> # A tibble: 2 × 2
#>   nsdiffs     n
#>     <int> <int>
#> 1       0   267
#> 2       1    37
```
**Explanation:** 37 of the 304 series carry seasonality strong enough that a seasonal difference is recommended. The other 267 do not need one.

</details>

## How do you find the odd series out among hundreds?

You now have a table of 304 rows and 48 columns. Nobody reads a table that size. But a table is something you can plot, and two features at a time makes a perfectly good map.

```r title="Map series by trend and seasonality"
ggplot(stl_feats, aes(x = trend_strength, y = seasonal_strength_year,
                      colour = Purpose)) +
  geom_point(alpha = 0.6) +
  labs(x = "Trend strength", y = "Seasonal strength",
       title = "Every tourism series on two axes")
```
Each dot is one entire time series, positioned by how much it trends and how much it repeats. Colouring by `Purpose` shows the holiday dots (strongly seasonal) sitting high, while business and other travel spread along the bottom. Two features already separate the categories, and you never told the plot what a holiday was.

### Compressing 48 features into two

Two features at a time means picking two and ignoring 46, which risks missing whatever the other 46 knew. **Principal component analysis** (PCA) solves that. It builds new axes that are blends of all 48 original features, arranged so that the first axis captures as much of the spread between series as any single direction can, the second captures as much of what is left, and so on. Plot the first two and you get the best flat picture of a 48-dimensional cloud.

```r title="Reduce 48 features to principal components"
library(broom)

pcs <- all_feats |>
  select(-Region, -State, -Purpose) |>
  prcomp(scale = TRUE) |>
  augment(all_feats)

pcs |> select(Region, Purpose, .fittedPC1, .fittedPC2) |> head(5)
#> # A tibble: 5 × 4
#>   Region         Purpose  .fittedPC1 .fittedPC2
#>   <chr>          <chr>         <dbl>      <dbl>
#> 1 Adelaide       Business     -0.868      1.25
#> 2 Adelaide       Holiday       1.00       1.26
#> 3 Adelaide       Other         4.90      -6.11
#> 4 Adelaide       Visiting      0.306      1.48
#> 5 Adelaide Hills Business     -5.00      -0.526
```
Three steps happen there. `select(-Region, -State, -Purpose)` drops the text columns so only numbers reach the maths. `prcomp(scale = TRUE)` finds the new axes. Then `augment()` from the broom package glues each series' position on those axes back onto the original table as `.fittedPC1` and `.fittedPC2`, so the labels travel with the coordinates.

[TIP]
**Always pass scale = TRUE to prcomp on a feature table.** The features have wildly different units: `spikiness` runs into the hundreds while `trend_strength` never leaves 0 to 1. Without scaling, the large-numbered features would dominate the components purely because of their units.

Now plot the two new axes exactly like the previous chart.

```r title="Plot the principal component map"
ggplot(pcs, aes(x = .fittedPC1, y = .fittedPC2, colour = Purpose)) +
  geom_point(alpha = 0.6) +
  labs(x = "Principal component 1", y = "Principal component 2",
       title = "All 304 series compressed onto two axes")
```
Most of the dots sit in one dense blob near the origin, which says most Australian tourism series behave broadly alike. A handful stretch far out to the right. Those are the series that differ from the crowd on many features at once, and they are exactly what you want to find when you are managing hundreds of forecasts.

### Naming the outliers

Because the labels travelled with the coordinates, finding out which series are the far-flung dots is a `filter()` away.

```r title="Identify the outlier series"
pcs |>
  filter(.fittedPC1 > 10) |>
  select(Region, State, Purpose, .fittedPC1, .fittedPC2)
#> # A tibble: 4 × 5
#>   Region                 State             Purpose  .fittedPC1 .fittedPC2
#>   <chr>                  <chr>             <chr>         <dbl>      <dbl>
#> 1 Australia's North West Western Australia Business       13.4    -11.3
#> 2 Australia's South West Western Australia Holiday        10.9      0.880
#> 3 Melbourne              Victoria          Holiday        12.3    -10.4
#> 4 South Coast            New South Wales   Holiday        11.9      9.42
```
Four series out of 304, found without plotting a single time series. The threshold of 10 was read off the chart, which is the normal way to use this: look, pick a cutoff, filter.

An outlier flag is only useful if you can see what caused it, so plot one.

```r title="Plot an outlier series to see why"
nw_business <- tourism |>
  filter(Region == "Australia's North West", Purpose == "Business")

ggplot(nw_business, aes(x = Quarter, y = Trips)) +
  geom_line() +
  labs(title = "Australia's North West business trips",
       y = "Trips (thousands)")
```
The chart shows what makes it unusual. Business travel to Australia's North West starts near 51 thousand trips, climbs steeply through the 2000s to a peak around 297, then falls back. That is the Western Australian mining boom and bust, and it is why this series has the highest trend strength in the whole dataset (0.934) and lands furthest from the crowd in the PCA map. Nothing else in the data looks like it.

**Try it:** Use the `pcs` table to find the series with `.fittedPC2` below -8, showing `Region`, `Purpose` and both components.

```r title="Your turn: find outliers on the second axis"
# Add a filter() step that keeps only rows where .fittedPC2 is below -8
pcs |>
  select(Region, Purpose, .fittedPC1, .fittedPC2) |>
  head(5)
#> # A tibble: 5 × 4
#>   Region         Purpose  .fittedPC1 .fittedPC2
#>   <chr>          <chr>         <dbl>      <dbl>
#> 1 Adelaide       Business     -0.868      1.25
#> 2 Adelaide       Holiday       1.00       1.26
#> 3 Adelaide       Other         4.90      -6.11
#> 4 Adelaide       Visiting      0.306      1.48
#> 5 Adelaide Hills Business     -5.00      -0.526
```
<details>
<summary>Click to reveal solution</summary>

```r title="Second-axis outliers solution"
pcs |>
  filter(.fittedPC2 < -8) |>
  select(Region, Purpose, .fittedPC1, .fittedPC2)
#> # A tibble: 4 × 4
#>   Region                 Purpose  .fittedPC1 .fittedPC2
#>   <chr>                  <chr>         <dbl>      <dbl>
#> 1 Australia's North West Business      13.4      -11.3
#> 2 Brisbane               Visiting       7.83      -8.36
#> 3 Melbourne              Holiday       12.3      -10.4
#> 4 Melbourne              Other          8.43      -8.34
```
**Explanation:** These are all large-city or boom-town series. They are unusual on the second axis, which captures a different blend of features from the first.

</details>

## How do you write your own feature function?

Every recipe so far shipped with the package. But `features()` has no idea whether a function came from feasts or from you. Any function that takes a numeric vector and returns named numbers will do.

Suppose you want to know which regions have grown. Compare the average of the last four quarters against the average of the first four.

```r title="Write a custom growth feature"
feat_growth <- function(x, ...) {
  n <- length(x)
  c(growth_ratio = mean(x[(n - 3):n]) / mean(x[1:4]))
}

tourism |>
  features(Trips, feat_growth) |>
  arrange(desc(growth_ratio)) |>
  head(5)
#> # A tibble: 5 × 4
#>   Region      State           Purpose growth_ratio
#>   <chr>       <chr>           <chr>          <dbl>
#> 1 Spa Country Victoria        Other         Inf
#> 2 Upper Yarra Victoria        Other         Inf
#> 3 Whitsundays Queensland      Other         Inf
#> 4 Riverland   South Australia Other          12.0
#> 5 Bundaberg   Queensland      Other           8.89
```
Walk through the function. `x` arrives as the series' values as a plain numeric vector, so `n <- length(x)` is 80 here. `x[(n - 3):n]` is the last four values and `x[1:4]` is the first four. Dividing their means gives a ratio above 1 for growth and below 1 for decline. Wrapping it in `c(growth_ratio = ...)` gives the output column its name.

[NOTE]
**The `...` in the signature is required, not decorative.** `features()` passes extra arguments such as the series' seasonal period to every feature function. Without `...` to absorb them, your function errors out the moment `features()` calls it.

Now look at what the ratio actually found. Three series came back as `Inf`, which is what R prints when you divide by zero. Those regions recorded zero "Other" trips across all of their first four quarters. That is not a growth story, it is a data story, and the feature surfaced it in one line.

A custom feature can return more than one number, which lets you investigate properly.

```r title="Write a feature returning two values"
feat_zeros <- function(x, ...) {
  c(zero_prop = mean(x == 0), first_nonzero = which(x > 0)[1])
}

tourism |>
  features(Trips, feat_zeros) |>
  arrange(desc(zero_prop)) |>
  head(5)
#> # A tibble: 5 × 5
#>   Region          State              Purpose zero_prop first_nonzero
#>   <chr>           <chr>              <chr>       <dbl>         <dbl>
#> 1 Kangaroo Island South Australia    Other       0.8               1
#> 2 MacDonnell      Northern Territory Other       0.75              3
#> 3 Wilderness West Tasmania           Other       0.738             1
#> 4 Wimmera         Victoria           Other       0.638             2
#> 5 Barkly          Northern Territory Other       0.625             1
```
`x == 0` produces a vector of TRUE and FALSE, and `mean()` of that gives the proportion of TRUEs, which is the share of zero quarters. `which(x > 0)[1]` finds the position of the first non-zero value. Both go into one `c()` call, so `features()` makes two columns.

The answer is stark. Kangaroo Island's "Other" series is zero in 80 percent of its quarters. Fitting a seasonal ARIMA to that would be nonsense, and now you know before you try.

[KEY INSIGHT]
**Features expose data-quality problems before modelling does.** A zero-heavy or flat-lined series will produce a model and a forecast without complaint. A two-line feature function catches it in advance, across your whole portfolio at once.

Custom features mix freely with built-in ones. Pass a `list()` of recipes and the columns are joined into a single table.

```r title="Combine custom and built-in features"
tourism |>
  features(Trips, list(feat_stl, feat_growth)) |>
  select(Region, Purpose, trend_strength, seasonal_strength_year, growth_ratio) |>
  head(5)
#> # A tibble: 5 × 5
#>   Region         Purpose  trend_strength seasonal_strength_year growth_ratio
#>   <chr>          <chr>             <dbl>                  <dbl>        <dbl>
#> 1 Adelaide       Business          0.464                  0.407        1.27
#> 2 Adelaide       Holiday           0.554                  0.619        1.15
#> 3 Adelaide       Other             0.746                  0.202        2.04
#> 4 Adelaide       Visiting          0.435                  0.452        1.16
#> 5 Adelaide Hills Business          0.464                  0.179        0.973
```
Nine columns from `feat_stl` and one from your own function, computed in the same pass over the data. Adelaide's "Other" travel doubled over the period while its business travel grew 27 percent, and both facts sit alongside the shape features that describe them.

**Try it:** Write a feature called `ex_feat_range` that returns `ex_range_ratio`, the difference between a series' maximum and minimum divided by its mean. Rank series by it, highest first.

```r title="Your turn: write a range feature"
# This returns the raw range. Divide it by mean(x) to make series comparable.
ex_feat_range <- function(x, ...) {
  c(ex_range_ratio = max(x) - min(x))
}

tourism |>
  features(Trips, ex_feat_range) |>
  arrange(desc(ex_range_ratio)) |>
  head(5)
#> # A tibble: 5 × 4
#>   Region          State           Purpose  ex_range_ratio
#>   <chr>           <chr>           <chr>             <dbl>
#> 1 South Coast     New South Wales Holiday            647.
#> 2 Sydney          New South Wales Business           593.
#> 3 Melbourne       Victoria        Visiting           539.
#> 4 North Coast NSW New South Wales Holiday            508.
#> 5 Melbourne       Victoria        Holiday            481.
```
<details>
<summary>Click to reveal solution</summary>

```r title="Range feature solution"
ex_feat_range <- function(x, ...) {
  c(ex_range_ratio = (max(x) - min(x)) / mean(x))
}

tourism |>
  features(Trips, ex_feat_range) |>
  arrange(desc(ex_range_ratio)) |>
  head(5)
#> # A tibble: 5 × 4
#>   Region          State              Purpose ex_range_ratio
#>   <chr>           <chr>              <chr>            <dbl>
#> 1 Wilderness West Tasmania           Other             21.5
#> 2 Kangaroo Island South Australia    Other             11.7
#> 3 Upper Yarra     Victoria           Other             11.7
#> 4 Barkly          Northern Territory Other             11.6
#> 5 Murray East     Victoria           Other             11.4
```
**Explanation:** Dividing by the mean makes the measure comparable across series of very different sizes. The winners are the sparse "Other" series from the previous example, where a mostly-zero series has one large spike.

</details>

## Complete Example: A Feature-Based Triage Report for 304 Series

Everything so far has been one question at a time. Here is the workflow those pieces were building toward: compute the fingerprint once, then use it to sort every series into a bucket that tells you what to do with it.

![Decision flow routing series to a strategy based on their features](screenshots/Time-Series-Features-in-R-triage-flow.webp)

*Figure 3: A feature-based routing rule sends every series to the treatment it needs.*

The rule reads top to bottom and stops at the first match. Data problems get caught before anything else, then genuinely seasonal series, then trending ones, and whatever is left is either noise or simple enough for a basic model.

```r title="Triage every series by its features"
triage <- tourism |>
  features(Trips, feature_set(pkgs = "feasts")) |>
  mutate(strategy = case_when(
    zero_run_mean > 0            ~ "sparse, check the data",
    seasonal_strength_year > 0.6 ~ "needs a seasonal model",
    trend_strength > 0.65        ~ "trend-driven, ETS or ARIMA",
    spectral_entropy > 0.99      ~ "close to noise, use a benchmark",
    TRUE                         ~ "simple model is fine"
  ))

triage |> count(strategy, sort = TRUE)
#> # A tibble: 5 × 2
#>   strategy                            n
#>   <chr>                           <int>
#> 1 sparse, check the data             98
#> 2 simple model is fine               81
#> 3 close to noise, use a benchmark    56
#> 4 needs a seasonal model             45
#> 5 trend-driven, ETS or ARIMA         24
```
`case_when()` checks each condition in order and assigns the label from the first one that is true, with `TRUE ~ ...` catching everything that matched nothing. `mutate()` adds the label as a new column, and `count(sort = TRUE)` tallies the buckets largest first.

That single table is a work plan. 98 series have zero-runs and need a data conversation before any modelling. 45 genuinely need seasonal models. Only 24 are trend-driven enough to justify fitting ETS or ARIMA carefully. And 56 are so close to noise that a simple benchmark is the honest answer.

Every bucket drills down, because the labels are attached to a full feature table.

```r title="Inspect the sparse series"
triage |>
  filter(strategy == "sparse, check the data") |>
  select(Region, Purpose, zero_run_mean, longest_flat_spot) |>
  arrange(desc(zero_run_mean)) |>
  head(6)
#> # A tibble: 6 × 4
#>   Region          Purpose zero_run_mean longest_flat_spot
#>   <chr>           <chr>           <dbl>             <int>
#> 1 Kangaroo Island Other            5.33                16
#> 2 MacDonnell      Other            4                   16
#> 3 Wilderness West Other            3.47                25
#> 4 Wimmera         Other            3.4                 10
#> 5 Lasseter        Other            2.88                10
#> 6 Barkly          Other            2.63                12
```
`zero_run_mean` is the average length of a run of consecutive zeros and `longest_flat_spot` is the longest stretch with no change at all. Kangaroo Island averages more than five zero quarters in a row and has a 16-quarter flat stretch, which is four years of no recorded travel. That is a reporting gap, not a forecasting problem, and no model would have told you so.

```r title="Inspect the seasonal series"
triage |>
  filter(strategy == "needs a seasonal model") |>
  select(Region, Purpose, seasonal_strength_year, seasonal_peak_year) |>
  arrange(desc(seasonal_strength_year)) |>
  head(6)
#> # A tibble: 6 × 4
#>   Region           Purpose seasonal_strength_year seasonal_peak_year
#>   <chr>            <chr>                    <dbl>              <dbl>
#> 1 Snowy Mountains  Holiday                  0.967                  3
#> 2 Great Ocean Road Holiday                  0.956                  1
#> 3 South Coast      Holiday                  0.952                  1
#> 4 Peninsula        Holiday                  0.928                  1
#> 5 Phillip Island   Holiday                  0.907                  1
#> 6 Central Coast    Holiday                  0.903                  1
```
The `seasonal_peak_year` column adds a detail you would otherwise have to plot to see: the Snowy Mountains peak at position 3, which is Q4, while everywhere else peaks at position 1, which is Q2. Ski fields and beaches are busy in opposite halves of the year, and the feature table says so in a column.

This is the shape that scales. The pipeline does not care whether it is handed 304 series or 30,000. You compute the fingerprint once, write the routing rule once, and get back a table that says where the modelling effort should go, before any model is fitted.

## Practice Exercises

### Exercise 1: Rank the most seasonal holiday destinations

Using only the `Holiday` series, find the 3 with the highest `seasonal_strength_year`. Show `Region`, `State`, `seasonal_strength_year` and `seasonal_peak_year`. Save the result to `my_holiday`.

```r title="Exercise 1 starter"
# Hint: filter the tsibble BEFORE computing features,
# then use feat_stl, select, arrange and head
my_holiday <- tourism |> filter(Purpose == "Holiday")
n_keys(my_holiday)
#> [1] 76
```
<details>
<summary>Click to reveal solution</summary>

```r title="Exercise 1 solution"
my_holiday <- tourism |>
  filter(Purpose == "Holiday") |>
  features(Trips, feat_stl) |>
  select(Region, State, seasonal_strength_year, seasonal_peak_year) |>
  arrange(desc(seasonal_strength_year)) |>
  head(3)

my_holiday
#> # A tibble: 3 × 4
#>   Region           State           seasonal_strength_year seasonal_peak_year
#>   <chr>            <chr>                            <dbl>              <dbl>
#> 1 Snowy Mountains  New South Wales                  0.967                  3
#> 2 Great Ocean Road Victoria                         0.956                  1
#> 3 South Coast      New South Wales                  0.952                  1
```
**Explanation:** Filtering the tsibble before `features()` means only Holiday series are measured at all, which is faster than computing all 304 and discarding three quarters of them.

</details>

### Exercise 2: Find the boom series

Write a custom feature `my_growth` returning `my_ratio`, the mean of the last four quarters divided by the mean of the first four. Combine it with `feat_stl`, then keep only series where `trend_strength` is above 0.7 AND `my_ratio` is above 2. Drop any infinite ratios. Sort by `my_ratio`, highest first, and save to `my_boom`.

```r title="Exercise 2 starter"
# Hint: n <- length(x), then the last four values are x[(n - 3):n]
# Hint: pass list(feat_stl, my_growth) to features()
# Hint: is.finite() drops Inf values inside filter()
my_growth <- function(x, ...) {
  c(my_ratio = NA_real_)  # replace NA_real_ with your calculation
}
```
<details>
<summary>Click to reveal solution</summary>

```r title="Exercise 2 solution"
my_growth <- function(x, ...) {
  n <- length(x)
  c(my_ratio = mean(x[(n - 3):n]) / mean(x[1:4]))
}

my_boom <- tourism |>
  features(Trips, list(feat_stl, my_growth)) |>
  filter(trend_strength > 0.7, my_ratio > 2, is.finite(my_ratio)) |>
  select(Region, Purpose, trend_strength, my_ratio) |>
  arrange(desc(my_ratio))

my_boom
#> # A tibble: 6 × 4
#>   Region                 Purpose  trend_strength my_ratio
#>   <chr>                  <chr>             <dbl>    <dbl>
#> 1 Australia's North West Business          0.934     3.72
#> 2 Melbourne East         Visiting          0.787     3.49
#> 3 Mackay                 Business          0.701     2.67
#> 4 Melbourne              Other             0.826     2.42
#> 5 Experience Perth       Other             0.730     2.18
#> 6 Adelaide               Other             0.746     2.04
```
**Explanation:** Requiring both a high trend strength and a large growth ratio finds series that grew a lot *and* grew smoothly. The mining-boom series tops the list, and `is.finite()` removes the divide-by-zero cases from the sparse series.

</details>

### Exercise 3: Rank the states by holiday seasonality

For `Holiday` series only, compute `seasonal_strength_year` for each series, then group by `State` and report the mean seasonality plus the number of series per state. Sort most seasonal first and save to `my_states`.

```r title="Exercise 3 starter"
# Hint: features() returns a plain tibble, so group_by()
# and summarise() work exactly as they do on any data frame
# Hint: n() counts rows within a group

my_states <- tourism |>
  filter(Purpose == "Holiday") |>
  features(Trips, feat_stl)

# Write the group_by() and summarise() steps below
head(my_states, 3)
#> # A tibble: 3 × 12
#>   Region State Purpose trend_strength seasonal_strength_year seasonal_peak_year seasonal_trough_year
#>   <chr>  <chr> <chr>            <dbl>                  <dbl>              <dbl>                <dbl>
#> 1 Adela… Sout… Holiday          0.554                  0.619                  1                    2
#> 2 Adela… Sout… Holiday          0.528                  0.296                  2                    1
#> 3 Alice… Nort… Holiday          0.381                  0.832                  3                    1
#> # ℹ 5 more variables: spikiness <dbl>, linearity <dbl>, curvature <dbl>, stl_e_acf1 <dbl>,
#> #   stl_e_acf10 <dbl>
```
<details>
<summary>Click to reveal solution</summary>

```r title="Exercise 3 solution"
my_states <- tourism |>
  filter(Purpose == "Holiday") |>
  features(Trips, feat_stl) |>
  group_by(State) |>
  summarise(
    my_mean_seasonality = mean(seasonal_strength_year),
    my_n = n()
  ) |>
  arrange(desc(my_mean_seasonality))

my_states
#> # A tibble: 8 × 3
#>   State              my_mean_seasonality  my_n
#>   <chr>                            <dbl> <int>
#> 1 Tasmania                         0.874     5
#> 2 Northern Territory               0.768     7
#> 3 New South Wales                  0.623    13
#> 4 Western Australia                0.610     5
#> 5 Queensland                       0.590    12
#> 6 South Australia                  0.538    12
#> 7 Victoria                         0.521    21
#> 8 ACT                              0.453     1
```
**Explanation:** This is the payoff of the flattening idea. Once features are rows, `group_by()` and `summarise()` aggregate *across series*, which is not something you can do while the data is still 24,320 observations deep. Tasmania's holiday travel is the most calendar-driven in the country, and the ACT's is the least.

</details>

## Frequently Asked Questions

### Do I need a tsibble, or will a plain data frame work?

You need a tsibble. `features()` is defined for tsibbles specifically, because it has to know which column is time and which columns split the data into separate series. Converting is one line, `as_tsibble(index = <time column>, key = <id columns>)`, as shown in the second section.

### What is the difference between seasonal_strength_year and season_acf1?

They measure the same thing two different ways, and they usually agree. `seasonal_strength_year` runs a full STL decomposition and reports the share of variance the seasonal component explains. `season_acf1` is a single correlation at the seasonal lag, so it is far cheaper to compute. Use `season_acf1` when you are screening a very large number of series, and `seasonal_strength_year` when you want the interpretable 0 to 1 share.

### Should I feed all 48 features into a clustering model?

Usually not. Many of the 48 are strongly correlated with each other, so clustering on the raw set effectively counts some traits several times. Either pick the handful that match your question, or run PCA first (as in the outlier section) and cluster on the first few components.

### Why does seasonal_peak_year say 3 when the peak is in Q4?

Because the position counts from 0, not 1. On quarterly data, 0 is Q1, 1 is Q2, 2 is Q3 and 3 is Q4. On monthly data the same column runs 0 to 11 for January through December. Add 1 before showing the number to anyone.

### What happens if my series are too short?

`feat_stl` needs at least two full seasonal cycles to separate a season from a trend. Given less than that, it silently returns fewer columns: the seasonal ones simply do not appear. A six-quarter series, for example, comes back with `trend_strength` and `spikiness` but no `seasonal_strength_year` at all. Always check the column names on short data rather than assuming the usual nine are there.

### Can series of different lengths live in the same tsibble?

Yes. `features()` processes each key group independently, so a tsibble holding one series of 40 quarters and another of 12 returns one row for each, with features computed over whatever data that series has. Just remember the short-series caveat above: a series too short for two seasonal cycles will be missing its seasonal columns, which shows up as `NA` once the rows are stacked together.

## Summary

| Idea | What to remember |
|---|---|
| A feature | One number summarising an entire series |
| `features()` | Applies a recipe to every series in a tsibble, returning one row each |
| The key | The tsibble columns that define where one series ends and the next begins |
| `feat_stl` | Trend and seasonal strength, peak and trough position, spikiness, linearity, curvature |
| `feat_acf` | Autocorrelation at lag 1, at the seasonal lag, and after differencing |
| `feature_set(pkgs = "feasts")` | All 48 features at once, the full fingerprint |
| Strength | A share of variance from 0 to 1, not a slope |
| PCA on features | Compresses 48 columns to 2 so hundreds of series fit on one chart |
| Custom features | Any function taking a numeric vector and returning named numbers, with `...` in the signature |

Use this table to go from a question to the feature that answers it.

| Your question | Feature to reach for |
|---|---|
| Does this series repeat every year? | `seasonal_strength_year` or `season_acf1` |
| Is it going anywhere? | `trend_strength` and `linearity` |
| When in the year is it busiest? | `seasonal_peak_year` |
| Can this be forecast at all? | `spectral_entropy` |
| Do I need to difference it? | `ndiffs` and `nsdiffs` |
| Did something break partway through? | `shift_level_max` and `shift_var_max` |
| Is the data even usable? | `zero_run_mean` and `longest_flat_spot` |
| Which series are unlike the rest? | PCA on the full feature set |

## References

1. Hyndman, R.J. & Athanasopoulos, G. *Forecasting: Principles and Practice*, 3rd Edition. Chapter 4: Time series features. [Link](https://otexts.com/fpp3/features.html) - the standard textbook treatment of this material, including the strength formulas used above.
2. feasts package reference site: Feature Extraction And Statistics for Time Series. [Link](https://feasts.tidyverts.org/) - the package's own site, listing every feature function it provides.
3. feasts documentation: `feat_stl()` reference. [Link](https://feasts.tidyverts.org/reference/feat_stl.html) - exact definitions and defaults for the nine columns `feat_stl` returns.
4. tsibble package reference site: Tidy Temporal Data Frames. [Link](https://tsibble.tidyverts.org/) - how index and key work, and every way to build a tsibble from data you already have.
5. Wang, X., Smith, K. & Hyndman, R.J. Characteristic-based clustering for time series data. *Data Mining and Knowledge Discovery*, 13(3), 335-364 (2006). [Link](https://robjhyndman.com/papers/wang.pdf) - the paper that introduced clustering series by their features, which is what the PCA section is a small version of.
6. Hyndman, R.J., Wang, E. & Laptev, N. Large-scale unusual time series detection. *IEEE ICDM Workshops* (2015). [Link](https://robjhyndman.com/papers/icdm2015.pdf) - how a feature space is used to flag unusual series in a portfolio of thousands.
7. Cleveland, R.B., Cleveland, W.S., McRae, J.E. & Terpenning, I. STL: A seasonal-trend decomposition procedure based on loess. *Journal of Official Statistics*, 6(1), 3-73 (1990). [Link](https://www.scb.se/contentassets/ca21efb41fee47d293bbee5bf7be7fb3/stl-a-seasonal-trend-decomposition-procedure-based-on-loess.pdf) - the original STL algorithm, if you want to know how the trend and season are actually estimated.

## Continue Learning

- [Time Series Decomposition in R](Time-Series-Decomposition-in-R.html) - the STL machinery behind `trend_strength` and `seasonal_strength_year`, explained step by step.
- [fable in R: Tidy Time Series Forecasting with tsibble](fable-in-R.html) - fit ETS and ARIMA to every series in a tsibble at once, which is the natural next step after triage.
- [ACF and PACF in R](ACF-and-PACF-in-R.html) - read autocorrelation plots properly and use them to choose ARIMA orders.

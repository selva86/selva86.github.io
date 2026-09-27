---
title: "Hierarchical and Grouped Forecasting Lesson 5: Coherent forecasts finance can plan against"
slug: "Coherent-Forecasts-Finance-Can-Plan-Against"
description: "Measure the dollar gap between regional and national revenue forecasts, close it with top-down, bottom-up and MinT, then score each plan on the 2024 actuals."
keywords: "coherent forecasts, forecast reconciliation, hierarchical forecasting, MinT, top-down forecasting, bottom-up forecasting, reconcile, min_trace, ETS, fable, revenue planning, R"
mathjax: false
webr: true
date: "2026-09-27"
post_type: "LESSON"
course_id: "ts-hierarchical"
course_title: "Hierarchical and Grouped Forecasting"
course_lesson: "5"
course_total: "5"
course_landing: "Hierarchical-and-Grouped-Forecasting-Course.html"
course_prev: "Reconciliation-with-fabletools"
course_next: ""
curriculum_id: "5.120.5"
lesson_access: "pro"
catalog_blurb: "How to make regional and national forecasts add up in one plan."
---

=== step === cover
## Coherent forecasts finance can plan against

Today let's learn how to make a set of forecasts add up, so that finance has one set of numbers to plan against.

Maya is a planning analyst at an outdoor-gear retailer. The company sells in four regions: North, South, East and West. Maya has to prepare the 2024 monthly revenue plan, in dollars.

She fits one forecasting model to each region and one more to the national total. That makes five models, and each one forecasts revenue for 2024. The table below shows the annual plan from each of them.

::widget styled-table {"cols":["line","annual_plan"],"rows":[["North",8367348],["South",5284572],["East",5826996],["West",2752651],["Sum of the four regions",22231567],["National",21932408],["Gap (regions minus national)",299159]],"formats":{"annual_plan":"dollar"},"title":"The 2024 revenue plan from five forecasts","note":"North, South, East, West and National each come from their own forecasting model. The other two lines are worked out from those five."}

Add up the four regional plans and you get $22,231,567. But the national plan says $21,932,408. So the same revenue for the same year is planned at two different totals, and they are $299,159 apart.

=== step === concept
## How four regions and a national total form a hierarchy

Let's start with the structure of Maya's data.

Revenue is recorded for each of the four regions, and the national revenue is the sum of the four in every month. A set of series where some are the sum of others is called a **hierarchy**. This one has two levels: the national total at the top and the four regions below it.

The rule that a total equals the sum of its parts is the **aggregation constraint**. Here it says that in every month, National = North + South + East + West.

A set of forecasts is **coherent** when it obeys the same rule: in every month, the four regional forecasts add up to the national forecast. So in a coherent plan, the regional lines and the national line can never disagree.

First we need the data. We simulate 72 months of revenue in dollars, from January 2019 to December 2024, for the four regions. Each region gets its own starting level, growth rate and seasonal peak month, and one demand shock is shared by all four regions.

```r
# Load the packages and simulate 72 months of revenue for four regions
library(fable)
library(fabletools)
library(tsibble)
library(dplyr)
library(tidyr)
library(ggplot2)
options(width = 100)

set.seed(3)
month_index <- yearmonth("2019 Jan") + 0:71
month_no <- 1:72

# One demand shock is shared by all four regions; each region adds its own noise
shock <- as.numeric(arima.sim(list(ar = 0.6), n = 72, sd = 0.03))

simulate_region <- function(level, growth, amp, phase) {
  trend <- 1 + growth * month_no / 12
  season <- 1 + amp * sin(2 * pi * (month_no - phase) / 12)
  noise <- exp(shock + rnorm(72, 0, 0.02))
  round(level * trend * season * noise, -2)
}

sales <- tibble(
  month = rep(month_index, 4),
  region = rep(c("North", "South", "East", "West"), each = 72),
  revenue = c(
    simulate_region(520000, 0.06, 0.16, 0),
    simulate_region(380000, 0.03, 0.10, 3),
    simulate_region(310000, 0.09, 0.10, 6),
    simulate_region(190000, 0.02, 0.05, 9)
  )
) |>
  as_tsibble(key = region, index = month)

head(sales)
#> # A tsibble: 6 x 3 [1M]
#> # Key:       region [1]
#>      month region revenue
#>      <mth> <chr>    <dbl>
#> 1 2019 Jan East    294600
#> 2 2019 Feb East    278700
#> 3 2019 Mar East    279800
#> 4 2019 Apr East    283400
#> 5 2019 May East    283400
#> 6 2019 Jun East    323200
```

`simulate_region()` builds one region's revenue as its level, times a growth trend, times a seasonal wave, times noise. The shared `shock` goes into all four regions, so they tend to rise and fall together. The result is stored as a **tsibble**, a data frame with a time index (`month`) and a key (`region`) that says which series each row belongs to.

Next, `aggregate_key(region, revenue = sum(revenue))` adds the national series. It creates one new series, shown as `<aggregated>`, that is the sum of the four regions in each month.

```r
# Add the national series with aggregate_key() and show the five series for December 2023
hier <- sales |>
  aggregate_key(region, revenue = sum(revenue))

hier |>
  filter(month == yearmonth("2023 Dec"))
#> # A tsibble: 5 x 3 [1M]
#> # Key:       region [5]
#>      month region       revenue
#>      <mth> <chr*>         <dbl>
#> 1 2023 Dec <aggregated> 1836400
#> 2 2023 Dec East          479600
#> 3 2023 Dec North         714500
#> 4 2023 Dec South         411000
#> 5 2023 Dec West          231300
```

There are now five series with 72 months each. In December 2023 the `<aggregated>` row is the national revenue, $1,836,400, and the four regions add up to exactly that.

Let's check that this holds in all 72 months. The block takes the largest absolute difference between the national series and the sum of the regions.

```r
# Check that the national series equals the sum of the four regions in every month
check <- hier |>
  as_tibble() |>
  mutate(level = if_else(is_aggregated(region), "national", "regions")) |>
  group_by(month, level) |>
  summarise(revenue = sum(revenue), .groups = "drop") |>
  pivot_wider(names_from = level, values_from = revenue)

max(abs(check$national - check$regions))
#> [1] 0
```

So the history obeys the aggregation constraint exactly. The forecasts, as we are about to see, do not have to.

Last, we split the time. The 60 months from 2019 to 2023 are the history the models are fitted on. The 12 months of 2024 are held back as the actuals, the revenue that was really recorded, and they are used only to score the plans once they are made.

```r
# Keep 2019 to 2023 as the history and hold 2024 back as the actuals
train <- hier |>
  filter(month <= yearmonth("2023 Dec"))
test <- hier |>
  filter(month >= yearmonth("2024 Jan"))

c(train_months = n_distinct(train$month), test_months = n_distinct(test$month))
#> train_months  test_months
#>           60           12
```

=== step === concept
## Base forecasts: one model fitted to each series

A **base forecast** is a forecast from a model that was fitted to one series alone. Maya fits one model to each of the five series, so she has five base forecasts, and each model is fitted to its own series only.

The model is ETS, exponential smoothing. `ETS(revenue)` chooses the form of the model for each series automatically. The form is written as three letters, for the error term, the trend term and the seasonal term. For each term, N means none, A means additive and M means multiplicative, and for the trend Ad means a damped additive trend. So ETS(M,Ad,M) has a multiplicative error, a damped additive trend and a multiplicative seasonal term.

The line `model(base = ETS(revenue))` fits all five series at once and names the models `base`. The output is a mable, a table of models with one row per series.

```r
# Fit one ETS model to each of the five series in the history
fit <- train |>
  model(base = ETS(revenue))

fit
#> # A mable: 5 x 2
#> # Key:     region [5]
#>   region                base
#>   <chr*>             <model>
#> 1 East          <ETS(M,A,M)>
#> 2 North        <ETS(M,Ad,M)>
#> 3 South         <ETS(A,N,A)>
#> 4 West          <ETS(A,N,N)>
#> 5 <aggregated>  <ETS(M,N,N)>
```

The five series got five different models. East is ETS(M,A,M), North is ETS(M,Ad,M), South is ETS(A,N,A), West is ETS(A,N,N) and the national series is ETS(M,N,N).

The national model has no trend and no seasonal term. The four regions peak in different months, so their seasonal patterns partly cancel in the national total, and the national model finds no seasonal term to fit. A model with no trend and no seasonal term forecasts the same value in every month, so the national forecast is a flat line.

The next block forecasts 12 months ahead from every model and puts the five forecasts side by side, one row per month of 2024.

```r
# Forecast 2024 from each model and lay the five forecasts side by side
plan_wide <- fit |>
  forecast(h = 12) |>
  as_tibble() |>
  mutate(node = if_else(is_aggregated(region), "National", as.character(region))) |>
  select(month, node, .mean) |>
  pivot_wider(names_from = node, values_from = .mean) |>
  select(month, National, North, South, East, West) |>
  mutate(
    sum_regions = North + South + East + West,
    gap = sum_regions - National
  )

plan_wide |>
  mutate(across(-month, round)) |>
  print(n = 12)
#> # A tibble: 12 × 8
#>       month National  North  South   East   West sum_regions    gap
#>       <mth>    <dbl>  <dbl>  <dbl>  <dbl>  <dbl>       <dbl>  <dbl>
#>  1 2024 Jan  1827701 741561 400323 444543 229388     1815814 -11886
#>  2 2024 Feb  1827701 800577 425506 436162 229388     1891631  63931
#>  3 2024 Mar  1827701 806337 446477 433392 229388     1915594  87893
#>  4 2024 Apr  1827701 813203 468025 441972 229388     1952587 124886
#>  5 2024 May  1827701 737405 464741 448031 229388     1879564  51864
#>  6 2024 Jun  1827701 692709 473108 477803 229388     1873008  45307
#>  7 2024 Jul  1827701 639367 482061 508498 229388     1859314  31613
#>  8 2024 Aug  1827701 598156 469863 532873 229388     1830280   2579
#>  9 2024 Sep  1827701 589714 434008 543624 229388     1796734 -30967
#> 10 2024 Oct  1827701 604386 417135 533788 229388     1784696 -43004
#> 11 2024 Nov  1827701 636980 396192 519723 229388     1782282 -45419
#> 12 2024 Dec  1827701 706952 407133 506589 229388     1850062  22361
```

Every column from `National` to `West` is a base forecast. `sum_regions` adds the four regional forecasts, and `gap` is `sum_regions` minus `National`. The gap is positive when the regions add up to more than the national forecast and negative when they add up to less.

The National column is $1,827,701 in every month. West is flat too, but North, South and East move through the year. So in April the regions add up to $1,952,587, which is $124,886 more than the national forecast, and in November they add up to $45,419 less.

=== step === widget
## How large is the gap between the regional forecasts and the national forecast?

The chart below plots the size of the gap in each month of 2024. The widget holds the `gap` column of `plan_wide` with the signs removed, so it shows how big each gap is, not which way it points. The signs are still in the `gap` column of `plan_wide`.

::widget chart-plotter {"data":[{"x":1,"y":11886.3,"fill":"gap"},{"x":2,"y":63930.6,"fill":"gap"},{"x":3,"y":87893.3,"fill":"gap"},{"x":4,"y":124886.4,"fill":"gap"},{"x":5,"y":51863.7,"fill":"gap"},{"x":6,"y":45307.3,"fill":"gap"},{"x":7,"y":31613.1,"fill":"gap"},{"x":8,"y":2579.4,"fill":"gap"},{"x":9,"y":30967,"fill":"gap"},{"x":10,"y":43004.2,"fill":"gap"},{"x":11,"y":45418.8,"fill":"gap"},{"x":12,"y":22361.3,"fill":"gap"}],"geoms":["bar","line"],"x":"month","y":"gap_size","code":{"bar":"ggplot(df, aes(factor(month), gap_size)) +\n  geom_col() +\n  labs(x = \"Month of 2024\", y = \"Size of the gap, dollars\")","line":"ggplot(df, aes(month, gap_size)) +\n  geom_line() +\n  geom_point() +\n  scale_x_continuous(breaks = 1:12) +\n  labs(x = \"Month of 2024\", y = \"Size of the gap, dollars\")"}}

The gap is largest in April at $124,886, which is 6.8% of that month's national forecast. It is smallest in August at $2,579. The regions add up to more than the national forecast in 8 months (February to August, and December) and to less in the other 4.

For the year, the gap is $299,159, which is 1.4% of the national forecast for the year. But that is the net of gaps with opposite signs. Add up the 12 monthly gaps with the signs removed and the total is about $562,000, so netting hides about $263,000 of disagreement.

[KEY INSIGHT]
A small gap for the year does not mean the monthly plans agree. Positive and negative monthly gaps cancel in the annual total, and the plan is written month by month.

So why do the forecasts disagree at all? Because nothing ties the five models to each other. Each one was fitted to its own series, and the national model has no seasonal term while three of the regional models have one.

=== step === concept
## How top-down scaling and bottom-up make the forecasts add up

There are two simple ways to make the five forecasts add up. Both start from `plan_wide`.

The first is **top-down**. It keeps the national forecast and splits it across the regions in proportion to that month's regional forecasts, so the four regions add up to the national forecast. Finance teams call this pro rata scaling.

For each month, the scale factor is `National / sum_regions`, and every regional forecast in that month is multiplied by it. Because the shares come from the month's regional forecasts, this version is called top-down with forecast proportions.

```r
# Top-down: multiply each month's regional forecasts by National / sum_regions
top_down <- plan_wide |>
  mutate(scale = National / sum_regions) |>
  mutate(across(c(North, South, East, West), ~ .x * scale))

top_down |>
  select(month, scale) |>
  mutate(scale = sprintf("%.3f", scale)) |>
  print(n = 12)
#> # A tibble: 12 × 2
#>       month scale
#>       <mth> <chr>
#>  1 2024 Jan 1.007
#>  2 2024 Feb 0.966
#>  3 2024 Mar 0.954
#>  4 2024 Apr 0.936
#>  5 2024 May 0.972
#>  6 2024 Jun 0.976
#>  7 2024 Jul 0.983
#>  8 2024 Aug 0.999
#>  9 2024 Sep 1.017
#> 10 2024 Oct 1.024
#> 11 2024 Nov 1.025
#> 12 2024 Dec 0.988
```

A factor below 1 means the regions add up to more than the national forecast, so top-down cuts them. In April the factor is 0.936. A factor above 1 means the regions add up to less, so top-down raises them, as it does in November with 1.025.

The second way is **bottom-up**. It keeps the four regional forecasts and defines the national forecast as their sum.

The next block computes the annual total of each node under the base plan, top-down and bottom-up.

```r
# Annual totals per node for the base plan, top-down and bottom-up
node_cols <- c("North", "South", "East", "West", "National")

base_totals <- plan_wide |>
  summarise(across(all_of(node_cols), sum))
top_down_totals <- top_down |>
  summarise(across(all_of(node_cols), sum))
bottom_up_totals <- base_totals |>
  mutate(National = North + South + East + West)

by_hand <- bind_rows(
  base = base_totals,
  top_down = top_down_totals,
  bottom_up = bottom_up_totals,
  .id = "plan"
)

by_hand |>
  mutate(
    sum_regions = North + South + East + West,
    gap = sum_regions - National,
    across(-plan, round)
  )
#> # A tibble: 3 × 8
#>   plan        North   South    East    West National sum_regions    gap
#>   <chr>       <dbl>   <dbl>   <dbl>   <dbl>    <dbl>       <dbl>  <dbl>
#> 1 base      8367348 5284572 5826996 2752651 21932408    22231567 299159
#> 2 top_down  8239733 5211972 5763048 2717655 21932408    21932408      0
#> 3 bottom_up 8367348 5284572 5826996 2752651 22231567    22231567      0
```

In the base row the regions add up to $22,231,567 and the national forecast is $21,932,408, a gap of $299,159. Both fixes bring the gap to 0. Top-down does it with National at $21,932,408, and bottom-up does it with National at $22,231,567.

Now let's see how far each plan moves each node away from the base plan.

```r
# How far each plan moves each node away from the base plan, in dollars for the year
by_hand |>
  mutate(across(all_of(node_cols), ~ round(.x - .x[plan == "base"])))
#> # A tibble: 3 × 6
#>   plan        North  South   East   West National
#>   <chr>       <dbl>  <dbl>  <dbl>  <dbl>    <dbl>
#> 1 base            0      0      0      0        0
#> 2 top_down  -127615 -72600 -63949 -34995        0
#> 3 bottom_up       0      0      0      0   299159
```

Top-down cuts the four regions by $299,159 in total: North by $127,615, South by $72,600, East by $63,949 and West by $34,995. Bottom-up leaves the regions alone and raises the national forecast by the same $299,159.

So top-down keeps the national forecast and uses the regional forecasts only for their monthly shares, while bottom-up keeps the regional forecasts and drops the national forecast. Both make the plan add up. But each one throws away the forecasts from one set of models.

=== step === quiz
## Quick check: how much does top-down scaling change each region in April?

In April the four regional forecasts add up to $1,952,587 and the national forecast is $1,827,701. Top-down scaling multiplies every regional forecast by one factor so that the regions add up to the national forecast. What happens to each region's April forecast?

::quiz {"correct": 3, "gate": true, "difficulty": "intermediate"}
- Each region falls by 6.8%, which is the gap of $124,886 divided by the national forecast. ::no
- Each region falls by the same $31,222, which is the gap split four ways. ::no
- Each region falls by 6.4%, because every regional forecast is multiplied by 1,827,701 / 1,952,587 = 0.936. ::ok Right. The factor is the national forecast over the sum of the regions, and 0.936 is a 6.4% cut for every region. North falls by about $52,012 and West by about $14,672, because the same percentage is taken from forecasts of different sizes.
- No region changes, because the national forecast moves up to $1,952,587 instead. ::no The factor is National / sum_regions = 1,827,701 / 1,952,587 = 0.936, so every region is multiplied by 0.936, a cut of 6.4%. Dividing the gap by the national forecast gives 6.8%, which uses the wrong denominator. An equal $31,222 from each region ignores region size and would be a 13.6% cut for West. Leaving the regions alone and moving the national forecast is bottom-up.

=== step === concept
## How MinT reconciliation changes all five forecasts at once

Top-down changes the four regions and leaves the national forecast alone. Bottom-up does the opposite. **MinT** changes all five forecasts at once.

Turning base forecasts into coherent ones is called **reconciliation**, and top-down and bottom-up are two ways to do it. MinT is short for minimum trace. It chooses the reconciliation that minimises the sum of the variances of the five reconciled forecast errors. That sum is the trace of the covariance matrix of the errors, which is where the name comes from.

A covariance matrix holds the variance of each series' forecast errors on the diagonal and, off the diagonal, how the errors of two series move together. MinT estimates it from the in-sample residuals of the five models, which are the errors each model made on the history it was fitted to. The version called `mint_shrink` shrinks the covariances between series toward zero, which keeps the estimate stable when each series has only 60 residuals.

The effect is that the forecasts with the largest errors are moved the most.

In fable, `reconcile()` sets up the adjustment on the five base models and `forecast()` then applies it. The call below sets up three methods at once: `bottom_up()`, `top_down()` with forecast proportions, and `min_trace()` with `mint_shrink`.

```r
# Reconcile the five base models three ways, then forecast 2024 from each
fc <- fit |>
  reconcile(
    bu = bottom_up(base),
    td = top_down(base, method = "forecast_proportions"),
    mint = min_trace(base, method = "mint_shrink")
  ) |>
  forecast(h = 12)

unique(fc$.model)
#> [1] "base" "bu"   "td"   "mint"
```

The table `fc` now holds four sets of forecasts: `base`, `bu` for bottom-up, `td` for top-down and `mint`.

The next block puts the four plans side by side and finds the largest monthly gap in each.

```r
# Lay the four plans side by side and find the largest monthly gap in each
fc_wide <- fc |>
  as_tibble() |>
  mutate(node = if_else(is_aggregated(region), "National", as.character(region))) |>
  select(month, plan = .model, node, .mean) |>
  pivot_wider(names_from = node, values_from = .mean) |>
  mutate(gap = North + South + East + West - National)

fc_wide |>
  group_by(plan) |>
  summarise(max_abs_gap = round(max(abs(gap)), 2))
#> # A tibble: 4 × 2
#>   plan  max_abs_gap
#>   <chr>       <dbl>
#> 1 base      124886.
#> 2 bu             0
#> 3 mint           0
#> 4 td             0
```

The base forecasts have a largest gap of $124,886. In `bu`, `td` and `mint` it is 0 to the cent, so all three plans are coherent.

To see which forecasts MinT moves most, look at the standard deviation of each model's in-sample residuals, in dollars.

```r
# Standard deviation of each series' in-sample residuals, in dollars
fit |>
  augment() |>
  as_tibble() |>
  group_by(region) |>
  summarise(residual_sd = round(sd(.resid)))
#> # A tibble: 5 × 2
#>   region       residual_sd
#>   <chr*>             <dbl>
#> 1 East               14279
#> 2 North              21210
#> 3 South              16961
#> 4 West                9579
#> 5 <aggregated>       64153
```

The national model has the largest residuals, $64,153, against $9,579 to $21,210 for the regions. So most of the adjustment falls on the national forecast.

The last comparison is the national forecast by month in the base plan and in MinT, with the share of each month's gap that the change takes.

```r
# National forecast by month: base plan against MinT, the change, and its share of the gap
fc_wide |>
  filter(plan %in% c("base", "mint")) |>
  select(month, plan, National) |>
  pivot_wider(names_from = plan, values_from = National) |>
  mutate(
    gap = plan_wide$gap,
    change = mint - base,
    share_of_gap = round(change / gap, 3),
    across(c(base, mint, gap, change), round)
  ) |>
  print(n = 12)
#> # A tibble: 12 × 6
#>       month    base    mint    gap change share_of_gap
#>       <mth>   <dbl>   <dbl>  <dbl>  <dbl>        <dbl>
#>  1 2024 Jan 1827701 1817173 -11886 -10528        0.886
#>  2 2024 Feb 1827701 1884324  63931  56623        0.886
#>  3 2024 Mar 1827701 1905548  87893  77847        0.886
#>  4 2024 Apr 1827701 1938313 124886 110612        0.886
#>  5 2024 May 1827701 1873636  51864  45936        0.886
#>  6 2024 Jun 1827701 1867829  45307  40129        0.886
#>  7 2024 Jul 1827701 1855700  31613  28000        0.886
#>  8 2024 Aug 1827701 1829985   2579   2285        0.886
#>  9 2024 Sep 1827701 1800273 -30967 -27427        0.886
#> 10 2024 Oct 1827701 1789612 -43004 -38089        0.886
#> 11 2024 Nov 1827701 1787473 -45419 -40227        0.886
#> 12 2024 Dec 1827701 1847506  22361  19805        0.886
```

In April the national forecast rises by $110,612 to $1,938,313, and the four regions fall by $14,274 in total. `share_of_gap` is 0.886 in every month, so the national forecast takes 88.6% of each month's gap and the four regions take the other 11.4%. The shares are the same in all 12 months because they come from one covariance matrix, estimated once from the residuals.

The national forecast is also no longer flat. It follows the regional forecasts: $1,817,173 in January and $1,787,473 in November, instead of $1,827,701 in both.

Finally, `annual` holds each plan's total for the year by node. The check compares the `bu` and `td` rows with the `by_hand` totals.

```r
# Annual totals per node for each plan, and a check against the hand computation
annual <- fc_wide |>
  group_by(plan) |>
  summarise(across(c(National, North, South, East, West), sum))

annual |>
  mutate(across(-plan, round))

hand_td <- by_hand |> filter(plan == "top_down") |> select(all_of(node_cols))
fable_td <- annual |> filter(plan == "td") |> select(all_of(node_cols))
hand_bu <- by_hand |> filter(plan == "bottom_up") |> select(all_of(node_cols))
fable_bu <- annual |> filter(plan == "bu") |> select(all_of(node_cols))

round(c(
  top_down = max(abs(hand_td - fable_td)),
  bottom_up = max(abs(hand_bu - fable_bu))
), 4)
#> # A tibble: 4 × 6
#>   plan  National   North   South    East    West
#>   <chr>    <dbl>   <dbl>   <dbl>   <dbl>   <dbl>
#> 1 base  21932408 8367348 5284572 5826996 2752651
#> 2 bu    22231567 8367348 5284572 5826996 2752651
#> 3 mint  22197373 8356824 5272470 5817181 2750898
#> 4 td    21932408 8239733 5211972 5763048 2717655
#>  top_down bottom_up
#>         0         0
```

Both differences are 0 to four decimals of a dollar, so `reconcile()` gives the same top-down and bottom-up totals as the hand computation. The `mint` row is the new plan.

=== step === widget
## What changed between the base plan and the reconciled plan?

This is the table Maya takes to the planning meeting: the annual plan before and after reconciliation, and what changed on each line. The widget holds the `base` and `mint` rows of `annual`, with the sum of the regions and the gap added as lines. Switch it to the report table to read it with dollar signs and percent.

::widget styled-table {"cols":["line","base_plan","reconciled_plan","change","change_pct"],"rows":[["North",8367348,8356824,-10524,-0.001258],["South",5284572,5272470,-12102,-0.00229],["East",5826996,5817181,-9815,-0.001684],["West",2752651,2750898,-1753,-0.000637],["Sum of the four regions",22231567,22197373,-34194,-0.001538],["National",21932408,22197373,264965,0.012081],["Gap (regions minus national)",299159,0,-299159,null]],"formats":{"base_plan":"dollar","reconciled_plan":"dollar","change":"comma","change_pct":"pct"},"title":"What changed from the base plan to the MinT plan","note":"Annual revenue plan for 2024, in dollars. Change is the MinT plan minus the base plan."}

The national plan rises by $264,965, or 1.2%, to $22,197,373. The four regions fall by $34,194 in total, and South moves the most, down $12,102 or 0.2%. The gap goes from $299,159 to 0.

Compare that with top-down, which cut each region by between 1.1% and 1.5% of its base plan: East by 1.1% ($63,949) and North by 1.5% ($127,615) are the two ends. Under MinT no region moves by more than 0.3%, because the national forecast takes most of the change.

=== step === concept
## Do the reconciled forecasts score better against the 2024 actuals?

So far we have checked that the plans add up. We have not checked how close they are to the revenue that was really recorded, and the 2024 actuals we held back let us do that.

The score is the **mean absolute error (MAE)**: the average of the absolute forecast errors over the 12 months, in dollars per month. `accuracy()` takes the forecasts and the actuals, and `measures = list(MAE = MAE)` asks for MAE only.

```r
# Score each plan on the 12 months of 2024 with the mean absolute error (MAE)
acc <- accuracy(fc, test, measures = list(MAE = MAE))

mae_by_node <- acc |>
  mutate(
    node = if_else(is_aggregated(region), "National", as.character(region)),
    node = factor(node, levels = c("National", "North", "South", "East", "West")),
    plan = factor(.model, levels = c("base", "td", "bu", "mint"))
  ) |>
  select(node, plan, MAE) |>
  as_tibble()

mae_wide <- mae_by_node |>
  pivot_wider(names_from = plan, values_from = MAE) |>
  select(node, base, td, bu, mint) |>
  arrange(node)

mae_wide |>
  mutate(across(-node, round))

colSums(mae_wide[, -1]) |>
  round()
#> # A tibble: 5 × 5
#>   node      base    td    bu  mint
#>   <fct>    <dbl> <dbl> <dbl> <dbl>
#> 1 National 59824 59824 51102 50053
#> 2 North    32027 35739 32027 32264
#> 3 South    23594 29644 23594 24603
#> 4 East      9174 12286  9174  8496
#> 5 West     11385  9524 11385 11175
#>   base     td     bu   mint
#> 136005 147018 127283 126590
```

Start with the National row. The base plan and top-down have the same MAE, $59,824, because top-down keeps the national forecast. Bottom-up brings it down to $51,102 and MinT to $50,053, which is 16.3% lower than the base plan.

Now the regions. MinT stays close to the base plan: North is $237 worse, South is $1,009 worse, East is $678 better and West is $211 better. Top-down is worse than the base plan in three regions: North by $3,712, South by $6,050 and East by $3,111. Only West improves, by $1,861.

The named vector at the bottom adds the MAE of the five nodes for each plan: 136,005 for the base plan, 147,018 for top-down, 127,283 for bottom-up and 126,590 for MinT. Bottom-up and MinT differ by 0.5%, and one test set of 12 months is too short to separate them.

The chart below shows the same MAE values, one group of bars per node.

```r
# Chart the MAE by node and plan
ggplot(mae_by_node, aes(node, MAE, fill = plan)) +
  geom_col(position = "dodge") +
  labs(x = NULL, y = "MAE, dollars per month")
```

Look at National first: the `bu` and `mint` bars are shorter than the `base` bar. Then look at North, South and East: in each of the three, the `td` bar is the tallest.

The last block compares each plan's national total for 2024 with the actual national revenue.

```r
# Compare each plan's national total for 2024 with the actual national revenue
actual_national <- test |>
  filter(is_aggregated(region)) |>
  as_tibble() |>
  summarise(actual = sum(revenue)) |>
  pull(actual)

annual |>
  transmute(plan, national_total = round(National), below_actual_by = round(actual_national - National))

actual_national
#> # A tibble: 4 × 3
#>   plan  national_total below_actual_by
#>   <chr>          <dbl>           <dbl>
#> 1 base        21932408          708492
#> 2 bu          22231567          409333
#> 3 mint        22197373          443527
#> 4 td          21932408          708492
#> [1] 22640900
```

Actual national revenue for 2024 was $22,640,900, and every plan is below it. The base plan and top-down fall short by $708,492, which is 3.1%. MinT falls short by $443,527, which is 2.0%.

So reconciliation closed the gap between the forecasts, but it did not close the gap to the actuals. All five models were fitted to the same history from 2019 to 2023, and 2024 revenue came in above what every one of them projected. Coherence removes the disagreement between the forecasts. It cannot remove an error that all five forecasts share.

=== step === quiz
## Quick check: what does reconciliation fix, and what does it not fix?

Use the table for the planning meeting and the scores on the 2024 actuals. Which statement about the MinT plan is correct?

::quiz {"correct": 2, "gate": true, "difficulty": "intermediate"}
- Every node is more accurate than in the base plan, because the forecasts now add up. ::no
- The forecasts add up in every month, no region's annual plan moves by more than 0.3%, national MAE falls from $59,824 to $50,053, and the national total is still $443,527 below actual revenue. ::ok Yes. Reconciliation fixes the disagreement between the forecasts, and here it also lowers the national error. It does not remove a shortfall that all five models share.
- The plan now matches actual revenue, because the regional and national forecasts agree with each other. ::no
- Top-down is the safest fix, because it keeps the national forecast unchanged. ::no Reconciliation makes the forecasts add up. It does not make every forecast more accurate: North and South MAE rose slightly under MinT, by $237 and $1,009 a month. It cannot close a shortfall that all five models share, so the MinT national total is still $443,527 below actual. And top-down keeps the national MAE at $59,824 while it raises regional MAE in North, South and East.

=== step === tryit
## Your turn: which way does top-down scaling move the regions in October?

`plan_wide` still holds the base forecasts for 2024. In April the scale factor was below 1, so top-down cut the regions. Work out the scale factor for October 2024, then print the percent change it makes to each region, rounded to 1 decimal place.

```r
# plan_wide holds the base forecasts, one row per month of 2024.
# Filter it to October 2024, divide National by sum_regions to get the scale factor,
# then print the percent change that factor makes to each region, rounded to 1 decimal.
# Press Check when you have them.
```
::check {"regex": "National[^\\n]*/[^\\n]*sum_regions", "gate": true, "difficulty": "intermediate", "ok": "Yes: 1,827,701 / 1,784,696 = 1.024, so top-down raises every region by 2.4% in October. The regions add up to less than the national forecast that month, so the factor is above 1.", "no": "The scale factor is the national forecast divided by the sum of the regional forecasts for that month: National / sum_regions. Filter plan_wide to October first, then print round(100 * (scale - 1), 1)."}
::solution
```r
# Top-down scale factor for October 2024 and the percent change it makes to each region
oct <- plan_wide |>
  filter(month == yearmonth("2024 Oct"))

scale_oct <- oct$National / oct$sum_regions
round(100 * (scale_oct - 1), 1)
#> [1] 2.4
```

A factor above 1 raises the regions, and a factor below 1 cuts them. The sign of the gap tells you which: when the regions add up to less than the national forecast, as in October, top-down scales them up.

=== step === concept
## References
::prose-only a reference list; there is nothing to draw

- Hyndman and Athanasopoulos, [Forecasting: Principles and Practice, 3rd edition](https://otexts.com/fpp3/hierarchical.html), chapter 11, "Forecasting hierarchical and grouped time series". The chapter behind this lesson, with the same fable workflow.
- Wickramasuriya, Athanasopoulos and Hyndman (2019), [Optimal forecast reconciliation for hierarchical and grouped time series through trace minimization](https://doi.org/10.1080/01621459.2018.1448825), Journal of the American Statistical Association 114(526), 804 to 819. The paper that introduced MinT.
- Hyndman, Ahmed, Athanasopoulos and Shang (2011), [Optimal combination forecasts for hierarchical time series](https://doi.org/10.1016/j.csda.2011.03.006), Computational Statistics and Data Analysis 55(9), 2579 to 2589.
- Athanasopoulos, Gamakumara, Panagiotelis, Hyndman and Affan (2020), Hierarchical forecasting, in Macroeconomic Forecasting in the Era of Big Data, Springer.
- [fabletools reference](https://fabletools.tidyverts.org/) for `reconcile()` and `min_trace()`.

=== step === complete
## Quick recap

You started with five forecasts that did not add up, measured the gap in dollars, and reconciled them three ways. To summarize:

- A set of forecasts is coherent when the regional forecasts add up to the national forecast in every month. Five separately fitted models were not: the gap was $299,159 for the year, up to $124,886 in April, and it changed sign across months.
- Top-down keeps the national forecast and uses the regional forecasts only for their monthly shares. Bottom-up keeps the regional forecasts and drops the national forecast.
- MinT changes all five forecasts. The national forecast rose by $264,965, the four regions fell by $34,194 in total, and the gap went to 0.
- Scored on the 2024 actuals, national MAE fell 16.3%, from $59,824 to $50,053. Regional MAE moved by at most $1,009 a month under MinT, while top-down raised it in North, South and East.
- Every plan's national total is still below the actual $22,640,900. Coherence removes the gap between the forecasts, not a shortfall that all five models share.

So when the planning meeting asks what changed, Maya can say:

"The forecasts now add up in every month. The national plan rose 1.2%, and no region's plan moved by more than 0.3%."

The next section moves from a separate model for each series to one model across many series.

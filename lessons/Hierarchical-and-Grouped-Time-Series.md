---
title: "Hierarchical and Grouped Forecasting Lesson 1: Hierarchical and grouped time series"
slug: "Hierarchical-and-Grouped-Time-Series"
description: "Learn to tell a hierarchical time series from a grouped one, declare both with aggregate_key() in R, and see why forecasts made series by series do not add up."
keywords: "hierarchical time series, grouped time series, aggregate_key, forecast reconciliation, hierarchical forecasting in R, fable, tsibble, tourism data"
mathjax: false
webr: true
post_type: "LESSON"
course_id: "ts-hierarchical"
course_title: "Hierarchical and Grouped Forecasting"
course_lesson: "1"
course_total: "5"
course_landing: "Hierarchical-and-Grouped-Forecasting-Course.html"
course_prev: ""
course_next: "Bottom-Up-Top-Down-and-Middle-Out"
curriculum_id: "5.120.1"
lesson_access: "pro"
catalog_blurb: "How the structure of your series decides which forecasts can add up."
---

=== step === cover
## Hierarchical and grouped time series

Today let's understand how a set of related time series is organised, and why that organisation decides how you can forecast it.

Let's say you plan tourism for two Australian states, Tasmania and Western Australia. Tourism Research Australia counts the overnight trips visitors make, every quarter, from 1998 Q1 to 2016 Q4. Tasmania has 5 tourism regions and Western Australia has 5.

The planning team wants three kinds of forecast: one for the two states together, one for each state, and one for each region.

So the team is not forecasting one series. It is forecasting a set of series where each higher one is the sum of the lower ones.

::widget process-flow {"steps":[{"title":"Total","sub":"1 series: all trips in the two states"},{"title":"State","sub":"2 series: Tasmania, Western Australia"},{"title":"Region","sub":"10 series: 5 regions in each state"}]}

The widget shows the three levels, and together they hold 13 series: 1 + 2 + 10.

=== step === concept
## The bottom-level series in a tidy table

Let's start with the data, because everything in this lesson is built from it.

The tourism table lives in the tsibble package. A tsibble is a data frame for time series with two extra ideas. The index is the column that holds the time, here `Quarter`. The keys are the columns that together identify one series, here `Region`, `State` and `Purpose`.

We keep the two states and every quarter up to 2016 Q4. The call `filter_index(. ~ "2016 Q4")` does the second part: the dot stands for the start of the data, so it keeps everything up to and including 2016 Q4. Press Run.

```r
# Load the packages and build the slice of 40 bottom-level series
library(tsibble)
library(fabletools)
library(fable)
library(dplyr)

tourism <- tsibble::tourism
sl <- tourism |>
  filter(State %in% c("Tasmania", "Western Australia")) |>
  filter_index(. ~ "2016 Q4")

range(sl$Quarter)
#> <yearquarter[2]>
#> [1] "1998 Q1" "2016 Q4"
#> # Year starts on: January
nrow(sl)
#> [1] 3040
n_keys(sl)
#> [1] 40
head(sl)
#> # A tsibble: 6 x 5 [1Q]
#> # Key:       Region, State, Purpose [1]
#>   Quarter Region                  State             Purpose  Trips
#>     <qtr> <chr>                   <chr>             <chr>    <dbl>
#> 1 1998 Q1 Australia's Coral Coast Western Australia Business  26.2
#> 2 1998 Q2 Australia's Coral Coast Western Australia Business  27.2
#> 3 1998 Q3 Australia's Coral Coast Western Australia Business  33.7
#> 4 1998 Q4 Australia's Coral Coast Western Australia Business  31.0
#> 5 1999 Q1 Australia's Coral Coast Western Australia Business  28.0
#> 6 1999 Q2 Australia's Coral Coast Western Australia Business  32.8
```

`tsibble` gives the data structure, `fabletools` gives `aggregate_key()` and `fable` gives the forecasting models, so all three are loaded.

The range confirms the window: 1998 Q1 to 2016 Q4, which is 76 quarters. There are 3,040 rows and 40 keys. Each row is one quarter of one series, and 40 series times 76 quarters gives 3,040.

Each series is one region and one purpose of travel, which is Business, Holiday, Other or Visiting. The first one in the output is business trips in Australia's Coral Coast, and `Trips` is the number of overnight trips, in thousands. These 40 are the bottom-level series: the finest series the data gives us.

Now let's list each region with the state it sits in.

```r
# List each region with the state it sits in
sl |>
  as_tibble() |>
  distinct(State, Region)
#> # A tibble: 10 × 2
#>    State             Region                         
#>    <chr>             <chr>                          
#>  1 Western Australia Australia's Coral Coast        
#>  2 Western Australia Australia's Golden Outback     
#>  3 Western Australia Australia's North West         
#>  4 Western Australia Australia's South West         
#>  5 Tasmania          East Coast                     
#>  6 Western Australia Experience Perth               
#>  7 Tasmania          Hobart and the South           
#>  8 Tasmania          Launceston, Tamar and the North
#>  9 Tasmania          North West                     
#> 10 Tasmania          Wilderness West
```

There are 10 regions, 5 in each state, so 10 regions times 4 purposes gives the 40 series. Every region appears under one state only. That one-state-per-region property is what a hierarchy is built on.

=== step === concept
## What is a hierarchical time series?

Add up the four purposes in a region and you get a series for the region. Add up the regions in a state and you get a series for the state. Add up the two states and you get one series for all the trips in the slice. Each of these sums is called an **aggregate series**.

Put the sums in order and they form a **hierarchy**: a structure where every series has exactly one parent. The parent of a region is its state, the parent of a state is the total, and the total has no parent. A series below another one is its child, and each layer of the structure (total, state, region) is a level.

`aggregate_key()` builds the structure. `State / Region` says that `Region` is nested inside `State`, and `Trips = sum(Trips)` says how to add the series up. `Purpose` is not named, so it is summed away. That makes the 10 region series the bottom level of this hierarchy: the finest level the structure keeps.

```r
# Nest Region inside State and sum Trips to build the 13-series hierarchy
hier <- sl |>
  aggregate_key(State / Region, Trips = sum(Trips))

n_keys(hier)
#> [1] 13
```

That is 13 series: 1 total, 2 states and 10 regions. Let's print all 13 for one quarter. `yearquarter("2016 Q4")` writes a quarter in a form R can compare with the `Quarter` column.

```r
# Show all 13 series in 2016 Q4
hier_q4 <- hier |>
  filter(Quarter == yearquarter("2016 Q4"))
print(hier_q4, n = 13)
#> # A tsibble: 13 x 4 [1Q]
#> # Key:       State, Region [13]
#>    Quarter State             Region                           Trips
#>      <qtr> <chr*>            <chr*>                           <dbl>
#>  1 2016 Q4 <aggregated>      <aggregated>                    3489. 
#>  2 2016 Q4 Tasmania          <aggregated>                     833. 
#>  3 2016 Q4 Western Australia <aggregated>                    2656. 
#>  4 2016 Q4 Tasmania          East Coast                       106. 
#>  5 2016 Q4 Tasmania          Hobart and the South             331. 
#>  6 2016 Q4 Tasmania          Launceston, Tamar and the North  216. 
#>  7 2016 Q4 Tasmania          North West                       149. 
#>  8 2016 Q4 Tasmania          Wilderness West                   30.9
#>  9 2016 Q4 Western Australia Australia's Coral Coast          257. 
#> 10 2016 Q4 Western Australia Australia's Golden Outback       270. 
#> 11 2016 Q4 Western Australia Australia's North West           316. 
#> 12 2016 Q4 Western Australia Australia's South West          755. 
#> 13 2016 Q4 Western Australia Experience Perth                1058. 
```

The key columns now show `<aggregated>` wherever a series covers everything under that key. The total has it in both `State` and `Region`. Tasmania has it in `Region`, because Tasmania adds up all of its regions. The `chr*` type marks the key columns that can hold `<aggregated>`.

Now read the `Trips` column. Tasmania's 833 thousand trips sit above its five regions: 106, 331, 216, 149 and 30.9. The total, 3,489, is Tasmania's 833 plus Western Australia's 2,656.

Let's check that in code. `is_aggregated(Region)` is TRUE on a row where `Region` is `<aggregated>`, so it picks out Tasmania's own series, and `!is_aggregated(Region)` picks out its five regions.

```r
# Check that Tasmania equals the sum of its five regions in 2016 Q4
tas_total <- hier_q4 |>
  filter(State == "Tasmania", is_aggregated(Region)) |>
  pull(Trips)
tas_regions <- hier_q4 |>
  filter(State == "Tasmania", !is_aggregated(Region)) |>
  pull(Trips)

round(tas_regions, 1)
#> [1] 106.1 331.0 216.4 148.6  30.9
sum(tas_regions)
#> [1] 832.99
tas_total
#> [1] 832.99
all.equal(tas_total, sum(tas_regions))
#> [1] TRUE
```

The five regions add up to 832.99, the same as the Tasmania series, so `all.equal()` returns TRUE. Series built with `aggregate_key()` add up exactly in every quarter, because each aggregate is defined as the sum of its children.

=== step === concept
## What is a grouped time series?

Now let's cross the attributes instead of nesting them. `Purpose` does not sit inside `State`. Holiday trips exist in Tasmania and in Western Australia alike, and each state has all four purposes.

When attributes cross like this, the structure is called a **grouped time series**. A bottom-level series then has two parents: one for its state and one for its purpose.

We cross `State` with `Purpose` using `*`.

```r
# Cross State with Purpose to build the 15-series grouped structure
grp <- sl |>
  aggregate_key(State * Purpose, Trips = sum(Trips))

n_keys(grp)
#> [1] 15
```

That is 15 series: 1 total, 2 states, 4 purposes and 8 state and purpose series (2 states times 4 purposes). `Region` is summed away here, so those 8 are the bottom level. Let's count the series by which of the two keys is aggregated.

```r
# Count the series by which of the two keys is aggregated
grp |>
  as_tibble() |>
  distinct(State, Purpose) |>
  count(State_aggregated = is_aggregated(State), Purpose_aggregated = is_aggregated(Purpose))
#> # A tibble: 4 × 3
#>   State_aggregated Purpose_aggregated     n
#>   <lgl>            <lgl>              <int>
#> 1 FALSE            FALSE                  8
#> 2 FALSE            TRUE                   2
#> 3 TRUE             FALSE                  4
#> 4 TRUE             TRUE                   1
```

Read the rows:

- Neither key aggregated: 8 bottom-level series.
- Only `Purpose` aggregated: 2 series, one per state.
- Only `State` aggregated: 4 series, one per purpose.
- Both keys aggregated: 1 series, the total.

Here is the difference from a hierarchy. In a grouped structure the total can be reached two ways: by adding the 2 state series, or by adding the 4 purpose series. Let's add up the 2016 trips both ways.

```r
# Add up the 2016 trips from the state series, then from the purpose series
trips_2016 <- grp |>
  filter_index("2016 Q1" ~ "2016 Q4") |>
  as_tibble()

state_series <- trips_2016 |>
  filter(!is_aggregated(State), is_aggregated(Purpose))
purpose_series <- trips_2016 |>
  filter(is_aggregated(State), !is_aggregated(Purpose))

round(sum(state_series$Trips))
#> [1] 13376
round(sum(purpose_series$Trips))
#> [1] 13376
```

Both routes reach 13,376 thousand trips for 2016. So the total series has two ways to be built.

The same is true one level down. Let's take the Tasmania holiday series and find which series it is added into.

```r
# Find the two parents of the Tasmania holiday series in 2016
tas_holiday <- trips_2016 |>
  filter(State == "Tasmania", Purpose == "Holiday") |>
  pull(Trips) |>
  sum()
tas_all_purposes <- trips_2016 |>
  filter(State == "Tasmania", is_aggregated(Purpose)) |>
  pull(Trips) |>
  sum()
all_states_holiday <- trips_2016 |>
  filter(is_aggregated(State), Purpose == "Holiday") |>
  pull(Trips) |>
  sum()

round(c(
  tasmania_holiday = tas_holiday,
  tasmania_all_purposes = tas_all_purposes,
  all_states_holiday = all_states_holiday
))
#>      tasmania_holiday tasmania_all_purposes    all_states_holiday 
#>                  1752                  3062                  5758
```

Tasmania holiday trips, 1,752 thousand, are added into two series. One is Tasmania across all purposes, at 3,062. The other is Holiday across all states, at 5,758. Those are its two parents: the Tasmania total and the Holiday total.

[KEY INSIGHT]
Count the parents of a bottom-level series. One parent means a hierarchy. Two parents means a grouped structure, because the attributes cross instead of nesting. Region nests inside State, since each region belongs to one state. Purpose nests inside nothing.

=== step === widget
## Reading a state by purpose table and its totals

A two-way table lays the grouped structure out flat. The widget shows the 2016 trips, in thousands, with state down the side and purpose across the top. Press Report table to switch from the raw print to the formatted table.

::widget styled-table {"cols":["State","Business","Holiday","Other","Visiting","All purposes"],"rows":[["Tasmania","457.4","1752.4","119.4","732.5","3061.7"],["Western Australia","2816.9","4005.8","514.9","2976.4","10313.9"],["All states","3274.3","5758.2","634.2","3709.0","13375.6"]],"formats":{"Business":"comma","Holiday":"comma","Other":"comma","Visiting":"comma","All purposes":"comma"},"title":"Trips by state and purpose, 2016, thousands","note":"Source: Tourism Research Australia, tourism data in the tsibble package. Each total is the sum of the unrounded values, so it can differ by 1 from the rounded cells."}

The numbers come from adding up the four quarters of 2016 in the grouped structure. Each of the 8 cells inside the table is a bottom-level series. Tasmania Holiday is 1,752.

The last column adds across a row, so it holds the two state series: Tasmania at 3,062 and Western Australia at 10,314. The last row adds down a column, so it holds the four purpose series: Business at 3,274, Holiday at 5,758, Other at 634 and Visiting at 3,709. The corner, 13,376, is the total series.

So the margins of the table are series too: 8 cells, 2 row totals, 4 column totals and 1 corner make the 15 series. Add up the last column or add up the last row and you reach the same corner.

One thing to notice in the report table. The four rounded Tasmania cells add up to 3,061, but the total says 3,062. Each total is the sum of the unrounded values, so it can differ by 1 from the rounded cells.

=== step === quiz
## Quick check: how many parents does a Tasmania holiday series have?

The Tasmania, Holiday cell in the table holds 1,752 thousand trips. How many series is it added into?

::quiz {"correct": 2, "gate": true, "difficulty": "beginner"}
- One, the Tasmania series, because the trips belong to a state. ::no
- Two, the Tasmania series and the Holiday series. ::ok Yes. The cell sits in the Tasmania row and in the Holiday column, so it is added into a row total and into a column total. Two parents is what makes the structure grouped.
- Three, the Tasmania series, the Holiday series and the total. ::no The cell sits in one row and one column, so it is added into exactly two series: the row total and the column total. The grand total is not a parent. It is the parent of those two, one level further up. And stopping at the state, the way a hierarchy would, misses the Holiday column.

=== step === concept
## How to combine nesting and crossing in one structure

Real data usually has both. `Region` nests inside `State`, and `Purpose` crosses with all of that.

`aggregate_key()` uses two operators for this. The `/` nests, so `State / Region` puts each region under its state. The `*` crosses, so `Purpose * (State / Region)` crosses `Purpose` with the whole State and Region hierarchy. The parentheses keep the nested part together.

```r
# Nest Region in State, cross with Purpose, and count the series
both <- sl |>
  aggregate_key(Purpose * (State / Region), Trips = sum(Trips))

n_keys(both)
#> [1] 65
```

That is 65 series. You can predict the count before running anything. Each part of the structure has a number of nodes, where a node is one series in that part, and crossing multiplies the parts' node counts.

`State / Region` has 1 total, 2 states and 10 regions, so 13 nodes. `Purpose` has 1 total and 4 purposes, so 5 nodes. Crossing gives 13 times 5, which is 65.

```r
# Predict the series counts from the node counts of each part
state_region_nodes <- 1 + 2 + 10
state_nodes <- 1 + 2
purpose_nodes <- 1 + 4

state_region_nodes * purpose_nodes
#> [1] 65
state_nodes * purpose_nodes
#> [1] 15
```

The same rule gives 3 times 5, which is 15, for `State * Purpose`. Both match what `n_keys()` returned.

In the 65-series structure the bottom level is the 40 series we started with: 10 regions times 4 purposes. Everything else, 25 series, is a sum of them.

=== step === concept
## Why forecasts made series by series do not add up

The data we built adds up exactly. Forecasts made one series at a time usually do not, and we can see it in the 13-series hierarchy.

We will forecast with ETS, which is exponential smoothing. It forecasts from a smoothed level and, when the series has them, a trend and a seasonal pattern. The three letters in a name like ETS(M,N,M) stand for the error, trend and seasonal parts: A is additive, M is multiplicative and N is none. `ETS()` picks the form for each series automatically.

The code below fits one ETS model to each of the 13 series, and prints the ones for Tasmania.

```r
# Fit a separate ETS model to each of the 13 series
fit <- hier |>
  model(ets = ETS(Trips))

fit |>
  filter(State == "Tasmania")
#> # A mable: 6 x 3
#> # Key:     State, Region [6]
#>   State    Region                                   ets
#>   <chr*>   <chr*>                               <model>
#> 1 Tasmania East Coast                      <ETS(A,N,A)>
#> 2 Tasmania Hobart and the South            <ETS(M,N,M)>
#> 3 Tasmania Launceston, Tamar and the North <ETS(M,N,A)>
#> 4 Tasmania North West                      <ETS(A,N,A)>
#> 5 Tasmania Wilderness West                 <ETS(A,N,A)>
#> 6 Tasmania <aggregated>                    <ETS(M,N,M)>
```

The Tasmania series itself gets ETS(M,N,M). East Coast gets ETS(A,N,A), and Launceston, Tamar and the North gets ETS(M,N,A). Different series get different forms, each with its own smoothing parameters, and nothing in the 13 fits links one series to another.

Now let's forecast 4 quarters ahead, which is 2017 Q1 to 2017 Q4. The column `.mean` holds the point forecast. We add up the five regional forecasts, then round both numbers to whole thousands so each gap is the difference of the two printed numbers.

```r
# Forecast 4 quarters ahead and compare Tasmania with the sum of its five regions
fc <- fit |>
  forecast(h = 4) |>
  as_tibble()

tas_gap <- fc |>
  filter(State == "Tasmania") |>
  group_by(Quarter) |>
  summarise(
    tasmania = round(.mean[is_aggregated(Region)]),
    regions_sum = round(sum(.mean[!is_aggregated(Region)]))
  ) |>
  mutate(gap = tasmania - regions_sum)

tas_gap
#> # A tibble: 4 × 4
#>   Quarter tasmania regions_sum   gap
#>     <qtr>    <dbl>       <dbl> <dbl>
#> 1 2017 Q1     1032         999    33
#> 2 2017 Q2      732         715    17
#> 3 2017 Q3      512         515    -3
#> 4 2017 Q4      725         709    16
```

In 2017 Q1 the Tasmania forecast is 1,032 thousand trips, and its five regional forecasts add up to 999. The gap is 33 thousand trips. In 2017 Q3 the gap turns to -3, so there the regions add up to more than Tasmania.

The same thing happens one level up. Here is the slice total against the sum of the two state forecasts in 2017 Q1.

```r
# Compare the slice total with the sum of the two state forecasts in 2017 Q1
slice_gap <- fc |>
  filter(Quarter == yearquarter("2017 Q1")) |>
  summarise(
    slice_total = round(.mean[is_aggregated(State)]),
    states_sum = round(sum(.mean[!is_aggregated(State) & is_aggregated(Region)]))
  ) |>
  mutate(gap = slice_total - states_sum)

slice_gap
#> # A tibble: 1 × 3
#>   slice_total states_sum   gap
#>         <dbl>      <dbl> <dbl>
#> 1        3908       3760   148
```

The slice total is 3,908 and the two states add up to 3,760, a gap of 148.

A set of forecasts is **coherent** when every aggregate forecast equals the sum of its children's forecasts. When it does not, the forecasts are **incoherent**, and these are. A planner who needs the state plan and the regional plans to agree cannot use them as they are.

Adjusting the forecasts so that they add up is called **forecast reconciliation**.

=== step === widget
## How Tasmania's five regions differ

Each of the five regions was fitted with its own model. The widget plots Tasmania's five regions for 16 quarters, 2013 Q1 to 2016 Q4, one dot per quarter. Switch to the facet_wrap view and press Run to get one panel per region.

::widget facet-grid {"data":[{"x":2013.00,"y":125.9,"facet":"East Coast"},{"x":2013.25,"y":57.0,"facet":"East Coast"},{"x":2013.50,"y":53.8,"facet":"East Coast"},{"x":2013.75,"y":75.7,"facet":"East Coast"},{"x":2014.00,"y":119.2,"facet":"East Coast"},{"x":2014.25,"y":121.2,"facet":"East Coast"},{"x":2014.50,"y":42.5,"facet":"East Coast"},{"x":2014.75,"y":82.1,"facet":"East Coast"},{"x":2015.00,"y":135.7,"facet":"East Coast"},{"x":2015.25,"y":71.8,"facet":"East Coast"},{"x":2015.50,"y":58.0,"facet":"East Coast"},{"x":2015.75,"y":106.4,"facet":"East Coast"},{"x":2016.00,"y":172.6,"facet":"East Coast"},{"x":2016.25,"y":51.2,"facet":"East Coast"},{"x":2016.50,"y":43.9,"facet":"East Coast"},{"x":2016.75,"y":106.1,"facet":"East Coast"},{"x":2013.00,"y":384.3,"facet":"Hobart and the South"},{"x":2013.25,"y":287.8,"facet":"Hobart and the South"},{"x":2013.50,"y":183.0,"facet":"Hobart and the South"},{"x":2013.75,"y":238.5,"facet":"Hobart and the South"},{"x":2014.00,"y":364.9,"facet":"Hobart and the South"},{"x":2014.25,"y":369.9,"facet":"Hobart and the South"},{"x":2014.50,"y":183.0,"facet":"Hobart and the South"},{"x":2014.75,"y":313.8,"facet":"Hobart and the South"},{"x":2015.00,"y":445.6,"facet":"Hobart and the South"},{"x":2015.25,"y":240.7,"facet":"Hobart and the South"},{"x":2015.50,"y":179.1,"facet":"Hobart and the South"},{"x":2015.75,"y":342.7,"facet":"Hobart and the South"},{"x":2016.00,"y":406.4,"facet":"Hobart and the South"},{"x":2016.25,"y":280.5,"facet":"Hobart and the South"},{"x":2016.50,"y":270.2,"facet":"Hobart and the South"},{"x":2016.75,"y":331.0,"facet":"Hobart and the South"},{"x":2013.00,"y":254.9,"facet":"Launceston, Tamar and the North"},{"x":2013.25,"y":169.7,"facet":"Launceston, Tamar and the North"},{"x":2013.50,"y":105.8,"facet":"Launceston, Tamar and the North"},{"x":2013.75,"y":113.4,"facet":"Launceston, Tamar and the North"},{"x":2014.00,"y":217.5,"facet":"Launceston, Tamar and the North"},{"x":2014.25,"y":186.0,"facet":"Launceston, Tamar and the North"},{"x":2014.50,"y":105.0,"facet":"Launceston, Tamar and the North"},{"x":2014.75,"y":195.3,"facet":"Launceston, Tamar and the North"},{"x":2015.00,"y":236.9,"facet":"Launceston, Tamar and the North"},{"x":2015.25,"y":157.7,"facet":"Launceston, Tamar and the North"},{"x":2015.50,"y":114.5,"facet":"Launceston, Tamar and the North"},{"x":2015.75,"y":205.5,"facet":"Launceston, Tamar and the North"},{"x":2016.00,"y":199.4,"facet":"Launceston, Tamar and the North"},{"x":2016.25,"y":145.8,"facet":"Launceston, Tamar and the North"},{"x":2016.50,"y":154.8,"facet":"Launceston, Tamar and the North"},{"x":2016.75,"y":216.4,"facet":"Launceston, Tamar and the North"},{"x":2013.00,"y":144.8,"facet":"North West"},{"x":2013.25,"y":104.5,"facet":"North West"},{"x":2013.50,"y":89.0,"facet":"North West"},{"x":2013.75,"y":87.7,"facet":"North West"},{"x":2014.00,"y":131.8,"facet":"North West"},{"x":2014.25,"y":156.1,"facet":"North West"},{"x":2014.50,"y":91.0,"facet":"North West"},{"x":2014.75,"y":106.2,"facet":"North West"},{"x":2015.00,"y":167.1,"facet":"North West"},{"x":2015.25,"y":95.4,"facet":"North West"},{"x":2015.50,"y":92.6,"facet":"North West"},{"x":2015.75,"y":137.5,"facet":"North West"},{"x":2016.00,"y":174.1,"facet":"North West"},{"x":2016.25,"y":135.9,"facet":"North West"},{"x":2016.50,"y":75.4,"facet":"North West"},{"x":2016.75,"y":148.6,"facet":"North West"},{"x":2013.00,"y":53.1,"facet":"Wilderness West"},{"x":2013.25,"y":38.6,"facet":"Wilderness West"},{"x":2013.50,"y":16.7,"facet":"Wilderness West"},{"x":2013.75,"y":33.6,"facet":"Wilderness West"},{"x":2014.00,"y":63.7,"facet":"Wilderness West"},{"x":2014.25,"y":44.4,"facet":"Wilderness West"},{"x":2014.50,"y":23.3,"facet":"Wilderness West"},{"x":2014.75,"y":34.0,"facet":"Wilderness West"},{"x":2015.00,"y":75.4,"facet":"Wilderness West"},{"x":2015.25,"y":12.3,"facet":"Wilderness West"},{"x":2015.50,"y":11.3,"facet":"Wilderness West"},{"x":2015.75,"y":40.7,"facet":"Wilderness West"},{"x":2016.00,"y":58.6,"facet":"Wilderness West"},{"x":2016.25,"y":38.0,"facet":"Wilderness West"},{"x":2016.50,"y":22.0,"facet":"Wilderness West"},{"x":2016.75,"y":30.9,"facet":"Wilderness West"}],"geom":"point","x":"year","y":"trips","facetVar":"region"}

The widget carries these 80 values, 16 quarters for each of the five Tasmania regions, taken from the same tourism data. The x axis is the year, so 2013.25 is 2013 Q2.

In the Run output all five panels share one y axis, so the levels can be compared. Hobart and the South sits high, between 179 and 446 thousand trips. East Coast runs from 42.5 to 173, Launceston, Tamar and the North from 105 to 255, and North West from 75.4 to 174. Wilderness West sits at the bottom, between 11.3 and 75.4.

The size of the seasonal swing differs too. East Coast's busiest quarter is about 4 times its quietest, 173 against 42.5. Hobart and the South's busiest is about 2.5 times its quietest, 446 against 179.

So the five regions differ in level and in swing, and each gets its own model. Every model is fitted to its own series alone, and nothing makes the five regional forecasts add up to the Tasmania forecast.

=== step === concept
## Which methods can each structure use to make forecasts add up?

Reconciliation methods differ in where they start. Four are worth knowing:

1. **Bottom-up** forecasts the bottom-level series, then adds them up the structure. Every aggregate is a sum by construction, so the forecasts are coherent.
2. **Top-down** forecasts the total, then splits it down the structure using shares, such as each region's share of its state.
3. **Middle-out** starts at a middle level, such as the states. It forecasts that level, adds up for the levels above and splits down for the levels below.
4. **Optimal combination** forecasts every series in the structure, then adjusts all the forecasts together so that they add up.

Top-down needs shares, so let's compute some. This block finds each region's share of Tasmania's 2016 trips in the hierarchy.

```r
# Compute each region's share of Tasmania's 2016 trips
tas_shares <- hier |>
  filter_index("2016 Q1" ~ "2016 Q4") |>
  as_tibble() |>
  filter(State == "Tasmania", !is_aggregated(Region)) |>
  group_by(Region = as.character(Region)) |>
  summarise(trips = round(sum(Trips))) |>
  mutate(share_pct = round(100 * trips / sum(trips), 1)) |>
  arrange(desc(share_pct))

tas_shares
#> # A tibble: 5 × 3
#>   Region                          trips share_pct
#>   <chr>                           <dbl>     <dbl>
#> 1 Hobart and the South             1288      42.1
#> 2 Launceston, Tamar and the North   716      23.4
#> 3 North West                        534      17.4
#> 4 East Coast                        374      12.2
#> 5 Wilderness West                   149       4.9
sum(tas_shares$share_pct)
#> [1] 100
```

The five shares add up to 100%. A top-down split of a Tasmania forecast gives each region its share and nothing is left over. That works because each region has one parent, Tasmania, so its share of that parent is the only split there is.

Now the Tasmania holiday series. It has two parents, so it has two shares: one of Tasmania's trips and one of all Holiday trips. The block below uses `tas_holiday`, `tas_all_purposes` and `all_states_holiday` from the grouped structure.

```r
# Compute the two shares of the Tasmania holiday series
round(100 * tas_holiday / tas_all_purposes, 1)
#> [1] 57.2
round(100 * tas_holiday / all_states_holiday, 1)
#> [1] 30.4
```

Holiday trips are 57.2% of Tasmania and 30.4% of all Holiday trips. Both are valid shares, but they split different totals, so there is no single split. A top-down method needs a unique parent to divide.

The 65-series structure is grouped as well. A bottom series such as Tasmania East Coast holiday has two parents: the East Coast series across all purposes, and the Tasmania holiday series. So top-down does not apply there either.

Here is the answer in one table, with the structure on the left and the method across the top.

| Structure | Bottom-up | Top-down | Middle-out | Optimal combination |
|---|---|---|---|---|
| Hierarchy, `State / Region` | Yes | Yes | Yes | Yes |
| Grouped, `State * Purpose` | Yes | No | No | Yes |
| Both, `Purpose * (State / Region)` | Yes | No | No | Yes |

A No means the split needs a unique parent, and the structure does not supply one. Bottom-up and optimal combination need no split, so they work on either structure. Top-down and middle-out split a total by shares, so they need one parent per series.

=== step === quiz
## Quick check: why do the forecasts not add up, and what can fix them?

The Tasmania forecast for 2017 Q1 is 1,032 thousand trips, and its five regional forecasts add up to 999. Which explanation and fix is right?

::quiz {"correct": 3, "gate": true, "difficulty": "intermediate"}
- Some quarters are missing from the regional series, so their forecasts add up to less. Filling the gaps fixes it. ::no
- An aggregate forecast always runs above the sum of its parts, so the total should be lowered by the average gap. ::no
- The 13 series were fitted separately, each with its own ETS form and smoothing parameters, so nothing forces the forecasts to add up. Bottom-up or optimal combination can reconcile them, even for a series with two parents. ::ok Yes. Each fit uses its own series only, so the Tasmania forecast and its five regional forecasts are separate results. Bottom-up and optimal combination need no split, so a series with two parents is no obstacle.
- The 13 series were fitted separately, so nothing forces the forecasts to add up. A top-down split fixes it on any structure, including a series with two parents. ::no Two separate ideas are mixed here. The gap does not come from missing data or from aggregates running high: the 2016 Q4 data add up exactly, and the 2017 Q3 gap is -3, the wrong sign for that. It comes from fitting 13 models with nothing shared between them. And a top-down split needs one parent per series, so it cannot handle Tasmania holiday, which has two.

=== step === tryit
## Your turn: declare a structure and count its series

Suppose the planners drop the State level and want `Region` crossed with `Purpose` instead. First work out how many series that structure has. Then declare it on `sl` and confirm the count with `n_keys()`.

```r
# Declare Region crossed with Purpose on sl and count the series
# Work out the count first: a total plus 10 regions, times a total plus 4 purposes
# Replace the line below with your aggregate_key call, then print n_keys()
regional <- sl
```
::check {"regex": "aggregate_key[(][^)]*(Region\\s*[*]\\s*Purpose|Purpose\\s*[*]\\s*Region)", "gate": true, "difficulty": "intermediate", "ok": "Right: 55 series. The Region part has a total plus 10 regions, the Purpose part has a total plus 4 purposes, and crossing multiplies them: 11 times 5.", "no": "Cross the two keys with * inside aggregate_key(), as in aggregate_key(Region * Purpose, Trips = sum(Trips)), then call n_keys() on the result."}
::solution
```r
# Cross Region with Purpose and count the series
regional <- sl |>
  aggregate_key(Region * Purpose, Trips = sum(Trips))

n_keys(regional)
#> [1] 55
```

The count comes from the node-count rule. Region has 1 + 10 = 11 nodes, Purpose has 1 + 4 = 5 nodes, and 11 times 5 is 55. There is no State level, so the 10 regions all sit directly under the total.

=== step === concept
## References

- [Forecasting: Principles and Practice, 3rd edition, chapter 11](https://otexts.com/fpp3/hierarchical.html) - Hyndman and Athanasopoulos (2021), OTexts. The chapter on hierarchical and grouped time series.
- [Hierarchical forecasts for Australian domestic tourism](https://doi.org/10.1016/j.ijforecast.2008.07.004) - Athanasopoulos, Ahmed and Hyndman (2009), International Journal of Forecasting 25(1), 146-166. A hierarchical forecasting study of Australian domestic tourism.
- [Optimal combination forecasts for hierarchical time series](https://doi.org/10.1016/j.csda.2011.03.006) - Hyndman, Ahmed, Athanasopoulos and Shang (2011), Computational Statistics and Data Analysis 55(9), 2579-2589.
- [Optimal forecast reconciliation for hierarchical and grouped time series through trace minimization](https://doi.org/10.1080/01621459.2018.1448825) - Wickramasuriya, Athanasopoulos and Hyndman (2019), Journal of the American Statistical Association 114(526), 804-819.
- [aggregate_key() reference page](https://fabletools.tidyverts.org/reference/aggregate_key.html) - the fabletools documentation.

=== step === complete
## Quick recap

You started from 40 bottom-level series, built a hierarchy, a grouped structure and a combination of both from them, and then saw what forecasting does to a hierarchy. To summarize:

- Count the parents of a bottom-level series. One parent means a hierarchy. Two parents means a grouped structure, where the attributes cross instead of nesting.
- `aggregate_key()` declares the structure. The `/` nests and the `*` crosses, and the series count is the product of each part's node count: 13 for `State / Region`, 5 for `Purpose`, so 65 series together.
- Series built by aggregation add up exactly: Tasmania's 833 thousand trips in 2016 Q4 equal the sum of its five regions.
- Forecasts made series by series do not. ETS fitted to each of the 13 series gave 1,032 for Tasmania in 2017 Q1 and 999 for its regions, a gap of 33, so the forecasts are incoherent. Adjusting them to add up is forecast reconciliation.
- The structure decides the method. Bottom-up and optimal combination work on a hierarchy and on a grouped structure. Top-down and middle-out split a total by shares, so they need one parent per series.

So with any set of related series, count the parents of a bottom series first: that count tells you which reconciliation methods you can use.

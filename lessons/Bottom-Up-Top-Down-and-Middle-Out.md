---
title: "Hierarchical and Grouped Forecasting Lesson 2: Bottom-up, top-down and middle-out"
slug: "Bottom-Up-Top-Down-and-Middle-Out"
description: "Make forecasts add up across a hierarchy with bottom-up, top-down and middle-out reconciliation in R, then compare the RMSE of each method at every level."
keywords: "bottom-up forecasting, top-down forecasting, middle-out forecasting, forecast reconciliation, hierarchical forecasting in R, coherent forecasts, historical proportions, RMSE by level, ets, forecast package"
mathjax: false
webr: true
post_type: "LESSON"
course_id: "ts-hierarchical"
course_title: "Hierarchical and Grouped Forecasting"
course_lesson: "2"
course_total: "5"
course_landing: "Hierarchical-and-Grouped-Forecasting-Course.html"
course_prev: "Hierarchical-and-Grouped-Time-Series"
course_next: "Optimal-Reconciliation-MinT"
curriculum_id: "5.120.2"
lesson_access: "pro"
catalog_blurb: "Three ways to make forecasts add up, and what each one costs in accuracy."
---

=== step === cover
## Bottom-up, top-down and middle-out

Today let's understand what to do when forecasts made one series at a time do not add up.

Priya is a demand planner at a bakery chain. The chain has 9 stores in 3 regions: North, Central and South. She has to give finance the forecast of monthly units sold for 2025, for the whole chain, for each region and for each store. That's 13 series in all, and finance will add them up.

So she forecasts each of the 13 series on its own. But when finance adds up the store forecasts, the region forecasts and the total forecast, the three do not match. The same question, how many units will we sell, has three different answers.

There are three standard ways to fix this: bottom-up, top-down and middle-out. We will build all three on the same data and see what each one costs in accuracy.

The sales are simulated to look like real bakery data. The chart shows the chain's total units for each month from January 2019 to December 2024.

::widget chart-plotter {"data":[{"x":1,"y":2396},{"x":2,"y":2292},{"x":3,"y":2643},{"x":4,"y":2617},{"x":5,"y":2837},{"x":6,"y":2998},{"x":7,"y":2665},{"x":8,"y":2683},{"x":9,"y":2784},{"x":10,"y":3025},{"x":11,"y":3108},{"x":12,"y":3586},{"x":13,"y":2446},{"x":14,"y":2398},{"x":15,"y":2559},{"x":16,"y":2771},{"x":17,"y":2965},{"x":18,"y":2861},{"x":19,"y":2717},{"x":20,"y":2772},{"x":21,"y":2884},{"x":22,"y":3086},{"x":23,"y":3141},{"x":24,"y":3771},{"x":25,"y":2592},{"x":26,"y":2443},{"x":27,"y":2709},{"x":28,"y":2669},{"x":29,"y":3039},{"x":30,"y":3041},{"x":31,"y":2790},{"x":32,"y":2898},{"x":33,"y":3008},{"x":34,"y":3250},{"x":35,"y":3419},{"x":36,"y":3797},{"x":37,"y":2673},{"x":38,"y":2600},{"x":39,"y":2893},{"x":40,"y":2978},{"x":41,"y":2970},{"x":42,"y":3177},{"x":43,"y":2875},{"x":44,"y":2981},{"x":45,"y":3046},{"x":46,"y":3345},{"x":47,"y":3301},{"x":48,"y":4058},{"x":49,"y":2743},{"x":50,"y":2613},{"x":51,"y":2846},{"x":52,"y":3009},{"x":53,"y":2983},{"x":54,"y":3010},{"x":55,"y":2919},{"x":56,"y":3133},{"x":57,"y":3003},{"x":58,"y":3410},{"x":59,"y":3388},{"x":60,"y":3812},{"x":61,"y":2808},{"x":62,"y":2744},{"x":63,"y":2921},{"x":64,"y":2956},{"x":65,"y":3212},{"x":66,"y":3268},{"x":67,"y":3133},{"x":68,"y":3210},{"x":69,"y":3157},{"x":70,"y":3442},{"x":71,"y":3884},{"x":72,"y":4411}],"geoms":["line","point"],"x":"month","y":"units"}

Switch between line and point. Every December is the highest month of its year, and sales trend upward over the years.

=== step === concept
## Why forecasts made series by series do not add up

Let's build Priya's data first, because every number from here on comes from it.

The 9 stores roll up into a **hierarchy** with three levels. At the bottom are the 9 stores. In the middle are the 3 regions, and each region is the sum of its 3 stores. At the top is the total, the sum of all 9 stores.

The sales are simulated for 84 months, January 2019 to December 2025. Each store has its own starting level, its own growth per month and its own noise, and all stores share one seasonal shape that peaks in December. N3 grows the fastest, at 1.5% a month.

```r
# Simulate 84 months of unit sales for 9 stores, three in each of three regions
set.seed(2026)
stores <- data.frame(
  store  = c("N1", "N2", "N3", "C1", "C2", "C3", "S1", "S2", "S3"),
  region = rep(c("North", "Central", "South"), each = 3),
  start  = c(620, 380, 100, 470, 290, 170, 460, 190, 100),
  growth = c(-0.001, 0.001, 0.015, 0.000, 0.002, 0.004, 0.001, 0.005, 0.008),
  noise  = c(0.05, 0.08, 0.12, 0.06, 0.10, 0.14, 0.04, 0.09, 0.13)
)
season <- c(0.86, 0.84, 0.92, 0.96, 1.00, 1.02, 0.98, 0.96, 1.00, 1.06, 1.12, 1.28)
season <- season / mean(season)

sales <- matrix(0, nrow = 84, ncol = 9, dimnames = list(NULL, stores$store))
for (i in 1:9) {
  trend <- stores$start[i] * (1 + stores$growth[i])^(0:83)
  sales[, i] <- round(trend * rep(season, 7) * exp(rnorm(84, 0, stores$noise[i])))
}
head(sales, 3)
#>       N1  N2 N3  C1  C2  C3  S1  S2 S3
#> [1,] 547 325 79 395 249 167 395 160 79
#> [2,] 493 342 83 392 218 147 383 150 84
#> [3,] 573 350 90 474 284 193 426 171 82
```

Each column is a store and each row is a month, so these are the first three months of 2019.

Now we add the stores up to regions and a total. A region or a total is just the sum of the stores under it.

```r
# Add the stores up to 3 regions and 1 total, giving 13 series in all
region_names <- c("North", "Central", "South")
store_names  <- stores$store
region_of    <- setNames(stores$region, stores$store)
stores_in    <- function(region) store_names[region_of == region]

all_series <- cbind(
  Total = rowSums(sales),
  sapply(region_names, function(r) rowSums(sales[, stores_in(r)])),
  sales
)
train_rows <- 1:72
test_rows  <- 73:84

dim(all_series)
#> [1] 84 13
all(all_series[, "Total"] == rowSums(all_series[, region_names]))
#> [1] TRUE
```

The last line confirms that the actual sales add up in every one of the 84 months. Nothing forces the same to hold for forecasts.

Months 1 to 72, January 2019 to December 2024, are the training months. Months 73 to 84 are the year 2025. That year is the **holdout**: data that no model is fit on, kept back so we can measure each forecast against what was really sold.

Next, one model per series. We fit an ETS model to each of the 13 training series and forecast the 12 months of 2025. ETS is exponential smoothing with an error term, a trend and a seasonal term.

Setting `model = "MAM"` fixes every series to multiplicative error, additive trend and multiplicative seasonality, and `damped = FALSE` keeps the trend going in a straight line instead of flattening it out over the forecast. With the same model form for all 13 series, the only thing that will differ between the methods later is how the forecasts are combined.

A forecast made for one series with its own model, without any regard for the other series, is called a **base forecast**. To see whether the 13 base forecasts agree with each other, we add up the base forecasts of each series' children, the series directly below it, and compare the sum with the series' own base forecast.

```r
# Fit one ETS(M,A,M) model to each of the 13 training series and forecast 2025
library(forecast)

base_fc <- sapply(colnames(all_series), function(name) {
  y <- ts(all_series[train_rows, name], start = c(2019, 1), frequency = 12)
  fit <- ets(y, model = "MAM", damped = FALSE)
  as.numeric(forecast(fit, h = 12)$mean)
})

children <- list(
  Total   = region_names,
  North   = stores_in("North"),
  Central = stores_in("Central"),
  South   = stores_in("South")
)
january <- base_fc[1, ]
sum_of_children <- sapply(children, function(kids) sum(january[kids]))

round(data.frame(
  base_forecast   = january[names(children)],
  sum_of_children = sum_of_children,
  gap             = january[names(children)] - sum_of_children
), 1)
#>         base_forecast sum_of_children  gap
#> Total          2873.7          2856.0 17.7
#> North          1117.0          1126.1 -9.2
#> Central         922.8           921.2  1.6
#> South           816.3           814.4  1.9
```

Read the Total row first. For January 2025 the three region forecasts add up to 2,856.0, but the total's own forecast is 2,873.7. That is a gap of 17.7 units. Inside North, the three stores add up to 1,126.1 while North's forecast is 1,117.0, a gap of -9.2.

A set of forecasts is **coherent** when every region equals the sum of its stores and the total equals the sum of the regions. These base forecasts are not coherent. The 13 models were fit separately, so nothing made them agree.

The gaps do not go away over a year. Let's add the 12 forecast months at each level.

```r
# Add the 12 forecast months of 2025 at each level and compare with what was sold
round(c(
  total_forecast = sum(base_fc[, "Total"]),
  sum_of_regions = sum(base_fc[, region_names]),
  sum_of_stores  = sum(base_fc[, store_names]),
  sold_in_2025   = sum(all_series[test_rows, "Total"])
))
#> total_forecast sum_of_regions  sum_of_stores   sold_in_2025
#>          39612          39604          39720          39779
```

The total's model says 39,612 units for 2025. The region models add up to 39,604 and the store models add up to 39,720. What was actually sold is 39,779. So the same year has three different forecasts.

Finance cannot plan against three numbers. Priya needs one set of forecasts that is coherent. Turning base forecasts into a coherent set is called **reconciliation**, and there are three standard rules for it.

=== step === concept
## Bottom-up: forecast every store, then add up

The first rule is the simplest. Keep the 9 store base forecasts exactly as they are, and add them up to get the regions and then the total.

```r
# Bottom-up: keep the 9 store forecasts and add them up to regions and the total
bu_stores  <- base_fc[, store_names]
bu_regions <- sapply(region_names, function(r) rowSums(bu_stores[, stores_in(r)]))
bu_total   <- rowSums(bu_stores)

round(c(bu_regions[1, ], Total = bu_total[1]), 1)
#>   North Central   South   Total
#>  1126.1   921.2   814.4  2861.7
```

For January 2025 North is now 1,126.1, the sum of N1, N2 and N3. Central is 921.2, South is 814.4 and the total is 2,861.7. The total's own base forecast was 2,873.7, and bottom-up does not use it.

So the regions and the total are new numbers, but the store forecasts are unchanged. That is what bottom-up means: it keeps the forecast at the bottom level and builds every level above it.

To check that a set of forecasts is coherent, `is_coherent()` compares the total with the sum of the regions and each region with the sum of its stores. It allows a tiny tolerance, 1e-8, because sums of decimals on a computer can differ in the last digits.

```r
# A set of forecasts is coherent when each level adds up to the level above it
is_coherent <- function(total, regions, stores) {
  total_gap  <- max(abs(total - rowSums(regions)))
  region_gap <- max(abs(regions - sapply(region_names, function(r) rowSums(stores[, stores_in(r)]))))
  max(total_gap, region_gap) < 1e-8
}

is_coherent(base_fc[, "Total"], base_fc[, region_names], base_fc[, store_names])
#> [1] FALSE
is_coherent(bu_total, bu_regions, bu_stores)
#> [1] TRUE
```

The base forecasts fail the check and the bottom-up forecasts pass it. They pass by construction, because every level is a sum of the level below.

Now let's compare the bottom-up forecasts for 2025 with what was sold.

```r
# Compare the bottom-up forecasts for 2025 with what was sold
round(c(
  bottom_up_total = sum(bu_total),
  sold_total      = sum(all_series[test_rows, "Total"]),
  bottom_up_N3    = sum(bu_stores[, "N3"]),
  sold_N3         = sum(all_series[test_rows, "N3"])
))
#> bottom_up_total      sold_total    bottom_up_N3         sold_N3
#>           39720           39779            3692            3931
```

The bottom-up total for 2025 is 39,720 against 39,779 sold. Store N3 is forecast at 3,692 against 3,931 sold.

Each month's error in the bottom-up total is the sum of the 9 store errors, because both the forecast total and the actual total are sums of the stores. So the accuracy of the total depends on all 9 store models at once.

=== step === concept
## Top-down: forecast the total, then split it by historical proportions

Top-down starts from the other end. Keep the total base forecast and split it across the stores. For the split, each store needs a proportion, its share of the chain's units.

We take the proportion from history: a store's units over the 72 training months divided by the total's units over the same months. This choice is called the proportions of the historical averages. It is one of several ways to pick proportions, and the simplest to compute.

```r
# Each store's proportion is its share of the chain's units over the 72 training months
td_props <- colSums(all_series[train_rows, store_names]) / sum(all_series[train_rows, "Total"])
round(100 * td_props, 1)
#>   N1   N2   N3   C1   C2   C3   S1   S2   S3
#> 19.8 13.3  6.1 15.7 10.4  6.8 16.0  7.5  4.6
```

N1 is the largest store with 19.8% of the chain's units and S3 the smallest with 4.6%. The 9 proportions add up to 1 before rounding.

A store's forecast for a month is its proportion times that month's total base forecast. The `outer()` function does this multiplication for all 12 months and all 9 stores at once. The regions are then the sums of their stores.

```r
# Top-down: split each month's total base forecast across the stores by those proportions
td_total   <- base_fc[, "Total"]
td_stores  <- outer(td_total, td_props)
td_regions <- sapply(region_names, function(r) rowSums(td_stores[, stores_in(r)]))

round(c(td_regions[1, ], Total = td_total[1]), 1)
#>   North Central   South   Total
#>  1124.4   944.1   805.2  2873.7
round(td_stores[1, c("N1", "N3")], 1)
#>    N1    N3
#> 568.3 174.0
is_coherent(td_total, td_regions, td_stores)
#> [1] TRUE
```

In January 2025 the total base forecast is 2,873.7. N1 gets 568.3 of it and N3 gets 174.0. North, Central and South get 1,124.4, 944.1 and 805.2, and those add up to 2,873.7, the total base forecast we started with.

So top-down keeps the total forecast and derives every level below it. The set is coherent because the proportions add up to 1, so the 9 store forecasts always add back to the total.

Now let's compare the top-down forecasts for N3 and N1 with what those stores sold in 2025.

```r
# Compare the top-down forecasts for N3 and N1 in 2025 with what those stores sold
round(c(
  top_down_N3 = sum(td_stores[, "N3"]),
  sold_N3     = sum(all_series[test_rows, "N3"]),
  top_down_N1 = sum(td_stores[, "N1"]),
  sold_N1     = sum(all_series[test_rows, "N1"])
))
#> top_down_N3     sold_N3 top_down_N1     sold_N1
#>        2398        3931        7833        6906
```

N3 is forecast at 2,398 units and sold 3,931, so top-down is 1,533 units, or 39%, too low. N1 is forecast at 7,833 and sold 6,906, which is 927 units, or 13%, too high.

The total forecast was close to what was sold, 39,612 against 39,779. So the miss comes from the split.

=== step === widget
## Why a fixed proportion misforecasts a store with a trending share

Top-down uses one proportion for every month of 2025. That works only if a store's share of the chain stays put, so let's look at N3's share.

The chart shows N3's share of the chain's units for each of the 72 training months: N3's units divided by the total's units in the same month, in percent.

::widget chart-plotter {"data":[{"x":1,"y":3.30},{"x":2,"y":3.62},{"x":3,"y":3.41},{"x":4,"y":3.52},{"x":5,"y":4.16},{"x":6,"y":3.47},{"x":7,"y":4.05},{"x":8,"y":4.03},{"x":9,"y":3.23},{"x":10,"y":4.17},{"x":11,"y":5.02},{"x":12,"y":4.21},{"x":13,"y":3.84},{"x":14,"y":4.96},{"x":15,"y":4.57},{"x":16,"y":4.91},{"x":17,"y":4.38},{"x":18,"y":4.93},{"x":19,"y":5.59},{"x":20,"y":4.98},{"x":21,"y":4.89},{"x":22,"y":4.34},{"x":23,"y":5.32},{"x":24,"y":4.56},{"x":25,"y":6.17},{"x":26,"y":5.20},{"x":27,"y":4.54},{"x":28,"y":6.56},{"x":29,"y":4.74},{"x":30,"y":4.27},{"x":31,"y":4.84},{"x":32,"y":5.28},{"x":33,"y":5.09},{"x":34,"y":5.63},{"x":35,"y":5.29},{"x":36,"y":4.53},{"x":37,"y":5.31},{"x":38,"y":6.92},{"x":39,"y":5.32},{"x":40,"y":5.37},{"x":41,"y":6.03},{"x":42,"y":7.21},{"x":43,"y":5.74},{"x":44,"y":6.71},{"x":45,"y":5.88},{"x":46,"y":5.95},{"x":47,"y":6.45},{"x":48,"y":6.97},{"x":49,"y":6.89},{"x":50,"y":7.58},{"x":51,"y":7.73},{"x":52,"y":8.84},{"x":53,"y":7.34},{"x":54,"y":5.51},{"x":55,"y":7.02},{"x":56,"y":6.32},{"x":57,"y":7.39},{"x":58,"y":8.33},{"x":59,"y":7.32},{"x":60,"y":7.35},{"x":61,"y":7.94},{"x":62,"y":8.27},{"x":63,"y":7.70},{"x":64,"y":8.73},{"x":65,"y":8.56},{"x":66,"y":8.60},{"x":67,"y":7.79},{"x":68,"y":8.85},{"x":69,"y":6.65},{"x":70,"y":9.27},{"x":71,"y":8.57},{"x":72,"y":10.68}],"geoms":["point","line"],"x":"month","y":"share_pct"}

N3's share starts at 3.3% in January 2019 and ends at 10.7% in December 2024. It climbs almost the whole way. In the point view the chart prints r = 0.91, the correlation between the month number and the share.

Let's put the yearly averages next to the proportion top-down used. The `tapply()` function takes the mean of the monthly shares within each calendar year.

```r
# N3's share of the chain's units in each year, next to the proportion top-down used
n3_share <- 100 * all_series[, "N3"] / all_series[, "Total"]
n1_share <- 100 * all_series[, "N1"] / all_series[, "Total"]
year <- rep(2019:2025, each = 12)

round(rbind(N3 = tapply(n3_share, year, mean), N1 = tapply(n1_share, year, mean)), 1)
#>    2019 2020 2021 2022 2023 2024 2025
#> N3  3.8  4.8  5.2  6.2  7.3  8.5  9.8
#> N1 21.4 21.2 20.9 19.3 18.8 17.6 17.4
round(100 * td_props[c("N3", "N1")], 1)
#>   N3   N1
#>  6.1 19.8
round(cor(1:72, n3_share[train_rows]), 2)
#> [1] 0.91
```

N3's average share was 3.8% in 2019, 8.5% in 2024 and 9.8% in 2025. Top-down used 6.1%, the share over all 72 months taken together, which N3 reached only around 2022. From 2023 on N3 sold a bigger share than the proportion says, so its forecast comes out too low.

N1 is the mirror case. Its share fell from 21.4% in 2019 to 17.6% in 2024 while top-down used 19.8%, so its forecast comes out too high.

[KEY INSIGHT]
A fixed historical proportion is an average of the past. For a store whose share of the total is trending, that average is wrong for the future, in whichever direction the share is moving.

=== step === quiz
## Quick check: why is the top-down forecast for store N3 so low?

Top-down forecast 2,398 units for N3 in 2025, and N3 sold 3,931. Which explanation fits the share chart?

::quiz {"correct": 3, "gate": true, "difficulty": "intermediate"}
- The total forecast was badly wrong, and the split passed the error down to N3. ::no
- The ETS model cannot forecast a store that grows as fast as N3. ::no
- N3's share of the chain rose during training, so its average share, 6.1%, is below its recent share. ::ok Yes. The proportion is an average over 72 months in which N3's share went from 3.3% to 10.7%. Its average share was 8.5% in 2024 and 9.8% in 2025, so 6.1% of the total forecast is too little.
- Top-down under-forecasts every store. ::no Not every store: N1 was over-forecast, 7,833 against 6,906 sold. The other two causes fail as well. The total forecast was only 0.4% low, 39,612 against 39,779 sold, and bottom-up used the same ETS models and got 3,692 for N3 against 3,931 sold. What is left is the proportion: a fixed 6.1% for a store whose share kept rising.

=== step === concept
## Middle-out: forecast the regions, add up and split down

Middle-out picks a level in the middle of the hierarchy and starts there. Here that level is the regions. Keep the 3 region base forecasts, then:

- Above the regions, add them up to get the total.
- Below the regions, split each region across its stores.

So middle-out is bottom-up above the middle level and top-down below it.

The split needs a proportion again, but now it is each store's share of its own region: the store's units over the training months divided by its region's units over the same months.

```r
# Middle-out: each store's share of its own region's units over the training months
mo_props <- sapply(store_names, function(s) {
  sum(all_series[train_rows, s]) / sum(all_series[train_rows, region_of[s]])
})
round(100 * mo_props[stores_in("North")], 1)
#>   N1   N2   N3
#> 50.5 34.0 15.5
```

In North, N1 has 50.5% of the region's units, N2 has 34.0% and N3 has 15.5%. Now the middle-out forecasts: the region forecasts stay as they are, the total is their sum, and each store gets its region's forecast times its proportion.

```r
# Keep the 3 region forecasts, add them up for the total, and split each region across its stores
mo_regions <- base_fc[, region_names]
mo_total   <- rowSums(mo_regions)
mo_stores  <- sapply(store_names, function(s) base_fc[, region_of[s]] * mo_props[s])

round(c(mo_regions[1, ], Total = mo_total[1]), 1)
#>   North Central   South   Total
#>  1117.0   922.8   816.3  2856.0
round(mo_stores[1, "N3"], 1)
#>    N3
#> 172.8
is_coherent(mo_total, mo_regions, mo_stores)
#> [1] TRUE
round(c(middle_out_N3 = sum(mo_stores[, "N3"]), sold_N3 = sum(all_series[test_rows, "N3"])))
#> middle_out_N3       sold_N3
#>          2399          3931
```

The January regions are the base forecasts, 1,117.0, 922.8 and 816.3. The total is 2,856.0, the sum of those three, and not the total's own 2,873.7. N3's January forecast is 172.8.

N3 is low again: 2,399 units in 2025 against 3,931 sold. The split below the regions also uses a fixed proportion, so it has the same weakness as top-down. Let's check whether N3's share of North rose too.

```r
# N3's share of North in each calendar year, next to the 15.5% the split used
round(100 * tapply(all_series[, "N3"] / all_series[, "North"], year, mean), 1)
#> 2019 2020 2021 2022 2023 2024 2025
#>  9.8 12.1 13.3 15.8 18.6 21.8 24.9
```

N3 had 9.8% of North's units in 2019 and 21.8% in 2024. The fixed 15.5% is too low in every year since 2022.

=== step === widget
## How accurate is each method at each level?

To compare the methods we need one accuracy number per level. The **RMSE**, the root mean squared error, is that number: square each month's forecast error, take the mean of the 12 squared errors and take the square root. It is in units, the same as the sales, and smaller is better.

We compute the RMSE of each of the 13 series on the 2025 holdout, then average the RMSEs within each level: 1 series at the total, 3 at the region level and 9 at the store level. The base forecasts get a column too, as the reference.

```r
# Compute RMSE by level for the base forecasts and the three methods on the 2025 holdout
actual_2025 <- all_series[test_rows, ]
bu_all <- cbind(Total = bu_total, bu_regions, bu_stores)
td_all <- cbind(Total = td_total, td_regions, td_stores)
mo_all <- cbind(Total = mo_total, mo_regions, mo_stores)

rmse_by_level <- function(forecasts, actual) {
  series_rmse <- sqrt(colMeans((forecasts - actual)^2))
  c(Total  = series_rmse[["Total"]],
    Region = mean(series_rmse[region_names]),
    Store  = mean(series_rmse[store_names]))
}

accuracy <- cbind(
  Base         = rmse_by_level(base_fc, actual_2025),
  `Bottom-up`  = rmse_by_level(bu_all, actual_2025),
  `Top-down`   = rmse_by_level(td_all, actual_2025),
  `Middle-out` = rmse_by_level(mo_all, actual_2025)
)
round(accuracy, 1)
#>        Base Bottom-up Top-down Middle-out
#> Total  75.0      79.6     75.0       76.2
#> Region 44.4      45.4     46.9       44.4
#> Store  29.1      29.1     50.8       51.2
```

Here is the same table as a report table. Switch between the raw print and the formatted version.

::widget styled-table {"cols":["Level","Base","Bottom-up","Top-down","Middle-out"],"rows":[["Total",75.0,79.6,75.0,76.2],["Region",44.4,45.4,46.9,44.4],["Store",29.1,29.1,50.8,51.2]],"formats":{"Base":"1dp","Bottom-up":"1dp","Top-down":"1dp","Middle-out":"1dp"},"title":"RMSE by level, 2025 holdout","note":"RMSE in units a month, averaged over the series at each level."}

RMSE is in units, so the total's RMSE is larger than a store's simply because the total sells more. Compare the methods within a level, across a row, and not one level with another.

Read each method against the Base column:

- Top-down matches Base at the total, 75.0. It kept the total base forecast.
- Middle-out matches Base at the region level, 44.4. It kept the 3 region base forecasts.
- Bottom-up matches Base at the store level, 29.1. It kept the 9 store base forecasts.

So each method leaves the base forecast unchanged at exactly one level and derives every other level from it. In 2025 accuracy is lost at the levels a method derives:

- Top-down's store RMSE is 50.8 against 29.1.
- Bottom-up's total RMSE is 79.6 against 75.0.
- Middle-out's RMSE is 76.2 at the total and 51.2 at the stores.

In 2025 each method is the most accurate of the three at the level where it keeps the base forecast. No method is the most accurate at every level.

Store N3 shows the cost of a fixed proportion most clearly.

```r
# RMSE for store N3 alone under each method
n3_methods <- list(`Bottom-up` = bu_all, `Top-down` = td_all, `Middle-out` = mo_all)
round(sapply(n3_methods, function(f) sqrt(mean((f[, "N3"] - actual_2025[, "N3"])^2))), 1)
#>  Bottom-up   Top-down Middle-out
#>       40.5      133.7      133.3
```

For N3 the RMSE is 40.5 under bottom-up against 133.7 under top-down and 133.3 under middle-out.

=== step === concept
## Do the RMSE results hold for earlier holdout years?

That table is for one holdout year, and a gap of a few units between two methods could be that year's luck. So let's run the same comparison for two earlier holdout years and average the three.

For the 2024 holdout we fit on the first 60 months and forecast months 61 to 72. For the 2023 holdout we fit on the first 48 months and forecast months 49 to 60. The proportions are recalculated from each training window.

All three methods end the same way: they produce 9 store forecasts and add up.

- Bottom-up uses the store base forecasts.
- Top-down uses the total's forecast times the proportions.
- Middle-out uses each region's forecast times the within-region proportions.

So `add_up()` builds all 13 forecast columns from 9 store forecasts. And `evaluate_origin()` reruns everything for a given number of training months, using the same `rmse_by_level()` as before.

```r
# Build the full 13-column forecast matrix from 9 store forecasts by adding up
add_up <- function(stores_fc) {
  regions_fc <- sapply(region_names, function(r) rowSums(stores_fc[, stores_in(r)]))
  cbind(Total = rowSums(stores_fc), regions_fc, stores_fc)
}

# Rerun the whole comparison for a holdout year that starts after n_train months
evaluate_origin <- function(n_train) {
  train  <- 1:n_train
  test   <- (n_train + 1):(n_train + 12)
  actual <- all_series[test, ]

  base <- sapply(colnames(all_series), function(name) {
    y <- ts(all_series[train, name], start = c(2019, 1), frequency = 12)
    as.numeric(forecast(ets(y, model = "MAM", damped = FALSE), h = 12)$mean)
  })

  td_props <- colSums(all_series[train, store_names]) / sum(all_series[train, "Total"])
  mo_props <- sapply(store_names, function(s) {
    sum(all_series[train, s]) / sum(all_series[train, region_of[s]])
  })

  bu <- add_up(base[, store_names])
  td <- add_up(outer(base[, "Total"], td_props))
  mo <- add_up(sapply(store_names, function(s) base[, region_of[s]] * mo_props[s]))

  cbind(
    Base         = rmse_by_level(base, actual),
    `Bottom-up`  = rmse_by_level(bu, actual),
    `Top-down`   = rmse_by_level(td, actual),
    `Middle-out` = rmse_by_level(mo, actual)
  )
}
```

Now we run it for the three holdout years. The first two tables show the total and the store RMSE for each method and year. The third is the mean of the three RMSE tables. `Reduce()` with the plus function adds the three tables cell by cell, and dividing by `length(results)`, which is 3, turns each cell into a mean.

```r
# Run the comparison for the 2023, 2024 and 2025 holdout years and average the results
origins <- c("2023" = 48, "2024" = 60, "2025" = 72)
results <- lapply(origins, evaluate_origin)

round(sapply(results, function(m) m["Total", ]), 1)
#>             2023  2024 2025
#> Base       139.8 139.6 75.0
#> Bottom-up  129.3 162.9 79.6
#> Top-down   139.8 139.6 75.0
#> Middle-out 139.2 141.5 76.2
round(sapply(results, function(m) m["Store", ]), 1)
#>            2023 2024 2025
#> Base       31.5 34.8 29.1
#> Bottom-up  31.5 34.8 29.1
#> Top-down   45.0 52.5 50.8
#> Middle-out 44.6 53.0 51.2
round(Reduce(`+`, results) / length(results), 1)
#>         Base Bottom-up Top-down Middle-out
#> Total  118.1     123.9    118.1      119.0
#> Region  57.3      59.2     60.6       57.3
#> Store   31.8      31.8     49.4       49.6
```

Start with the total. Bottom-up beat the base forecast in 2023, 129.3 against 139.8. But it lost in 2024, 162.9 against 139.6, and again in 2025, 79.6 against 75.0. So at the total the ranking of the methods changes from year to year.

Now the store level. Bottom-up equals Base and beats top-down in all three years: 31.5 against 45.0, 34.8 against 52.5 and 29.1 against 50.8. Middle-out stays close to top-down in every year.

The three-year means say the same. At the total, Base and top-down score 118.1, bottom-up scores 123.9 and middle-out scores 119.0. At the regions, Base and middle-out score 57.3, bottom-up scores 59.2 and top-down scores 60.6. At the stores, Base and bottom-up score 31.8, top-down scores 49.4 and middle-out scores 49.6.

At the total, bottom-up trailed top-down by 4.6 in 2025. Over the three years the gap is 5.8, which is 123.9 minus 118.1 from the mean table. At the store level, top-down's loss is much larger, 49.4 against 31.8, and it shows up every year.

[KEY INSIGHT]
A method gives up accuracy at the levels it derives, and how much it gives up depends on the level and on the year. The loss for top-down at the stores is large and appears in every holdout year. The loss for bottom-up at the total is small and changes sign in one year.

=== step === quiz
## Quick check: which method suits store-level stock orders?

Priya's stores each place a stock order from their own forecast. Which method should she use for those orders?

::quiz {"correct": 2, "gate": true, "difficulty": "intermediate"}
- Top-down, because the total is the easiest series to forecast. ::no
- Bottom-up, because it keeps each store's own base forecast and has the lowest store RMSE. ::ok Yes. Its store RMSE, averaged over the three holdout years, is 31.8, against 49.4 for top-down and 49.6 for middle-out. It costs something at the total, 123.9 against 118.1, but store orders are placed from the store forecasts.
- Middle-out, because it combines the best of both. ::no
- Any of them, because all three add up, so their accuracy is the same. ::no Adding up is a property of the set of forecasts, not a measure of accuracy. All three sets are coherent, and yet their store RMSE is 31.8, 49.4 and 49.6. A method has the base forecast's accuracy only at the level where it keeps the base forecast. Top-down and middle-out keep it at the total and the regions, not at the stores.

=== step === tryit
## Your turn: middle-out forecast for one store

S3 is the smallest store in South, and its middle-out forecast has not been worked out yet. Compute S3's January 2025 middle-out forecast: South's base forecast for January times S3's share of South's units over the training months. The objects `all_series`, `train_rows` and `base_fc` are still in your session.

```r
# Work out S3's January 2025 middle-out forecast.
# S3's share is its units over the training months divided by South's units over the same months.
# Multiply that share by South's base forecast for January.
# Two lines. Press Check when you have them.
```
::check {"regex": "(?=[\\s\\S]*base_fc[^\\n]*South)(?=[\\s\\S]*(sum|mean|colSums|colMeans)[(][^\\n]*S3[^\\n]*/\\s*(sum|mean)[(][^)]*South)", "gate": true, "difficulty": "intermediate", "ok": "Right: S3 has 16.3% of South's units, and 16.3% of South's January forecast of 816.3 is 132.9 units. That is the share of its own region, which is what middle-out splits by.", "no": "Middle-out splits South's forecast, so divide S3's units over the training months by South's units over the same months, not by the chain's units. Then multiply South's January base forecast, the January row of the South column in base_fc, by that share."}
::solution
```r
# Split South's January 2025 base forecast by each store's share of South's training units
s3_share <- sum(all_series[train_rows, "S3"]) / sum(all_series[train_rows, "South"])
s3_january <- base_fc[1, "South"] * s3_share
round(c(share_pct = 100 * s3_share, forecast = unname(s3_january)), 1)
#> share_pct  forecast
#>      16.3     132.9

south_shares <- colSums(all_series[train_rows, c("S1", "S2", "S3")]) / sum(all_series[train_rows, "South"])
south_january <- base_fc[1, "South"] * south_shares
round(south_january, 1)
#>    S1    S2    S3
#> 465.1 218.2 132.9
round(sum(south_january), 1)
#> [1] 816.3
```

S3 has 16.3% of South's units, so it gets 16.3% of South's January base forecast: 132.9 units. The three South stores get 465.1, 218.2 and 132.9, and together they add up to South's 816.3.

The chain's units are the wrong denominator here. S3's share of the chain is 4.6%, and using that share on South's forecast would give only 37.2 units, because it describes S3 against all 9 stores and not against its region.

=== step === concept
## References

- [Forecasting: Principles and Practice, 3rd ed., chapter 11, Forecasting hierarchical and grouped time series](https://otexts.com/fpp3/hierarchical.html). Hyndman and Athanasopoulos (2021), OTexts. Bottom-up, top-down and middle-out, and the proportions of the historical averages.
- Disaggregation methods to expedite product line forecasting. Gross and Sohl (1990), Journal of Forecasting 9(3), 233-254. The comparison of top-down proportion methods.
- [Hierarchical forecasts for Australian domestic tourism](https://doi.org/10.1016/j.ijforecast.2008.07.004). Athanasopoulos, Ahmed and Hyndman (2009), International Journal of Forecasting 25(1), 146-166. Bottom-up, top-down and middle-out compared on a real hierarchy.
- [Optimal combination forecasts for hierarchical time series](https://doi.org/10.1016/j.csda.2011.03.006). Hyndman, Ahmed, Athanasopoulos and Shang (2011), Computational Statistics and Data Analysis 55(9), 2579-2589. The single method that contains the three rules as special cases.
- [Automatic time series forecasting: the forecast package for R](https://doi.org/10.18637/jss.v027.i03). Hyndman and Khandakar (2008), Journal of Statistical Software 27(3), 1-22. The source of `ets()`.

=== step === complete
## Recap: the three methods and the level each leaves unchanged

You took 13 base forecasts that did not add up and made them coherent in three ways. To summarize:

- Bottom-up keeps the 9 store base forecasts and adds them up to the regions and the total.
- Top-down keeps the total base forecast and splits it across the stores by their historical proportions, then adds the stores up to the regions.
- Middle-out keeps the 3 region base forecasts, adds them up to the total and splits each region across its stores by the within-region proportions.
- Each method keeps the base forecast at one level and derives the rest. In 2025 its RMSE at that level equals the base RMSE: 75.0 at the total for top-down, 44.4 at the regions for middle-out and 29.1 at the stores for bottom-up.
- A fixed proportion misforecasts a store whose share is trending. N3's share rose from 3.8% in 2019 to 9.8% in 2025 while top-down used 6.1%, so it forecast 2,398 units against 3,931 sold.
- No method was best at every level. Over three holdout years bottom-up had the lowest store RMSE, 31.8 against 49.4 for top-down, and its total RMSE was 5.8 higher, 123.9 against 118.1.

So when someone asks which method to use, start with the level where accuracy matters most, and keep the base forecast at that level.

The next part covers a single reconciliation method of which all three of these are special cases, with its weights chosen from the covariance of the forecast errors.

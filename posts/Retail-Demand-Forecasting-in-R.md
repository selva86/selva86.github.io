---
title: "Retail Demand Forecasting in R: an End-to-End Case Study"
slug: "Retail-Demand-Forecasting-in-R"
description: "A complete retail demand forecasting case study in R: explore sales data, backtest ETS and ARIMA models, quantify uncertainty, and set inventory safety stock."
keywords: "retail demand forecasting in R, demand forecasting R, forecast retail sales R, fable demand forecasting, ETS ARIMA forecasting R, time series forecasting case study, safety stock forecasting, inventory forecasting R, seasonal demand forecast R"
auto_link_terms: "retail demand forecasting|demand forecasting in R|retail demand forecasting in R|forecast retail demand|demand forecasting case study|end-to-end forecasting workflow|forecast to inventory decision|safety stock from a forecast|service level forecasting|turn a forecast into a decision|retail sales forecasting"
auto_link_case_sensitive: false
mathjax: true
webr: true
date: "2026-07-23"
curriculum_id: "TS2-13.4"
post_type: "C"
sidebar_section: "Time Series"
sidebar_title: "Retail Demand Forecasting"
sidebar_order: "64"
difficulty: "Intermediate"
---

<p class="lead">Retail demand forecasting predicts how much a store will sell in future periods, so the business can hold the right amount of stock. This is a full case study on one real retail series: we start from raw monthly sales, explore what drives them, test several models honestly, quantify how uncertain the forecast is, and finish by deciding exactly how much stock to hold. Every number on this page was produced by running the code, not estimated.</p>

## How does an end-to-end retail demand forecast work in R?

Picture a group of department stores in the Australian state of Victoria. Every month they record their total sales, and every year the planning team has to answer one question: how much stock should we carry, month by month, so we neither run out during the Christmas rush nor drown in leftover inventory in February? To answer that, they first need a forecast of demand. Here is the entire forecast for the next year, produced by a single command, before we explain any of the moving parts.

```r title="Load libraries and forecast a year of demand"
library(tsibble)
library(fable)
library(tsibbledata)
library(dplyr)

demand <- aus_retail |>
  filter(State == "Victoria", Industry == "Department stores") |>
  as_tibble() |>
  transmute(Month, Sales = Turnover) |>
  as_tsibble(index = Month)

demand |>
  model(ets = ETS(Sales)) |>
  forecast(h = 12)
#> # A fable: 12 x 4 [1M]
#> # Key:     .model [1]
#>    .model    Month        Sales .mean
#>    <chr>     <mth>       <dist> <dbl>
#>  1 ets    2019 Jan  N(369, 355)  369.
#>  2 ets    2019 Feb  N(288, 219)  288.
#>  3 ets    2019 Mar  N(367, 359)  367.
#>  4 ets    2019 Apr  N(385, 400)  385.
#>  5 ets    2019 May  N(382, 400)  382.
#>  6 ets    2019 Jun  N(399, 442)  399.
#>  7 ets    2019 Jul  N(377, 403)  377.
#>  8 ets    2019 Aug  N(338, 329)  338.
#>  9 ets    2019 Sep  N(353, 365)  353.
#> 10 ets    2019 Oct  N(390, 453)  390.
#> 11 ets    2019 Nov  N(442, 593)  442.
#> 12 ets    2019 Dec N(744, 1717)  744.
```

Read what came back. `aus_retail` is a dataset of Australian retail turnover that ships with the `tsibbledata` package, and we kept a single slice of it: department-store sales in Victoria, renamed to `Sales`. The `model(ets = ETS(Sales))` step fitted an exponential smoothing model, and `forecast(h = 12)` asked it for the next 12 months. The result is a small table where each row is a future month, the `Sales` column holds the forecast as a probability distribution written `N(mean, variance)`, and `.mean` is the single best-guess number pulled out of that distribution. Look at the last row: the model expects December to reach 744, more than double a quiet month, which is precisely the peak the stocking decision has to get right.

That one command is the destination. The rest of this page is the journey that makes the forecast trustworthy and turns it into a stocking decision. Figure 1 lays out the whole route.

![The end-to-end retail demand forecasting workflow, from raw sales history to a stocking decision](screenshots/Retail-Demand-Forecasting-in-R-workflow.webp)

*Figure 1: The whole journey from raw sales to a stocking decision.*

Before we go further, let us look at the raw material we are working with. The `demand` object we built is a tsibble, which is a table that knows one column is time. Printing it shows the shape of the data.

```r title="Inspect the demand series"
demand
#> # A tsibble: 441 x 2 [1M]
#>       Month Sales
#>       <mth> <dbl>
#>  1 1982 Apr 104. 
#>  2 1982 May 110. 
#>  3 1982 Jun  96.7
#>  4 1982 Jul 105. 
#>  5 1982 Aug  92.5
#>  6 1982 Sep  98.3
#>  7 1982 Oct 103. 
#>  8 1982 Nov 115. 
#>  9 1982 Dec 208. 
#> 10 1983 Jan  81.5
#> # ℹ 431 more rows
```

We have 441 monthly observations running from April 1982 to December 2018, one number per month. Notice the very first December already jumps to 208 while the months around it sit near 100. That Christmas spike is the single most important feature of retail demand, and we will come back to it many times.

[NOTE]
**Sales here are monthly turnover in millions of dollars, used as our demand signal.** Real demand planning often works in units per product, but the workflow is identical: swap the column and everything downstream still holds. We use the tidyverts tools (`tsibble`, `fable` and friends) throughout because they keep the time structure attached as we wrangle.

**Try it:** Build the demand series for a different Victorian category, "Cafes, restaurants and takeaway food services", and count how many months it covers. The starter below builds the series for you.

```r title="Your turn: build a second demand series"
ex_cafes <- aus_retail |>
  filter(State == "Victoria",
         Industry == "Cafes, restaurants and takeaway food services") |>
  as_tibble() |>
  transmute(Month, Sales = Turnover) |>
  as_tsibble(index = Month)
# your code: count the months in ex_cafes
```

<details>
<summary>Click to reveal solution</summary>

```r title="Count the months in the cafes series"
nrow(ex_cafes)
#> [1] 441
```

**Explanation:** `nrow()` counts the rows, and each row is one month. Every series in `aus_retail` covers the same 441 months, so any category you pick starts and ends on the same dates.

</details>

## What is the demand data telling us?

Before modeling anything, look at the data. A quick plot answers more questions than a page of summary statistics, so we draw the whole history first.

```r title="Plot the full demand history"
library(feasts)
library(ggplot2)

autoplot(demand, Sales) +
  labs(y = "Monthly sales ($m)", title = "Victoria department store demand")
```

Run that and three things jump out. The line drifts upward over the decades, so there is a long-run trend. Every year has a sharp spike, so there is strong yearly seasonality. And the spikes get taller as the years pass, so the size of the seasonal swing grows with the overall level. That last point matters for model choice, and we will name it properly soon.

Let us quantify the spike. If we average sales within each calendar month across all years, the seasonal shape shows up as plain numbers.

```r title="Average demand by calendar month"
demand |>
  as_tibble() |>
  mutate(month = lubridate::month(Month, label = TRUE)) |>
  group_by(month) |>
  summarise(avg_sales = round(mean(Sales), 0)) |>
  arrange(desc(avg_sales)) |>
  head(6)
#> # A tibble: 6 × 2
#>   month avg_sales
#>   <ord>     <dbl>
#> 1 Dec         516
#> 2 Nov         299
#> 3 Jun         262
#> 4 May         261
#> 5 Oct         261
#> 6 Apr         255
```

December averages 516, nearly double November at 299, and roughly twice a typical off-peak month near 260. For a department store this is the whole ballgame: get December right and you have got most of the year right.

[KEY INSIGHT]
**Seasonality is the dominant signal in retail demand, so the model must nail the December peak.** A forecast that is smooth and pleasant but misses Christmas is worse than useless, because Christmas is when the stocking decision has real money on the line.

We can go one level deeper and formally split the series into its parts. STL decomposition separates any series into a slow-moving trend, a repeating seasonal pattern, plus whatever noise is left over. The `feat_stl` feature reports how strong each part is, on a 0-to-1 scale.

```r title="Measure trend and seasonal strength"
demand |>
  features(Sales, feat_stl) |>
  select(trend_strength, seasonal_strength_year)
#> # A tibble: 1 × 2
#>   trend_strength seasonal_strength_year
#>            <dbl>                  <dbl>
#> 1          0.988                  0.986
```

Both strengths are about 0.99, which is close to the maximum of 1. In plain terms, almost all of the movement in this series is explained by its trend and its yearly season, and very little is random noise. That is good news: a demand series this regular is highly forecastable.

To see the pieces themselves, pull out the decomposition components and look at the first rows, then plot them.

```r title="Decompose the series with STL"
dcmp <- demand |>
  model(STL(Sales)) |>
  components()

dcmp |> select(Month, trend, season_year, remainder)
#> # A tsibble: 441 x 4 [1M]
#>       Month trend season_year remainder
#>       <mth> <dbl>       <dbl>     <dbl>
#>  1 1982 Apr  107.       -5.95    3.04  
#>  2 1982 May  107.        5.89   -3.11  
#>  3 1982 Jun  108.      -12.7     1.70  
#>  4 1982 Jul  108.       -8.71    5.26  
#>  5 1982 Aug  108.      -18.3     2.29  
#>  6 1982 Sep  109.      -14.0     3.40  
#>  7 1982 Oct  109.       -7.35    0.797 
#>  8 1982 Nov  110.        4.86   -0.0548
#>  9 1982 Dec  110.      136.    -37.5   
#> 10 1983 Jan  111.      -25.4    -3.78  
#> # ℹ 431 more rows
```

Each month's actual sales equal `trend + season_year + remainder`. The `trend` column is the smooth backbone, `season_year` is the repeating monthly adjustment, and `remainder` is the small unexplained wiggle. Look at row 9, the first December: its seasonal adjustment is +136, a massive positive bump, while the quiet months carry small negative adjustments. Plotting the components with `autoplot(dcmp)` stacks these three panels so you can see each one on its own.

**Try it:** Put a single number on the Christmas spike. Compute the December average divided by the overall monthly average. The starter builds both averages for you.

```r title="Your turn: size the Christmas spike"
ex_all <- mean(demand$Sales)                 # overall monthly average
ex_dec <- demand |> as_tibble() |>
  filter(lubridate::month(Month) == 12) |>
  summarise(dec = mean(Sales)) |> pull(dec)  # December average
# your code: divide the December average by the overall average
```

<details>
<summary>Click to reveal solution</summary>

```r title="How big is the Christmas spike?"
round(ex_dec / ex_all, 2)
#> [1] 1.9
```

**Explanation:** December demand runs about 1.9 times the average month. That single multiple is why inventory planning for this category lives or dies by the December forecast.

</details>

## How do you test a demand forecast honestly?

Here is the mistake that ruins most forecasting projects: judging a model by how well it fits the data it was trained on. A flexible model can trace the past almost perfectly and still forecast the future terribly, the same way memorizing last year's exam does not mean you understand the subject. The only honest test is to hide the most recent stretch of data, forecast it as if it were unknown, then compare against what actually happened.

So we split the series in time. Everything up to December 2016 becomes the training set, and the final two years (2017 and 2018) become the test set. `filter_index()` slices a tsibble by date in one line.

```r title="Split into training and test sets"
train <- demand |> filter_index(. ~ "2016 Dec")
test  <- demand |> filter_index("2017 Jan" ~ .)

cat("train:", nrow(train), " test:", nrow(test), "\n")
#> train: 417  test: 24
```

The training set holds 417 months and the test set holds the last 24. We deliberately kept two full years in the test set so the evaluation covers two separate Christmases, not just one lucky (or unlucky) December. Figure 2 shows the shape of this honest test.

![An honest backtest splits history into an older training portion and a recent test portion, fits on the training data, forecasts the test window, and scores against the real values](screenshots/Retail-Demand-Forecasting-in-R-backtest.webp)

*Figure 2: Train on older months, test on recent ones, then score.*

[WARNING]
**A model scored on its own training data almost always looks better than it really is.** Always hold out the most recent months, forecast them as if they were unknown, then score against the truth. The recent window matters because it is the closest thing you have to the future you actually care about.

**Try it:** Suppose you only wanted a one-year test instead of two. Build a test set that holds out just 2018, and count its months. The starter makes the slice.

```r title="Your turn: hold out only the last year"
ex_test <- demand |> filter_index("2018 Jan" ~ .)
# your code: how many months are in ex_test, and what range do they cover?
```

<details>
<summary>Click to reveal solution</summary>

```r title="Count the held-out months"
nrow(ex_test)
#> [1] 12
range(ex_test$Month)
#> <yearmonth[2]>
#> [1] "2018 Jan" "2018 Dec"
```

**Explanation:** `filter_index("2018 Jan" ~ .)` keeps every month from January 2018 to the end, which is the 12 months of 2018. A shorter test window trains on more data but tests on fewer Christmases, so you trade evidence for training history.

</details>

## Which model forecasts demand best?

Now we fit real models and let the backtest pick a winner. We will try four, from dumb to smart, because a smart model is only worth its complexity if it beats the dumb one.

The first is `SNAIVE`, the seasonal naive method, which forecasts each month to equal the same month last year. It is the baseline every serious model must clear. The second is `ETS`, exponential smoothing, which tracks a level, a trend, and a season and updates them as new data arrives. The third is `ARIMA`, which models each value from its own recent past values and past errors. The fourth is a version of `ETS` fitted to the logarithm of sales, our way of handling the fact that the seasonal swings grow with the level.

That last idea deserves one check. When the size of the seasonal wobble grows with the level, a transformation can even it out. The Guerrero method suggests a good power transformation automatically.

```r title="Find a variance-stabilizing transformation"
demand |> features(Sales, features = guerrero)
#> # A tibble: 1 × 1
#>   lambda_guerrero
#>             <dbl>
#> 1           0.173
```

The suggested power (lambda) is 0.173, which sits close to 0. A lambda of exactly 0 corresponds to a log transformation, so taking logs is a sensible, interpretable choice, which is why our fourth model uses `log(Sales)`. Now we fit all four at once.

```r title="Fit four candidate models"
fit <- train |>
  model(
    snaive  = SNAIVE(Sales),
    ets     = ETS(Sales),
    arima   = ARIMA(Sales),
    ets_log = ETS(log(Sales))
  )
fit
#> # A mable: 1 x 4
#>     snaive          ets                     arima      ets_log
#>    <model>      <model>                   <model>      <model>
#> 1 <SNAIVE> <ETS(M,A,M)> <ARIMA(0,1,2)(0,1,1)[12]> <ETS(A,A,A)>
```

The result is a mable, short for model table, holding all four fitted models in one row. Look at what the automatic search chose. We never specified an ETS or ARIMA shape; writing `ETS(Sales)` told fable to search the family and keep the best fit. It landed on `ETS(M,A,M)`, meaning multiplicative errors and an additive trend, paired with a multiplicative season. The `M` on the season is important: it means the model already assumes the seasonal swing scales with the level, which is exactly the behavior we spotted in the plot.

To read one model in detail, `report()` prints its inner workings.

```r title="Report the fitted ETS model"
fit |> select(ets) |> report()
#> Series: Sales 
#> Model: ETS(M,A,M) 
#>   Smoothing parameters:
#>     alpha = 0.1009497 
#>     beta  = 0.005779738 
#>     gamma = 0.2220998 
#>   sigma^2:  0.0027
#>      AIC     AICc      BIC 
#> 4648.269 4649.803 4716.832 
```

The three smoothing parameters say how fast the model reacts to new information. A small `alpha` of about 0.10 means the level updates slowly and smoothly, `beta` near zero means the trend barely changes, and `gamma` of about 0.22 means the seasonal pattern adapts at a moderate pace. (The report also lists twelve seasonal starting values, which we have left out here for space.) These are learned from the data, not set by us.

A mable is not a forecast. To get one, pass it to `forecast()` with a horizon. Because we want to compare against the held-out 24 months, we forecast 24 months ahead.

```r title="Forecast the held-out window"
fc <- fit |> forecast(h = 24)
fc
#> # A fable: 96 x 4 [1M]
#> # Key:     .model [4]
#>    .model    Month       Sales .mean
#>    <chr>     <mth>      <dist> <dbl>
#>  1 snaive 2017 Jan N(367, 306)  367.
#>  2 snaive 2017 Feb N(291, 306)  291.
#>  3 snaive 2017 Mar N(368, 306)  368.
#>  4 snaive 2017 Apr N(368, 306)  368.
#>  5 snaive 2017 May N(362, 306)  362.
#>  6 snaive 2017 Jun N(397, 306)  397.
#>  7 snaive 2017 Jul N(359, 306)  359.
#>  8 snaive 2017 Aug N(316, 306)  316 
#>  9 snaive 2017 Sep N(336, 306)  336.
#> 10 snaive 2017 Oct N(364, 306)  364.
#> # ℹ 86 more rows
```

That is 96 rows, which is 4 models times 24 months. Now for the moment of truth. `accuracy()` lines each forecast up against the real value in that month and scores it. We pass the full `demand` series so it can find the actual 2017 and 2018 numbers.

```r title="Score every model on held-out demand"
acc <- accuracy(fc, demand)
acc |> select(.model, RMSE, MAE, MAPE, MASE, RMSSE) |> arrange(RMSSE)
#> # A tibble: 4 × 6
#>   .model   RMSE   MAE  MAPE  MASE RMSSE
#>   <chr>   <dbl> <dbl> <dbl> <dbl> <dbl>
#> 1 ets      13.1  10.2  2.60 0.755 0.748
#> 2 arima    13.1  10.6  2.98 0.781 0.751
#> 3 ets_log  13.3  10.5  2.66 0.773 0.759
#> 4 snaive   15.9  13.1  3.45 0.968 0.907
```

Read the table from the bottom up. The naive baseline (`snaive`) has the largest errors, as expected. All three real models beat it, and the plain `ets` model wins on every measure, with an average error (MAE) of about 10.2 million dollars a month and a MAPE of 2.6 percent. Notice that `ets_log`, the version with the log transform, actually did slightly worse than plain `ets`. That is a genuine and useful result: the multiplicative `ETS(M,A,M)` already handles the growing seasonal swing on its own, so the extra log transform is redundant here rather than helpful.

The two right-hand columns, MASE and RMSSE, are scaled errors. They divide a model's error by the error of the naive baseline, so a value below 1 means the model beat the baseline. The winning `ets` scores 0.748, meaning its errors are about a quarter smaller than just repeating last year.

[KEY INSIGHT]
**Scaled errors like MASE and RMSSE tell you whether a model earned its keep.** Below 1 beats the naive baseline, above 1 loses to it. Because the scaling removes the size of the series, you can compare a tiny product line against a whole department on the same footing.

Numbers land harder as a picture. Let us plot the actual demand against the point forecasts from the winner and the baseline over the test window.

```r title="Plot forecasts against actual demand"
library(ggplot2)
recent  <- demand |> filter_index("2015 Jan" ~ .) |> as_tibble() |> mutate(Month = as.Date(Month))
fc_plot <- fc |> filter(.model %in% c("ets", "snaive")) |> as_tibble() |> mutate(Month = as.Date(Month))

ggplot() +
  geom_line(data = recent, aes(Month, Sales), colour = "grey40") +
  geom_line(data = fc_plot, aes(Month, .mean, colour = .model), linewidth = 0.8) +
  labs(y = "Monthly sales ($m)", colour = "Model")
```

Run it and the grey line is the truth while the coloured lines are the two forecasts. The `ets` line tracks the real Christmas peaks closely, while the `snaive` line is a flatter copy of the previous year that lags the growth. Seeing the fit is worth a dozen accuracy tables.

**Try it:** The winner was chosen by RMSSE, but a planner might care more about plain average error. Rank the four models by MAE instead. The starter selects the columns for you.

```r title="Your turn: rank the models by MAE"
ex_rank <- acc |> select(.model, MAE)
# your code: arrange ex_rank so the smallest MAE is on top
```

<details>
<summary>Click to reveal solution</summary>

```r title="Models ranked by mean absolute error"
acc |> select(.model, MAE) |> arrange(MAE)
#> # A tibble: 4 × 2
#>   .model    MAE
#>   <chr>   <dbl>
#> 1 ets      10.2
#> 2 ets_log  10.5
#> 3 arima    10.6
#> 4 snaive   13.1
```

**Explanation:** `ets` still leads, so the choice is robust: it wins whether you rank by scaled error or by plain average error. When different metrics agree, you can trust the pick.

</details>

## How certain is the forecast, and why does that matter for stock?

A point forecast is a single number, and single numbers are dangerous for inventory. If the model predicts 744 and you stock exactly 744, you have a coin-flip chance of running out, because real demand lands above the forecast half the time. To decide stock levels you need the whole range of likely demand, not just its center.

Every forecast in a fable already carries that range as its distribution. The `hilo()` function turns a distribution into a plain low-high band at whatever confidence level you name. Here is the 95 percent band for the winning model over the first few test months.

```r title="Read a 95 percent forecast interval"
fc |>
  filter(.model == "ets") |>
  hilo(level = 95) |>
  as_tibble() |>
  transmute(Month, mean = round(.mean, 0), interval = `95%`) |>
  head(6)
#> # A tibble: 6 × 3
#>      Month  mean               interval
#>      <mth> <dbl>                 <hilo>
#> 1 2017 Jan   362 [324.8573, 398.8265]95
#> 2 2017 Feb   284 [255.0384, 313.4771]95
#> 3 2017 Mar   359 [322.1447, 396.4708]95
#> 4 2017 Apr   373 [333.8923, 411.5087]95
#> 5 2017 May   367 [328.6337, 405.6497]95
#> 6 2017 Jun   387 [346.4780, 428.3873]95
```

Each row now shows a best guess plus the range the model is 95 percent sure the true demand falls within. For January 2017 the model expects about 362 and is 95 percent confident the real figure lands between roughly 325 and 399. That spread, not the single number, is what an inventory decision actually needs.

[TIP]
**Reach for hilo() whenever someone asks "how sure are you?"** It converts any forecast distribution into plain low-high numbers at the level you choose, so you can hand a stakeholder an honest range without touching a standard-error formula.

**Try it:** Business reports often prefer an 80 percent band to a 95 percent one. Produce the 80 percent interval for the winning model. The starter filters to the `ets` forecasts.

```r title="Your turn: get an 80 percent interval"
ex_ets <- fc |> filter(.model == "ets")
# your code: pipe ex_ets through hilo() at the 80 percent level
```

<details>
<summary>Click to reveal solution</summary>

```r title="An 80 percent interval for the winner"
fc |>
  filter(.model == "ets") |>
  hilo(level = 80) |>
  as_tibble() |>
  transmute(Month, mean = round(.mean, 0), interval = `80%`) |>
  head(4)
#> # A tibble: 4 × 3
#>      Month  mean               interval
#>      <mth> <dbl>                 <hilo>
#> 1 2017 Jan   362 [337.6590, 386.0249]80
#> 2 2017 Feb   284 [265.1522, 303.3633]80
#> 3 2017 Mar   359 [335.0081, 383.6073]80
#> 4 2017 Apr   373 [347.3252, 398.0758]80
```

**Explanation:** The 80 percent band is narrower than the 95 percent band, because you are asking the model to be sure about a smaller range. Same forecast, same `hilo()` verb, just a lower confidence level.

</details>

## How do you turn the forecast into an inventory decision?

This is the payoff, and it is the part most tutorials skip. A forecast is only useful if it changes a decision, and the decision here is: how much stock do we hold for each month? The bridge between the two is a service level, which is the probability you want of not running out. A 95 percent service level means you are willing to stock out only 1 month in 20.

First we commit to the winner and use all the data. We refit `ETS(Sales)` on the full history (no need to hold anything back now that the model is chosen) and forecast the real future, 2019.

```r title="Refit the winner and forecast 2019"
fit_full <- demand |> model(ets = ETS(Sales))
fc_2019 <- fit_full |> forecast(h = 12)

fc_2019 |> hilo(level = 95) |>
  as_tibble() |>
  transmute(Month, point = round(.mean, 0),
            lo = round(`95%`$lower, 0), hi = round(`95%`$upper, 0))
#> # A tibble: 12 × 4
#>       Month point    lo    hi
#>       <mth> <dbl> <dbl> <dbl>
#>  1 2019 Jan   369   332   405
#>  2 2019 Feb   288   259   317
#>  3 2019 Mar   367   330   404
#>  4 2019 Apr   385   346   424
#>  5 2019 May   382   343   421
#>  6 2019 Jun   399   357   440
#>  7 2019 Jul   377   338   417
#>  8 2019 Aug   338   303   374
#>  9 2019 Sep   353   316   391
#> 10 2019 Oct   390   348   431
#> 11 2019 Nov   442   394   489
#> 12 2019 Dec   744   663   825
```

December 2019 is forecast at 744, with a 95 percent range of 663 to 825. That December row is where the stocking decision bites, so let us pull out its distribution and read off its two key numbers: the mean and the standard deviation.

```r title="Extract the December demand distribution"
dec <- fc_2019 |> filter(lubridate::month(Month) == 12)
dec_dist <- dec$Sales[[1]]

mu  <- mean(dec_dist)
sig <- sqrt(distributional::variance(dec_dist))
cat("December mean:", round(mu, 1), "  sd:", round(sig, 1), "\n")
#> December mean: 744   sd: 41.4
```

The model says December demand is centered on 744 with a standard deviation of about 41. The standard deviation is the width of our uncertainty, and it is the raw material for the stocking decision. Figure 3 shows the idea: pick a service level, read the matching quantile of the demand distribution, and that quantile is the stock to hold.

![A forecast distribution is converted into a stock level by choosing a service level and reading the matching quantile](screenshots/Retail-Demand-Forecasting-in-R-inventory.webp)

*Figure 3: A forecast distribution becomes a stock level via a quantile.*

Now we build the actual stocking table. For a normal demand distribution, the stock needed for a given service level is the mean plus a multiple of the standard deviation, where the multiple `z` comes from the normal curve (`qnorm()`). The safety stock is the extra cushion above the average forecast.

```r title="Build a service-level stocking table"
stock_plan <- tibble(service_level = c(0.80, 0.90, 0.95, 0.99)) |>
  mutate(
    z             = round(qnorm(service_level), 2),
    stock_to_hold = round(mu + qnorm(service_level) * sig, 0),
    safety_stock  = round(qnorm(service_level) * sig, 0)
  )
stock_plan
#> # A tibble: 4 × 4
#>   service_level     z stock_to_hold safety_stock
#>           <dbl> <dbl>         <dbl>        <dbl>
#> 1          0.8   0.84           779           35
#> 2          0.9   1.28           797           53
#> 3          0.95  1.64           812           68
#> 4          0.99  2.33           840           96
```

Read this as a menu of choices. To be 95 percent sure of meeting December demand, hold 812 worth of stock, which is 68 above the 744 forecast. Want near-certainty at 99 percent? That costs 840, a 96 cushion. The jump from 95 to 99 percent raises the safety stock from 68 to 96, a 40 percent bigger cushion for only 4 extra points of coverage, which is the diminishing return every inventory manager learns to respect.

You do not have to trust the formula on faith. The stock level it produces is exactly the quantile of the forecast distribution, which fable can compute directly.

```r title="Confirm the stock level equals the forecast quantile"
cat("formula  mu + z*sig :", round(mu + qnorm(0.95) * sig, 1), "\n")
cat("fable quantile 0.95 :", round(quantile(dec_dist, 0.95)[[1]], 1), "\n")
#> formula  mu + z*sig : 812.1 
#> fable quantile 0.95 : 812.1
```

The two agree at 812.1. This is the classic safety-stock formula meeting the modern forecast distribution, and they are the same thing.

If you like the math, here it is in one line. The safety stock you hold above the forecast mean is:

$$SS = z_{sl} \cdot \sigma$$

Where:

- $SS$ = the safety stock (the cushion above the average forecast)
- $z_{sl}$ = the normal multiplier for your chosen service level (for example 1.645 at 95 percent)
- $\sigma$ = the standard deviation of the demand forecast

If you are not interested in the formula, skip it: the stock table above is all you need to act.

[KEY INSIGHT]
**The forecast's uncertainty is the direct input to safety stock, so a sharper forecast frees up cash.** A smaller $\sigma$ means a smaller cushion for the same service level, which is inventory you no longer have to buy and warehouse. That is the concrete business value of a better model.

**Try it:** A manager wants the stock level for a 97.5 percent service level. The December mean `mu` and standard deviation `sig` are already in memory from above.

```r title="Your turn: stock for a 97.5 percent service level"
# mu and sig are the December mean and standard deviation from above
# your code: compute mu + qnorm(0.975) * sig, rounded to a whole number
```

<details>
<summary>Click to reveal solution</summary>

```r title="Stock for a 97.5 percent service level"
round(mu + qnorm(0.975) * sig, 0)
#> [1] 825
```

**Explanation:** At 97.5 percent the multiplier `qnorm(0.975)` is about 1.96, so the stock level is 825, sitting neatly between the 95 percent (812) and 99 percent (840) levels from the table.

</details>

## Complete Example: from raw data to a stocking decision

Here is the whole case study compressed into one runnable block, so you can see the pipeline as a single thought. It rebuilds the series, backtests the winning model, refits on all the data, forecasts December, and reports the 95 percent stock level, using fresh `cx_` variable names so it does not disturb anything above.

```r title="End-to-end demand forecast and stocking decision"
cx_demand <- aus_retail |>
  filter(State == "Victoria", Industry == "Department stores") |>
  as_tibble() |> transmute(Month, Sales = Turnover) |>
  as_tsibble(index = Month)

cx_fit   <- cx_demand |> filter_index(. ~ "2016 Dec") |> model(ets = ETS(Sales))
cx_rmsse <- cx_fit |> forecast(h = 24) |> accuracy(cx_demand) |> pull(RMSSE)

cx_final <- cx_demand |> model(ets = ETS(Sales)) |> forecast(h = 12)
cx_dec   <- cx_final |> filter(lubridate::month(Month) == 12)
cx_mu    <- mean(cx_dec$Sales[[1]])
cx_sd    <- sqrt(distributional::variance(cx_dec$Sales[[1]]))
cx_stock <- cx_mu + qnorm(0.95) * cx_sd

tibble(
  backtest_RMSSE = round(cx_rmsse, 3),
  dec_forecast   = round(cx_mu, 0),
  stock_95       = round(cx_stock, 0),
  safety_stock   = round(cx_stock - cx_mu, 0)
)
#> # A tibble: 1 × 4
#>   backtest_RMSSE dec_forecast stock_95 safety_stock
#>            <dbl>        <dbl>    <dbl>        <dbl>
#> 1          0.748          744      812           68
```

One block carries the whole story: the model beats the naive baseline (RMSSE 0.748), forecasts December demand at 744, and recommends holding 812 to hit a 95 percent service level, a 68-unit cushion. That final row is the deliverable an inventory team can act on.

## Practice Exercises

These build on the objects created above (`sig`, `fc_2019`). Use the distinct variable names given so you do not overwrite the tutorial's state.

### Exercise 1: The cost of a higher service level

Higher service levels cost more stock. Using the December standard deviation `sig`, compute the safety stock for a 90 percent and a 99 percent service level, then report how many extra units the jump from 90 to 99 costs.

```r title="Exercise 1: safety stock at two service levels"
# Hint: safety stock at service level sl is qnorm(sl) * sig.
# Build a 2-row tibble for sl = 0.90 and 0.99, then the extra units between them.

# Write your code below:

```

<details>
<summary>Click to reveal solution</summary>

```r title="Exercise 1 solution"
ss <- tibble(service_level = c(0.90, 0.99)) |>
  mutate(safety_stock = round(qnorm(service_level) * sig, 0))
ss
#> # A tibble: 2 × 2
#>   service_level safety_stock
#>           <dbl>        <dbl>
#> 1          0.9            53
#> 2          0.99           96
cat("Extra units to go from 90% to 99%:",
    round(qnorm(0.99) * sig - qnorm(0.90) * sig, 0), "\n")
#> Extra units to go from 90% to 99%: 43
```

**Explanation:** Moving from a 90 to a 99 percent service level nearly doubles the cushion, from 53 to 96, an extra 43 units of stock. Those last few points of certainty are expensive, which is why 95 percent is such a common compromise.

</details>

### Exercise 2: A full-year stocking plan

The December decision was one month. Build the whole 2019 plan: for each month, take the forecast mean and its standard deviation, and compute the 95 percent stock level and the safety stock. Use the `fc_2019` forecast from the tutorial.

```r title="Exercise 2: a 95 percent stock level for every month"
# Hint: add a column sd = sqrt(distributional::variance(Sales)),
# then stock_95 = .mean + qnorm(0.95) * sd, and safety = qnorm(0.95) * sd.

# Write your code below:

```

<details>
<summary>Click to reveal solution</summary>

```r title="Exercise 2 solution"
year_plan <- fc_2019 |>
  mutate(sd = sqrt(distributional::variance(Sales))) |>
  as_tibble() |>
  transmute(
    Month,
    forecast = round(.mean, 0),
    stock_95 = round(.mean + qnorm(0.95) * sd, 0),
    safety   = round(qnorm(0.95) * sd, 0)
  )
year_plan
#> # A tibble: 12 × 4
#>       Month forecast stock_95 safety
#>       <mth>    <dbl>    <dbl>  <dbl>
#>  1 2019 Jan      369      400     31
#>  2 2019 Feb      288      313     24
#>  3 2019 Mar      367      398     31
#>  4 2019 Apr      385      418     33
#>  5 2019 May      382      415     33
#>  6 2019 Jun      399      433     35
#>  7 2019 Jul      377      410     33
#>  8 2019 Aug      338      368     30
#>  9 2019 Sep      353      385     31
#> 10 2019 Oct      390      425     35
#> 11 2019 Nov      442      482     40
#> 12 2019 Dec      744      812     68
```

**Explanation:** The safety stock is largest in the high-demand months (December at 68, November at 40) because bigger sales carry bigger absolute uncertainty. This one table is a complete, defensible inventory plan for the year.

</details>

### Exercise 3: Repeat the workflow on a new category

The real test of a workflow is whether it transfers. Build the demand series for Victoria "Clothing retailing", split at the same date, fit `SNAIVE` and `ETS`, and report which one wins the backtest by RMSSE.

```r title="Exercise 3: pick the best model for a new category"
# Hint: rebuild the series (Sales = Turnover), filter_index to "2016 Dec" for training,
# model(snaive = SNAIVE(Sales), ets = ETS(Sales)), forecast h = 24, accuracy vs full series.

# Write your code below:

```

<details>
<summary>Click to reveal solution</summary>

```r title="Exercise 3 solution"
clothing <- aus_retail |>
  filter(State == "Victoria", Industry == "Clothing retailing") |>
  as_tibble() |> transmute(Month, Sales = Turnover) |>
  as_tsibble(index = Month)

cl_fit <- clothing |>
  filter_index(. ~ "2016 Dec") |>
  model(snaive = SNAIVE(Sales), ets = ETS(Sales))

cl_fit |>
  forecast(h = 24) |>
  accuracy(clothing) |>
  select(.model, RMSSE, MASE) |>
  arrange(RMSSE)
#> # A tibble: 2 × 3
#>   .model RMSSE  MASE
#>   <chr>  <dbl> <dbl>
#> 1 ets    0.753 0.814
#> 2 snaive 1.47  1.63
```

**Explanation:** The exact same workflow ports straight to clothing, where `ets` again wins convincingly (RMSSE 0.753 against the baseline's 1.47). A method that generalizes across categories is the one worth building a process around.

</details>

## Frequently Asked Questions

**Should I forecast demand in units or in dollars?**
Whichever drives your decision. This case study used monthly turnover in dollars, but if you order stock in units, forecast units. The workflow does not change: swap the response column and every step from decomposition to safety stock works the same way.

**How much history do I need?**
Enough to see the seasonality several times over. For monthly retail data with a yearly season, aim for at least three to four full years so the model can learn the seasonal shape, and hold out one to two recent years to test it. We had 35 years, which is generous.

**Why hold out two years instead of one?**
Because one held-out December could be a fluke. Testing across two separate Christmases gives you more confidence that the winning model is genuinely better and not just lucky on a single peak.

**How do I choose between ETS and ARIMA?**
Do not choose up front. Fit both, plus a naive baseline, and let a held-out backtest decide, exactly as we did. Here ETS won narrowly, but on a different series ARIMA might. The framework makes fitting both a one-line change, so there is no reason to guess.

**How often should I refresh the forecast?**
Refit whenever new data arrives, typically monthly for this kind of series. The whole pipeline is a short script, so re-running it each month with the latest sales keeps both the forecast and the stocking plan current.

**Can I add promotions or price as drivers?**
Yes. When demand depends on known drivers like price or a promotion flag, a dynamic regression model (`ARIMA(Sales ~ price + promo)`) folds them in. Some of those richer workflows use packages that run best in a local R session rather than in your browser.

## Summary

Retail demand forecasting is not one model but a short, honest pipeline. You explore the data to find its trend and seasonality, split it in time to test fairly, fit a few models from a naive baseline upward, pick the winner on held-out accuracy, quantify the uncertainty, and convert that uncertainty into a stocking decision. Every step is a handful of tidyverts verbs.

| Step | Verb | What it did |
|---|---|---|
| Explore | `autoplot()`, `features()` | Revealed a strong trend and a dominant December peak |
| Split | `filter_index()` | Held out the last 24 months for an honest test |
| Fit | `model()` | Trained SNAIVE, ETS, ARIMA, and a logged ETS at once |
| Evaluate | `accuracy()` | Picked ETS by scaled error (RMSSE 0.748) |
| Quantify | `hilo()` | Turned the forecast into low-high demand ranges |
| Decide | `qnorm()`, `quantile()` | Converted the December distribution into a 95 percent stock level |

The headline lesson: a forecast only matters when it changes a decision. By carrying the demand distribution all the way to a service level, we turned a monthly sales prediction of 744 into a concrete instruction, hold 812 units of stock, that a business can act on with a known 95 percent chance of not stocking out.

## References

1. Hyndman, R.J., & Athanasopoulos, G. *Forecasting: Principles and Practice*, 3rd edition. [Link](https://otexts.com/fpp3/) - the free textbook behind every method on this page, from STL decomposition to ETS to honest backtesting.
2. fable package documentation, tidyverts. [Link](https://fable.tidyverts.org/) - the reference for the `model()`, `forecast()`, and `accuracy()` verbs used throughout.
3. feasts package documentation (decomposition and features). [Link](https://feasts.tidyverts.org/) - covers `STL()`, `feat_stl`, and the `guerrero` feature we used to explore the series.
4. tsibble package documentation, tidyverts. [Link](https://tsibble.tidyverts.org/) - explains the time-aware table and the `filter_index()` date slicing behind the train/test split.
5. O'Hara-Wild, M., Hyndman, R.J., & Wang, E. *tsibbledata: Diverse Datasets for tsibble*. [Link](https://tsibbledata.tidyverts.org/) - the package that ships the `aus_retail` series this case study is built on.
6. Hyndman, R.J. Tidy forecasting in R. [Link](https://robjhyndman.com/hyndsight/fable/) - a short tour of the fable workflow from its author, good for seeing the big picture.
7. Australian Bureau of Statistics, Retail Trade, Australia (source of `aus_retail`). [Link](https://www.abs.gov.au/statistics/industry/retail-and-wholesale-trade/retail-trade-australia) - the official source of the monthly turnover figures behind the dataset.

## Continue Learning

- [Forecast Hundreds of Series Automatically in R](Batch-Forecasting-in-R.html) - scale this single-series workflow to hundreds of products or stores at once.
- [Forecast Accuracy in R: MAE, RMSE, MAPE, and MASE](Forecast-Accuracy-in-R.html) - a deeper look at the error measures we used to pick the winning model.
- [fable in R: Tidy Time Series Forecasting](fable-in-R.html) - the framework this case study is built on, explained from the single-series basics up.

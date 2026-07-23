---
title: "Forecast Hundreds of Series Automatically in R"
slug: "Batch-Forecasting-in-R"
description: "Forecast hundreds of time series at once in R. Fit ETS, ARIMA and naive models to every series in one command, then auto-pick the best model per series."
keywords: "batch forecasting in R, forecast many time series R, fable forecasting, forecast hundreds of series, automatic forecasting R, per-series model selection, aus_retail forecasting, tsibble model(), mable fable accuracy, forecasting at scale"
auto_link_terms: "batch forecasting|batch forecasting in R|forecast hundreds of series|forecasting many series automatically|automatic forecasting in R|per-series model selection|automatic model selection per series|forecasting at scale|forecast every series|null model|is_null_model()|keyed tsibble forecasting|mable of models|scale forecasting to thousands of series"
auto_link_case_sensitive: false
mathjax: false
webr: true
date: "2026-07-23"
curriculum_id: "TS2-13.1"
post_type: "C"
sidebar_section: "Time Series"
sidebar_title: "Batch Forecasting"
sidebar_order: "44"
difficulty: "Intermediate"
---

<p class="lead">Batch forecasting means fitting a forecasting model to many time series at once instead of one at a time. In R the fable framework does it in a single <code>model()</code> call over a table that knows which rows belong to which series, and this page builds the whole workflow from scratch: from one command, to reading every forecast, to letting each series pick its own best model automatically. Everything runs on 8 real Australian retail series, and every number you see was measured, not guessed.</p>

## How do you forecast many series without writing a loop?

If you have ever had to forecast more than one thing, you know the usual shape of the code. You write a loop. For each product, each store, each region, you pull out that one series, fit a model, save the forecast, then move to the next. It works, but it is slow to write, easy to break, and it buries the interesting part (the forecasts) under a pile of bookkeeping.

There is a cleaner way. If your data sits in a table that knows which rows belong to which series, you can fit and forecast every series with a single command. Here is that command working on 8 retail series before we explain any of the pieces.

```r title="Forecast every series in one command"
library(tsibble)
library(fable)
library(tsibbledata)
library(dplyr)

retail <- aus_retail |>
  filter(Industry == "Cafes, restaurants and takeaway food services") |>
  filter_index("2015 Jan" ~ .)

retail |>
  model(ets = ETS(Turnover)) |>
  forecast(h = "2 years")
#> # A fable: 192 x 6 [1M]
#> # Key:     State, Industry, .model [8]
#>    State  Industry .model    Month   Turnover
#>    <chr>  <chr>    <chr>     <mth>     <dist>
#>  1 Austr… Cafes, … ets    2019 Jan   N(59, 4)
#>  2 Austr… Cafes, … ets    2019 Feb N(63, 8.7)
#>  3 Austr… Cafes, … ets    2019 Mar  N(71, 15)
#>  4 Austr… Cafes, … ets    2019 Apr  N(66, 20)
#>  5 Austr… Cafes, … ets    2019 May  N(68, 25)
#>  6 Austr… Cafes, … ets    2019 Jun  N(66, 30)
#> # ℹ 1 more variable: .mean <dbl>
```

Read what came back. `aus_retail` is a dataset of Australian retail turnover that ships with the `tsibbledata` package. We kept one industry (cafes and restaurants) across all 8 states, and trimmed the history to 2015 onward. That left 8 separate series. The `model(ets = ETS(Turnover))` step fitted an exponential smoothing model to each one, and `forecast(h = "2 years")` asked each fitted model for the next 24 months. The result is a single tidy table of 192 rows, which is 8 series times 24 months, with a `.model` column naming the model and a `Turnover` column holding each forecast as a probability distribution.

Nowhere did we write a loop or juggle an index by hand. The table carried the series identity for us, so one line of modeling code applied to all 8 series at the same time. That is the whole idea of batch forecasting, and the rest of this page unpacks how it works and how far it scales.

[KEY INSIGHT]
**A forecast is just data, so a batch of forecasts is just a bigger table.** Once every model, every series and every future month lives in one data frame, "do it for all of them" stops being a loop and becomes an ordinary table operation you already know how to write.

**Try it:** The starter below fits a seasonal naive model to every series but stops there, so it prints the fitted models instead of forecasts. Add the forecasting step to get a one-year forecast for all 8 series.

```r title="Your turn: forecast one year with SNAIVE"
ex_fit <- retail |> model(snaive = SNAIVE(Turnover))
ex_fit
```

<details>
<summary>Click to reveal solution</summary>

```r title="One-year SNAIVE forecast for every series"
ex_fc <- retail |>
  model(snaive = SNAIVE(Turnover)) |>
  forecast(h = "1 year")
ex_fc
#> # A fable: 96 x 6 [1M]
#> # Key:     State, Industry, .model [8]
#>    State  Industry .model    Month  Turnover
#>    <chr>  <chr>    <chr>     <mth>    <dist>
#>  1 Austr… Cafes, … snaive 2019 Jan N(55, 22)
#>  2 Austr… Cafes, … snaive 2019 Feb N(60, 22)
#>  3 Austr… Cafes, … snaive 2019 Mar N(71, 22)
#>  4 Austr… Cafes, … snaive 2019 Apr N(67, 22)
#>  5 Austr… Cafes, … snaive 2019 May N(68, 22)
#>  6 Austr… Cafes, … snaive 2019 Jun N(67, 22)
#> # ℹ 1 more variable: .mean <dbl>
```

**Explanation:** `forecast(h = "1 year")` turns each fitted model into 12 future rows. With 8 series that is 96 rows in total, produced by the same single command.

</details>

## What is a keyed tsibble, and why does it make this automatic?

The part that makes this work is the table type. Classic forecasting tools in R use a `ts` object, which is a bare numeric vector with a start date and a season length attached. A `ts` object holds exactly one series, and it drops that time structure as soon as you manipulate it with a normal data verb like `filter()`. The fable framework replaces it with a tsibble, which is a data frame that knows two special things: which column is time (the index), and which column or columns identify a series (the key).

The key is what powers batch forecasting. Let us look at the full dataset before we sliced it, so you can see the key at work.

```r title="Inspect the full panel and its key"
aus_retail
n_keys(aus_retail)
key_vars(aus_retail)
#> # A tsibble: 64,532 x 5 [1M]
#> # Key:       State, Industry [152]
#>    State                        Industry                               `Series ID`    Month Turnover
#>    <chr>                        <chr>                                  <chr>          <mth>    <dbl>
#>  1 Australian Capital Territory Cafes, restaurants and catering servi… A3349849A   1982 Apr      4.4
#>  2 Australian Capital Territory Cafes, restaurants and catering servi… A3349849A   1982 May      3.4
#>  3 Australian Capital Territory Cafes, restaurants and catering servi… A3349849A   1982 Jun      3.6
#> [1] 152
#> [1] "State"    "Industry"
```

The header tells the story. `Key: State, Industry [152]` means the combination of state and industry marks a series, and there are 152 of them packed into this one table. `n_keys()` confirms the count, and `key_vars()` names the two columns that form the key. Every one of those 152 series has its own history stacked in the same data frame, kept apart only by the key.

[NOTE]
**A tsibble stays a tsibble when you wrangle it.** Because it is a real data frame underneath, `filter()`, `mutate()`, `select()` and friends all work, and the key travels along automatically. That is why the slice we made at the top is still a valid multi-series table, ready to forecast.

To keep every code block on this page quick, we work with the 8-series slice rather than all 152. Nothing about the modeling code would change for the full set; only the running time grows. Here is the slice, with its key showing exactly 8 series.

```r title="The 8-series working slice"
retail
#> # A tsibble: 384 x 5 [1M]
#> # Key:       State, Industry [8]
#>    State                        Industry                               `Series ID`    Month Turnover
#>    <chr>                        <chr>                                  <chr>          <mth>    <dbl>
#>  1 Australian Capital Territory Cafes, restaurants and takeaway food … A3349606J   2015 Jan     50.3
#>  2 Australian Capital Territory Cafes, restaurants and takeaway food … A3349606J   2015 Feb     54  
#>  3 Australian Capital Territory Cafes, restaurants and takeaway food … A3349606J   2015 Mar     62.2
```

Think of the key as the instruction "treat each group as its own series". When you later call `model()`, fable reads the key, splits the table into its 8 groups behind the scenes, fits your model separately inside each group, and stitches the results back into one table. You never manage the split yourself. That is the difference between one command and one command per series: the key does the splitting for you.

**Try it:** Each series in `retail` covers the same 48 months (2015 through 2018). Confirm it for one state by counting the rows for Tasmania. The starter isolates the state but does not count yet.

```r title="Your turn: count months for one series"
ex_tas <- retail |> filter(State == "Tasmania")
ex_tas
```

<details>
<summary>Click to reveal solution</summary>

```r title="Count the rows for one series"
retail |> filter(State == "Tasmania") |> nrow()
#> [1] 48
```

**Explanation:** Filtering to one state leaves a single-series tsibble, and `nrow()` shows 48 months. Every series in the slice has the same length here, though fable is happy to forecast series of different lengths too.

</details>

## How do you fit a model to every series in one command?

Now we build the real workflow. Because we want to judge our forecasts honestly later, we hold back the most recent year of data as a test set and train only on what came before. Splitting a tsibble by time is a one-liner with `filter_index()`.

With the training data in hand, we fit three models at once. `SNAIVE` is the seasonal naive baseline, where the forecast for next July is simply last July; it is the bar every serious model must clear. `ETS` is exponential smoothing, which tracks a level, a trend and a season. `ARIMA` models each series through its own past values and past errors. We ask for all three in one `model()` call.

```r title="Fit three models to every series at once"
train <- retail |> filter_index("2015 Jan" ~ "2017 Dec")

fit <- train |>
  model(
    snaive = SNAIVE(Turnover),
    ets    = ETS(Turnover),
    arima  = ARIMA(Turnover)
  )
fit
#> # A mable: 8 x 5
#> # Key:     State, Industry [8]
#>   State                        Industry       snaive          ets                              arima
#>   <chr>                        <chr>         <model>      <model>                            <model>
#> 1 Australian Capital Territory Cafes, rest… <SNAIVE> <ETS(A,N,A)>          <ARIMA(0,1,0)(0,1,0)[12]>
#> 2 New South Wales              Cafes, rest… <SNAIVE> <ETS(A,A,A)> <ARIMA(0,0,0)(1,1,1)[12] w/ drift>
#> 3 Northern Territory           Cafes, rest… <SNAIVE> <ETS(M,N,N)>          <ARIMA(0,1,1)(0,1,0)[12]>
#> 4 Queensland                   Cafes, rest… <SNAIVE> <ETS(M,N,A)>          <ARIMA(1,0,0)(1,1,0)[12]>
#> 5 South Australia              Cafes, rest… <SNAIVE> <ETS(M,A,M)> <ARIMA(0,0,2)(1,1,0)[12] w/ drift>
#> 6 Tasmania                     Cafes, rest… <SNAIVE> <ETS(A,N,A)> <ARIMA(0,0,0)(0,1,0)[12] w/ drift>
#> 7 Victoria                     Cafes, rest… <SNAIVE> <ETS(A,N,A)> <ARIMA(0,0,1)(1,1,0)[12] w/ drift>
#> 8 Western Australia            Cafes, rest… <SNAIVE> <ETS(M,N,A)>          <ARIMA(0,1,0)(0,1,0)[12]>
```

What came back is called a mable, short for model table. It has one row per series and one column per model, so this one holds 24 fitted models (8 series times 3 model types) in a single object. The pipeline in Figure 1 shows where the mable sits: `model()` turns the data table into a mable, and later verbs walk it forward.

![Batch forecasting pipeline: a keyed tsibble becomes a mable, then a fable, then a score table, then a best model per series](screenshots/Batch-Forecasting-in-R-pipeline.webp)

*Figure 1: Each fable verb runs once and applies to every series in the table.*

Look closely at the cells, because they reveal the automatic part. We never told fable which ETS or ARIMA to use. Writing `ETS(Turnover)` with nothing on the right of the response told it to search the family and keep the best fit for that series, and `ARIMA(Turnover)` did the same. That is why the cells differ from row to row: New South Wales landed on `ETS(A,A,A)` while Northern Territory got `ETS(M,N,N)`, and every state has its own ARIMA order. Each series was tuned on its own, automatically, inside the same command.

[NOTE]
**Leaving the right-hand side of a model empty turns on automatic selection.** Both ETS and ARIMA run their own search per series and keep whichever specification fits best, so you do not hand-tune 8 (or 8,000) models yourself. This one `model()` call is also the slowest step on the page, since it is doing all that searching; give it a moment to run.

The mable behaves like any table. You can pull each series' fitted statistics with `glance()`, which returns one row per series per model.

```r title="Fit statistics for every series and model"
glance(fit) |>
  select(State, .model, AICc, BIC) |>
  arrange(State, .model)
#> # A tibble: 24 × 4
#>    State                        .model  AICc   BIC
#>    <chr>                        <chr>  <dbl> <dbl>
#>  1 Australian Capital Territory arima   114.  115.
#>  2 Australian Capital Territory ets     224.  224.
#>  3 Australian Capital Territory snaive   NA    NA 
#>  4 New South Wales              arima   216.  219.
#>  5 New South Wales              ets     388.  380.
#>  6 New South Wales              snaive   NA    NA 
```

Each series has its own fitted numbers. The `NA` values for SNAIVE are expected, because the seasonal naive method has no likelihood to score, so information criteria like AICc do not apply to it. We will judge the models on held-out accuracy instead, which is fairer across model types anyway.

**Try it:** You can read a single fitted model in full with `report()`. The starter selects the ETS column for all states, which is one step too broad. Narrow it to one column and one state, then report it.

```r title="Your turn: report one fitted model"
ex_rep <- fit |> select(State, ets)
ex_rep
```

<details>
<summary>Click to reveal solution</summary>

```r title="Report the ARIMA fit for one series"
fit |>
  select(State, arima) |>
  filter(State == "Victoria") |>
  report()
#> Series: Turnover 
#> Model: ARIMA(0,0,1)(1,1,0)[12] w/ drift 
#> 
#> Coefficients:
#>          ma1     sar1  constant
#>       0.3991  -0.6817   78.8739
#> s.e.  0.2005   0.1525    5.6801
#> 
#> sigma^2 estimated as 279.3:  log likelihood=-103.86
#> AIC=215.72   AICc=217.83   BIC=220.43
```

**Explanation:** `report()` needs a single model, so you first select one column and one series. It prints the chosen ARIMA order, its coefficients and its fit statistics, exactly as if you had modeled that one series on its own.

</details>

## How do you read the forecasts and their uncertainty?

A mable is not a forecast yet, it is a set of fitted models. To get forecasts, pass the whole mable to `forecast()` with a horizon. Because the mable holds every series and every model, one call produces every forecast.

```r title="Forecast twelve months for all series and models"
fc <- fit |> forecast(h = 12)
fc
#> # A fable: 288 x 6 [1M]
#> # Key:     State, Industry, .model [24]
#>    State  Industry .model    Month  Turnover
#>    <chr>  <chr>    <chr>     <mth>    <dist>
#>  1 Austr… Cafes, … snaive 2018 Jan N(57, 27)
#>  2 Austr… Cafes, … snaive 2018 Feb N(62, 27)
#>  3 Austr… Cafes, … snaive 2018 Mar N(69, 27)
#>  4 Austr… Cafes, … snaive 2018 Apr N(64, 27)
#>  5 Austr… Cafes, … snaive 2018 May N(66, 27)
#>  6 Austr… Cafes, … snaive 2018 Jun N(63, 27)
#> # ℹ 1 more variable: .mean <dbl>
```

The result is a fable, a forecast table. Its 288 rows are 8 series times 3 models times 12 months. The `Turnover` column is not a single number but a distribution written as `N(mean, variance)`, so each forecast carries its own uncertainty. The `.mean` column, hidden at the far right, is the point forecast pulled out of that distribution for convenience.

Point forecasts alone hide the risk. To see a prediction interval, pipe the fable through `hilo()`, which turns a distribution into a low-high band at the confidence level you ask for.

```r title="Read a 95 percent interval for one series"
fc |>
  filter(State == "Victoria", .model == "ets") |>
  hilo(level = 95) |>
  select(Month, .mean, `95%`)
#> # A tsibble: 12 x 3 [1M]
#>       Month .mean                   `95%`
#>       <mth> <dbl>                  <hilo>
#>  1 2018 Jan  890. [852.4758,  927.2501]95
#>  2 2018 Feb  808. [757.7259,  857.9640]95
#>  3 2018 Mar  888. [827.8941,  948.3272]95
#>  4 2018 Apr  884. [815.4608,  953.1583]95
#>  5 2018 May  880. [803.1022,  956.1285]95
#>  6 2018 Jun  852. [768.5332,  935.4869]95
```

Each row now shows the expected turnover and the range the model is 95 percent sure it falls within. For January 2018 the point forecast is about 890 and the band runs from roughly 852 to 927, which is the honest way to report a forecast: a center plus a spread.

[TIP]
**Reach for hilo() whenever a stakeholder asks "how sure are you?"** It converts any fable's distribution column into plain low-high numbers at whatever level you name, so you can hand over intervals without any manual math on standard errors.

Numbers land better as a picture. Because a fable is a data frame, you can plot it with ordinary ggplot2. Here we draw the history and the three forecasts for two of the states side by side.

```r title="Plot history and forecasts for two series"
library(ggplot2)
two <- c("Victoria", "Tasmania")
hist_df <- retail |> filter(State %in% two) |> as_tibble() |> mutate(Month = as.Date(Month))
fc_df   <- fc |> filter(State %in% two) |> as_tibble() |> mutate(Month = as.Date(Month))

ggplot() +
  geom_line(data = hist_df, aes(Month, Turnover), colour = "grey40") +
  geom_line(data = fc_df, aes(Month, .mean, colour = .model), linewidth = 0.8) +
  facet_wrap(~ State, scales = "free_y") +
  labs(y = "Turnover ($m)", colour = "Model") +
  theme_minimal()
```

Run it and you get two panels, one per state, each showing the grey history and three coloured forecast lines fanning into 2018. You can immediately see that the models disagree, and that some track the seasonal shape better than others. Which raises the real question: with three candidates per series, how do you decide which one to trust?

**Try it:** Business reports often use an 80 percent band rather than 95. The starter filters the fable to the ARIMA forecasts for Victoria. Add an `hilo()` step at the 80 percent level and select the interval column.

```r title="Your turn: get an 80 percent interval"
ex_int <- fc |> filter(State == "Victoria", .model == "arima")
ex_int
```

<details>
<summary>Click to reveal solution</summary>

```r title="An 80 percent interval for one series"
fc |>
  filter(State == "Victoria", .model == "arima") |>
  hilo(level = 80) |>
  select(Month, .mean, `80%`)
#> # A tsibble: 12 x 3 [1M]
#>       Month .mean                    `80%`
#>       <mth> <dbl>                   <hilo>
#>  1 2018 Jan  898. [ 876.3501,  919.1816]80
#>  2 2018 Feb  818. [ 794.9631,  841.0801]80
#>  3 2018 Mar  896. [ 873.0188,  919.1358]80
#>  4 2018 Apr  902. [ 878.4984,  924.6154]80
#>  5 2018 May  899. [ 876.2692,  922.3862]80
#>  6 2018 Jun  867. [ 843.8172,  889.9342]80
```

**Explanation:** The 80 percent band is narrower than the 95 percent one, because you are asking the model to be certain about a smaller range. Same fable, same `hilo()` verb, just a different level.

</details>

## How do you pick the best model for each series automatically?

This is where batch forecasting pays off. We held back the last 12 months, so we can compare each forecast against what actually happened and score it. The `accuracy()` function lines each forecast up with the matching month in the real data (which is why we pass the full `retail` table, not just the test slice) and scores the entire fable at once, returning one row per series per model.

Two of its columns are built for comparing across different series: MASE and RMSSE. Both are scaled errors, meaning they divide a model's error by the error of the naive baseline on that series. A value below 1 means the model beat the naive forecast; above 1 means it lost to it. Because the scaling cancels out the size of each series, you can compare a tiny territory against a huge state fairly.

```r title="Score every series and model on held-out data"
acc <- accuracy(fc, retail)
acc |>
  select(State, .model, RMSSE, MASE) |>
  arrange(State, .model)
#> # A tibble: 24 × 4
#>    State                        .model RMSSE  MASE
#>    <chr>                        <chr>  <dbl> <dbl>
#>  1 Australian Capital Territory arima  1.36  1.64 
#>  2 Australian Capital Territory ets    1.43  1.82 
#>  3 Australian Capital Territory snaive 0.660 0.780
#>  4 New South Wales              arima  0.397 0.380
#>  5 New South Wales              ets    0.387 0.340
#>  6 New South Wales              snaive 0.957 0.951
```

Already you can see the models trading places. In the Capital Territory the naive baseline wins with an RMSSE of 0.660, while in New South Wales the ETS model wins at 0.387. No single model is best everywhere. That is normal, and it is exactly why fitting several and comparing them per series pays off.

To turn this table into a decision, group by the series and keep the row with the lowest error. `slice_min()` does the picking.

```r title="Keep the lowest-error model for each series"
best <- acc |>
  group_by(State) |>
  slice_min(RMSSE, n = 1) |>
  ungroup() |>
  select(State, .model, RMSSE)
best
#> # A tibble: 8 × 3
#>   State                        .model RMSSE
#>   <chr>                        <chr>  <dbl>
#> 1 Australian Capital Territory snaive 0.660
#> 2 New South Wales              ets    0.387
#> 3 Northern Territory           snaive 1.11 
#> 4 Queensland                   ets    0.616
#> 5 South Australia              arima  0.614
#> 6 Tasmania                     snaive 0.399
#> 7 Victoria                     arima  0.269
#> 8 Western Australia            snaive 0.344
```

Every series now carries its own winner, chosen by the data rather than by you. Figure 2 shows the small pipeline each series went through to get here.

![Automatic per-series selection: fit three models, score them on held-out months, keep the lowest RMSSE](screenshots/Batch-Forecasting-in-R-selection.webp)

*Figure 2: Every series is scored on held-out months and keeps its own lowest-error model.*

Count the winners and the point of the whole exercise jumps out.

```r title="Tally which model won how many series"
best |> count(.model, name = "series_won")
#> # A tibble: 3 × 2
#>   .model series_won
#>   <chr>       <int>
#> 1 arima           2
#> 2 ets             2
#> 3 snaive          4
```

The naive baseline won 4 of the 8 series, while ETS and ARIMA took 2 each. Read that honestly: on this data the fancy models beat the simple one only half the time. If you had forced one model onto all 8 series, you would have been wrong for at least half of them. Selecting per series is not a nicety here, it is the difference between a good forecast and a mediocre one, and the batch workflow makes it automatic.

[KEY INSIGHT]
**No single model wins every series, so let the data choose one per series.** Because every model, every series and every score sit in one table, "pick the best model for each series" is a `group_by()` plus `slice_min()`, not a research project. This scales to thousands of series without another line of logic.

**Try it:** Before trusting per-series selection, it helps to know how each model does on average. The starter groups the scores by model. Add a `summarise()` that computes the mean RMSSE, then sort to see the overall ranking.

```r title="Your turn: average score per model"
ex_avg <- acc |> group_by(.model)
ex_avg
```

<details>
<summary>Click to reveal solution</summary>

```r title="Average RMSSE for each model"
acc |>
  group_by(.model) |>
  summarise(mean_RMSSE = mean(RMSSE)) |>
  arrange(mean_RMSSE)
#> # A tibble: 3 × 2
#>   .model mean_RMSSE
#>   <chr>       <dbl>
#> 1 snaive      0.762
#> 2 ets         0.768
#> 3 arima       0.876
```

**Explanation:** On average the three models are close, with the naive baseline barely ahead. That average hides the real story: per-series selection does better than any of these single numbers, because it takes the winner in each series rather than one model's average.

</details>

## What happens when a series is too short or broken?

At scale, some series will not cooperate. A shop that opened last month has almost no history. A sensor that dropped out leaves a wall of missing values. In a hand-written loop, one such series throws an error and can halt the whole run. fable is built for the batch case, so it handles a failed fit gracefully: it marks that series with a null model and keeps going with the rest.

Let us force the problem. We build a tiny panel with one healthy series and one that is almost entirely missing, then fit a model to both.

```r title="Fit a panel where one series cannot be modeled"
library(tibble)
library(purrr)

good <- tibble(store = "A", Month = yearmonth("2015 Jan") + 0:23,
               Sales = as.numeric(20 + 0:23 + 4 * sin((0:23) * pi / 6)))
newp <- tibble(store = "B", Month = yearmonth("2015 Jan") + 0:23,
               Sales = c(rep(NA, 22), 3, 4))
panel <- bind_rows(good, newp) |> as_tsibble(index = Month, key = store)

fit_p <- panel |> model(ets = ETS(Sales))
fit_p
#> # A mable: 2 x 2
#> # Key:     store [2]
#>   store          ets
#>   <chr>      <model>
#> 1 A     <ETS(A,A,A)>
#> 2 B     <NULL model>
```

Store A fitted fine. Store B, which has only two real data points, could not be fitted, so its cell reads `<NULL model>` rather than crashing the run. The batch survived one bad series, which is exactly the behavior you want when you are fitting hundreds at a time.

You still need to know which series failed, so you can handle them. `is_null_model()` tests a fitted model, and mapping it across the column flags every failure.

```r title="Flag the series that failed to fit"
fit_p |>
  mutate(failed = map_lgl(ets, is_null_model)) |>
  as_tibble() |>
  select(store, failed)
#> # A tibble: 2 × 2
#>   store failed
#>   <chr> <lgl> 
#> 1 A     FALSE 
#> 2 B     TRUE
```

[WARNING]
**A null model produces missing forecasts, so never let one slip through silently.** Always scan a large mable with is_null_model() and decide what to do with the failures: exclude them, or fall back to a benchmark forecast that always fits. Fitting the seasonal naive model alongside your real models is a cheap insurance policy, because the naive method fits almost anything and gives every series at least one usable forecast.

Speed matters once the series count climbs. Because each series is fitted independently, the work splits cleanly across CPU cores. The tidyverts tools cooperate with the `future` package: add `library(future)` and `plan(multisession)` before your `model()` call, and the same one command spreads the fits across your cores with no other change. That is the payoff of the batch design; scaling up is a configuration line, not a rewrite.

[TIP]
**Turn on parallelism with two lines, not a rewrite.** Calling `plan(multisession, workers = 4)` before `model()` runs the per-series fits on four cores at once, and because the series are independent there is nothing to coordinate. Fit time drops roughly in proportion to the cores you give it.

**Try it:** For a big batch you often just want a count of failures. The starter adds the null flag to the mable. Finish it by summarising the flag into a single count of failed series.

```r title="Your turn: count the failed series"
ex_flags <- fit_p |> mutate(is_null = map_lgl(ets, is_null_model))
ex_flags
```

<details>
<summary>Click to reveal solution</summary>

```r title="Count how many series failed to fit"
fit_p |>
  mutate(is_null = map_lgl(ets, is_null_model)) |>
  as_tibble() |>
  summarise(n_failed = sum(is_null))
#> # A tibble: 1 × 1
#>   n_failed
#>      <int>
#> 1        1
```

**Explanation:** Summing a logical column counts the `TRUE` values, so `n_failed` reports how many series in the batch produced a null model. One failed here, which matches the flag table above.

</details>

## Complete Example: Forecast Every Series With Its Own Best Model

Here is the whole workflow end to end, reusing the `retail` slice and the `best` table of per-series winners we built earlier. We refit all three models on the full history (not just the training window), forecast every series a year ahead, then keep only each series' chosen model with a `semi_join()`. The result is one forecast per series, each from the model that proved best for it, produced automatically.

```r title="End-to-end automatic per-series forecast"
fit_full <- retail |>
  model(snaive = SNAIVE(Turnover), ets = ETS(Turnover), arima = ARIMA(Turnover))

fc_full <- fit_full |> forecast(h = 12)

final <- fc_full |>
  as_tibble() |>
  semi_join(best, by = c("State", ".model")) |>
  select(State, .model, Month, .mean)

final |>
  group_by(State) |>
  slice_head(n = 1) |>
  ungroup()
#> # A tibble: 8 × 4
#>   State                        .model    Month  .mean
#>   <chr>                        <chr>     <mth>  <dbl>
#> 1 Australian Capital Territory snaive 2019 Jan   54.9
#> 2 New South Wales              ets    2019 Jan 1374. 
#> 3 Northern Territory           snaive 2019 Jan   34.6
#> 4 Queensland                   ets    2019 Jan  717. 
#> 5 South Australia              arima  2019 Jan  196. 
#> 6 Tasmania                     snaive 2019 Jan   55.4
#> 7 Victoria                     arima  2019 Jan  947. 
#> 8 Western Australia            snaive 2019 Jan  454. 
```

Each state now has a January 2019 forecast from its own winning model: the Capital Territory keeps its naive forecast, New South Wales its ETS, Victoria its ARIMA. The whole thing is a handful of verbs, and it would read identically if `retail` held 152 series or 152,000. That is what "forecast hundreds of series automatically" means in practice.

## Practice Exercises

These build on the objects created above (`acc`, `best`, `fc`). Use distinct variable names so you do not overwrite the tutorial's state.

### Exercise 1: Measure the payoff of per-series selection

Per-series selection should beat committing to one model for everyone. Compare the mean RMSSE you would get from the single best model overall against the mean RMSSE from the per-series winners in `best`.

```r title="Exercise 1: single model vs per-series selection"
# Hint: for the single-model score, group acc by .model, take the mean RMSSE,
# and keep the smallest. For per-series, average the RMSSE column of best.

# Write your code below:

```

<details>
<summary>Click to reveal solution</summary>

```r title="Exercise 1 solution"
pool_best <- acc |>
  group_by(.model) |>
  summarise(mean_RMSSE = mean(RMSSE)) |>
  slice_min(mean_RMSSE, n = 1)

per_series <- best |> summarise(mean_RMSSE = mean(RMSSE))

pool_best
per_series
#> # A tibble: 1 × 2
#>   .model mean_RMSSE
#>   <chr>       <dbl>
#> 1 snaive      0.762
#> # A tibble: 1 × 1
#>   mean_RMSSE
#>        <dbl>
#> 1      0.550
```

**Explanation:** The best single model averages 0.762, while picking the winner for each series averages 0.550. That drop is the concrete value of per-series selection: a better forecast for free, from models you already fitted.

</details>

### Exercise 2: How often does ETS beat the baseline?

A good sanity check on any model is how often it beats the naive baseline. Using `acc`, reshape the MASE scores so each series has one row with a column per model, then count in how many series ETS beat SNAIVE.

```r title="Exercise 2: count ETS wins over the baseline"
# Hint: select State, .model and MASE, then pivot_wider so ets and snaive
# become columns. Compare them and sum the wins.

# Write your code below:

```

<details>
<summary>Click to reveal solution</summary>

```r title="Exercise 2 solution"
library(tidyr)
wide <- acc |>
  select(State, .model, MASE) |>
  pivot_wider(names_from = .model, values_from = MASE) |>
  mutate(ets_beats_snaive = ets < snaive)
wide |> summarise(ets_wins = sum(ets_beats_snaive), of = n())
#> # A tibble: 1 × 2
#>   ets_wins    of
#>      <int> <int>
#> 1        4     8
```

**Explanation:** `pivot_wider()` puts each model's MASE in its own column, so a row-wise comparison is easy. ETS beat the naive baseline in 4 of the 8 series, which lines up with the winner tally from the tutorial.

</details>

### Exercise 3: Assemble the chosen-model forecast for the test window

Instead of the future forecast from the Complete Example, build the held-out forecast (the 2018 test months in `fc`) using only each series' selected model. Then confirm each series contributes exactly 12 months.

```r title="Exercise 3: keep only each series' chosen forecast"
# Hint: turn fc into a tibble, semi_join it to best on State and .model,
# then group and count the months per series.

# Write your code below:

```

<details>
<summary>Click to reveal solution</summary>

```r title="Exercise 3 solution"
chosen <- fc |>
  as_tibble() |>
  semi_join(best, by = c("State", ".model")) |>
  select(State, .model, Month, .mean)
chosen |>
  group_by(State, .model) |>
  summarise(months = n(), .groups = "drop")
#> # A tibble: 8 × 3
#>   State                        .model months
#>   <chr>                        <chr>   <int>
#> 1 Australian Capital Territory snaive     12
#> 2 New South Wales              ets        12
#> 3 Northern Territory           snaive     12
#> 4 Queensland                   ets        12
#> 5 South Australia              arima      12
#> 6 Tasmania                     snaive     12
#> 7 Victoria                     arima      12
#> 8 Western Australia            snaive     12
```

**Explanation:** The `semi_join()` keeps only the rows whose series-and-model pair appears in `best`, which is exactly each series' winner. Every series contributes its 12 test months, giving you a clean per-series forecast table.

</details>

## Frequently Asked Questions

**Is batch forecasting the same as a global forecasting model?**
No, and the difference matters. Batch forecasting fits a separate model to each series (many local models, run by one command). A global forecasting model instead trains one model on the stacked history of all series so they share what they learn. Batch is the right default when your series behave differently; global shines when you have thousands of short, similar series. See the linked posts below to compare them.

**How many series can this handle?**
As many as your memory and patience allow. The code is identical for 8 or 8,000 series; only run time grows, and it grows roughly in line with the series count. For large panels, turn on parallelism with `future` and consider fitting cheaper models first to triage.

**Do all my series need the same length or the same dates?**
No. A tsibble happily holds series of different lengths and start dates. Each series is fitted on whatever history it has. Series that are too short simply return a null model, which you can flag and handle.

**Which accuracy measure should I use to compare series?**
Use a scaled measure like MASE or RMSSE. Plain errors like RMSE are on each series' own scale, so a big series would dominate the comparison. Scaled measures divide by the naive baseline, which puts every series on the same footing.

**Can I mix in other models like Prophet or a neural network?**
Yes. Any model with a fable interface slots into the same `model()` call as another named argument, and it flows through `forecast()` and `accuracy()` unchanged. Some of those models rely on packages that run outside the browser, so try them in a local R session.

## Summary

Batch forecasting turns "forecast every series" from a loop into a short chain of table operations. The key column in a tsibble does the per-series splitting, `model()` fits every series at once, `forecast()` and `accuracy()` carry the whole batch forward, and a `group_by()` picks the best model for each series automatically.

![Batch forecasting at a glance: keyed tsibble, one command, automatic choice, robust at scale](screenshots/Batch-Forecasting-in-R-overview.webp)

*Figure 3: The batch forecasting workflow at a glance.*

| Step | Verb | What it does across all series |
|---|---|---|
| Structure | `as_tsibble()`, key | Marks which rows form each series |
| Fit | `model()` | Fits every model to every series, one row per series |
| Forecast | `forecast(h = )` | Produces a distribution per series per horizon |
| Evaluate | `accuracy()` | Scores each series and model on held-out data |
| Select | `group_by()` + `slice_min()` | Keeps each series' lowest-error model |
| Harden | `is_null_model()` | Flags series that could not be fitted |

The headline lesson from the data: no single model won more than half the series, so letting each series choose its own model measurably improved the forecasts, and the batch workflow made that choice automatic.

## References

1. Hyndman, R.J., & Athanasopoulos, G. *Forecasting: Principles and Practice*, 3rd edition. Chapter 13, Forecasting many series. [Link](https://otexts.com/fpp3/)
2. fable package documentation, tidyverts. [Link](https://fable.tidyverts.org/)
3. tsibble package documentation, tidyverts. [Link](https://tsibble.tidyverts.org/)
4. fabletools reference, including `accuracy()` and `is_null_model()`. [Link](https://fabletools.tidyverts.org/reference/index.html)
5. O'Hara-Wild, M., Hyndman, R.J., & Wang, E. *tsibbledata: Diverse Datasets for tsibble*. [Link](https://tsibbledata.tidyverts.org/)
6. Hyndman, R.J. Tidy forecasting in R. [Link](https://robjhyndman.com/hyndsight/fable/)
7. Australian Bureau of Statistics, Retail Trade, Australia (source of `aus_retail`). [Link](https://www.abs.gov.au/statistics/industry/retail-and-wholesale-trade/retail-trade-australia)

## Continue Learning

- [fable in R: Tidy Time Series Forecasting with tsibble](fable-in-R.html) - the framework this page builds on, explained from the single-series basics up.
- [Global Forecasting Models in R](Global-Forecasting-Models-in-R.html) - the other way to forecast many series, where one model learns across all of them.
- [Forecast Accuracy in R](Forecast-Accuracy-in-R.html) - a deeper look at MASE, RMSSE and the other measures used to pick winners here.

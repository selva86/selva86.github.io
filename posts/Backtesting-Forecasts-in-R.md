---
title: "Backtesting Forecast Models in R at Scale"
slug: "Backtesting-Forecasts-in-R"
description: "Backtest forecast models in R at scale: build rolling origins with stretch_tsibble, score many models on many series, then prove the winner was not luck."
keywords: "backtesting forecasts in R, time series backtesting, stretch_tsibble, rolling origin evaluation, forecast cross-validation in R, fable backtesting, RMSSE, compare forecasting models"
mathjax: true
webr: true
date: "2026-07-22"
curriculum_id: "TS2-10.4"
post_type: "C"
sidebar_section: "Time Series"
sidebar_title: "Backtesting Forecasts"
sidebar_order: "45"
auto_link_terms: "backtest a forecast|backtesting forecasts|forecast backtesting|backtesting in R|stretch_tsibble|slide_tsibble|rolling origins|forecast origins|rolling origin evaluation|backtesting many series"
auto_link_case_sensitive: false
difficulty: "Advanced"
---

<p class="lead">Backtesting a forecast means refitting your model at many past points in time and scoring the forecasts it would actually have made from each one. In R, <code>stretch_tsibble()</code> builds those training windows, <code>model()</code> fits every candidate on each window, and <code>accuracy()</code> collapses thousands of forecast errors into one number per model.</p>

## Why does a single train/test split give you the wrong answer?

One holdout period is a sample of size one. You score each model against a single stretch of history, and nothing in the result tells you how much came from the model and how much came from that particular stretch. Hold out 2015 and one model looks best; hold out 2016 and a different one does. The block below scores the same three models on Victorian department-store sales at three cut-offs, one year apart. Everything here uses base R plus the tidyverts stack (tsibble for the data, fable for the models).

```r title="Score three models at three cut-offs"
library(dplyr)
library(tsibble)
library(tsibbledata)
library(fable)
library(fabletools)
library(tidyr)
library(ggplot2)

dept <- aus_retail |>
  filter(State == "Victoria", Industry == "Department stores",
         lubridate::year(Month) >= 2005) |>
  select(Month, Turnover) |>
  as_tsibble(index = Month)

one_split <- function(cutoff) {
  dept |>
    filter(Month <= yearmonth(cutoff)) |>
    model(ets    = ETS(Turnover),
          tslm   = TSLM(Turnover ~ trend() + season()),
          snaive = SNAIVE(Turnover ~ drift())) |>
    forecast(h = 12) |>
    accuracy(dept) |>
    transmute(train_ends = cutoff, .model, RMSE = round(RMSE, 1))
}

split_scores <- bind_rows(one_split("2014 Dec"), one_split("2015 Dec"), one_split("2016 Dec"))
split_scores |> pivot_wider(names_from = .model, values_from = RMSE)
#> # A tibble: 3 × 4
#>   train_ends   ets snaive  tslm
#>   <chr>      <dbl>  <dbl> <dbl>
#> 1 2014 Dec    25.5   21.9  21.6
#> 2 2015 Dec    16     21.6  21.9
#> 3 2016 Dec    15.7   15    19.9
```

Here is what that code did. `dept` pulls one monthly series (Victorian department-store turnover, 2005 to 2018) out of `aus_retail` and wraps it as a tsibble, a table that knows `Month` is its time column. The `one_split()` function takes a cut-off date, keeps only the months up to it as training data, fits three models on that training slice, forecasts the next 12 months, and asks `accuracy()` how far those forecasts landed from what really happened. `yearmonth("2014 Dec")` turns that string into a month value the tsibble can compare its `Month` column against.

The three candidates are deliberately different in character. `ETS()` is exponential smoothing: it tracks a level, a trend and a seasonal pattern, and R picks which of those pieces the series actually needs. `TSLM()` is an ordinary linear regression of turnover on a straight-line trend plus one dummy variable per calendar month. `SNAIVE()` is the seasonal naive benchmark, which forecasts each month as the same month one year earlier, with `drift()` adding an adjustment for the average yearly change. RMSE is root mean squared error: the typical size of a miss, in millions of dollars of turnover, where smaller is better.

Now read the numbers. Train to the end of 2014 and `tslm` wins at 21.6. Move the cut-off forward one year and `ets` wins at 16.0. Move it one more year and `snaive` wins at 15.0. Three splits, three different champions, and the "loser" in one row is the "winner" in the next.

[KEY INSIGHT]
**A single holdout measures the holdout as much as it measures the model.** The 12 months you happened to hold out have their own weather, their own promotions and their own shocks, so the winner you crown is partly an accident of which year you set aside.

**Try it:** Two earlier cut-offs are already wired up below. Run the block and check whether the ranking from the table above holds in 2011 and 2012. Then change one of the two dates to a year of your choice.

```r title="Your turn: two earlier cut-offs"
ex_splits <- bind_rows(one_split("2011 Dec"), one_split("2012 Dec"))
ex_splits |> pivot_wider(names_from = .model, values_from = RMSE)
#> # A tibble: 2 × 4
#>   train_ends   ets snaive  tslm
#>   <chr>      <dbl>  <dbl> <dbl>
#> 1 2011 Dec    12.2   15.3  16.8
#> 2 2012 Dec    10.5    9.4  17  
```

<details>
<summary>Click to reveal solution</summary>

```r title="Reading the two earlier cut-offs"
ex_splits |>
  group_by(train_ends) |>
  slice_min(RMSE, n = 1) |>
  ungroup()
#> # A tibble: 2 × 3
#>   train_ends .model  RMSE
#>   <chr>      <chr>  <dbl>
#> 1 2011 Dec   ets     12.2
#> 2 2012 Dec   snaive   9.4
```

**Explanation:** `ets` wins 2011 and `snaive` wins 2012, so the flip-flopping is not confined to recent years. Notice also that every RMSE here is far lower than the 2014 to 2016 numbers. That is not because the models improved, it is because those particular years were easier to forecast.

</details>

## What exactly is a rolling origin backtest?

The fix is to stop treating one cut-off as special and use all of them. A **forecast origin** is any point in the past where you could have stood and made a forecast. A rolling origin backtest walks the origin forward through history, refits at every stop, forecasts a fixed number of months ahead, and pools every error into one score.

![Three forecast origins, each training on history up to its cut-off and scoring the months that follow](screenshots/Backtesting-Forecasts-in-R-rolling-origins.webp)

*Figure 1: Each origin trains on everything up to a cut-off, then is scored on the months that follow.*

The critical rule is the one your intuition already suspects: the scoring window always sits **after** the training window. That is what separates this from ordinary cross-validation, which splits the rows into folds (chunks that take turns being the test set) chosen at random. Shuffle a time series and you train on 2018 to predict 2015, which no real forecast ever gets to do.

In the tidyverts stack you do not write this loop by hand. `stretch_tsibble()` takes one series and returns a stack of training sets, one per origin, glued together into a single table with an id column marking which is which.

```r title="Build every training window at once"
dept_cv_raw <- dept |> stretch_tsibble(.init = 96, .step = 6)
dept_cv_raw
#> # A tsibble: 1,716 x 3 [1M]
#> # Key:       .id [13]
#>       Month Turnover   .id
#>       <mth>    <dbl> <int>
#>  1 2005 Jan     300.     1
#>  2 2005 Feb     260.     1
#>  3 2005 Mar     320.     1
#>  4 2005 Apr     286      1
#>  5 2005 May     318.     1
#>  6 2005 Jun     358.     1
#>  7 2005 Jul     318.     1
#>  8 2005 Aug     289      1
#>  9 2005 Sep     306.     1
#> 10 2005 Oct     316.     1
#> # ℹ 1,706 more rows
```

Two arguments control everything. `.init = 96` says the first training window holds 96 months (8 years) of history. `.step = 6` says each following window adds another 6 months. The result is 13 separate training sets stacked into 1,716 rows, and the new `.id` column says which training set each row belongs to.

[NOTE]
**The .id column becomes a tsibble key, which is why the whole stack behaves like 13 separate series.** Every function downstream (model, forecast, accuracy) already knows how to work series-by-series, so it will loop over your origins for free.

The stacking is easier to believe once you count the rows in each window.

```r title="How long is each training window"
dept_cv_raw |>
  as_tibble() |>
  count(.id, name = "training_months") |>
  head(4)
#> # A tibble: 4 × 2
#>     .id training_months
#>   <int>           <int>
#> 1     1              96
#> 2     2             102
#> 3     3             108
#> 4     4             114
```

Window 1 has the 96 months you asked for, window 2 has 102, window 3 has 108. Each one keeps all the history of the one before it and adds six more months. That is why this is called a **stretching** or **expanding** window.

How many origins will you get? It is worth being able to predict this before you press Run, because this number multiplied by your model count is your compute bill.

```r title="Count origins before you run anything"
n_origins <- function(n_obs, init, step, h) {
  length(seq(from = init, to = n_obs - h, by = step))
}
n_origins(n_obs = 168, init = 96, step = 6, h = 12)
#> [1] 11
```

The function counts the training-window sizes you can reach by starting at `init` and stepping by `step`, stopping at `n_obs - h` so that every origin still has a full `h` months of future left to be scored on. With 168 months of data, a 96-month start, 6-month steps and a 12-month horizon, that is 11 usable origins, two fewer than the 13 windows `stretch_tsibble()` produced. The next section deals with those two extras.

[TIP]
**Set .init to at least two full seasonal cycles, and more if you can afford it.** A seasonal model needs to see each month happen a few times before it can estimate that month's effect, so 24 months is a hard floor for monthly data and 60 or more is a comfortable one.

**Try it:** The block below stretches with a 12-month step instead of 6. Predict how many windows you will get before you run it, then check.

```r title="Your turn: a coarser step"
ex_cv <- dept |> stretch_tsibble(.init = 96, .step = 12)
dplyr::n_distinct(ex_cv$.id)
#> [1] 7
```

<details>
<summary>Click to reveal solution</summary>

```r title="Checking the count against the formula"
length(seq(from = 96, to = 168, by = 12))
#> [1] 7
```

**Explanation:** The window sizes are 96, 108, 120, 132, 144, 156 and 168 months, which is 7 windows. Doubling the step roughly halves the number of origins, and therefore roughly halves the runtime.

</details>

## How do you run a full backtest and read the score?

You now have training windows. Turning them into a model ranking takes three more calls, and one cleanup step that almost every tutorial skips.

![The backtest pipeline from stretch_tsibble through accuracy to a deployment decision](screenshots/Backtesting-Forecasts-in-R-pipeline.webp)

*Figure 2: The five calls that turn a series into a model ranking, and the two decisions that follow.*

Start with the cleanup. `stretch_tsibble()` happily builds a window that ends on the very last month of your data. That origin has no future left to be scored against, and the one before it has only six months of future when you asked for twelve. Look at the tail:

```r title="Inspect where each window ends"
origin_ends <- dept_cv_raw |>
  as_tibble() |>
  group_by(.id) |>
  summarise(train_end = max(Month))
tail(origin_ends, 4)
#> # A tibble: 4 × 2
#>     .id train_end
#>   <int>     <mth>
#> 1    10  2017 Jun
#> 2    11  2017 Dec
#> 3    12  2018 Jun
#> 4    13  2018 Dec
```

The data ends in December 2018. Origin 13 trains right up to the edge, so all 12 of its forecasts fall past the end of the data and score nothing. Origin 12 trains to June 2018, so only its first six forecasts can be scored. Nothing errors, nothing warns. The origin simply contributes fewer horizons than the others, which quietly tilts your average toward short-horizon forecasts that are easier to get right.

```r title="Keep only origins with a full horizon"
full_h  <- origin_ends |> filter(train_end <= max(dept$Month) - 12) |> pull(.id)
dept_cv <- dept_cv_raw |> filter(.id %in% full_h)
cat("origins kept:", length(full_h), "of", max(origin_ends$.id), "\n")
#> origins kept: 11 of 13
```

The filter keeps only origins whose training window ends at least 12 months before the data does. That leaves 11 origins, exactly the number `n_origins()` predicted. Every surviving origin now contributes the same 12 horizons, so the average is comparing like with like.

[WARNING]
**Untrimmed origins bias a backtest optimistic.** The last few windows score only their easiest, shortest horizons, so they lower the pooled error and make the whole model set look better than it is.

Now the actual backtest. Because `.id` is a key, one `model()` call fits every model on every origin, and one `forecast()` call produces every forecast.

```r title="Fit every model on every origin"
dept_fc <- dept_cv |>
  model(ets    = ETS(Turnover),
        tslm   = TSLM(Turnover ~ trend() + season()),
        snaive = SNAIVE(Turnover ~ drift())) |>
  forecast(h = 12)

dept_acc <- dept_fc |> accuracy(dept)
dept_acc |> transmute(.model, RMSE = round(RMSE, 2), MAE = round(MAE, 2), MASE = round(MASE, 3))
#> # A tibble: 3 × 4
#>   .model  RMSE   MAE  MASE
#>   <chr>  <dbl> <dbl> <dbl>
#> 1 ets     17.2  13.1 0.945
#> 2 snaive  17.1  13.3 0.96 
#> 3 tslm    18.9  15.2 1.10
```

Three calls did a lot of work. `model()` fitted 33 models (11 origins times 3 specifications), `forecast(h = 12)` produced 396 forecasts, and `accuracy(dept)` looked each one up against the real turnover for that month and pooled the errors. Passing the original `dept` as the second argument is what lets `accuracy()` find the truth: the forecasts know their dates, `dept` knows what actually happened on those dates. Two metrics sit beside RMSE in that table. MAE is the mean absolute error, the average size of a miss without squaring it first, so it is less swayed by one large error. MASE divides that same error by how badly a seasonal naive forecast would have done on the training data, which puts it on a scale where 1 means "no better than repeating last year"; the section on combining series returns to why that rescaling matters.

The verdict is much duller than any single split suggested, and that is the point. `ets` and `snaive` are effectively tied around 17, and `tslm` is clearly behind at 18.9. A sophisticated exponential smoothing model is failing to beat "the same month last year, nudged for trend". That is a genuinely useful finding, and no single split delivered it: two of the three splits earlier made `ets` look either much better or much worse than it really is.

**Try it:** `dept_acc` already carries every metric `accuracy()` computes, not just the three shown. Pull out MAPE (mean absolute percentage error) and ME (mean error, which reveals bias) from the same object.

```r title="Your turn: two more metrics"
ex_acc <- dept_acc |> transmute(.model, MAPE = round(MAPE, 2), ME = round(ME, 2))
ex_acc
#> # A tibble: 3 × 3
#>   .model  MAPE    ME
#>   <chr>  <dbl> <dbl>
#> 1 ets     3.5   6.08
#> 2 snaive  3.61  3.7 
#> 3 tslm    4     5.74
```

<details>
<summary>Click to reveal solution</summary>

```r title="Ranking by bias instead of size"
ex_acc |> arrange(abs(ME))
#> # A tibble: 3 × 3
#>   .model  MAPE    ME
#>   <chr>  <dbl> <dbl>
#> 1 snaive  3.61  3.7 
#> 2 tslm    4     5.74
#> 3 ets     3.5   6.08
```

**Explanation:** Every ME is positive, which means all three models forecast **too low** on average by 3.7 to 6.1 units. That is a systematic bias, not random noise, and `ets` has the most of it despite the best MAPE. A backtest that reports only RMSE hides this completely.

</details>

### Which model wins at which forecast horizon?

A single pooled RMSE answers "which model is best on average across the next twelve months". Almost nobody actually needs that. A merchandising team reordering stock needs the next one to three months; a finance team building a budget needs month twelve. Those can have different winners.

To split the score by horizon you need an `h` column that says how many months ahead each forecast was. The forecasts arrive in date order within each origin and model, so `row_number()` is enough, but the grouping has to be exactly right.

```r title="Score the backtest by horizon"
dept_fc_h <- dept_fc |>
  group_by(.id, .model) |>
  mutate(h = row_number()) |>
  ungroup() |>
  as_fable(response = "Turnover", distribution = Turnover)

acc_h <- dept_fc_h |> accuracy(dept, by = c("h", ".model"))
acc_h |>
  transmute(h, .model, RMSE = round(RMSE, 1)) |>
  pivot_wider(names_from = .model, values_from = RMSE)
#> # A tibble: 12 × 4
#>        h   ets snaive  tslm
#>    <int> <dbl>  <dbl> <dbl>
#>  1     1  19.2   12.5  18.2
#>  2     2  11     16.4  12.1
#>  3     3  11     16    13.6
#>  4     4  17.7   17.8  19  
#>  5     5  12.7   13.1  15.6
#>  6     6  20.7   24.3  26.7
#>  7     7  21.6   13    19.4
#>  8     8  11.4   16.6  12.1
#>  9     9  15.4   16.4  15.5
#> 10    10  19.2   17.7  19.5
#> 11    11  13.8   13.2  17.5
#> 12    12  25.7   23.6  29.5
```

Walk through the code. `group_by(.id, .model)` then `row_number()` numbers the 12 forecasts inside each origin-and-model combination from 1 to 12. `ungroup()` drops the grouping, and `as_fable()` re-labels the result as a forecast table so `accuracy()` will still accept it. Then `by = c("h", ".model")` tells `accuracy()` to compute one RMSE per horizon per model instead of one per model.

Grouping by `.id` alone is a trap worth naming. It numbers rows 1 to 36 across all three models stacked together, so `ets` gets horizons 1 to 12, `tslm` gets 13 to 24 and `snaive` gets 25 to 36. The table comes out looking plausible and is completely wrong. Group by both.

[WARNING]
**A step that divides evenly into the seasonal period confounds horizon with calendar month.** Here `.step = 6` on monthly data means every training window ends in either June or December, so h = 6 and h = 12 always land on the same two high-volume months. The h = 12 spike is partly December, not just distance.

A picture makes the crossovers obvious.

```r title="Plot RMSE against horizon"
ggplot(acc_h, aes(x = h, y = RMSE, colour = .model)) +
  geom_line(linewidth = 0.9) +
  geom_point(size = 1.8) +
  scale_x_continuous(breaks = 1:12) +
  labs(title = "Backtest RMSE by forecast horizon",
       subtitle = "Victorian department stores, 11 rolling origins",
       x = "Months ahead (h)", y = "RMSE", colour = "Model") +
  theme_minimal(base_size = 12)
```

The lines cross repeatedly, which is exactly what the pooled tie was hiding. `snaive` is dramatically better at h = 1 (12.5 against 19.2) and at h = 7, while `ets` is clearly better at h = 2, h = 3 and h = 8. If you only ever forecast one month ahead, the pooled table gave you the wrong recommendation.

**Try it:** Use `acc_h` to find the best model for short-range forecasting, meaning the average RMSE over h = 1 to 3.

```r title="Your turn: the short-horizon winner"
ex_short <- acc_h |>
  filter(h <= 3) |>
  group_by(.model) |>
  summarise(RMSE_h1_h3 = round(mean(RMSE), 2)) |>
  arrange(RMSE_h1_h3)
ex_short
#> # A tibble: 3 × 2
#>   .model RMSE_h1_h3
#>   <chr>       <dbl>
#> 1 ets          13.7
#> 2 tslm         14.6
#> 3 snaive       15.0
```

<details>
<summary>Click to reveal solution</summary>

```r title="Short horizons against long horizons"
acc_h |>
  mutate(range = if_else(h <= 3, "h 1-3", "h 4-12")) |>
  group_by(range, .model) |>
  summarise(RMSE = round(mean(RMSE), 2), .groups = "drop") |>
  pivot_wider(names_from = range, values_from = RMSE)
#> # A tibble: 3 × 3
#>   .model `h 1-3` `h 4-12`
#>   <chr>    <dbl>    <dbl>
#> 1 ets       13.7     17.6
#> 2 snaive    15.0     17.3
#> 3 tslm      14.6     19.4
```

**Explanation:** `ets` wins the short range and `snaive` wins the long range, which is why they tie overall. Averaging over h = 1 to 3 also washes out the single bad h = 1 point for `ets`, a reminder that horizon-level numbers computed from only 11 origins are themselves noisy.

</details>

## Should the window expand, slide, or tile?

So far every training window kept all the history before it. That is one of three ways to move a window through time, and the choice changes what your backtest is actually measuring.

![Expanding, sliding and tiling windows compared](screenshots/Backtesting-Forecasts-in-R-window-types.webp)

*Figure 3: Expanding keeps every past observation, sliding forgets, tiling never overlaps.*

**Expanding** windows (`stretch_tsibble()`) grow: origin 5 sees everything origin 4 saw plus six more months. This matches what you do in production, where you never throw data away, and it gives later origins more training data than earlier ones.

**Sliding** windows (`slide_tsibble()`) stay a fixed length and move: origin 5 gains six months at the end and loses six from the start. Every origin gets the same amount of training data, and anything older than 96 months is dropped from the training set entirely.

**Tiling** windows (`tile_tsibble()`) are fixed length and never overlap, which makes the folds closer to statistically independent at the cost of producing very few of them.

```r title="Build fixed-length sliding windows"
dept_slide <- dept |>
  slide_tsibble(.size = 96, .step = 6) |>
  filter(.id %in% full_h)

dept_slide |>
  as_tibble() |>
  group_by(.id) |>
  summarise(starts = min(Month), ends = max(Month), months = n()) |>
  head(3)
#> # A tibble: 3 × 4
#>     .id   starts     ends months
#>   <int>    <mth>    <mth>  <int>
#> 1     1 2005 Jan 2012 Dec     96
#> 2     2 2005 Jul 2013 Jun     96
#> 3     3 2006 Jan 2013 Dec     96
```

`.size = 96` replaces `.init = 96`, and the difference shows up in the `starts` column. Window 1 begins in January 2005, window 2 begins in July 2005, window 3 begins in January 2006. The start date marches forward in lockstep with the end date, so `months` stays pinned at 96 forever. Compare that to the expanding table earlier, where the count climbed 96, 102, 108, 114.

Because the windows carry the same ids, the same trim applies and the two schemes become directly comparable.

```r title="Sliding against expanding, same models"
slide_acc <- dept_slide |>
  model(ets    = ETS(Turnover),
        tslm   = TSLM(Turnover ~ trend() + season()),
        snaive = SNAIVE(Turnover ~ drift())) |>
  forecast(h = 12) |>
  accuracy(dept)

window_compare <- bind_rows(
  dept_acc  |> transmute(window = "expanding", .model, RMSE = round(RMSE, 2)),
  slide_acc |> transmute(window = "sliding",   .model, RMSE = round(RMSE, 2))
)
window_compare |> pivot_wider(names_from = window, values_from = RMSE)
#> # A tibble: 3 × 3
#>   .model expanding sliding
#>   <chr>      <dbl>   <dbl>
#> 1 ets         17.2    17.1
#> 2 snaive      17.1    17.6
#> 3 tslm        18.9    20.7
```

Forgetting old history helped `ets` very slightly (17.2 down to 17.1) and hurt the other two, with `tslm` suffering most (18.9 up to 20.7). That pattern makes sense: `tslm` fits a single straight trend line through whatever it is given, so a longer history gives it a steadier slope estimate. Since none of these gaps is large, expanding is the reasonable default for this series.

[TIP]
**Reach for sliding windows when you believe old history is actively misleading.** A pricing change, a store closure or a pandemic makes 2015 a poor guide to 2019, and a fixed-length window is the simplest way to stop a model from averaging across the break.

**Try it:** Shorter windows give you more of them. Build sliding windows of 60 months instead of 96 and count how many you get.

```r title="Your turn: shorter sliding windows"
ex_slide <- dept |> slide_tsibble(.size = 60, .step = 6)
dplyr::n_distinct(ex_slide$.id)
#> [1] 19
```

<details>
<summary>Click to reveal solution</summary>

```r title="Where the extra windows come from"
ex_slide |>
  as_tibble() |>
  group_by(.id) |>
  summarise(starts = min(Month), ends = max(Month)) |>
  head(2)
#> # A tibble: 2 × 3
#>     .id   starts     ends
#>   <int>    <mth>    <mth>
#> 1     1 2005 Jan 2009 Dec
#> 2     2 2005 Jul 2010 Jun
```

**Explanation:** A 60-month window fits inside the data 19 times instead of 13, because it can finish scanning much earlier. More origins means a more stable average, but each model now sees only five years of history, which is thin for estimating twelve monthly seasonal effects.

</details>

## How do you scale a backtest to many series without melting your laptop?

Everything so far ran on one series. Real forecasting jobs have hundreds or thousands, and the cost of a backtest is brutally simple arithmetic:

**fits = origins x series x models**

Every one of those fits is a full model estimation. Here is what the corners of that grid look like for the 168-month series you have been using.

```r title="Count the fits before you commit"
cost_grid <- expand.grid(step = c(1, 3, 6, 12), series = c(1, 6, 152)) |>
  mutate(origins = sapply(step, function(s) n_origins(168, 96, s, 12)),
         fits    = origins * series * 3)
cost_grid
#>    step series origins  fits
#> 1     1      1      61   183
#> 2     3      1      21    63
#> 3     6      1      11    33
#> 4    12      1       6    18
#> 5     1      6      61  1098
#> 6     3      6      21   378
#> 7     6      6      11   198
#> 8    12      6       6   108
#> 9     1    152      61 27816
#> 10    3    152      21  9576
#> 11    6    152      11  5016
#> 12   12    152       6  2736
```

Read the extremes. Three models on one series with a monthly step is 183 fits, which is seconds of work. The same three models across all 152 `aus_retail` series with a monthly step is 27,816 fits. At one second per fit that is nearly eight hours.

When the bill is too high, pull the levers in this order:

1. **Increase `.step` first.** Going from 1 to 6 cuts the work by about 83 percent and costs you only precision in the average, not correctness. Overlapping origins are highly redundant anyway, since consecutive windows share almost all their data.
2. **Cut the model list next.** Backtest five candidates once to shortlist, then backtest the surviving two thoroughly.
3. **Raise `.init` third.** Fewer origins, and the ones you drop are the least representative ones (see the section on what ruins a backtest).
4. **Never shrink `h` to save time.** The horizon is set by the decision you are making, not by your compute budget.

Scaling out is a one-word change: a tsibble with a `key` column holds many series, and `stretch_tsibble()` folds every one of them.

```r title="Load a six-series panel"
six <- c("Department stores",
         "Cafes, restaurants and takeaway food services",
         "Newspaper and book retailing",
         "Liquor retailing",
         "Hardware, building and garden supplies retailing",
         "Pharmaceutical, cosmetic and toiletry goods retailing")

vic <- aus_retail |>
  filter(State == "Victoria", Industry %in% six, lubridate::year(Month) >= 2010) |>
  transmute(Industry, Month, Turnover) |>
  as_tsibble(index = Month, key = Industry)

vic
#> # A tsibble: 648 x 3 [1M]
#> # Key:       Industry [6]
#>    Industry                                         Month Turnover
#>    <chr>                                            <mth>    <dbl>
#>  1 Cafes, restaurants and takeaway food services 2010 Jan     658.
#>  2 Cafes, restaurants and takeaway food services 2010 Feb     611.
#>  3 Cafes, restaurants and takeaway food services 2010 Mar     704.
#>  4 Cafes, restaurants and takeaway food services 2010 Apr     698.
#>  5 Cafes, restaurants and takeaway food services 2010 May     692 
#>  6 Cafes, restaurants and takeaway food services 2010 Jun     670.
#>  7 Cafes, restaurants and takeaway food services 2010 Jul     724.
#>  8 Cafes, restaurants and takeaway food services 2010 Aug     749.
#>  9 Cafes, restaurants and takeaway food services 2010 Sep     736.
#> 10 Cafes, restaurants and takeaway food services 2010 Oct     705 
#> # ℹ 638 more rows
```

`key = Industry` is the whole trick. The tsibble now holds six independent series of 108 months each, and every tidyverts verb will respect that boundary automatically. Nothing will ever average across industries by accident.

```r title="Fold the panel and count the bill"
vic_ends <- vic |>
  stretch_tsibble(.init = 72, .step = 6) |>
  as_tibble() |>
  group_by(.id) |>
  summarise(train_end = max(Month))

vic_keep <- vic_ends |> filter(train_end <= max(vic$Month) - 12) |> pull(.id)
vic_cv   <- vic |> stretch_tsibble(.init = 72, .step = 6) |> filter(.id %in% vic_keep)

cat("origins:", length(vic_keep),
    " series:", dplyr::n_distinct(vic_cv$Industry),
    " model fits:", length(vic_keep) * dplyr::n_distinct(vic_cv$Industry) * 3, "\n")
#> origins: 5  series: 6  model fits: 90
```

The trim is identical to the single-series case, because `.id` still marks the origin and the origins are shared across all six series. Five origins times six series times three models is 90 fits.

[NOTE]
**The next block is the slow one, and that is the lesson.** Ninety model estimations take roughly half a minute in your browser. Multiply by the 152-series, 61-origin corner of the grid above and you can feel why `.step` is the first lever anyone reaches for.

```r title="Backtest all six series at once"
vic_fc <- vic_cv |>
  model(ets    = ETS(Turnover),
        tslm   = TSLM(Turnover ~ trend() + season()),
        snaive = SNAIVE(Turnover ~ drift())) |>
  forecast(h = 12)

vic_acc <- vic_fc |> accuracy(vic)
vic_acc |>
  transmute(Industry = substr(Industry, 1, 22), .model, RMSE = round(RMSE, 1)) |>
  pivot_wider(names_from = .model, values_from = RMSE)
#> # A tibble: 6 × 4
#>   Industry                 ets snaive  tslm
#>   <chr>                  <dbl>  <dbl> <dbl>
#> 1 Cafes, restaurants and  39.4   34.5  61.4
#> 2 Department stores       14.2   15.9  17.5
#> 3 Hardware, building and  17.1   23.2  27.6
#> 4 Liquor retailing         7.1    7.3  10.4
#> 5 Newspaper and book ret   4.5    8.6  10.7
#> 6 Pharmaceutical, cosmet  20.5   28.4  42.5
```

The code is unchanged from the single-series version. `accuracy()` noticed the `Industry` key and reported one row per series per model, and `substr()` just shortens the industry names so the table fits on screen.

`ets` wins five of the six series and `snaive` takes cafes. But look at the RMSE column itself: 39.4 for cafes down to 4.5 for books. Those numbers are not on the same scale, and the next section is about why that makes averaging them dangerous.

**Try it:** Suppose your real panel has 20 series and you want three models with a 6-month step on 168-month histories. Work out the fit count using the helper you already wrote.

```r title="Your turn: budget a 20-series job"
ex_fits <- n_origins(168, 96, 6, 12) * 20 * 3
ex_fits
#> [1] 660
```

<details>
<summary>Click to reveal solution</summary>

```r title="What a coarser step saves you"
c(step6 = n_origins(168, 96, 6, 12) * 20 * 3,
  step12 = n_origins(168, 96, 12, 12) * 20 * 3)
#>  step6 step12 
#>    660    360
```

**Explanation:** 11 origins times 20 series times 3 models is 660 fits. Moving to a 12-month step drops that to 360, a 45 percent saving, in exchange for basing the average on 6 origins instead of 11.

</details>

## How do you combine scores across series without letting the biggest one decide?

You have six numbers per model and you want one. The obvious move, averaging the RMSEs, quietly hands the decision to whichever series sells the most.

```r title="Who really casts the votes"
rmse_share <- vic_acc |>
  filter(.model == "ets") |>
  transmute(Industry = substr(Industry, 1, 22),
            RMSE = round(RMSE, 1),
            share = paste0(round(100 * RMSE / sum(RMSE)), "%")) |>
  arrange(desc(RMSE))
rmse_share
#> # A tibble: 6 × 3
#>   Industry                RMSE share
#>   <chr>                  <dbl> <chr>
#> 1 Cafes, restaurants and  39.4 38%  
#> 2 Pharmaceutical, cosmet  20.5 20%  
#> 3 Hardware, building and  17.1 17%  
#> 4 Department stores       14.2 14%  
#> 5 Liquor retailing         7.1 7%   
#> 6 Newspaper and book ret   4.5 4%   
```

Cafes contributes 38 percent of the total RMSE and books contributes 4 percent. In a plain average, the cafes series casts roughly nine times the vote of the books series, and it earns that power purely by being a bigger business. If your goal is "pick the model that forecasts our categories well", that weighting is not what you asked for.

The fix is to divide every error by something that carries the same units, so the result has no units at all. The natural yardstick is how badly a seasonal naive forecast would have done on that same series.

The intuition first: a scaled error of 1 means "this model was exactly as good as repeating last year's value". Below 1 means better than that, above 1 means worse. Because the comparison happens inside each series, a big series and a small series can finally be averaged.

$$\text{RMSSE} = \sqrt{\frac{\frac{1}{h}\sum_{t=T+1}^{T+h}\left(y_t - \hat{y}_t\right)^2}{\frac{1}{T-m}\sum_{t=m+1}^{T}\left(y_t - y_{t-m}\right)^2}}$$

Where:

- $y_t$ = what actually happened at time $t$
- $\hat{y}_t$ = what the model forecast for time $t$
- $h$ = number of forecast points being scored
- $T$ = number of observations in the training window
- $m$ = the seasonal period, which is 12 for monthly data
- the denominator = the average squared error of a seasonal naive forecast **on the training data**, which is the yardstick

If you are not interested in the algebra, skip it. The only thing you need is that `fabletools` computes it for you when you name the measure.

```r title="Score with RMSSE instead of RMSE"
vic_rmsse <- vic_fc |> accuracy(vic, measures = list(rmsse = RMSSE))
vic_rmsse |>
  transmute(Industry = substr(Industry, 1, 22), .model, rmsse = round(rmsse, 2)) |>
  pivot_wider(names_from = .model, values_from = rmsse)
#> # A tibble: 6 × 4
#>   Industry                 ets snaive  tslm
#>   <chr>                  <dbl>  <dbl> <dbl>
#> 1 Cafes, restaurants and  0.86   0.75  1.34
#> 2 Department stores       0.83   0.93  1.02
#> 3 Hardware, building and  0.53   0.71  0.85
#> 4 Liquor retailing        0.52   0.53  0.76
#> 5 Newspaper and book ret  0.33   0.63  0.78
#> 6 Pharmaceutical, cosmet  0.66   0.91  1.37
```

Every number now sits in the same range regardless of how big the business is. Books, which had the smallest RMSE by far, turns out to be where `ets` performs best of all in relative terms (0.33, meaning a third of the seasonal naive error). And `tslm` scores above 1 on two series, meaning its forecasts for those industries were worse than simply repeating the same month from a year earlier.

```r title="The two averages side by side"
metric_compare <- vic_acc |>
  group_by(.model) |>
  summarise(mean_RMSE = round(mean(RMSE), 1)) |>
  left_join(vic_rmsse |> group_by(.model) |> summarise(mean_RMSSE = round(mean(rmsse), 3)),
            by = ".model")
metric_compare
#> # A tibble: 3 × 3
#>   .model mean_RMSE mean_RMSSE
#>   <chr>      <dbl>      <dbl>
#> 1 ets         17.1      0.621
#> 2 snaive      19.7      0.746
#> 3 tslm        28.3      1.02
```

Here the two agree on the ordering, which is a comfort but not a guarantee. They disagree on the margin: mean RMSE says `tslm` is 66 percent worse than `ets`, mean RMSSE says 64 percent, and mean RMSE gets there mostly through the cafes series. Report the scaled number.

[WARNING]
**Averaging MAPE across series is worse than averaging RMSE, not better.** A percentage error looks scale-free but explodes toward infinity whenever actual values approach zero, so one slow month in one small series can dominate the entire panel average.

There is a third option that ignores magnitudes entirely: count wins and average ranks. If model A beats model B on 25 out of 30 series-and-origin combinations, that is persuasive no matter what the errors were.

```r title="Win rate and mean rank across every cell"
cell <- vic_fc |>
  accuracy(vic, by = c("Industry", ".id", ".model"), measures = list(rmsse = RMSSE))

win_rate <- cell |>
  group_by(Industry, .id) |>
  slice_min(rmsse, n = 1) |>
  ungroup() |>
  count(.model, name = "wins") |>
  mutate(win_rate = paste0(round(100 * wins / sum(wins)), "%"))

mean_rank <- cell |>
  group_by(Industry, .id) |>
  mutate(rank = rank(rmsse)) |>
  ungroup() |>
  group_by(.model) |>
  summarise(mean_rank = round(mean(rank), 2), mean_rmsse = round(mean(rmsse), 3))

cat("cells:", nrow(cell), "\n")
#> cells: 90
win_rate
#> # A tibble: 2 × 3
#>   .model  wins win_rate
#>   <chr>  <int> <chr>   
#> 1 ets       23 77%     
#> 2 snaive     7 23%     
mean_rank
#> # A tibble: 3 × 3
#>   .model mean_rank mean_rmsse
#>   <chr>      <dbl>      <dbl>
#> 1 ets         1.23      0.616
#> 2 snaive      1.87      0.726
#> 3 tslm        2.9       1.01
```

Adding `.id` to the `by` argument is what makes this possible: instead of one score per series, you get one score per series **per origin**, giving 6 times 5 times 3 = 90 rows. `slice_min()` picks the best model in each of the 30 series-and-origin cells, and `rank()` scores 1 for best, 2 for second, 3 for worst inside each cell before averaging.

`ets` wins 23 of the 30 cells and carries a mean rank of 1.23, meaning it is nearly always first or second. `tslm` never wins a single cell, which is a far clearer statement than "its RMSE was 28.3".

[KEY INSIGHT]
**Win rate answers a different question from mean error, and it is usually the question you meant.** Mean error asks "how much money do I lose"; win rate asks "how often would this choice have been right". Report both, and worry when they disagree.

**Try it:** Recompute the win counts using only the three largest series (they are already sitting in `rmse_share`) and see whether the story changes.

```r title="Your turn: win rate on the big three"
ex_big <- rmse_share$Industry[1:3]
ex_wins <- cell |>
  mutate(Industry = substr(Industry, 1, 22)) |>
  filter(Industry %in% ex_big) |>
  group_by(Industry, .id) |>
  slice_min(rmsse, n = 1) |>
  ungroup() |>
  count(.model, name = "wins")
ex_wins
#> # A tibble: 2 × 2
#>   .model  wins
#>   <chr>  <int>
#> 1 ets       12
#> 2 snaive     3
```

<details>
<summary>Click to reveal solution</summary>

```r title="Big three against the full panel"
ex_wins |> mutate(share_of_15 = paste0(round(100 * wins / 15), "%"))
#> # A tibble: 2 × 3
#>   .model  wins share_of_15
#>   <chr>  <int> <chr>      
#> 1 ets       12 80%        
#> 2 snaive     3 20%
```

**Explanation:** 12 of 15 is 80 percent, against 77 percent across all six series. The conclusion barely moves, which is reassuring: `ets` is not winning the panel on the strength of the small series alone.

</details>

## Is the winning model actually better, or did it just get lucky?

A 77 percent win rate over 30 cells is encouraging, but 30 is not a big number. Toss a fair coin 30 times and 23 heads happens by chance often enough to be worth ruling out.

The right way to test this is to exploit the pairing. Every cell scored **both** models on exactly the same series over exactly the same 12 months, so instead of comparing two averages you can look at the 30 differences directly. Pairing removes the "some series and some periods are just harder" noise, which is most of the noise.

```r title="Turn 30 cells into 30 paired differences"
paired <- cell |>
  select(Industry, .id, .model, rmsse) |>
  pivot_wider(names_from = .model, values_from = rmsse) |>
  mutate(diff = ets - snaive)

paired |>
  summarise(cells = n(),
            mean_diff = round(mean(diff), 3),
            sd_diff   = round(sd(diff), 3),
            ets_wins  = sum(diff < 0))
#> # A tibble: 1 × 4
#>   cells mean_diff sd_diff ets_wins
#>   <int>     <dbl>   <dbl>    <int>
#> 1    30     -0.11   0.242       23
```

`pivot_wider()` puts each model's score in its own column so the three rows per cell become one row with an `ets`, `snaive` and `tslm` column. Then `diff` is negative whenever `ets` did better.

The average difference is -0.11 RMSSE, so `ets` beats `snaive` by about a tenth of a seasonal-naive error per cell. The standard deviation is 0.242, more than twice the size of the mean, which tells you the differences swing wildly from cell to cell. That spread is precisely why you cannot eyeball this.

```r title="Test the 30 differences"
pair_t <- t.test(paired$diff)
cat("mean difference:", round(pair_t$estimate, 3),
    "\n95 pct CI:", round(pair_t$conf.int[1], 3), "to", round(pair_t$conf.int[2], 3),
    "\np-value:", round(pair_t$p.value, 4), "\n")
#> mean difference: -0.11 
#> 95 pct CI: -0.2 to -0.02 
#> p-value: 0.0189

pair_sign <- binom.test(sum(paired$diff < 0), nrow(paired))
cat("sign test p-value:", round(pair_sign$p.value, 4), "\n")
#> sign test p-value: 0.0052
```

Two tests, deliberately. The `t.test()` on the differences asks whether their true average is zero and answers no, p = 0.0189, with a confidence interval running from -0.20 to -0.02 that never touches zero. The `binom.test()` sign test ignores the sizes entirely and just asks whether 23 wins out of 30 could come from a coin flip; at p = 0.0052 it says no. Two different questions, same conclusion, which is much stronger than either alone.

This is also the answer to the single-series result from earlier. There, `ets` and `snaive` were tied at 17.2 against 17.1 on 11 origins, and you had no basis to prefer either. Widening to six series and 30 paired cells is what turned a coin flip into a decision.

```r title="See the spread of the differences"
ggplot(paired, aes(x = diff)) +
  geom_histogram(bins = 12, fill = "#8f7fe8", colour = "white") +
  geom_vline(xintercept = 0, linetype = "dashed", linewidth = 0.8) +
  labs(title = "Per-cell RMSSE difference: ets minus snaive",
       subtitle = "Negative means ets forecast better on that series and origin",
       x = "RMSSE difference", y = "Number of cells") +
  theme_minimal(base_size = 12)
```

The histogram shows the shape the summary statistics hide. Most of the mass sits just left of the dashed zero line, which is the many small `ets` wins, and there is a thin tail on the right where `snaive` won by a lot. `ets` wins often and narrowly; `snaive` wins rarely and widely.

[NOTE]
**Overlapping windows make these cells less independent than the test assumes.** Consecutive origins share almost all their training data, so treat the p-value as a decision aid rather than a formal guarantee. The Diebold-Mariano test, available as dm.test in the forecast package, is the tool built for exactly this and adjusts for autocorrelated loss differences.

**Try it:** Run the same paired comparison for `ets` against `tslm`. The `cell` table already has everything you need.

```r title="Your turn: test ets against tslm"
ex_paired <- cell |>
  select(Industry, .id, .model, rmsse) |>
  pivot_wider(names_from = .model, values_from = rmsse) |>
  mutate(diff = ets - tslm)
signif(t.test(ex_paired$diff)$p.value, 3)
#> [1] 2.49e-08
```

<details>
<summary>Click to reveal solution</summary>

```r title="How lopsided the tslm comparison is"
ex_paired |>
  summarise(mean_diff = round(mean(diff), 3),
            ets_wins  = sum(diff < 0),
            cells     = n())
#> # A tibble: 1 × 3
#>   mean_diff ets_wins cells
#>       <dbl>    <int> <int>
#> 1    -0.398       30    30
```

**Explanation:** `ets` beats `tslm` in all 30 cells by an average of 0.398 RMSSE, and the p-value of 0.0000000249 reflects that. When a model loses every single cell you do not really need a test, which is the useful lesson: formal testing earns its keep on close calls, not on blowouts.

</details>

## What silently ruins a backtest?

A backtest can run cleanly, print a tidy table and still be wrong. These are the failures that never raise an error.

The first is the oldest one in forecasting: reporting how well a model fits data it has already seen.

```r title="In-sample error is not forecast error"
dept_full_fit <- dept |>
  model(ets    = ETS(Turnover),
        tslm   = TSLM(Turnover ~ trend() + season()),
        snaive = SNAIVE(Turnover ~ drift()))

dept_full_fit |>
  accuracy() |>
  transmute(.model, in_sample_RMSE = round(RMSE, 2)) |>
  arrange(in_sample_RMSE)
#> # A tibble: 3 × 2
#>   .model in_sample_RMSE
#>   <chr>           <dbl>
#> 1 ets              12.0
#> 2 tslm             14.4
#> 3 snaive           16.5
```

Calling `accuracy()` on a fitted model with no second argument scores its residuals, meaning how close it got to the data it was trained on. Compare with the backtest table from earlier: in-sample says `ets` 12.0, `tslm` 14.4, `snaive` 16.5, while the backtest said `snaive` 17.1, `ets` 17.2, `tslm` 18.9.

Two things went wrong at once. Every number is optimistic (`ets` by 43 percent), and the **ordering flipped**: in-sample crowns `ets` a clear winner over `snaive` by 4.5 points, while the backtest has them tied. Flexible models like `ets` have more parameters to fit to the training data, so they gain the most when the score is computed from that same data.

[WARNING]
**In-sample error rewards flexibility, out-of-sample error rewards being right.** Any comparison between a flexible model and a rigid one is biased toward the flexible one until you make the forecasts genuinely out of sample.

The second failure is starting too early. Origins near the beginning of your data train on very little history, and a model fitted on too little history can produce forecasts that are not merely poor but absurd.

```r title="How much does .init change the verdict"
init_sweep <- lapply(c(24, 60, 96), function(ini) {
  cv <- dept |> stretch_tsibble(.init = ini, .step = 12)
  keep <- cv |> as_tibble() |> group_by(.id) |> summarise(e = max(Month)) |>
    filter(e <= max(dept$Month) - 12) |> pull(.id)
  cv |>
    filter(.id %in% keep) |>
    model(ets = ETS(Turnover), snaive = SNAIVE(Turnover ~ drift())) |>
    forecast(h = 12) |>
    accuracy(dept) |>
    transmute(.init = ini, origins = length(keep), .model, RMSE = round(RMSE, 2))
})

bind_rows(init_sweep) |> pivot_wider(names_from = .model, values_from = RMSE)
#> # A tibble: 3 × 4
#>   .init origins   ets snaive
#>   <dbl>   <int> <dbl>  <dbl>
#> 1    24      12  88.5   16.3
#> 2    60       9  14.4   16.3
#> 3    96       6  16.0   16.5
```

The `lapply()` runs the same backtest three times with different starting window sizes and stacks the results. Look at the `ets` column: 88.5, then 14.4, then 16.0. With only 24 months of history, `ets` has to estimate twelve seasonal effects from two observations each, and at least one origin produced a forecast so far off that it inflated the pooled RMSE more than fivefold. The `snaive` column barely moves (16.3, 16.3, 16.5) because a rigid model cannot go badly wrong.

If you had run this backtest at `.init = 24` you would have concluded that `snaive` beats `ets` by a factor of five. It does not. One origin, trained on two years of data, decided the ranking for all twelve.

[TIP]
**Report the median RMSE across origins alongside the mean.** A single blown fold moves the mean enormously and the median barely at all, so a large gap between the two is a fast signal that one origin needs investigating rather than averaging.

Four more traps are worth naming even though they need your own data to demonstrate:

1. **Transforms computed before splitting.** Standardising, log-transforming with a global lambda, deseasonalising or smoothing the whole series first leaks future information into every training window, because the parameters of that transform were estimated using data the model should not have seen. Compute the transform inside each fold.
2. **Regressors you would not have had.** A model that uses next month's advertising spend backtests beautifully and cannot be deployed, because in production that column is itself a forecast. Either forecast the regressor too, or lag it far enough that it is genuinely known.
3. **Choosing the model on the full series, then backtesting only the winner.** The selection step saw all the data, so the backtest is scoring a choice that already knew the answer. Put the selection inside the fold: that is why `ETS()` is left to pick its own form at every origin here rather than being fixed once up front.
4. **Refitting more often in the backtest than in production.** If your job reruns quarterly but your backtest refits every month, your backtest is measuring a fresher model than the one you will actually ship.

**Try it:** The `.init` sweep results are already in `init_sweep`. Pull out just the `snaive` rows to confirm how little a rigid model cares about the starting window size.

```r title="Your turn: snaive across .init values"
ex_init <- bind_rows(init_sweep) |> filter(.model == "snaive")
ex_init
#> # A tibble: 3 × 4
#>   .init origins .model  RMSE
#>   <dbl>   <int> <chr>  <dbl>
#> 1    24      12 snaive  16.3
#> 2    60       9 snaive  16.3
#> 3    96       6 snaive  16.5
```

<details>
<summary>Click to reveal solution</summary>

```r title="Measuring the sensitivity of each model"
bind_rows(init_sweep) |>
  group_by(.model) |>
  summarise(worst = max(RMSE), best = min(RMSE), spread = round(max(RMSE) - min(RMSE), 2))
#> # A tibble: 2 × 4
#>   .model worst  best spread
#>   <chr>  <dbl> <dbl>  <dbl>
#> 1 ets     88.5  14.4  74.1 
#> 2 snaive  16.5  16.3   0.2
```

**Explanation:** Changing `.init` moves the `ets` score by 74.1 RMSE and the `snaive` score by 0.2. Any backtest setting that changes one model's score 370 times more than another's is not a neutral choice, it is part of the result.

</details>

## Complete Example: from raw series to a deployed forecast

Here is the whole decision, end to end, using the objects already built above. Step one is to put the two scale-free verdicts side by side.

```r title="The decision table"
decision <- mean_rank |>
  left_join(win_rate |> select(.model, win_rate), by = ".model") |>
  mutate(win_rate = replace_na(win_rate, "0%")) |>
  arrange(mean_rank)
decision
#> # A tibble: 3 × 4
#>   .model mean_rank mean_rmsse win_rate
#>   <chr>      <dbl>      <dbl> <chr>   
#> 1 ets         1.23      0.616 77%     
#> 2 snaive      1.87      0.726 23%     
#> 3 tslm        2.9       1.01  0%
```

The three verdicts agree. `ets` has the best mean rank (1.23), the best mean RMSSE (0.616) and the highest win rate (77 percent), and the paired tests from the previous section confirmed the gap over `snaive` is unlikely to be luck (p = 0.019 on the differences, p = 0.005 on the signs). `tslm` never won a cell and scores above 1, so it loses to seasonal naive on average and should not be shipped.

Step two is the one people forget: the model you deploy is refit on **everything**, including the months the backtest held out. The backtest chose the recipe, not the final parameters.

```r title="Refit the winner on all data and forecast"
final_fit <- vic |> model(ets = ETS(Turnover))
final_fc  <- final_fit |> forecast(h = 12)

final_fc |>
  as_tibble() |>
  filter(Industry == "Department stores") |>
  transmute(Month, point_forecast = round(.mean, 1)) |>
  head(4)
#> # A tibble: 4 × 2
#>      Month point_forecast
#>      <mth>          <dbl>
#> 1 2019 Jan           367.
#> 2 2019 Feb           291.
#> 3 2019 Mar           365.
#> 4 2019 Apr           380.
```

`model()` on the untouched `vic` fits one ETS per industry using all 108 months, and `forecast(h = 12)` projects each one through 2019. The department-store numbers show the seasonal shape you would expect: a January that is still elevated from the Christmas run, a February trough, then a climb back.

What the backtest bought you is the sentence you can now say out loud: across six categories and five origins, an automatically selected ETS beat both a seasonal naive benchmark and a trend-plus-season regression 77 percent of the time, by roughly a tenth of a seasonal-naive error, and the margin held up under a paired test. That is a defensible model choice, not a hunch.

## Practice Exercises

These combine several ideas from the tutorial. Every object they need (`dept`, `vic`, `vic_fc`, `cell`, `dept_slide`) is already in your session.

### Exercise 1: Backtest with a coarser step and trim it correctly

Build an expanding backtest of `dept` with `.init = 96` and `.step = 12`, trim the origins that do not have a full 12 months of future, then fit `ets`, `tslm` and `snaive` and rank them by RMSE. Compare your ranking to the `.step = 6` result (`ets` 17.2, `snaive` 17.1, `tslm` 18.9).

```r title="Exercise 1 starter: count the raw windows"
# Step 1: build the stretch and see how many raw windows you get
my_cv <- dept |> stretch_tsibble(.init = 96, .step = 12)
dplyr::n_distinct(my_cv$.id)
#> [1] 7

# Step 2: trim to origins with a full 12 months of future, then fit and score
# Hint: reuse the origin_ends / full_h pattern from the tutorial
```

<details>
<summary>Click to reveal solution</summary>

```r title="Exercise 1 solution"
my_keep <- my_cv |> as_tibble() |> group_by(.id) |> summarise(e = max(Month)) |>
  filter(e <= max(dept$Month) - 12) |> pull(.id)

my_scores <- my_cv |>
  filter(.id %in% my_keep) |>
  model(ets    = ETS(Turnover),
        tslm   = TSLM(Turnover ~ trend() + season()),
        snaive = SNAIVE(Turnover ~ drift())) |>
  forecast(h = 12) |>
  accuracy(dept) |>
  transmute(.model, RMSE = round(RMSE, 2)) |>
  arrange(RMSE)
my_scores
#> # A tibble: 3 × 2
#>   .model  RMSE
#>   <chr>  <dbl>
#> 1 ets     16.0
#> 2 snaive  16.5
#> 3 tslm    18.6
```

**Explanation:** Seven raw windows trim to six usable ones. The ranking now puts `ets` ahead of `snaive` rather than a hair behind, which is the honest reading of a 6-origin backtest: with this few origins the top two are within noise of each other, exactly as the 11-origin version suggested. `tslm` stays last either way, and that is the conclusion you can actually rely on.

</details>

### Exercise 2: Does the ranking change between short and long horizons?

Using `vic_fc`, compute a per-cell RMSSE that is also broken out by horizon, bucket the horizons into h = 1 to 6 and h = 7 to 12, then report the mean rank of each model within each bucket. Does the same model lead in both?

```r title="Exercise 2 starter: add a horizon column"
# Step 1: number the forecasts within each series, origin and model
my_bucket <- vic_fc |>
  group_by(Industry, .id, .model) |>
  mutate(h = row_number()) |>
  ungroup() |>
  as_fable(response = "Turnover", distribution = Turnover) |>
  accuracy(vic, by = c("Industry", ".id", ".model", "h"), measures = list(rmsse = RMSSE))
head(my_bucket, 3)
#> # A tibble: 3 × 6
#>   Industry                                        .id .model     h .type  rmsse
#>   <chr>                                         <int> <chr>  <int> <chr>  <dbl>
#> 1 Cafes, restaurants and takeaway food services     1 ets        1 Test  0.0564
#> 2 Cafes, restaurants and takeaway food services     1 ets        2 Test  0.0335
#> 3 Cafes, restaurants and takeaway food services     1 ets        3 Test  0.424 

# Step 2: bucket h, average within each cell and bucket, then rank
```

<details>
<summary>Click to reveal solution</summary>

```r title="Exercise 2 solution"
my_ranks <- my_bucket |>
  mutate(bucket = if_else(h <= 6, "h 1-6", "h 7-12")) |>
  group_by(Industry, .id, bucket, .model) |>
  summarise(rmsse = mean(rmsse), .groups = "drop") |>
  group_by(Industry, .id, bucket) |>
  mutate(rank = rank(rmsse)) |>
  ungroup() |>
  group_by(bucket, .model) |>
  summarise(mean_rank = round(mean(rank), 2), .groups = "drop") |>
  pivot_wider(names_from = bucket, values_from = mean_rank)
my_ranks
#> # A tibble: 3 × 3
#>   .model `h 1-6` `h 7-12`
#>   <chr>    <dbl>    <dbl>
#> 1 ets       1.33     1.67
#> 2 snaive    2        1.7 
#> 3 tslm      2.67     2.63
```

**Explanation:** `ets` leads both buckets, so the overall recommendation survives. But its edge shrinks with distance: mean rank 1.33 versus 2.00 in the near term, narrowing to 1.67 versus 1.70 further out, which is effectively a tie. The practical reading is that `ets` earns its keep on short-range forecasts, and beyond six months you could ship the far cheaper seasonal naive with little loss.

</details>

### Exercise 3: Would you trust this result from one series alone?

Take the sliding-window backtest of `dept` (`dept_slide`, 11 origins), score `ets` and `snaive` per origin, then run a sign test on how often `ets` won. Compare the p-value to the 0.0052 you got from the six-series panel.

```r title="Exercise 3 starter: per-origin scores"
# Score each model separately on each origin, then reshape so one row = one origin
# Hint: accuracy(..., by = c(".id", ".model")) then pivot_wider
# Then: binom.test(number of ets wins, number of origins)
```

<details>
<summary>Click to reveal solution</summary>

```r title="Exercise 3 solution"
my_slide_cell <- dept_slide |>
  model(ets = ETS(Turnover), snaive = SNAIVE(Turnover ~ drift())) |>
  forecast(h = 12) |>
  accuracy(dept, by = c(".id", ".model")) |>
  select(.id, .model, RMSE) |>
  pivot_wider(names_from = .model, values_from = RMSE)

my_sign <- binom.test(sum(my_slide_cell$ets < my_slide_cell$snaive), nrow(my_slide_cell))
cat("origins where ets won:", sum(my_slide_cell$ets < my_slide_cell$snaive),
    "of", nrow(my_slide_cell),
    "\nsign test p-value:", round(my_sign$p.value, 4), "\n")
#> origins where ets won: 7 of 11 
#> sign test p-value: 0.5488
```

**Explanation:** `ets` won 7 of 11 origins, a 64 percent win rate that looks similar to the panel's 77 percent, but the p-value is 0.5488. Eleven observations simply cannot separate a real edge from a coin flip. This is the argument for backtesting at scale in one number: the six-series panel did not make the model better, it made the evidence strong enough to act on.

</details>

## Frequently Asked Questions

### How many origins do I actually need?

Enough that the winner is not decided by two or three folds. As a rough guide, aim for at least 20 origin-and-series cells before you trust a close call, and remember that widening across series is usually cheaper than shortening `.step`, because extra series add genuinely new information while extra origins mostly re-use the same history.

### Should `.step` always be 1?

No. Consecutive origins share nearly all their training data, so their errors are heavily correlated and the twentieth origin adds far less information than the first. Stepping by a quarter of your seasonal period is a good default, and if you step by exactly the seasonal period every origin ends in the same calendar month, which confounds horizon with season.

### Does a good backtest score mean my model is good?

It means it is better than the alternatives you tested, on the history you tested. That is all. Always include a naive benchmark such as `SNAIVE()` so the number has a floor, and treat any scaled error above 1 as a failure regardless of how good the RMSE looks.

### Can I backtest a model that needs future regressors?

Yes, but you must supply the regressor values for each forecast window through the `new_data` argument of `forecast()`, and those values have to be ones you would genuinely have had at the origin. Feeding in the true future values measures a model you cannot deploy.

### Should the deployed model be refit on all the data?

Yes. The backtest exists to choose the model specification, not to produce the forecast you ship. Once you have chosen, refit on the full history so the model sees the most recent months, which are usually the most relevant ones.

### How is this different from tsCV() in the forecast package?

`tsCV()` does the same rolling-origin job for `ts` objects and returns a matrix of errors that you summarise yourself. The tsibble approach shown here works on tidy data frames, handles many series through the key column without a loop, and returns errors already labelled by series, origin and model, which is what makes aggregation and paired testing straightforward. Use `tsCV()` for a quick single-series check and this pipeline when you are comparing models across a panel.

## Summary

![Overview of the backtesting workflow](screenshots/Backtesting-Forecasts-in-R-overview.webp)

*Figure 4: The whole backtest in one picture: build origins, score forecasts, decide.*

| Decision | Tool | Gotcha to avoid |
|---|---|---|
| Build expanding origins | `stretch_tsibble(.init, .step)` | The last origins have no future to be scored on, so trim them |
| Build fixed-length origins | `slide_tsibble(.size, .step)` | Short windows starve seasonal models |
| Fit every model on every origin | `model()` on the stacked tsibble | Libraries and specifications must be identical across origins |
| Score the forecasts | `accuracy(fc, original_data)` | Never score against the stacked data, always the original |
| Score by horizon | `group_by(.id, .model)` then `row_number()` | Grouping by `.id` alone silently mixes the models together |
| Combine across series | `RMSSE` or `MASE`, plus win rate | Plain RMSE hands the vote to your biggest series |
| Confirm the winner | Paired `t.test()` and `binom.test()` | Overlapping folds are not fully independent |
| Ship it | Refit on all data, then `forecast()` | The backtest picks the recipe, not the final parameters |

The short version: one holdout tells you about one year, a rolling backtest tells you about your model, and a rolling backtest across many series tells you enough to defend the decision.

## References

1. Hyndman, R.J. & Athanasopoulos, G. - *Forecasting: Principles and Practice*, 3rd edition, Section 5.10: Time series cross-validation. [Link](https://otexts.com/fpp3/tscv.html)
2. Hyndman, R.J. & Athanasopoulos, G. - *Forecasting: Principles and Practice*, 3rd edition, Section 5.8: Evaluating point forecast accuracy. [Link](https://otexts.com/fpp3/accuracy.html)
3. tsibble documentation - `stretch_tsibble()` reference. [Link](https://tsibble.tidyverts.org/reference/stretch_tsibble.html)
4. tsibble documentation - `slide_tsibble()` reference. [Link](https://tsibble.tidyverts.org/reference/slide_tsibble.html)
5. fabletools documentation - `accuracy()` and the built-in accuracy measures. [Link](https://fabletools.tidyverts.org/reference/accuracy.html)
6. Hyndman, R.J. - *Time series cross-validation using fable* (2021). [Link](https://robjhyndman.com/hyndsight/tscv-fable/)
7. Hyndman, R.J. & Koehler, A.B. - *Another look at measures of forecast accuracy*, International Journal of Forecasting 22(4), 2006. The paper that introduced scaled errors. [Link](https://doi.org/10.1016/j.ijforecast.2006.03.001)
8. Hewamalage, H., Ackermann, K. & Bergmeir, C. - *Forecast evaluation for data scientists: common pitfalls and best practices*, Data Mining and Knowledge Discovery, 2023. [Link](https://link.springer.com/article/10.1007/s10618-022-00894-5)
9. forecast package documentation - `dm.test()`, the Diebold-Mariano test for comparing forecast accuracy. [Link](https://pkg.robjhyndman.com/forecast/reference/dm.test.html)
10. Svetunkov, I. - *Rolling Origin* vignette, greybox package. A more parameterised treatment of origin design. [Link](https://cran.r-project.org/web/packages/greybox/vignettes/ro.html)

## Continue Learning

- [Time Series Cross-Validation in R with tsCV()](Time-Series-Cross-Validation-in-R.html) - the same rolling-origin idea using the forecast package on a single `ts` object, with a closer look at how errors grow with horizon.
- [Forecast Accuracy in R: MAE, RMSE, MAPE, and MASE](Forecast-Accuracy-in-R.html) - what each metric measures and when it misleads, which is the vocabulary this tutorial assumes.
- [Global Forecasting Models in R](Global-Forecasting-Models-in-R.html) - what to do once your backtest spans hundreds of series and one model per series stops making sense.

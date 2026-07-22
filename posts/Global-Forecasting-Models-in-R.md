---
title: "Global Forecasting Models in R: Learn Across Many Series"
slug: "Global-Forecasting-Models-in-R"
description: "Train one forecasting model across 152 retail series in R. Build the pooled table, fix the scaling trap, and measure when global beats one per series."
keywords: "global forecasting model R, cross-learning time series, forecasting many time series R, pooled forecasting model, local vs global forecasting, panel data forecasting R, aus_retail forecasting, one model many series"
auto_link_terms: "global forecasting model|global forecasting models|cross-learning|cross learning across series|local vs global forecasting|one model per series|pooled forecasting model|panel data forecasting|forecasting many time series|per-series scaling|cold start forecasting|pooled training table"
auto_link_case_sensitive: false
mathjax: true
webr: true
date: "2026-07-22"
curriculum_id: "TS2-9.3"
post_type: "C"
sidebar_section: "Time Series"
sidebar_title: "Global Forecasting Models"
sidebar_order: "43"
difficulty: "Intermediate"
---

<p class="lead">A global forecasting model is a single model fitted to the stacked history of many time series at once, so that a pattern learned from one series improves the forecast for all the others. It is how the M4 and M5 competitions were won, and it is the only practical option once you have thousands of series to forecast. This page builds one on 152 real Australian retail series, walks into the scaling trap that ruins most pooled models, and then measures whether the global model actually beats one model per series. On this data it does not, and finding out exactly why turns out to be the most useful thing on the page. Every number here was measured, not estimated.</p>

## What is a global forecasting model, and how is it different from what you do now?

If you have forecast more than one series before, you have almost certainly written a loop. For each product, each store, each region, you fit a model, produce a forecast, then move on to the next one. That is the local approach, and it is what nearly every forecasting tutorial teaches. A global model reverses it: instead of 500 models that each saw one series, you build one model that saw all 500.

We will work with `aus_retail`, which ships with the `tsibbledata` package. It holds monthly retail turnover for every combination of Australian state and retail industry, which is exactly the shape of problem global models were invented for.

```r title="Load 152 retail series"
library(tsibbledata)
library(tsibble)
library(lubridate)
library(dplyr)
library(ggplot2)

state_code <- c("Australian Capital Territory" = "ACT", "New South Wales" = "NSW",
                "Northern Territory" = "NT",  "Queensland" = "QLD",
                "South Australia" = "SA",     "Tasmania" = "TAS",
                "Victoria" = "VIC",           "Western Australia" = "WA")

retail <- as_tibble(aus_retail) |>
  mutate(series = paste(state_code[State], Industry, sep = " / "),
         Month  = as_date(Month)) |>
  select(series, Industry, Month, Turnover)

cat("series:", length(unique(retail$series)),
    " rows:", nrow(retail),
    " months:", format(min(retail$Month)), "to", format(max(retail$Month)), "\n")
head(retail, 4)
#> series: 152  rows: 64532  months: 1982-04-01 to 2018-12-01
#> # A tibble: 4 × 4
#>   series                                         Industry                        Month      Turnover
#>   <chr>                                          <chr>                           <date>        <dbl>
#> 1 ACT / Cafes, restaurants and catering services Cafes, restaurants and caterin… 1982-04-01      4.4
#> 2 ACT / Cafes, restaurants and catering services Cafes, restaurants and caterin… 1982-05-01      3.4
#> 3 ACT / Cafes, restaurants and catering services Cafes, restaurants and caterin… 1982-06-01      3.6
#> 4 ACT / Cafes, restaurants and catering services Cafes, restaurants and caterin… 1982-07-01      4
```

Here is what those lines did. `aus_retail` arrives as a tsibble, a table that knows which column is time and which columns identify each separate series, so `as_tibble()` strips that wrapper off and leaves us with an ordinary data frame. The `state_code` vector is a lookup table: writing `state_code[State]` replaces every long state name with its three-letter code, which keeps the series labels short enough to read. `as_date()` turns the year-month labels into real dates so `lubridate` can pull months and years out of them later.

The result is 64,532 monthly observations spread across 152 separate series, each running from April 1982 to December 2018. That is 152 forecasting problems, and 152 is a small number by industrial standards. A supermarket chain forecasts a few hundred thousand.

The single most important fact about these series is that they are not the same size. Some of them are not even close.

```r title="Compare the size of the series"
sizes <- retail |>
  group_by(series) |>
  summarise(months = n(), avg = round(mean(Turnover), 1), .groups = "drop") |>
  arrange(avg)

bind_rows(head(sizes, 3), tail(sizes, 3))
#> # A tibble: 6 × 3
#>   series                                               months    avg
#>   <chr>                                                 <int>  <dbl>
#> 1 NT / Newspaper and book retailing                       369    2.5
#> 2 NT / Footwear and other personal accessory retailing    369    3.3
#> 3 NT / Other recreational goods retailing                 369    3.3
#> 4 VIC / Food retailing                                    441 1279.
#> 5 NSW / Supermarket and grocery stores                    441 1322
#> 6 NSW / Food retailing                                    441 1653.
```

`group_by()` splits the table into one group per series, `summarise()` collapses each group to a single row holding its length and its average turnover, and `arrange()` sorts the result so the smallest series float to the top. Stacking the first three rows on top of the last three with `bind_rows()` gives us both ends of the range in one view.

Read the `avg` column. Newspaper and book retailing in the Northern Territory averages 2.5 million dollars a month. Food retailing in New South Wales averages 1,653 million. The largest series is roughly 650 times the smallest. Hold on to that number, because it is the single fact that decides whether a global model works or falls over, and we will come back to it in a dedicated section.

![Two ways to forecast 152 series: one model per series, or one model for all of them](screenshots/Global-Forecasting-Models-in-R-local-vs-global.webp)

*Figure 1: The same 152 series, fitted two ways.*

[KEY INSIGHT]
**A local approach stores one set of parameters per series, a global approach stores one set in total.** That single sentence is the whole difference. Everything else on this page, the scaling, the accuracy comparison, the cold-start trick, follows from the fact that one shared set of numbers has to serve every series at once.

**Try it:** The block below lists three New South Wales series in ascending order of size. Change it to show the three *largest* Victorian series instead. You need to change the state code and add a sort.

```r title="Your turn: find the largest Victorian series"
ex_sizes <- sizes |> filter(startsWith(series, "NSW"))
head(ex_sizes, 3)
#> # A tibble: 3 × 3
#>   series                                                months   avg
#>   <chr>                                                  <int> <dbl>
#> 1 NSW / Other recreational goods retailing                 441  74.4
#> 2 NSW / Newspaper and book retailing                       441  92.2
#> 3 NSW / Footwear and other personal accessory retailing    441 134.
```

<details>
<summary>Click to reveal solution</summary>

```r title="Largest Victorian series solution"
ex_big <- sizes |> filter(startsWith(series, "VIC")) |> arrange(desc(avg))
head(ex_big, 3)
#> # A tibble: 3 × 3
#>   series                               months   avg
#>   <chr>                                 <int> <dbl>
#> 1 VIC / Food retailing                    441 1279.
#> 2 VIC / Supermarket and grocery stores    441 1083.
#> 3 VIC / Household goods retailing         441  621.
```

**Explanation:** `sizes` was already sorted ascending by `arrange(avg)`, so `head()` returned the smallest. Adding `arrange(desc(avg))` reverses the order and puts the biggest series first.

</details>

## Why would a model trained on other retailers' sales help predict yours?

This is the question that decides whether the whole idea is sensible. Why should sales of hardware in South Australia teach a model anything useful about clothing sales in Tasmania? They are different products, different customers, different states.

The answer is that the model is not learning about hardware or clothing. It is learning about *shape*: the way retail turnover moves from month to month. Let us look at four series drawn from opposite ends of the size range.

```r title="Plot four series in actual dollars"
few <- c("NT / Newspaper and book retailing",
         "TAS / Clothing retailing",
         "VIC / Liquor retailing",
         "NSW / Food retailing")

ggplot(filter(retail, series %in% few), aes(Month, Turnover, colour = series)) +
  geom_line() +
  labs(title = "Four retail series in actual dollars", y = "Turnover ($ million)", x = NULL) +
  theme_minimal() + theme(legend.position = "bottom")
```

Run that and you get a chart with one line soaring near 2,000 and three lines squashed flat along the bottom axis. In dollar terms these series have nothing in common. You cannot even see the shape of the small ones.

Now divide every series by its own long-run average, so each one is expressed as a multiple of its own typical month rather than in dollars.

```r title="Plot the same four series relative to their own average"
retail |>
  filter(series %in% few) |>
  group_by(series) |>
  mutate(relative = Turnover / mean(Turnover)) |>
  ggplot(aes(Month, relative, colour = series)) +
  geom_line() +
  labs(title = "The same four series, each divided by its own average",
       y = "Turnover / series average", x = NULL) +
  theme_minimal() + theme(legend.position = "bottom")
```

The four lines now sit on top of each other. All four climb over the decades, all four wobble up and down within each year, and all four spike at the same time of year. The dollar amounts were hiding a common structure that was there the whole time.

That impression deserves a number rather than an eyeball. Below we compute a seasonal index for every series: for each calendar month, how does turnover in that month compare to the average month of the same year?

```r title="Measure the shared seasonal shape"
seasonal <- retail |>
  group_by(series, yr = year(Month)) |>
  mutate(year_avg = mean(Turnover)) |>
  ungroup() |>
  group_by(series, mth = month(Month)) |>
  summarise(index = mean(Turnover / year_avg), .groups = "drop")

seasonal |>
  group_by(mth) |>
  summarise(median_index = round(median(index), 2),
            share_above_average = round(mean(index > 1), 2)) |>
  as.data.frame()
#>    mth median_index share_above_average
#> 1    1         0.94                0.08
#> 2    2         0.87                0.02
#> 3    3         0.94                0.14
#> 4    4         0.93                0.04
#> 5    5         0.98                0.15
#> 6    6         0.95                0.16
#> 7    7         0.98                0.24
#> 8    8         0.98                0.33
#> 9    9         0.98                0.28
#> 10  10         1.03                0.79
#> 11  11         1.05                0.93
#> 12  12         1.38                1.00
```

Walk through the calculation. The first `group_by()` works within each series and each year, so `year_avg` becomes the average month of that particular year for that particular series. Dividing an actual month by that average removes both the size of the series and the long-run trend, leaving only the seasonal wobble. The second `group_by()` then averages that ratio across all the years, giving one index per calendar month per series. Finally we summarise across all 152 series.

Now read the last column, which is the share of series whose index for that month is above 1. In December it is 1.00. Every single one of the 152 series, in every state, in every industry, sells more in December than in its average month, by a median of 38 percent. November is 0.93 and October is 0.79. February is the mirror image: only 2 percent of series are above average.

[KEY INSIGHT]
**The seasonal shape is common to all 152 series, and anything common can be learned once and reused.** A local model fitted to one Tasmanian clothing series has to rediscover the December spike from that series alone. A global model has already seen 151 other series agree that December is high, so it arrives at your series with the answer mostly worked out.

This is what the literature calls cross-learning, and it has a firmer theoretical footing than you might expect. Montero-Manso and Hyndman proved that for time series forecasting, global methods are not more restrictive than local ones: any set of local models can in principle be matched by a single global model, given enough flexibility. They also showed that the complexity a local approach needs grows with the number of series, while a global model's stays constant. That means a global model can afford to be more complex than any individual series could ever support, and still generalise well.

**Try it:** The block below summarises December's seasonal index across all 152 series as five quantiles. Change it to look at February instead, and see how the whole distribution shifts below 1.

```r title="Your turn: summarise a month's seasonal index"
ex_dec <- seasonal |> filter(mth == 12)
round(quantile(ex_dec$index, c(0, 0.25, 0.5, 0.75, 1)), 2)
#>   0%  25%  50%  75% 100%
#> 1.02 1.19 1.38 1.52 1.92
```

<details>
<summary>Click to reveal solution</summary>

```r title="February seasonal index solution"
ex_feb <- seasonal |> filter(mth == 2)
round(quantile(ex_feb$index, c(0, 0.25, 0.5, 0.75, 1)), 2)
#>   0%  25%  50%  75% 100%
#> 0.71 0.84 0.87 0.90 1.07
```

**Explanation:** The weakest December series still reaches 1.02, while February's strongest barely scrapes past 1.0 at 1.07. The two months hardly overlap at all. That consistency across 152 independent series is precisely the regularity a pooled model can exploit.

</details>

## How do you stack many series into one training table?

A model like `lm()` does not read a time series. It reads a table, one row at a time, and it has no idea the rows are in any order. Before it can forecast anything, the past has to be copied into each row as ordinary columns. If that idea is new to you, the [feature engineering tutorial](Feature-Engineering-for-Forecasting-in-R.html) covers it in depth. Here we need just enough of it to make the pooling point.

For each month we build five predictor columns: turnover one, two and three months earlier, and turnover twelve and thirteen months earlier. The first three capture short-run momentum, the last two capture where the series was at this point last year.

```r title="Build the pooled training table"
make_rows <- function(df) {
  df <- df[order(df$Month), ]
  y  <- df$Turnover
  n  <- length(y)
  lg <- function(k) c(rep(NA_real_, k), y[seq_len(n - k)])

  data.frame(series   = df$series[1],
             Industry = df$Industry[1],
             Month    = df$Month,
             y        = y,
             lag1  = lg(1),  lag2 = lg(2), lag3 = lg(3),
             lag12 = lg(12), lag13 = lg(13),
             month = month(df$Month))
}

pool <- do.call(rbind, lapply(split(retail, retail$series), make_rows))
pool <- pool[complete.cases(pool), ]
pool$month <- factor(pool$month)
row.names(pool) <- NULL

cat("pooled rows:", nrow(pool), " from", length(unique(pool$series)), "series\n")
head(pool[, c("series", "Month", "y", "lag1", "lag12", "month")], 3)
#> pooled rows: 62556  from 152 series
#>                                           series      Month   y lag1 lag12 month
#> 1 ACT / Cafes, restaurants and catering services 1983-05-01 4.3  4.4   3.4     5
#> 2 ACT / Cafes, restaurants and catering services 1983-06-01 4.3  4.3   3.6     6
#> 3 ACT / Cafes, restaurants and catering services 1983-07-01 4.6  4.3   4.0     7
```

The helper deserves a line-by-line reading, because everything downstream rests on it. `lg(k)` builds a lagged column by gluing `k` missing values onto the front of the series and dropping `k` values off the back, which slides every value down by `k` rows. `split()` cuts the 152 series apart, `lapply()` runs the helper on each one separately, and `do.call(rbind, ...)` stacks the 152 results back into one table. Splitting first is not optional: if you lagged the whole table at once, the last row of one series would leak into the first row of the next.

`complete.cases()` then drops the first thirteen rows of every series, the ones where the lags do not exist yet. That costs us 1,976 rows and leaves 62,556. Turning `month` into a factor tells `lm()` to treat it as twelve separate categories rather than a number where December is twelve times January.

![Every series contributes rows to a single pooled training table](screenshots/Global-Forecasting-Models-in-R-pooled-table.webp)

*Figure 2: Every series contributes rows to one training table.*

Look at the table that came out. It has a `series` column, but every other column is just a number. Rows from Tasmanian clothing and rows from New South Wales food sit side by side, and nothing marks where one series ends and the next begins. That is the point. To the model this is one dataset of 62,556 examples of the question "given these five recent numbers and this calendar month, what comes next?"

Now we split into a training period and a test period, by date.

```r title="Split by date, not by row"
train <- pool[pool$Month <= as.Date("2017-12-01"), ]
test  <- pool[pool$Month >= as.Date("2018-01-01"), ]

cat("train rows:", nrow(train), " test rows:", nrow(test),
    " series in test:", length(unique(test$series)), "\n")
cat("train ends:", format(max(train$Month)), " test starts:", format(min(test$Month)), "\n")
#> train rows: 60780  test rows: 1776  series in test: 148
#> train ends: 2017-12-01  test starts: 2018-01-01
```

Everything up to December 2017 trains the model. All of 2018 is held back. That is 1,776 test points, which is 12 months across 148 series. The count is 148 rather than 152 because four categories, liquor and specialised food retailing in Queensland and Tasmania, stopped being reported before 2018. Real datasets have holes like that, and a global model absorbs them without complaint.

[WARNING]
**Split by date, never by random rows.** A random split would put January 2018 in training and February 2018 in testing, and since February's `lag1` column literally contains January's value, the model would be shown the answer. Every series must be cut at the same calendar moment.

Be clear about what "forecast 2018" means here, because it decides how to read every number on the rest of the page. February 2018's `lag1` column holds January 2018's actual turnover, so when we score February we are standing at the end of January, not at the end of 2017. Every prediction below is therefore one month ahead, scored across all twelve months of 2018. That is the standard way to compare models that all use the same lag columns, and it is what keeps the local and global comparison fair.

[NOTE]
**One month ahead is not twelve months ahead.** To produce a real twelve-month forecast from a December 2017 standing point, you need one of two extra strategies: feed each prediction back in as the next month's `lag1` and step forward a month at a time (recursive), or fit a separate model per horizon, one that predicts twelve months out directly from the lags you actually have (direct). Errors compound under the recursive strategy, so the numbers get worse the further out you go. Neither strategy changes anything about the pooling decision this page measures, which is why we hold the horizon fixed at one month throughout.

**Try it:** The block below counts how many training rows each series contributes and reports the range. Change it to list the three series with the fewest rows, so you can see which categories are barely represented.

```r title="Your turn: count training rows per series"
ex_counts <- table(pool$series[pool$Month <= as.Date("2017-12-01")])
range(ex_counts)
#> [1]  19 416
```

<details>
<summary>Click to reveal solution</summary>

```r title="Shortest series solution"
ex_counts <- table(pool$series[pool$Month <= as.Date("2017-12-01")])
head(sort(ex_counts), 3)
#>                 TAS / Liquor retailing TAS / Other specialised food retailing
#>                                     19                                     19
#>                 QLD / Liquor retailing
#>                                    127
```

**Explanation:** Two Tasmanian series contribute only 19 training rows each, against 416 for a full-length series. A local model fitted to 19 rows with 17 parameters to estimate has essentially no chance. The global model simply treats those 19 rows as 19 more examples among 60,780.

</details>

## Why must you rescale each series before pooling?

Now we fit the first real global model, and it will disappoint us. That is deliberate. The failure is the most valuable thing in this section, because it is the mistake that degrades pooled models in production without ever raising an error, a warning, or a bad-looking summary number.

First we need a way to score a forecast that is fair across series of wildly different sizes. Mean absolute percentage error does that: it converts every miss into a percentage of the actual value, so being 10 million out on a 1,600 million series counts as a small error, and being 10 million out on a 2.5 million series counts as a catastrophe.

MAPE has two known weaknesses worth stating before we lean on it. It is undefined when the actual value is zero, and it penalises over-forecasting more heavily than under-forecasting. Retail turnover in this dataset never comes close to zero, so neither weakness bites here. If your series can hit zero, use MASE or RMSSE instead: both divide your error by the error a seasonal naive forecast would have made on the same series, which puts every series on a comparable footing without dividing by the actual value. RMSSE is the measure the M5 competition scored on.

```r title="Score the seasonal naive benchmark"
mape <- function(actual, forecast) mean(abs(actual - forecast) / actual) * 100

cat("seasonal naive MAPE:", round(mape(test$y, test$lag12), 2), "%\n")
#> seasonal naive MAPE: 5.92 %
```

That is our benchmark. The seasonal naive forecast simply says "this month will be whatever it was twelve months ago", which is the `lag12` column we already built. It is wrong by 5.92 percent on average across 2018. Any model that cannot beat 5.92 is not worth deploying.

Now the global model. One call to `lm()`, one formula, all 60,780 rows.

```r title="Fit a global model on raw turnover"
form <- y ~ lag1 + lag2 + lag3 + lag12 + lag13 + month

global_raw  <- lm(form, data = train)
pred_raw    <- predict(global_raw, newdata = test)

cat("global model, raw values, MAPE:", round(mape(test$y, pred_raw), 2), "%\n")
cat("coefficients:", length(coef(global_raw)), "\n")
#> global model, raw values, MAPE: 5.73 %
#> coefficients: 17
```

Seventeen numbers, fitted once, now forecast all 148 series. That is a remarkable reduction in moving parts, and a poor result. It scores 5.73 percent against the seasonal naive's 5.92 percent, an improvement so small it would not survive a different test year.

Something is badly wrong, and averaging hides it. Let us split the series into four groups by size and score each group separately.

```r title="Find out which series the model failed"
scale_of <- train |> group_by(series) |> summarise(scale = mean(y), .groups = "drop")

by_size <- test |>
  mutate(pred = pred_raw) |>
  left_join(scale_of, by = "series") |>
  mutate(size = cut(scale, quantile(scale_of$scale, c(0, .25, .5, .75, 1)),
                    include.lowest = TRUE,
                    labels = c("smallest", "small", "large", "largest"))) |>
  group_by(size) |>
  summarise(series = n_distinct(series),
            median_turnover = round(median(scale), 1),
            mape_raw = round(mape(y, pred), 2), .groups = "drop")

as.data.frame(by_size)
#>       size series median_turnover mape_raw
#> 1 smallest     36            10.2    13.19
#> 2    small     37            48.0     4.60
#> 3    large     37           119.8     3.20
#> 4  largest     38           358.0     2.24
```

`scale_of` records each series' average turnover during training. `cut()` with `quantile()` then chops the series into four equal-sized buckets by that average, and we score each bucket on its own.

The result is stark. On the largest quarter of series the model is off by 2.24 percent, which is genuinely good. On the smallest quarter it is off by 13.19 percent, which is far worse than doing nothing at all. The single average of 5.73 percent describes no actual series. The model is excellent for big retailers and useless for small ones.

The reason is the loss function. `lm()` chooses its 17 coefficients to minimise the total squared error in dollars, summed over every row of every series:

$$\text{loss} = \sum_{i=1}^{152} \sum_{t} \left( y_{i,t} - \hat{y}_{i,t} \right)^{2}$$

Where:

- $y_{i,t}$ = actual turnover for series $i$ in month $t$, in millions of dollars
- $\hat{y}_{i,t}$ = the model's prediction for that same month
- the inner sum runs over every month of series $i$, the outer over all 152 series

Now put numbers in. A 10 percent miss on New South Wales food retailing is about 165 million, which squared is roughly 27,000. A 10 percent miss on Northern Territory book retailing is 0.25 million, which squared is 0.06. The big series contributes four hundred thousand times more to the total. So whenever a coefficient value that suits the big series conflicts with one that suits the small series, the big series outweighs it four hundred thousand to one, and the fitted coefficients end up describing the big series alone.

[WARNING]
**Pooling raw values silently optimises for your largest series.** The overall error looks acceptable because the big series dominate the average too. Always break your error down by series size before you trust a pooled model, or you will ship something that has quietly abandoned the long tail.

The fix follows straight from the diagnosis. If the problem is that series live at different scales, put them all on the same scale. We divide every value in a series, target and lags alike, by that series' average turnover during the training period.

```r title="Put every series on the same scale"
lag_cols <- c("lag1", "lag2", "lag3", "lag12", "lag13")

train_s <- left_join(train, scale_of, by = "series")
train_s[c("y", lag_cols)] <- train_s[c("y", lag_cols)] / train_s$scale

test_s <- left_join(test, scale_of, by = "series")
test_s[lag_cols] <- test_s[lag_cols] / test_s$scale

head(train_s[, c("series", "Month", "y", "lag1", "lag12", "scale")], 3)
#>                                           series      Month         y      lag1     lag12    scale
#> 1 ACT / Cafes, restaurants and catering services 1983-05-01 0.2160882 0.2211135 0.1708605 19.89928
#> 2 ACT / Cafes, restaurants and catering services 1983-06-01 0.2160882 0.2160882 0.1809111 19.89928
#> 3 ACT / Cafes, restaurants and catering services 1983-07-01 0.2311642 0.2160882 0.2010123 19.89928
```

Two details matter here. First, the scale is computed from the training window only. Using the full history including 2018 would leak information about the test period into the features. Second, we scale the target in the training data but not in the test data, because the test target is what we are trying to predict and must stay in its original dollars for scoring. We keep the `scale` column so we can convert predictions back.

The ACT cafes series now sits around 0.22, meaning that month ran at 22 percent of the series' long-run average. Every series in the table now speaks the same language: multiples of its own typical month.

```r title="Fit the global model on scaled values"
global <- lm(form, data = train_s)
pred_global <- predict(global, newdata = test_s) * test_s$scale

cat("global model, scaled, MAPE:", round(mape(test$y, pred_global), 2), "%\n")
#> global model, scaled, MAPE: 3.82 %
```

Note the `* test_s$scale` on the prediction line. The model returns a forecast in scaled units, so multiplying by the series' own scale converts it back to millions of dollars. Forget that step and every forecast comes out near 1.

Error drops from 5.73 percent to 3.82 percent. Same data, same formula, same 17 coefficients, same `lm()` call. The only change was the units. Let us confirm the improvement landed where the damage was.

```r title="Compare raw and scaled by series size"
test |>
  mutate(raw = pred_raw, scaled = pred_global) |>
  left_join(scale_of, by = "series") |>
  mutate(size = cut(scale, quantile(scale_of$scale, c(0, .25, .5, .75, 1)),
                    include.lowest = TRUE,
                    labels = c("smallest", "small", "large", "largest"))) |>
  group_by(size) |>
  summarise(mape_raw    = round(mape(y, raw), 2),
            mape_scaled = round(mape(y, scaled), 2), .groups = "drop") |>
  as.data.frame()
#>       size mape_raw mape_scaled
#> 1 smallest    13.19        5.95
#> 2    small     4.60        4.07
#> 3    large     3.20        3.06
#> 4  largest     2.24        2.28
```

This is the whole lesson in four rows. The smallest series improve from 13.19 percent to 5.95 percent, less than half the error. The largest series get very slightly worse, 2.24 to 2.28, because they no longer monopolise the fit. That is the trade you want: a rounding error of harm to the series that were already fine, in exchange for rescuing the ones that were broken.

It is worth looking at what the model actually learned, because with a linear model you can just read it.

```r title="Read the learned coefficients"
round(coef(global)[1:6], 3)
#> (Intercept)        lag1        lag2        lag3       lag12       lag13
#>      -0.033       0.737       0.053       0.040       0.840      -0.669
```

Those six numbers are a compact description of how Australian retail behaves. Last month carries a weight of 0.737 and the same month last year carries 0.840, so the forecast is roughly "where you were last month, corrected by where you were this time last year". The month before last year, `lag13`, comes in at -0.669, almost cancelling `lag12`.

That combination is not arbitrary. Adding roughly one unit of `lag12` and subtracting roughly one unit of `lag13` is the same as adding last year's month-on-month *change* to this year's level. The model worked out, from data alone, that it should carry over last year's seasonal step rather than last year's level. Classical seasonal ARIMA models encode that exact structure by hand. Here 152 series agreed on it.

**Try it:** We scaled each series by its mean. The mean is sensitive to a few unusual months, so the median is often a safer choice. Swap `mean(y)` for `median(y)` below and see whether it helps.

```r title="Your turn: try a different scaling statistic"
ex_scale_med <- train |> group_by(series) |> summarise(scale = mean(y), .groups = "drop")

ex_tr <- left_join(train, ex_scale_med, by = "series")
ex_tr[c("y", lag_cols)] <- ex_tr[c("y", lag_cols)] / ex_tr$scale
ex_te <- left_join(test, ex_scale_med, by = "series")
ex_te[lag_cols] <- ex_te[lag_cols] / ex_te$scale

ex_pred <- predict(lm(form, data = ex_tr), newdata = ex_te) * ex_te$scale
cat("MAPE:", round(mape(test$y, ex_pred), 2), "%\n")
#> MAPE: 3.82 %
```

<details>
<summary>Click to reveal solution</summary>

```r title="Median scaling solution"
ex_scale_med2 <- train |> group_by(series) |> summarise(scale = median(y), .groups = "drop")

ex_tr2 <- left_join(train, ex_scale_med2, by = "series")
ex_tr2[c("y", lag_cols)] <- ex_tr2[c("y", lag_cols)] / ex_tr2$scale
ex_te2 <- left_join(test, ex_scale_med2, by = "series")
ex_te2[lag_cols] <- ex_te2[lag_cols] / ex_te2$scale

ex_pred2 <- predict(lm(form, data = ex_tr2), newdata = ex_te2) * ex_te2$scale
cat("median scaling MAPE:", round(mape(test$y, ex_pred2), 2), "%\n")
#> median scaling MAPE: 3.82 %
```

**Explanation:** Identical to two decimal places. That is the useful finding: the model is not sensitive to *which* sensible statistic you scale by, only to whether you scale at all. Mean, median, last value or standard deviation will all rescue you from the 5.73 percent disaster. Pick one, compute it from training data only, and move on.

</details>

## Does one global model actually beat one model per series?

Most articles on this topic stop here, having shown that a global model works, without ever checking it against the obvious alternative. We are going to check.

The comparison has to be fair, which means changing exactly one thing. Same features, same model family, same training window, same test set. The only difference is whether the rows are pooled or kept apart.

```r title="Fit one model per series"
pred_local <- rep(NA_real_, nrow(test))
n_coef <- 0

for (s in unique(test$series)) {
  in_train <- train$series == s
  in_test  <- test$series  == s
  fit <- lm(form, data = train[in_train, ])
  n_coef <- n_coef + length(coef(fit))
  pred_local[in_test] <- predict(fit, newdata = test[in_test, ])
}

cat("models fitted:", length(unique(test$series)), "\n")
cat("coefficients stored:", n_coef, "\n")
cat("local models MAPE:", round(mape(test$y, pred_local), 2), "%\n")
#> models fitted: 148
#> coefficients stored: 2516
#> local models MAPE: 3.58 %
```

The loop walks the series one at a time, fits `lm()` to that series alone, and writes its 2018 predictions into the right slots. Notice there is no scaling anywhere in this loop, and it is not an oversight. A model fitted to a single series only ever sees one scale, so dividing that series by a constant would change its coefficients and leave its predictions exactly the same. Scaling is a problem created by pooling, and it exists only for the global model.

Now the scoreboard.

```r title="Compare all four approaches"
data.frame(
  approach     = c("Seasonal naive", "Global, raw values", "Global, scaled", "One model per series"),
  models       = c(0, 1, 1, 148),
  coefficients = c(0, 17, 17, 2516),
  mape         = c(round(mape(test$y, test$lag12), 2),
                   round(mape(test$y, pred_raw), 2),
                   round(mape(test$y, pred_global), 2),
                   round(mape(test$y, pred_local), 2))
)
#>               approach models coefficients mape
#> 1       Seasonal naive      0            0 5.92
#> 2   Global, raw values      1           17 5.73
#> 3       Global, scaled      1           17 3.82
#> 4 One model per series    148         2516 3.58
```

The honest answer is that on this dataset, one model per series wins. 3.58 percent against 3.82 percent. The global model loses by about seven percent in relative terms.

That result is worth sitting with, because it contradicts a great deal of confident writing on this subject. It is also completely unsurprising once you look at what these series are. Every one of them has up to 441 monthly observations, which is 37 years of history. A local model with 17 parameters and 400 rows of clean, strongly seasonal data has everything it needs. There is nothing left for cross-learning to add.

What the global model bought instead was 17 coefficients rather than 2,516. That is a 148-fold reduction in what you have to fit, store, monitor, retrain and debug. Whether 0.24 percentage points of accuracy is worth that trade is a question about your engineering team, not about statistics.

The average also conceals a split decision.

```r title="Count which approach wins on each series"
head_to_head <- test |>
  mutate(g = pred_global, l = pred_local) |>
  group_by(series) |>
  summarise(global_mape = mape(y, g), local_mape = mape(y, l), .groups = "drop") |>
  left_join(scale_of, by = "series")

cat("global wins on", sum(head_to_head$global_mape < head_to_head$local_mape),
    "of", nrow(head_to_head), "series\n")

small <- head_to_head$scale < median(head_to_head$scale)
cat("among the 74 smaller series, global wins on",
    sum(head_to_head$global_mape[small] < head_to_head$local_mape[small]), "\n")
#> global wins on 60 of 148 series
#> among the 74 smaller series, global wins on 27
```

The global model is beaten overall, yet it wins outright on 60 of the 148 series. This is not one approach dominating another; it is two approaches with different failure modes, and the aggregate number picks a winner by a narrow margin.

[NOTE]
**A single average error hides everything interesting about a forecasting comparison.** Before you conclude that method A beats method B, count how many series each one actually wins, and check whether the winners share a characteristic such as size, length or volatility. Aggregate numbers are for reporting; per-series numbers are for deciding.

**Try it:** The block below finds the three series where the global model beats the local one by the widest margin. Reverse the subtraction to find where local wins biggest instead.

```r title="Your turn: find the biggest wins"
ex_gap <- head_to_head |>
  mutate(gap = round(local_mape - global_mape, 2)) |>
  arrange(desc(gap))

head(ex_gap[, c("series", "gap")], 3)
#> # A tibble: 3 × 2
#>   series                                                      gap
#>   <chr>                                                     <dbl>
#> 1 NT / Clothing retailing                                    1.67
#> 2 ACT / Clothing, footwear and personal accessory retailing  1.42
#> 3 SA / Hardware, building and garden supplies retailing      1.12
```

<details>
<summary>Click to reveal solution</summary>

```r title="Biggest local wins solution"
ex_gap2 <- head_to_head |>
  mutate(gap = round(global_mape - local_mape, 2)) |>
  arrange(desc(gap))

head(ex_gap2[, c("series", "gap")], 3)
#> # A tibble: 3 × 2
#>   series                                                       gap
#>   <chr>                                                      <dbl>
#> 1 NT / Pharmaceutical, cosmetic and toiletry goods retailing  4.61
#> 2 ACT / Newspaper and book retailing                          2.87
#> 3 TAS / Cafes, restaurants and catering services              2.41
```

**Explanation:** Local wins are larger at the top end, 4.61 points against 1.67, which is why local wins the average despite winning fewer series. Series where the local model triumphs tend to have their own idiosyncratic behaviour, exactly the thing a shared set of coefficients cannot represent.

</details>

## When does the global model win, then?

We have one result on one dataset. That is an anecdote, not a rule. To turn it into a rule we need to work out *which property* of this data made the local approach win, and then vary that property.

The obvious candidate is history length. The local models had 400 rows each. The global model's advantage is supposed to be that it borrows data from elsewhere, which should matter most when there is little data at home. So let us shorten the history and watch.

The function below repeats the entire comparison using only the most recent N years of training data. Everything else, the test set, the features, the scaling, stays identical.

```r title="Vary how much history each series gets"
compare_history <- function(years) {
  starts_at <- as.Date(sprintf("%d-01-01", 2018 - years))
  tr <- train[train$Month >= starts_at, ]

  sc <- tr |> group_by(series) |> summarise(scale = mean(y), .groups = "drop")
  trs <- left_join(tr, sc, by = "series")
  trs[c("y", lag_cols)] <- trs[c("y", lag_cols)] / trs$scale
  tes <- left_join(test, sc, by = "series")
  tes[lag_cols] <- tes[lag_cols] / tes$scale

  g <- predict(lm(form, data = trs), newdata = tes) * tes$scale

  l <- rep(NA_real_, nrow(test))
  for (s in unique(test$series)) {
    i <- tr$series == s
    j <- test$series == s
    l[j] <- suppressWarnings(predict(lm(form, data = tr[i, ]), newdata = test[j, ]))
  }

  data.frame(years_of_history = years,
             rows_per_series   = round(nrow(tr) / length(unique(tr$series))),
             local_mape        = round(mape(test$y, l), 2),
             global_mape       = round(mape(test$y, g), 2))
}

crossover <- do.call(rbind, lapply(c(2, 3, 5, 10, 36), compare_history))
crossover
#>   years_of_history rows_per_series local_mape global_mape
#> 1                2              24       5.46        4.05
#> 2                3              36       4.39        4.06
#> 3                5              59       3.96        4.05
#> 4               10             117       3.64        3.96
#> 5               36             400       3.58        3.82
```

One line inside that function needs explaining. The local `predict()` call is wrapped in `suppressWarnings()` because at two years of history several series have fewer training rows than the model has parameters to estimate, so `lm()` cannot pin all 17 down and R warns that the prediction comes from a rank-deficient fit. Those warnings are part of the finding, not noise to be hidden: they are R telling you the local approach has run out of data.

Read the two error columns side by side, because the contrast between them is the entire point of this page.

The local column moves a great deal: 5.46 percent with two years of history, falling to 3.58 percent with the full 36. Cut a local model's history and its accuracy falls with it, because 24 rows cannot support 17 parameters.

The global column barely moves at all: 4.05 down to 3.82. Cut every series from 36 years to two and the global model loses almost nothing, because it still has roughly 3,500 training rows, gathered from 148 series at once. The amount of data it learns from barely changed.

The two columns cross somewhere between three and five years. Below that, the global model wins, and at two years it wins by a wide margin, 4.05 against 5.46. Above it, the local model pulls ahead and stays ahead.

```r title="Chart the crossover"
long <- rbind(
  data.frame(years = crossover$years_of_history, mape = crossover$local_mape,
             approach = "one model per series"),
  data.frame(years = crossover$years_of_history, mape = crossover$global_mape,
             approach = "one global model"))

ggplot(long, aes(years, mape, colour = approach)) +
  geom_line(linewidth = 1) + geom_point(size = 2.5) +
  scale_x_log10(breaks = c(2, 3, 5, 10, 36)) +
  labs(title = "One model per series only wins once each series is long enough",
       x = "Years of history per series (log scale)", y = "MAPE on 2018 (%)") +
  theme_minimal() + theme(legend.position = "bottom")
```

The chart shows one steeply falling line and one nearly flat one, crossing near the four-year mark.

[KEY INSIGHT]
**A local model's accuracy depends on how much data it has about your series. A global model's accuracy depends on how much data it has in total.** That is why the flat line is flat. Multiplying the number of series is a substitute for lengthening them, and it is a substitute you can usually get for free, because the other series already exist.

This also explains the M5 competition result, where global models swept the leaderboard. Those were daily Walmart sales for individual products, many of them short, and many of them intermittent, meaning most days record a sale of zero. That is the left-hand end of our chart, where the global line sits comfortably below the local one. Australian retail aggregates with 37 years of smooth monthly history are the right-hand end.

**Try it:** The block below runs the comparison for seven years of history. Change it to 20 years and confirm that the local model's lead widens as history grows.

```r title="Your turn: test a different history length"
compare_history(7)
#>   years_of_history rows_per_series local_mape global_mape
#> 1                7              83       3.78        3.97
```

<details>
<summary>Click to reveal solution</summary>

```r title="Twenty years of history solution"
compare_history(20)
#>   years_of_history rows_per_series local_mape global_mape
#> 1               20             236       3.51        3.82
```

**Explanation:** At seven years the local model leads by 0.19 points; at twenty years it leads by 0.31. The gap grows because the local model keeps improving while the global model has already plateaued. It also shows the local model peaking early: 3.51 at twenty years is marginally better than 3.58 with the full 36, since retail behaviour in the 1980s is not very relevant to 2018.

</details>

## What can a global model do that a local model simply cannot?

Accuracy is not the only axis. There is one thing a global model does that a local model cannot do at all, at any level of accuracy, and for many businesses it is the reason the whole approach exists.

A local model needs your series' history to exist before it can be fitted. If the series is brand new, there is nothing to fit. A global model has no such requirement, because its coefficients came from other series. Forecasting a series that has no history of its own is called the cold-start problem, and it is the one situation where a local model has nothing to offer at all.

We can test that directly. Below we remove 20 series from the training data completely, so the model never sees a single row from them, then ask it to forecast their 2018.

```r title="Forecast series the model has never seen"
set.seed(7)
held_out <- sample(unique(test$series), 20)

train_seen <- train_s[!(train_s$series %in% held_out), ]
test_new   <- test_s[test_s$series %in% held_out, ]
actual_new <- test[test$series %in% held_out, ]

cat("trained on:", length(unique(train_seen$series)), "series\n")
cat("forecasting:", length(unique(test_new$series)), "series it has never seen\n")

cold <- lm(form, data = train_seen)
pred_cold <- predict(cold, newdata = test_new) * test_new$scale

cat("cold-start global MAPE:", round(mape(actual_new$y, pred_cold), 2), "%\n")
cat("seasonal naive on the same series:", round(mape(actual_new$y, actual_new$lag12), 2), "%\n")
cat("global model that HAD seen them:",
    round(mape(actual_new$y, pred_global[test$series %in% held_out]), 2), "%\n")
#> trained on: 132 series
#> forecasting: 20 series it has never seen
#> cold-start global MAPE: 3.53 %
#> seasonal naive on the same series: 5.93 %
#> global model that HAD seen them: 3.54 %
```

Compare the last two numbers carefully. A model trained on 132 series forecasts 20 completely unseen series at 3.53 percent error. The model that *did* train on those same 20 series scores 3.54 percent. They are the same to within noise, and the unseen version is fractionally ahead by chance.

The global model gains essentially nothing from having seen your particular series before. Everything it knows about how Australian retail behaves, it learned from the others.

[TIP]
**This is why retailers run global models for new products.** A product launched last month has no history, so no local model exists for it. A global model trained on the rest of the catalogue produces a forecast on day one, and as this experiment shows, that forecast can be about as good as the one it would eventually make with a full history. You still need the series' recent lag values to make the prediction, but you do not need them to have trained the model.

![Decision guide for how much to pool retail series before forecasting](screenshots/Global-Forecasting-Models-in-R-when-to-pool.webp)

*Figure 3: Where each pooling choice makes sense.*

The same property has a less glamorous but equally valuable consequence in production. One model means one artefact to version, one training job to schedule, one set of coefficients to review when a forecast goes wrong, and one thing to monitor for drift. Anyone who has maintained a few thousand independently fitted models will recognise why that matters.

**Try it:** The block below holds out 5 series. Change it to hold out 40, a quarter of the dataset, and see whether cold-start accuracy degrades when the model has fewer series to learn from.

```r title="Your turn: hold out more series"
set.seed(7)
ex_held <- sample(unique(test$series), 5)

ex_train <- train_s[!(train_s$series %in% ex_held), ]
ex_test  <- test_s[test_s$series %in% ex_held, ]
ex_actual <- test[test$series %in% ex_held, ]

ex_p <- predict(lm(form, data = ex_train), newdata = ex_test) * ex_test$scale
cat("held out", length(ex_held), "series, MAPE:", round(mape(ex_actual$y, ex_p), 2), "%\n")
#> held out 5 series, MAPE: 3.58 %
```

<details>
<summary>Click to reveal solution</summary>

```r title="Forty held-out series solution"
set.seed(7)
ex_held2 <- sample(unique(test$series), 40)

ex_train2 <- train_s[!(train_s$series %in% ex_held2), ]
ex_test2  <- test_s[test_s$series %in% ex_held2, ]
ex_actual2 <- test[test$series %in% ex_held2, ]

ex_p2 <- predict(lm(form, data = ex_train2), newdata = ex_test2) * ex_test2$scale
cat("held out", length(ex_held2), "series, MAPE:", round(mape(ex_actual2$y, ex_p2), 2), "%\n")
#> held out 40 series, MAPE: 3.74 %
```

**Explanation:** Holding out 40 series leaves only 108 to train on, and error rises from 3.58 to 3.74 percent. Some of that is the smaller training set and some is that a different, harder set of series is being scored. Either way the degradation is mild, which is the reassuring result: cold-start forecasting does not collapse when the training pool shrinks by a quarter.

</details>

## How related do the series have to be?

So far we have treated pooling as a switch with two settings: every series in one model, or every series in its own. It is really a dial. You can pool within groups of similar series, which gives the model more data than a local fit while asking it to describe less variety than a fully global fit.

Our data has an obvious grouping already: the retail industry. Clothing behaves like clothing whichever state it is in. Let us fit one model per industry, pooling the eight states together.

```r title="Pool within each industry instead"
pred_industry <- rep(NA_real_, nrow(test))

for (ind in unique(test_s$Industry)) {
  i <- train_s$Industry == ind
  j <- test_s$Industry  == ind
  fit <- lm(form, data = train_s[i, ])
  pred_industry[j] <- predict(fit, newdata = test_s[j, ]) * test_s$scale[j]
}

cat("models:", length(unique(test$Industry)), "\n")
cat("industry-pooled MAPE:", round(mape(test$y, pred_industry), 2), "%\n")
#> models: 20
#> industry-pooled MAPE: 3.63 %
```

Twenty models, one per industry, each trained on that industry's eight state-level series. Note that we still use the scaled table, because the states differ enormously in size even within a single industry.

Putting all three settings of the dial side by side:

```r title="The pooling dial, from none to full"
data.frame(
  pooling = c("None (one model per series)", "By industry (20 groups)", "All series together"),
  models  = c(148, 20, 1),
  mape    = c(round(mape(test$y, pred_local), 2),
              round(mape(test$y, pred_industry), 2),
              round(mape(test$y, pred_global), 2))
)
#>                       pooling models mape
#> 1 None (one model per series)    148 3.58
#> 2     By industry (20 groups)     20 3.63
#> 3         All series together      1 3.82
```

Industry pooling lands at 3.63 percent, within a whisker of the 148-model local approach and clearly ahead of the fully global one, while needing only 20 models. On this dataset that is the best accuracy-per-model trade available.

[NOTE]
**Pooling is a dial, not a switch.** Fully global and fully local are just the two extremes. Grouping by a variable that genuinely drives the dynamics often beats both, and in production it is frequently the setting people land on after trying the extremes first.

Why does grouping help here? Because different industries genuinely behave differently, and a single shared set of coefficients has to average over that difference. The try-it below lets you see it directly.

**Try it:** The block below prints the coefficients that the liquor retailing model learned. Change the industry to `"Department stores"` and compare the `lag1` and `lag13` values. They tell two completely different stories.

```r title="Your turn: compare coefficients across industries"
ex_ind <- "Liquor retailing"
round(coef(lm(form, data = train_s[train_s$Industry == ex_ind, ]))[1:6], 3)
#> (Intercept)        lag1        lag2        lag3       lag12       lag13
#>      -0.040       0.675       0.044       0.055       0.872      -0.638
```

<details>
<summary>Click to reveal solution</summary>

```r title="Department stores coefficients solution"
ex_ind2 <- "Department stores"
round(coef(lm(form, data = train_s[train_s$Industry == ex_ind2, ]))[1:6], 3)
#> (Intercept)        lag1        lag2        lag3       lag12       lag13
#>      -0.033       0.111       0.025       0.069       0.811      -0.042
```

**Explanation:** Liquor retailing leans hard on last month, 0.675, and cancels most of `lag12` with `lag13` at -0.638. Department stores almost ignore last month, 0.111, and barely use `lag13` at all, -0.042. Department stores are so violently seasonal that December tells you nothing about January; last year's same month is nearly the whole signal. A fully global model has to split the difference between these two behaviours, and serves neither industry as well as its own model does.

</details>

## Complete Example: the whole pipeline in one place

Everything above, condensed. This block assumes the objects built earlier in the page still exist, prints the summary of what was fitted, and then shows six months of the 2018 forecast for one series so you can see the actual numbers rather than an error statistic.

```r title="End-to-end global forecast summary"
cat("Global forecasting model, end to end\n")
cat("  series pooled     :", length(unique(train_s$series)), "\n")
cat("  training rows     :", nrow(train_s), "\n")
cat("  model coefficients:", length(coef(global)), "\n")
cat("  2018 MAPE         :", round(mape(test$y, pred_global), 2), "%\n")
cat("  seasonal naive    :", round(mape(test$y, test$lag12), 2), "%\n")
#> Global forecasting model, end to end
#>   series pooled     : 152
#>   training rows     : 60780
#>   model coefficients: 17
#>   2018 MAPE         : 3.82 %
#>   seasonal naive    : 5.92 %
```

```r title="Inspect one series' forecasts"
one <- "TAS / Clothing retailing"

forecast_2018 <- test |>
  mutate(forecast = round(pred_global, 1)) |>
  filter(series == one) |>
  select(Month, actual = y, forecast) |>
  head(6)

forecast_2018
#>        Month actual forecast
#> 1 2018-01-01   20.2     19.3
#> 2 2018-02-01   17.7     15.7
#> 3 2018-03-01   19.6     19.9
#> 4 2018-04-01   19.9     21.0
#> 5 2018-05-01   21.4     21.5
#> 6 2018-06-01   20.4     20.1
```

Those forecasts for a mid-sized Tasmanian clothing series came from a model that also forecasts New South Wales food retailing, a series 80 times larger, using the same 17 numbers. February is the worst month of the six, forecast at 15.7 against an actual 20.2, which is the model applying the average February dip to a series whose dip is shallower than most. That is the cost of sharing coefficients, visible in a single row.

## Practice Exercises

### Exercise 1: Give the global model per-industry seasonality

The fully global model applies one shared set of month effects to all 152 series, which we saw is a poor fit for department stores. Add an interaction between `month` and `Industry` to the formula so the model can learn a separate seasonal pattern per industry, while still being one model. Fit it on `train_s`, predict on `test_s`, and report both the coefficient count and the MAPE against the plain global model's 3.82 percent.

```r title="Exercise 1 starter"
# Hint: month * Industry in a formula expands to month + Industry + their interaction.
# Fit on train_s, predict on test_s, remember to multiply by test_s$scale.

# Write your code below:

```

<details>
<summary>Click to reveal solution</summary>

```r title="Per-industry seasonality solution"
ex1_form <- y ~ lag1 + lag2 + lag3 + lag12 + lag13 + month * Industry
ex1_fit  <- lm(ex1_form, data = train_s)
ex1_pred <- predict(ex1_fit, newdata = test_s) * test_s$scale

cat("coefficients:", length(coef(ex1_fit)), "\n")
cat("global with per-industry seasonality:", round(mape(test$y, ex1_pred), 2), "%\n")
cat("plain global:", round(mape(test$y, pred_global), 2), "%\n")
#> coefficients: 245
#> global with per-industry seasonality: 3.77 %
#> plain global: 3.82 %
```

**Explanation:** The model improves from 3.82 to 3.77 percent, and it is still one model, one training run, one artefact. It now carries 245 coefficients instead of 17, which is a lot more than the global model had but still an order of magnitude fewer than the 2,516 the local approach needed. This is the Montero-Manso and Hyndman argument made concrete: a global model can afford extra complexity because it has 60,780 rows to support it, where a single series had only 400.

</details>

### Exercise 2: Pool by state instead of by industry

We pooled by industry and got 3.63 percent from 20 models. State is the other obvious grouping in this data. Fit one model per state, pooling all industries within each state, and compare. The state code is the part of the `series` string before the `" / "`, which `sub(" /.*$", "", series)` will extract. Predict on the scaled test table and report the MAPE.

```r title="Exercise 2 starter"
# Hint: build a state vector for train_s and test_s, then loop over unique states
# exactly as the industry loop did.

# Write your code below:

```

<details>
<summary>Click to reveal solution</summary>

```r title="State pooling solution"
ex2_state_train <- sub(" /.*$", "", train_s$series)
ex2_state       <- sub(" /.*$", "", test_s$series)
ex2_pred <- rep(NA_real_, nrow(test))

for (st in unique(ex2_state)) {
  i <- ex2_state_train == st
  j <- ex2_state == st
  ex2_pred[j] <- predict(lm(form, data = train_s[i, ]), newdata = test_s[j, ]) * test_s$scale[j]
}

cat("models:", length(unique(ex2_state)), "\n")
cat("state-pooled MAPE:", round(mape(test$y, ex2_pred), 2), "%\n")
cat("industry-pooled MAPE:", round(mape(test$y, pred_industry), 2), "%\n")
#> models: 8
#> state-pooled MAPE: 3.78 %
#> industry-pooled MAPE: 3.63 %
```

**Explanation:** State pooling scores 3.78 percent, barely better than the fully global 3.82 and clearly worse than industry pooling's 3.63. The lesson generalises: group by whatever drives the dynamics, not by whatever labels happen to be in your data. What a shop sells determines its seasonal shape. Which state it sits in mostly determines its size, and we already removed size by scaling.

</details>

### Exercise 3: Scale from recent history instead of all of it

We scaled each series by its mean over the entire training window, 1982 to 2017. For a series that has tripled since 1982, that mean describes a level the series left behind decades ago. Recompute the scale using only 2016 and 2017, refit the global model on the newly scaled data, and see whether a more current scale helps.

```r title="Exercise 3 starter"
# Hint: filter train to Month >= as.Date("2016-01-01") to compute the scale,
# but still fit the model on the full training window.

# Write your code below:

```

<details>
<summary>Click to reveal solution</summary>

```r title="Recent-window scaling solution"
recent <- train[train$Month >= as.Date("2016-01-01"), ]
ex3_scale <- recent |> group_by(series) |> summarise(scale = mean(y), .groups = "drop")

ex3_tr <- left_join(train, ex3_scale, by = "series")
ex3_tr[c("y", lag_cols)] <- ex3_tr[c("y", lag_cols)] / ex3_tr$scale
ex3_te <- left_join(test, ex3_scale, by = "series")
ex3_te[lag_cols] <- ex3_te[lag_cols] / ex3_te$scale

ex3_pred <- predict(lm(form, data = ex3_tr), newdata = ex3_te) * ex3_te$scale

cat("scaled by last 2 years:", round(mape(test$y, ex3_pred), 2), "%\n")
cat("scaled by full history:", round(mape(test$y, pred_global), 2), "%\n")
#> scaled by last 2 years: 3.8 %
#> scaled by full history: 3.82 %
```

**Explanation:** A marginal improvement, 3.80 against 3.82. The reason the gain is small is that scaling is a per-series constant, and a linear model largely absorbs a constant. The reason to prefer the recent window anyway is operational: in production you refit periodically and your scale should track the series' current level, otherwise a series that has doubled will feed the model lag values near 2.0 that it has rarely seen in training. Try this exercise again with a nonlinear learner and the gap widens considerably.

</details>

## Frequently Asked Questions

**Does this replace ARIMA and ETS?** No. Those are local models by construction, and this page just showed a local approach winning on long, clean, seasonal series. `fable`'s `model()` function fits one model per key in a tsibble, which is the local approach done well, and for a few hundred long series it remains an excellent default. Global models earn their place when series are numerous and short, or when new ones keep appearing.

**Why use `lm()` when everyone uses LightGBM?** Because the pooling decision is what this page is about, and a linear model lets you read the shared coefficients directly and see what cross-learning actually learned. In production a global model is usually a gradient boosted tree, which handles the nonlinearity and the interactions that our linear formula cannot. The pooling, scaling and evaluation logic is identical either way. The [gradient boosting tutorial](XGBoost-Forecasting-in-R.html) covers the learner side.

**How many series do I need before pooling helps?** There is no threshold, because it depends on length as much as count. The useful question is the one the crossover table answers: how much history does each series have? Below roughly three or four years of monthly data, our global model won even with 148 series. The two quantities trade against each other, so run the `compare_history()` experiment on your own data rather than trusting a rule of thumb.

**Do I still need to scale if I use trees?** More than ever. A linear model partly absorbs scale differences through its coefficients. A tree splits on raw thresholds, so a rule like "if lag1 is above 300" is meaningless for a series that never exceeds 5. Trees cannot extrapolate beyond the range they were trained on either, so an unscaled global tree caps its forecast for your largest series at the highest value it happened to see during training.

**How do I forecast twelve months ahead instead of one?** Pick recursive or direct. Recursive means predicting January, treating that prediction as January's actual value so it becomes February's `lag1`, and stepping forward: simple, one model, but each month's error feeds the next. Direct means fitting a separate model per horizon, each using only lags that are genuinely available at the forecast origin, so a twelve-month model would drop `lag1`, `lag2` and `lag3` and lean on `lag12` and `lag13`: more models to maintain, no error compounding. Direct tends to win at long horizons; the pooling and scaling logic on this page is unchanged either way.

**Does a global model give me prediction intervals?** `lm()` will produce them with `predict(..., interval = "prediction")`, but they assume constant variance across all pooled rows, which is unlikely to hold even after scaling. For pooled models, empirical intervals from held-out residuals are the safer route, and conformal prediction is the principled version of that idea.

## Summary

| Question | Answer from this page |
|---|---|
| What is a global model? | One model fitted to the stacked rows of many series, storing one shared set of parameters |
| What makes pooling work? | Shared shape. All 152 series peak in December, by a median of 38 percent |
| What breaks it? | Unscaled pooling. Error on the smallest quarter of series was 13.19 percent, against 2.24 on the largest |
| How do you fix it? | Divide each series by its own training mean, then multiply predictions back. Error fell from 5.73 to 3.82 percent |
| Did global beat local here? | No. 3.82 against 3.58 percent, though it won on 60 of 148 series with 17 coefficients instead of 2,516 |
| When does global win? | When series are short. Below about four years of history, global led; at two years it led by 1.41 points |
| What is global-only? | Forecasting a series that was never in training. Cold-start scored 3.53 percent, matching the model that had seen it |
| What is the best setting? | Often neither extreme. Pooling by industry gave 3.63 percent from 20 models |

## References

1. Montero-Manso, P. and Hyndman, R.J. *Principles and Algorithms for Forecasting Groups of Time Series: Locality and Globality.* International Journal of Forecasting (2021). [Link](https://robjhyndman.com/publications/global-forecasting/)
2. Hyndman, R.J. and Athanasopoulos, G. *Forecasting: Principles and Practice*, 3rd edition. Chapter on judgmental and many-series forecasting. [Link](https://otexts.com/fpp3/)
3. Makridakis, S., Spiliotis, E. and Assimakopoulos, V. *The M5 Accuracy competition: Results, findings and conclusions.* International Journal of Forecasting (2022). [Link](https://doi.org/10.1016/j.ijforecast.2021.11.013)
4. Januschowski, T. et al. *Criteria for classifying forecasting methods.* International Journal of Forecasting (2020), the paper that formalised the local versus global distinction. [Link](https://doi.org/10.1016/j.ijforecast.2019.05.008)
5. Hewamalage, H., Bergmeir, C. and Bandara, K. *Global Models for Time Series Forecasting: A Simulation Study.* Pattern Recognition (2022). [Link](https://arxiv.org/abs/2012.12485)
6. tsibbledata package reference, `aus_retail` dataset documentation. [Link](https://tsibbledata.tidyverts.org/reference/aus_retail.html)
7. fable package documentation, fitting models across many series with `model()`. [Link](https://fable.tidyverts.org/)
8. R Core Team. *An Introduction to R*, section on statistical models and formulas. [Link](https://cran.r-project.org/doc/manuals/r-release/R-intro.html)

## Continue Learning

- [Feature Engineering for Time Series Forecasting in R](Feature-Engineering-for-Forecasting-in-R.html) covers the lag, rolling, calendar and Fourier features that fill a pooled table, and the leakage traps that come with them.
- [Gradient Boosting for Time Series in R: xgboost vs the Classics](XGBoost-Forecasting-in-R.html) swaps the linear learner used here for boosted trees, and shows why trees cannot extrapolate a trend.
- [Time Series Cross Validation in R](Time-Series-Cross-Validation-in-R.html) replaces the single 2018 holdout used on this page with a rolling origin, which is how you should evaluate any of these models before deploying them.

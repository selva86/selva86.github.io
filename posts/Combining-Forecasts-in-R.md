---
title: "Combining Forecasts in R: Ensemble Averaging"
slug: "Combining-Forecasts-in-R"
description: "Combine ARIMA, ETS and STL forecasts in R by averaging them. See why it cuts error, when the median beats the mean, and how to build an honest combined interval."
keywords: "combining forecasts in R, forecast combination, ensemble averaging forecasting, forecast combination puzzle, average ARIMA and ETS forecasts, weighted forecast combination, combined prediction interval, forecast ensemble R"
auto_link_terms: "combining forecasts in R|forecast combination|forecast combinations|ensemble averaging|combining forecasts|forecast combination puzzle|averaging forecasts|combined forecast|forecast ensemble|inverse MSE weights|Granger-Ramanathan weights|equal-weight combination|simple average forecast"
auto_link_case_sensitive: false
mathjax: true
webr: true
date: "2026-07-22"
curriculum_id: "FR-adva-6"
post_type: "C"
sidebar_section: "Time Series"
sidebar_title: "Combining Forecasts"
sidebar_order: "28"
difficulty: "Intermediate"
---

<p class="lead">Combining forecasts means averaging the predictions of several models into a single number instead of picking one model and trusting it. It usually beats the average model you could have picked, because the models make mistakes in different directions and those mistakes partly cancel when you add them up.</p>

## What does combining forecasts actually mean?

Picking a forecasting model is a bet. Fit exponential smoothing and ARIMA to the same series and they will hand you different numbers for next month, and there is no reliable way to know in advance which one to trust. Combining sidesteps the bet entirely: you keep both, and you average them. Let's watch that happen on a series you have almost certainly seen before.

We will use `AirPassengers`, which ships with R. It records the monthly total of international airline passengers, in thousands, from January 1949 to December 1960. It trends upward and it has a strong yearly cycle, which makes it a fair test for any forecasting method.

The rule we have to follow is simple: hide some of the data, forecast it, then check. We will train on everything up to the end of 1959 and hold back the twelve months of 1960 as the answer sheet.

```r title="Split AirPassengers into train and test"
library(forecast)

train <- window(AirPassengers, end = c(1959, 12))
test  <- window(AirPassengers, start = c(1960, 1))

c(train_months = length(train), test_months = length(test))
#> train_months  test_months
#>          132           12
```

`window()` cuts a slice out of a time series using calendar positions rather than row numbers, so `end = c(1959, 12)` means "up to and including December 1959". We now have 132 months to learn from and 12 months that the models are not allowed to see.

Next we fit three genuinely different forecasting methods and ask each for the twelve months of 1960. You do not need to understand their internals to follow this article. All that matters is that they work in different ways, so they make different mistakes.

- `ets()` fits an exponential smoothing model, which builds a forecast from weighted averages of recent values.
- `auto.arima()` searches a family of ARIMA models, which forecast from past values and past errors.
- `stlf()` first splits the series into trend, season and remainder, forecasts the deseasonalised part, then puts the season back.

```r title="Fit three different models and forecast 1960"
fc_ets   <- forecast(ets(train),        h = 12)
fc_arima <- forecast(auto.arima(train), h = 12)
fc_stl   <- stlf(train,                 h = 12)

round(cbind(Actual = test,
            ETS    = fc_ets$mean,
            ARIMA  = fc_arima$mean,
            STL    = fc_stl$mean), 1)
#>          Actual   ETS ARIMA   STL
#> Jan 1960    417 411.9 424.1 416.1
#> Feb 1960    391 407.0 407.1 403.6
#> Mar 1960    419 467.3 470.8 448.2
#> Apr 1960    461 450.7 460.9 440.5
#> May 1960    472 451.5 484.9 448.8
#> Jun 1960    535 513.2 536.9 498.7
#> Jul 1960    622 569.9 612.9 544.9
#> Aug 1960    606 567.6 623.9 545.6
#> Sep 1960    508 496.1 527.9 484.1
#> Oct 1960    461 432.2 471.9 440.2
#> Nov 1960    390 376.6 426.9 401.6
#> Dec 1960    432 424.8 469.9 433.1
```

Each `forecast()` call returns an object whose `$mean` component holds the predicted values, one per future month. `cbind()` glues those three columns next to the truth so we can read across a row and see all four numbers for the same month.

Read the July 1960 row. The truth was 622. ETS said 569.9, ARIMA said 612.9, STL said 544.9. The three models disagree by nearly 70 passengers about the same month, and every one of them undershoots. Now look at November: ETS says 376.6 and ARIMA says 426.9, and this time the truth (390) sits near the bottom rather than the top. The models are not simply ranked best to worst. They take turns being wrong.

That is the opening for combining. If we just average the three columns, the months where one model runs high and another runs low should partly settle down.

```r title="Average the three forecasts and score them"
combo <- (fc_ets$mean + fc_arima$mean + fc_stl$mean) / 3

rmse <- function(f) sqrt(mean((test - f)^2))

data.frame(
  method = c("ETS", "ARIMA", "STL-ETS", "Combination"),
  RMSE   = round(c(rmse(fc_ets$mean), rmse(fc_arima$mean),
                   rmse(fc_stl$mean), rmse(combo)), 2)
)
#>        method  RMSE
#> 1         ETS 27.40
#> 2       ARIMA 23.93
#> 3     STL-ETS 34.20
#> 4 Combination 22.26
```

The combination is one line of arithmetic: add the three `$mean` vectors and divide by three. The `rmse()` helper is the root mean squared error, the usual way to score a forecast. It squares each miss, averages the squares, and takes the square root, so it is measured in passengers and bigger misses count for more. Lower is better. The row labelled STL-ETS is the `stlf()` forecast, named that way because `stlf()` uses exponential smoothing on the deseasonalised series; later tables shorten the label to STL.

The combination scored 22.26, which is lower than all three of the models it was built from. The best single model, ARIMA, scored 23.93. So this average of three forecasts, none of which required any tuning or judgement, beat every one of its own ingredients.

![One training series feeds three models, and their three forecasts collapse into one number](screenshots/Combining-Forecasts-in-R-combination-flow.webp)

*Figure 1: One training series feeds three models, and their three forecasts collapse into one number.*

[KEY INSIGHT]
**You never had to know which model was best.** ARIMA turned out to be the strongest single method on 1960, but nothing in the training data told you that in advance. The combination reached a better score without you making that call at all, which is the whole point of the technique.

**Try it:** RMSE punishes large misses harshly because it squares them. Check whether the combination still wins under mean absolute error, which just averages the size of each miss without squaring.

```r title="Your turn: score the same forecasts with MAE"
ex_mae <- function(f) mean(abs(test - f))

# Apply ex_mae() to fc_ets$mean, fc_arima$mean, fc_stl$mean and combo,
# then round the four numbers to 2 decimals.
# your code here
# Expected: the combination is lowest, near 17.6
```

<details>
<summary>Click to reveal solution</summary>

```r title="MAE comparison solution"
round(c(ETS         = ex_mae(fc_ets$mean),
        ARIMA       = ex_mae(fc_arima$mean),
        STL         = ex_mae(fc_stl$mean),
        Combination = ex_mae(combo)), 2)
#>         ETS       ARIMA         STL Combination
#>       22.80       18.53       26.48       17.61
```

**Explanation:** The ranking is unchanged and the combination still wins, at 17.61 against ARIMA's 18.53. That matters, because a result that only appears under one error measure is usually an artefact of that measure. This one is not.

</details>

## Why does averaging forecasts beat the models it averages?

The last section showed that combining worked. It did not show why, and "the errors cancel" is a slogan until you can point at the numbers. So let's point at them. We will subtract each model's forecast from the truth and look at the twelve misses, month by month.

```r title="The error each model made each month"
errors <- cbind(ETS   = test - fc_ets$mean,
                ARIMA = test - fc_arima$mean,
                STL   = test - fc_stl$mean)

round(errors, 1)
#>            ETS ARIMA   STL
#> Jan 1960   5.1  -7.1   0.9
#> Feb 1960 -16.0 -16.1 -12.6
#> Mar 1960 -48.3 -51.8 -29.2
#> Apr 1960  10.3   0.1  20.5
#> May 1960  20.5 -12.9  23.2
#> Jun 1960  21.8  -1.9  36.3
#> Jul 1960  52.1   9.1  77.1
#> Aug 1960  38.4 -17.9  60.4
#> Sep 1960  11.9 -19.9  23.9
#> Oct 1960  28.8 -10.9  20.8
#> Nov 1960  13.4 -36.9 -11.6
#> Dec 1960   7.2 -37.9  -1.1
```

A positive number means the model forecast too low and the truth came in above it. A negative number means the model overshot. Because `test` and each `$mean` are both monthly time series covering 1960, R lines them up by date automatically before subtracting.

Now read December. ETS was 7.2 too low while ARIMA was 37.9 too high. Average those two and you get a miss of about 15 instead of 38. That is the cancellation, and it is happening for real in the table, not in a diagram. August is the same story with the signs flipped between ETS and ARIMA.

March is the opposite case and it is just as important. Every model undershot by a lot: -48.3, -51.8, -29.2. There is nothing to cancel, so the average is still badly wrong. Combining rescues you from disagreement, never from a mistake all your models share.

![Averaging only helps when the models are wrong in different directions](screenshots/Combining-Forecasts-in-R-error-cancellation.webp)

*Figure 2: Averaging only helps when the models are wrong in different directions.*

We can measure how much the models tend to agree by correlating their error columns. A correlation near 1 means two models miss together, which leaves nothing to cancel. A correlation near 0 means they miss independently.

```r title="How correlated are the three error series"
round(cor(errors), 3)
#>         ETS ARIMA   STL
#> ETS   1.000 0.676 0.878
#> ARIMA 0.676 1.000 0.719
#> STL   0.878 0.719 1.000
```

ETS and STL correlate at 0.878, the highest pair in the table, and that makes sense once you know that `stlf()` uses exponential smoothing internally on the deseasonalised series. They share most of their machinery, so they tend to miss in the same direction. ETS and ARIMA correlate at 0.676, the lowest pair, because they are genuinely different machinery. That pair is where most of the cancellation comes from.

[KEY INSIGHT]
**Diversity is worth more than individual accuracy.** A model that is slightly worse but wrong in a different way contributes more to a combination than a model that is slightly better but wrong in the same way as everything else you already have.

### The identity that makes this a guarantee

So far this is an observation about one dataset. It is actually a mathematical certainty, and the proof is short enough to state. Skip to the code block below if you would rather see it than read it.

Write $e_i$ for the error of model $i$ on some month and $\bar{e}$ for the error of the equal-weight combination. Since the combination is the average of the forecasts, its error is the average of the errors: $\bar{e} = \frac{1}{M}\sum_{i=1}^{M} e_i$. Squaring and averaging over the $M$ models gives an exact split:

$$\text{MSE}_{\text{combo}} = \frac{1}{M}\sum_{i=1}^{M}\text{MSE}_i \;-\; \overline{\text{disagreement}}$$

Where:

- $M$ = the number of models being combined, which is 3 here
- $\text{MSE}_{\text{combo}}$ = the mean squared error of the combined forecast
- $\text{MSE}_i$ = the mean squared error of model $i$ on its own
- $\overline{\text{disagreement}}$ = the average spread of the models' forecasts around their own mean, computed month by month

This is the ambiguity decomposition, known from ensemble learning [4]. Read the right hand side again: you start from the average member's error and you subtract something that can never be negative, because a spread is a squared quantity. So the combination is never worse than the average member. Not usually, not on average. Never.

Rather than take that on faith, let's compute both sides and check that they match.

```r title="Verify the ambiguity decomposition"
mse <- function(f) mean((test - f)^2)

members <- cbind(fc_ets$mean, fc_arima$mean, fc_stl$mean)

avg_member_mse <- mean(c(mse(fc_ets$mean), mse(fc_arima$mean), mse(fc_stl$mean)))
disagreement   <- mean(apply(members, 1, function(row) mean((row - mean(row))^2)))

round(c(average_member_mse = avg_member_mse,
        disagreement       = disagreement,
        predicted_combo    = avg_member_mse - disagreement,
        actual_combo_mse   = mse(combo)), 2)
#> average_member_mse       disagreement    predicted_combo   actual_combo_mse
#>             830.90             335.57             495.33             495.33
```

The `apply(members, 1, ...)` line walks through the twelve months one at a time. For each month it takes the three forecasts, measures how far each sits from their own average, squares those distances and averages them. That single number is how much the models disagreed about that month, and `disagreement` is its average across the year.

The last two numbers are identical: 495.33 and 495.33. The identity is not an approximation. The models' average error was 830.90, their disagreement was worth 335.57, and the combination collected every bit of that difference.

[WARNING]
**The guarantee covers the average member, not the best one.** Combining is proven to beat the typical model in your set. It is not proven to beat whichever model happens to turn out strongest, and in the next section you will watch it fail to do exactly that.

**Try it:** ETS and ARIMA had the least correlated errors, so their pair should show a large disagreement term. Run the decomposition on just those two and predict their combination's RMSE without ever averaging the forecasts.

```r title="Your turn: decompose the ETS and ARIMA pair"
ex_pair_members <- cbind(fc_ets$mean, fc_arima$mean)

# 1. ex_avg_mse: average of mse(fc_ets$mean) and mse(fc_arima$mean)
# 2. ex_dis: same apply() pattern as above, on ex_pair_members
# 3. print both, plus their difference, plus the square root of the difference
# your code here
# Expected: the square root of the difference is about 19.19
```

<details>
<summary>Click to reveal solution</summary>

```r title="Pair decomposition solution"
ex_avg_mse <- mean(c(mse(fc_ets$mean), mse(fc_arima$mean)))
ex_dis     <- mean(apply(ex_pair_members, 1, function(row) mean((row - mean(row))^2)))

round(c(avg_member_mse = ex_avg_mse,
        disagreement   = ex_dis,
        combo_mse      = ex_avg_mse - ex_dis,
        combo_rmse     = sqrt(ex_avg_mse - ex_dis)), 2)
#> avg_member_mse   disagreement      combo_mse     combo_rmse
#>         661.69         293.44         368.25          19.19
```

**Explanation:** The pair scores 19.19, better than the three-model combination's 22.26. Dropping STL helped, because STL was both the weakest member and the one most correlated with ETS. Keep that result in mind and stay sceptical of it: you only know STL was the weak link because you have already seen 1960. Section five asks whether you could have known it beforehand.

</details>

## Did the combination just get lucky on this one test window?

One good year proves very little. The 1960 result could be a coincidence of that particular twelve months, and any honest test has to repeat the exercise on windows we have not already looked at.

So we will roll the origin backwards. Train on everything up to the end of 1955 and forecast 1956, then train up to the end of 1956 and forecast 1957, and so on through 1960. Five separate forecasting problems, five separate scorecards, and the models get refitted from scratch every time.

```r title="Roll the forecast origin across five years"
one_year <- function(end_year) {
  tr <- window(AirPassengers, end = c(end_year, 12))
  te <- window(AirPassengers, start = c(end_year + 1, 1), end = c(end_year + 1, 12))

  e <- forecast(ets(tr),        h = 12)$mean
  a <- forecast(auto.arima(tr), h = 12)$mean
  s <- stlf(tr,                 h = 12)$mean

  r <- function(f) sqrt(mean((te - f)^2))
  c(Year = end_year + 1, ETS = r(e), ARIMA = r(a), STL = r(s), Combination = r((e + a + s) / 3))
}

roll <- t(sapply(1955:1959, one_year))
round(roll, 1)
#>      Year  ETS ARIMA  STL Combination
#> [1,] 1956 16.8  10.4 26.7        16.9
#> [2,] 1957 24.4  15.8 34.2        24.5
#> [3,] 1958 21.3  21.5 26.9        20.2
#> [4,] 1959 50.8  47.5 50.0        48.4
#> [5,] 1960 27.4  23.9 34.2        22.3
```

`one_year()` packages the whole experiment for a single origin: cut the training window, cut the matching test year, refit all three models, then average them and return five numbers. `sapply()` runs it once per origin and `t()` turns the result into one row per year. This block refits three models five times, so give it a few seconds.

The refitting matters. If we reused the models fitted on data through 1959 to forecast 1956, they would have seen the future, and the whole test would be meaningless.

Now the summary that actually answers the question. For each year, did the combination beat the average of the three models, and did it beat whichever model happened to be best that year?

```r title="Did the combination beat the average member and the best member"
member_cols <- roll[, c("ETS", "ARIMA", "STL")]

data.frame(
  year         = roll[, "Year"],
  avg_member   = round(rowMeans(member_cols), 1),
  best_member  = round(apply(member_cols, 1, min), 1),
  combination  = round(roll[, "Combination"], 1),
  beat_average = roll[, "Combination"] < rowMeans(member_cols),
  beat_best    = roll[, "Combination"] < apply(member_cols, 1, min)
)
#>   year avg_member best_member combination beat_average beat_best
#> 1 1956       18.0        10.4        16.9         TRUE     FALSE
#> 2 1957       24.8        15.8        24.5         TRUE     FALSE
#> 3 1958       23.2        21.3        20.2         TRUE      TRUE
#> 4 1959       49.4        47.5        48.4         TRUE     FALSE
#> 5 1960       28.5        23.9        22.3         TRUE      TRUE
```

Look at the `beat_average` column: five TRUEs out of five. That is the guarantee from the previous section showing up in data, exactly as the algebra promised. It could not have come out any other way.

Now look at `beat_best`: only two TRUEs against three FALSEs. In 1956 and 1957 the combination lost badly to ARIMA on its own, 16.9 against 10.4 and 24.5 against 15.8. Averaging in two weaker models diluted a genuinely strong one.

```r title="Average RMSE across all five origins"
round(colMeans(roll[, -1]), 2)
#>         ETS       ARIMA         STL Combination
#>       28.13       23.84       34.39       26.45
```

Averaged over the five years, ARIMA scored 23.84 and the combination scored 26.45. On this series, the honest verdict is that ARIMA was consistently the strongest model and combining it with the others made things slightly worse.

That result is the honest one, and it is the point of the section. Combining is insurance rather than a route to first place. It reliably keeps you out of the bottom half of your model set, which is worth a lot when you cannot tell in advance which model is strong. What it will not do is beat a model that was better all along, and pretending otherwise would leave you unable to explain a year like 1956.

[NOTE]
**One series is not evidence about forecasting in general.** The reason practitioners trust combination is that it has been tested across thousands of series in the M-competitions, where combinations dominate the leaderboards [6]. AirPassengers is one series with a strong clean trend, which is close to the ideal case for ARIMA.

**Try it:** The guarantee protects you from being average. Check the stronger everyday claim: how often did the combination beat the worst model of the three?

```r title="Your turn: count wins against the worst member"
# ex_worst: use apply() with max over the ETS/ARIMA/STL columns of `roll`
# then count how many years the Combination column was below it
# your code here
# Expected: a single number out of 5
```

<details>
<summary>Click to reveal solution</summary>

```r title="Wins against the worst member solution"
ex_worst <- apply(roll[, c("ETS", "ARIMA", "STL")], 1, max)
sum(roll[, "Combination"] < ex_worst)
#> [1] 5
```

**Explanation:** Five out of five, which also follows from the guarantee: if the combination always beats the average member, and the average is always below the worst, then the combination always beats the worst. You cannot pick the ruinous model by accident if you refuse to pick at all.

</details>

## What happens when one of the forecasts is bad?

Everything so far assumed three reasonable models. Real ensembles are messier. Somebody adds a model that made sense last quarter, or a colleague's spreadsheet gets included, or a method quietly breaks when the season shifts. What does one bad member do to the average?

Let's find out by deliberately adding two weak forecasters. A seasonal naive forecast just repeats last year's value for the same month, ignoring the trend entirely. A drift forecast draws a straight line through the first and last training points, ignoring the season entirely. Both are legitimate baselines, and both are badly suited to a series that trends and cycles at the same time.

```r title="Add two deliberately weak members"
fc_naive <- snaive(train, h = 12)$mean
fc_drift <- rwf(train, drift = TRUE, h = 12)$mean

round(c(ETS = rmse(fc_ets$mean), ARIMA = rmse(fc_arima$mean), STL = rmse(fc_stl$mean),
        SeasonalNaive = rmse(fc_naive), Drift = rmse(fc_drift)), 2)
#>           ETS         ARIMA           STL SeasonalNaive         Drift
#>         27.40         23.93         34.20         50.71         92.67
```

The two newcomers are far worse than anything we had. Seasonal naive is at 50.71, roughly double the good models. Drift is at 92.67, nearly four times ARIMA, because a straight line simply cannot reproduce a summer peak.

Now we combine all five, three ways. The plain mean weights every member equally, including the bad ones. The median takes the middle value of the five and ignores the rest. The trimmed mean throws away the highest and lowest forecast for each month and averages what survives.

```r title="Compare mean, median and trimmed mean"
five <- cbind(fc_ets$mean, fc_arima$mean, fc_stl$mean, fc_naive, fc_drift)

mean5   <- rowMeans(five)
median5 <- apply(five, 1, median)
trim5   <- apply(five, 1, mean, trim = 0.2)

data.frame(
  rule = c("Mean of 5", "Median of 5", "Trimmed mean of 5", "Mean of the 3 good ones"),
  RMSE = round(c(rmse(mean5), rmse(median5), rmse(trim5), rmse(combo)), 2)
)
#>                      rule  RMSE
#> 1               Mean of 5 37.35
#> 2             Median of 5 32.44
#> 3       Trimmed mean of 5 32.54
#> 4 Mean of the 3 good ones 22.26
```

`apply(five, 1, median)` runs across each month's five forecasts and keeps the middle one. `trim = 0.2` tells `mean()` to discard the top 20% and bottom 20% of the values before averaging, which with five members means dropping one from each end and averaging the middle three.

The plain mean collapsed from 22.26 to 37.35. Two bad members out of five were enough to make the combination worse than any of the three good models individually. The median and the trimmed mean both recover about half of that loss, landing near 32.5, because a single extreme forecast cannot move a middle value the way it moves an average.

Half the damage is still damage. Look at what the bad members do to the actual numbers.

```r title="See the drag on the first four months"
round(head(cbind(Actual = test, Mean = mean5, Median = median5,
                 Trimmed = trim5, Drift = fc_drift), 4), 1)
#>          Actual  Mean Median Trimmed Drift
#> Jan 1960    417 403.9  411.9   411.7 407.2
#> Feb 1960    391 393.8  407.0   405.9 409.5
#> Mar 1960    419 440.8  448.2   442.4 411.7
#> Apr 1960    461 432.4  440.5   435.1 413.9
```

In April the truth was 461. The drift forecast said 413.9, so far below the others that it pulled the mean down to 432.4 while the median stayed at 440.5. Drift makes the same kind of error every month, because a straight line cannot climb for the summer peak, so it pulls the mean down in every row of the table.

[WARNING]
**One broken member can poison an equal-weight mean.** Because every forecast gets the same weight, a model that is wrong by 90 contributes just as much as a model that is wrong by 20. Robust rules reduce the loss, they do not remove it. Screening your members before you combine them is the real fix.

[TIP]
**The median needs at least five members to be useful.** With four members the median is just the average of the middle two, and with three it is the middle forecast, which throws away two thirds of your information. Below five members, screen bad models out by hand instead of hoping a robust rule will hide them.

**Try it:** Suppose only the seasonal naive model sneaks in, and the truly awful drift model does not. Combine the three good models plus seasonal naive, and compare the mean against the median. Guess which wins before you run it.

```r title="Your turn: four members, mean versus median"
ex_four <- cbind(fc_ets$mean, fc_arima$mean, fc_stl$mean, fc_naive)

# Compute rmse() of rowMeans(ex_four) and of apply(ex_four, 1, median)
# your code here
# Expected: the two numbers are close, and one of them may surprise you
```

<details>
<summary>Click to reveal solution</summary>

```r title="Four member mean versus median solution"
round(c(mean4 = rmse(rowMeans(ex_four)), median4 = rmse(apply(ex_four, 1, median))), 2)
#>   mean4 median4
#>   25.08   28.89
```

**Explanation:** The mean wins this time, 25.08 against 28.89, reversing the result from the five-member case. Seasonal naive is mediocre but not extreme, so the mean absorbs it without much harm while the median pays a real price for discarding two of the three good forecasts. Robustness is not free, and it only pays for itself when a member is genuinely far out.

</details>

## Should you weight the forecasts by how accurate they have been?

Equal weights feel crude. ARIMA has looked stronger than STL all article, so surely we should give it more say. This is the most natural improvement anyone thinks of, it has a long research literature behind it, and it usually does not work. Let's see why.

The classic scheme, from Bates and Granger's original 1969 paper [2], gives each model a weight proportional to the inverse of its squared error, so accurate models get more say:

$$w_i = \frac{1 / \text{MSE}_i}{\sum_{j=1}^{M} 1 / \text{MSE}_j}$$

Where:

- $w_i$ = the weight given to model $i$, and the weights sum to 1
- $\text{MSE}_i$ = the mean squared error of model $i$, measured on data the weights are allowed to see

That last clause is doing the heavy lifting. The weights must come from data that is not the test set, otherwise we are grading our own homework. The safe source is each model's fit on the training data.

```r title="Each model's error on the training data"
train_rmse <- c(ETS   = accuracy(fc_ets)["Training set", "RMSE"],
                ARIMA = accuracy(fc_arima)["Training set", "RMSE"],
                STL   = accuracy(fc_stl)["Training set", "RMSE"])
round(train_rmse, 2)
#>   ETS ARIMA   STL
#>  9.35  9.91  9.86
```

`accuracy()` on a forecast object returns a small table of error measures, and the `"Training set"` row is how well the model reproduced the data it was fitted to. Notice the numbers are nearly identical: 9.35, 9.91, 9.86. All three models describe the past about equally well.

Notice also that ETS looks best in-sample at 9.35, even though ARIMA was clearly best on the future. Hold that thought.

```r title="Turn training errors into weights"
w <- (1 / train_rmse^2) / sum(1 / train_rmse^2)
round(w, 3)
#>   ETS ARIMA   STL
#> 0.358 0.319 0.322
```

The weights land at 0.358, 0.319 and 0.322. Equal weights would be 0.333 each. Because the training errors were so similar, the scheme barely moves away from a plain average, and the tiny nudge it does make favours ETS, which was not the model that deserved it.

```r title="Equal weights versus inverse-MSE weights"
weighted <- w["ETS"] * fc_ets$mean + w["ARIMA"] * fc_arima$mean + w["STL"] * fc_stl$mean

round(c(equal_weights = rmse(combo), inverse_mse_weights = rmse(weighted)), 2)
#>       equal_weights inverse_mse_weights
#>               22.26               22.39
```

Equal weights 22.26, inverse-MSE weights 22.39. The sophisticated scheme is very slightly worse. This is the forecast combination puzzle: theoretically better weighting schemes keep failing to beat the simple average in practice [5].

### What happens if we estimate the weights properly

Maybe inverse-MSE is too timid. Granger and Ramanathan proposed treating the whole thing as a regression: put the actual values on the left, the member forecasts on the right, and let least squares find the weights. That is strictly more flexible, so it should do strictly better.

To keep it honest we need a third slice of data. We will train the models on everything through 1958, forecast 1959, then fit the regression on that year. Then we apply those weights to the 1960 forecasts we already have.

```r title="Estimate regression weights on a validation year"
val_train <- window(AirPassengers, end = c(1958, 12))
val_test  <- window(AirPassengers, start = c(1959, 1), end = c(1959, 12))

v_ets   <- forecast(ets(val_train),        h = 12)$mean
v_arima <- forecast(auto.arima(val_train), h = 12)$mean
v_stl   <- stlf(val_train,                 h = 12)$mean

gr <- lm(as.numeric(val_test) ~ as.numeric(v_ets) + as.numeric(v_arima) + as.numeric(v_stl))
round(coef(gr), 3)
#>         (Intercept)   as.numeric(v_ets) as.numeric(v_arima)   as.numeric(v_stl)
#>            -214.519              -0.893              -0.065               2.624
```

`lm()` fits a linear regression: the variable on the left of `~` is predicted from the variables on the right, and `coef()` pulls out the fitted intercept and slopes. Look at what the regression decided. ETS gets a weight of -0.893, meaning "whatever ETS says, move away from it". STL gets 2.624, more than double its own forecast. And there is an intercept of -214.5 on top. These are not weights in any meaningful sense. Least squares had four free parameters and only twelve months to fit, so it picked whatever coefficients minimised the error on those twelve months, however implausible they look.

```r title="Apply the regression weights to 1960"
b <- coef(gr)
gr_forecast <- b[1] + b[2] * fc_ets$mean + b[3] * fc_arima$mean + b[4] * fc_stl$mean

round(c(equal_weights = rmse(combo),
        inverse_mse   = rmse(weighted),
        regression    = rmse(gr_forecast),
        best_member   = min(rmse(fc_ets$mean), rmse(fc_arima$mean), rmse(fc_stl$mean))), 2)
#> equal_weights   inverse_mse    regression   best_member
#>         22.26         22.39         68.32         23.93
```

The regression weights scored 68.32, three times worse than simply averaging. The most flexible method available produced the worst forecast in this article by a wide margin, because it spent all its flexibility memorising the noise in a single validation year.

For completeness, here is the ceiling nobody can reach. Fit the same regression directly on the 1960 test data, which is cheating, and see how good the weights could theoretically have been.

```r title="The unreachable oracle weights"
oracle <- lm(as.numeric(test) ~ as.numeric(fc_ets$mean) +
               as.numeric(fc_arima$mean) + as.numeric(fc_stl$mean))

round(c(oracle_rmse = sqrt(mean(residuals(oracle)^2)), equal_weights = rmse(combo)), 2)
#>   oracle_rmse equal_weights
#>         12.31         22.26
```

The residuals of that fit are exactly the errors the oracle combination would have made, so the square root of their mean square is its RMSE. Perfect hindsight weights would have scored 12.31 against the simple average's 22.26. So there really is a much better combination in there. The problem is that finding it requires knowing the answer, and every honest attempt to estimate it from real data made things worse instead.

[KEY INSIGHT]
**Estimating weights costs more than the weights are worth.** Every weight you estimate is itself uncertain, and with a handful of models and a short validation window that uncertainty swamps whatever improvement better weights could deliver. Equal weights have zero estimation error, which is exactly why they are so hard to beat.

[NOTE]
**Weighting does start to pay off with lots of data and lots of models.** With many candidate forecasters, long histories and genuinely large accuracy gaps between them, estimated weights can beat the simple average. The rule of thumb is that below roughly ten members with a short track record, the simple average is the sensible default.

**Try it:** ARIMA was the strongest model on the test year. Try tilting the combination toward it by hand: 0.5 to ARIMA, 0.3 to ETS, 0.2 to STL. Remember this uses hindsight you would not have had.

```r title="Your turn: hand-picked weights"
ex_w <- c(0.5, 0.3, 0.2)

# Build ex_fc as ex_w[1]*fc_arima$mean + ex_w[2]*fc_ets$mean + ex_w[3]*fc_stl$mean
# then rmse() it, rounded to 2 decimals
# your code here
# Expected: better than 22.26, but you needed the answer sheet to get it
```

<details>
<summary>Click to reveal solution</summary>

```r title="Hand-picked weights solution"
ex_fc <- ex_w[1] * fc_arima$mean + ex_w[2] * fc_ets$mean + ex_w[3] * fc_stl$mean
round(rmse(ex_fc), 2)
#> [1] 19.85
```

**Explanation:** 19.85 beats the equal-weight 22.26, and it also beats every automatic weighting scheme we tried. That is not a recommendation. You chose those weights by reading the test-set scoreboard, which is the one thing you can never do with a real forecast. It does show that good weights exist, which is why researchers keep looking for a way to estimate them.

</details>

## How do you build a prediction interval for a combined forecast?

A point forecast is half an answer. Anyone acting on it needs a range too. Each of our three models supplies its own 95% interval, so the tempting move is to average the lower bounds and average the upper bounds. That is wrong, and it is worth seeing why.

```r title="Averaging the members bounds, the tempting mistake"
naive_lower <- (fc_ets$lower[, 2] + fc_arima$lower[, 2] + fc_stl$lower[, 2]) / 3
naive_upper <- (fc_ets$upper[, 2] + fc_arima$upper[, 2] + fc_stl$upper[, 2]) / 3

round(head(cbind(Actual = test, Lower = naive_lower,
                 Combination = combo, Upper = naive_upper), 4), 1)
#>          Actual Lower Combination Upper
#> Jan 1960    417 393.8       417.4 440.9
#> Feb 1960    391 375.5       405.9 436.2
#> Mar 1960    419 423.7       462.1 500.6
#> Apr 1960    461 407.6       450.7 493.8
```

The `$lower` and `$upper` components of a forecast object are matrices with one column per confidence level. Column 1 holds the 80% bounds and column 2 the 95% bounds, so `[, 2]` picks the 95% interval.

The March row exposes the problem. The truth was 419 and the interval runs from 423.7 to 500.6, so the actual value falls outside a 95% interval entirely. That can happen once in a while by chance, but the deeper issue is structural: this interval only describes how uncertain each model is about its own forecast. It says nothing about the fact that the three models disagree with each other by 22 passengers about that very month.

The honest way to combine uncertainty is to treat the ensemble as a mixture: with probability one third the world behaves like the ETS model, with probability one third like ARIMA, and with probability one third like STL. We simulate from that mixture and read the quantiles off the pooled draws.

First we need each model's mean and standard deviation at each horizon. The standard deviation is recoverable from the 95% bound, since a 95% upper bound sits 1.96 standard deviations above the mean.

```r title="Recover each model's mean and spread"
mean_mat <- cbind(ETS = fc_ets$mean, ARIMA = fc_arima$mean, STL = fc_stl$mean)

sd_mat <- cbind(ETS   = (fc_ets$upper[, 2]   - fc_ets$mean)   / qnorm(0.975),
                ARIMA = (fc_arima$upper[, 2] - fc_arima$mean) / qnorm(0.975),
                STL   = (fc_stl$upper[, 2]   - fc_stl$mean)   / qnorm(0.975))

round(head(sd_mat, 4), 2)
#>            ETS ARIMA   STL
#> Jan 1960 15.55 10.48 10.02
#> Feb 1960 19.46 13.14 13.82
#> Mar 1960 26.38 15.68 16.79
#> Apr 1960 28.95 17.79 19.30
```

`qnorm(0.975)` is 1.959964, the number of standard deviations that leaves 2.5% in the upper tail of a normal distribution. Dividing the distance from the mean to the upper bound by it recovers the standard deviation. The spreads widen from January to April, which is the usual pattern: the further ahead you forecast, the less you know.

Now the simulation. For each of the twelve months we draw four thousand futures. Each draw picks one of the three models at random, then draws a value from that model's own distribution for that month.

```r title="Draw four thousand futures from the model mixture"
set.seed(2026)
n_sim <- 4000

draws <- sapply(1:12, function(h) {
  pick <- sample(1:3, n_sim, replace = TRUE)
  rnorm(n_sim, mean = mean_mat[h, pick], sd = sd_mat[h, pick])
})

dim(draws)
#> [1] 4000   12
```

`sample(1:3, n_sim, replace = TRUE)` chooses a model for each of the four thousand draws. Because `mean_mat[h, pick]` is indexed by that vector of choices, `rnorm()` receives four thousand mean and standard deviation pairs at once and returns one draw from each. `set.seed(2026)` fixes the random numbers so you get exactly these results.

The result is a 4000 by 12 matrix: four thousand possible versions of 1960. The interval is just the middle 95% of each column.

```r title="Read the interval off the pooled draws"
pooled_lower <- apply(draws, 2, quantile, probs = 0.025)
pooled_upper <- apply(draws, 2, quantile, probs = 0.975)

round(head(cbind(Actual = test, Lower = pooled_lower,
                 Combination = combo, Upper = pooled_upper), 4), 1)
#>          Actual Lower Combination Upper
#> Jan 1960    417 388.8       417.4 442.8
#> Feb 1960    391 375.4       405.9 437.4
#> Mar 1960    419 417.5       462.1 506.9
#> Apr 1960    461 401.8       450.7 497.1
```

March now runs from 417.5 to 506.9, and the actual value of 419 sits inside it. The lower bound moved down by six passengers, which is precisely the model disagreement that the averaged-bounds version had thrown away.

Let's measure both versions properly: how wide are they on average, and how often did they actually contain the truth?

```r title="Compare width and real coverage"
round(c(naive_width   = mean(naive_upper - naive_lower),
        pooled_width  = mean(pooled_upper - pooled_lower),
        naive_cover   = mean(test >= naive_lower  & test <= naive_upper),
        pooled_cover  = mean(test >= pooled_lower & test <= pooled_upper)), 3)
#>  naive_width pooled_width  naive_cover pooled_cover
#>      107.089      125.705        0.917        1.000
```

The pooled interval is 125.7 passengers wide against the naive version's 107.1, about 17% wider. It captured all twelve actual values while the averaged-bounds interval captured eleven, so 91.7% coverage from something that claimed to be a 95% interval.

Twelve months is far too small a sample to judge coverage properly, so do not read much into 11 versus 12. The structural argument is the one that should convince you: across the twelve months, the gap between the highest and the lowest member forecast averages 38 passengers, and any interval built by averaging the members' own bounds is arithmetically incapable of reflecting that.

[WARNING]
**Averaging the members' bounds is not a combined prediction interval.** It produces an interval that is too narrow, because it captures only each model's uncertainty about itself and discards the disagreement between models. Pool simulated futures instead.

**Try it:** Build an 80% interval instead of a 95% one from the same `draws` matrix, and check how wide it is.

```r title="Your turn: an 80% combined interval"
# ex_lo and ex_hi: apply quantile() to draws at probs 0.10 and 0.90
# then report the mean width and the coverage on `test`
# your code here
# Expected: much narrower than 125.7
```

<details>
<summary>Click to reveal solution</summary>

```r title="80% combined interval solution"
ex_lo <- apply(draws, 2, quantile, probs = 0.10)
ex_hi <- apply(draws, 2, quantile, probs = 0.90)

round(c(width_80 = mean(ex_hi - ex_lo), cover_80 = mean(test >= ex_lo & test <= ex_hi)), 3)
#> width_80 cover_80
#>   83.373    0.917
```

**Explanation:** The 80% interval is 83.4 wide, a third narrower than the 95% one, and it still caught eleven of twelve months. Demanding less confidence buys you a tighter range. You have learned nothing new about 1960, you have simply agreed to be wrong more often.

</details>

## Which R packages combine forecasts for you?

Everything so far was deliberately hand-rolled, because a combination really is just arithmetic on vectors and you should be able to see that. For production work there are packages that handle the bookkeeping, and the modern one is `fable`, which lets you write a combination as an algebraic expression over fitted models.

```r title="Build a combination with fable"
library(fable)
library(tsibble)
library(dplyr)

air       <- as_tsibble(AirPassengers)
air_train <- air |> filter(index < yearmonth("1960 Jan"))

fit <- air_train |>
  model(ets = ETS(value), arima = ARIMA(value)) |>
  mutate(combo = (ets + arima) / 2)

fit
#> # A mable: 1 x 3
#>             ets                              arima         combo
#>         <model>                            <model>       <model>
#> 1 <ETS(M,Ad,M)> <ARIMA(3,0,0)(0,1,0)[12] w/ drift> <COMBINATION>
```

`|>` is R's pipe: it feeds the value on its left into the function on its right as the first argument, so `air |> filter(...)` means the same as `filter(air, ...)`. `as_tsibble()` converts the classic time series object into a tsibble, the tidy time series format the fable ecosystem uses. `model()` fits several models in one call and returns a mable, a table with one column per fitted model. The clever part is the `mutate()` line: `(ets + arima) / 2` is real arithmetic on model objects, and fable stores the result as a first-class model of type `COMBINATION`.

Because the combination is a model like any other, forecasting and scoring it need no special handling.

```r title="Forecast and score the fable combination"
fc <- fit |> forecast(h = 12)

fc |>
  fabletools::accuracy(air) |>
  select(.model, RMSE, MAE, MAPE) |>
  arrange(RMSE)
#> # A tibble: 3 × 4
#>   .model  RMSE   MAE  MAPE
#>   <chr>  <dbl> <dbl> <dbl>
#> 1 arima   18.5  14.9  3.10
#> 2 combo   22.3  17.5  3.55
#> 3 ets     27.4  22.8  4.66
```

Passing `air`, the full series, to `fabletools::accuracy()` is what lets it look up the true 1960 values and score each forecast against them. The ARIMA that fable selected differs from the one `auto.arima()` chose, so its score differs too. The pattern is the one we have seen all article: the combination lands between its members, well clear of the weaker one.

[NOTE]
**Both the forecast and fabletools packages define accuracy().** Whichever loads last wins, so after `library(fable)` a bare `accuracy()` call is the fabletools version and will reject a plain forecast object. Write `fabletools::accuracy()` or `forecast::accuracy()` explicitly whenever both are loaded.

Here is how the main options compare.

| Package | How you combine | Best for |
|---|---|---|
| `fable` | Algebra on fitted models, `(ets + arima) / 2` | Modern tidy workflows, actively maintained |
| `forecast` | Manual arithmetic on `$mean` vectors | Full control, and it is what this article used |
| `forecastHybrid` | `hybridModel()` fits five methods and weights them | A quick ensemble with no setup |
| `opera` | Weights updated online as new data arrives | Long live series where the best model changes over time |
| `ForecastComb` | Fifteen schemes including eigenvector methods | Research comparisons across many weighting rules |

[TIP]
**Reach for a package when the bookkeeping gets painful, not before.** Two or three models is a one-line average you can debug in your head. Twenty models with rolling re-weighting is where `opera` starts earning its place.

**Try it:** Add a seasonal naive model to the fable combination and see what a weak third member does inside the tidy workflow.

```r title="Your turn: a three-model fable combination"
# In one pipeline: model() with ets = ETS(value), arima = ARIMA(value),
# snaive = SNAIVE(value), then mutate(combo3 = (ets + arima + snaive) / 3),
# then forecast(h = 12), fabletools::accuracy(air), select(.model, RMSE), arrange(RMSE)
# your code here
# Expected: combo3 lands below ets, not above it
```

<details>
<summary>Click to reveal solution</summary>

```r title="Three-model fable combination solution"
ex_fit <- air_train |>
  model(ets = ETS(value), arima = ARIMA(value), snaive = SNAIVE(value)) |>
  mutate(combo3 = (ets + arima + snaive) / 3)

ex_fit |>
  forecast(h = 12) |>
  fabletools::accuracy(air) |>
  select(.model, RMSE) |>
  arrange(RMSE)
#> # A tibble: 4 × 2
#>   .model  RMSE
#>   <chr>  <dbl>
#> 1 arima   18.5
#> 2 ets     27.4
#> 3 combo3  28.3
#> 4 snaive  50.7
```

**Explanation:** Adding seasonal naive pushed the combination from 22.3 to 28.3, now worse than ETS alone. The tidy syntax makes bad ensembles just as easy to build as good ones. Nothing in `fable` will warn you that a member is dragging the average down, so screening remains your job.

</details>

## Complete Example

Here is the whole workflow wrapped into one reusable function. Give it a seasonal series, a forecast horizon and a combining rule, and it splits the data, fits three models, combines them and scores everything.

```r title="A reusable combine_forecasts function"
combine_forecasts <- function(y, h, rule = "mean") {
  n     <- length(y)
  train <- ts(head(y, n - h), start = start(y), frequency = frequency(y))
  test  <- ts(tail(y, h), start = time(y)[n - h + 1], frequency = frequency(y))

  members <- cbind(
    ETS   = forecast(ets(train),        h = h)$mean,
    ARIMA = forecast(auto.arima(train), h = h)$mean,
    STL   = stlf(train,                 h = h)$mean
  )

  combined <- switch(rule,
    mean    = rowMeans(members),
    median  = apply(members, 1, median),
    trimmed = apply(members, 1, mean, trim = 0.2)
  )

  rmse <- function(f) sqrt(mean((as.numeric(test) - as.numeric(f))^2))

  data.frame(
    method = c(colnames(members), paste0("Combination (", rule, ")")),
    RMSE   = round(c(apply(members, 2, rmse), rmse(combined)), 2),
    row.names = NULL
  )
}

combine_forecasts(USAccDeaths, h = 12)
#>               method   RMSE
#> 1                ETS 289.62
#> 2              ARIMA 288.83
#> 3                STL 271.88
#> 4 Combination (mean) 278.75
```

`USAccDeaths` counts monthly accidental deaths in the United States, a series with no strong trend, which makes it a completely different test from `AirPassengers`. Inside the function, `head()` and `tail()` cut the series into its first `n - h` and last `h` values, and `ts()` rebuilds each piece as a time series: `start(y)` and `frequency(y)` carry over the original calendar, and `time(y)[n - h + 1]` is the calendar time of the first test point. `switch()` picks the combining rule from the string you passed, and `as.numeric()` inside `rmse()` strips the time series attributes so the subtraction works whether `combined` came back as a series or a plain vector.

The result is the pattern this article has been building toward, in miniature. The combination scored 278.75, below the members' average of 283.4, above the best member's 271.88. It beat two of three models without knowing in advance which two.

One function, any series. Let's point it at a quarterly one.

```r title="The same function on quarterly UK gas"
combine_forecasts(UKgas, h = 8)
#>               method   RMSE
#> 1                ETS  78.32
#> 2              ARIMA  71.27
#> 3                STL 109.46
#> 4 Combination (mean)  84.05
```

`UKgas` is quarterly UK gas consumption, so we hold out eight quarters instead of twelve months and the function adapts automatically through `frequency(y)`. Once again the combination at 84.05 beats the members' average of 86.35 and lands between the best and the worst member. That is the same outcome we got on `AirPassengers` and on `USAccDeaths`, on three series with quite different shapes.

## Practice Exercises

### Exercise 1: Verify the guarantee on a different year

The ambiguity decomposition should hold for any holdout window, not just 1960. Refit all three models on data through 1958, forecast the twelve months of 1959, and confirm that `average member MSE - disagreement` equals the combination's actual MSE. Report the combination's RMSE both ways.

```r title="Exercise 1 starter"
# Hint: build my_series and my_test with window(), then reuse the
# apply(members, 1, function(row) mean((row - mean(row))^2)) pattern.
# Compare sqrt(avg_mse - disagreement) against a direct rmse of rowMeans().

# Write your code below:

```

<details>
<summary>Click to reveal solution</summary>

```r title="Exercise 1 solution"
my_series <- window(AirPassengers, end = c(1958, 12))
my_test   <- window(AirPassengers, start = c(1959, 1), end = c(1959, 12))

my_members <- cbind(forecast(ets(my_series),        h = 12)$mean,
                    forecast(auto.arima(my_series), h = 12)$mean,
                    stlf(my_series,                 h = 12)$mean)

my_avg_mse <- mean(apply(my_members, 2, function(f) mean((my_test - f)^2)))
my_dis     <- mean(apply(my_members, 1, function(row) mean((row - mean(row))^2)))
my_direct  <- sqrt(mean((my_test - rowMeans(my_members))^2))

round(c(avg_member_mse = my_avg_mse,
        disagreement   = my_dis,
        combo_mse      = my_avg_mse - my_dis,
        combo_rmse     = sqrt(my_avg_mse - my_dis),
        check_rmse     = my_direct), 2)
#> avg_member_mse   disagreement      combo_mse     combo_rmse     check_rmse
#>        2446.25          99.91        2346.34          48.44          48.44
```

**Explanation:** The two RMSE figures agree to the decimal, 48.44 and 48.44, so the identity holds on 1959 exactly as it did on 1960. Note how small the disagreement term is here, 99.91 against 1960's 335.57. The models largely agreed about 1959 and were largely wrong together, which is why the combination saved so little that year.

</details>

### Exercise 2: Screen out the weakest member, honestly

The try-it in section two showed that the ETS and ARIMA pair beat the three-model combination on 1960. Try to reach that result without cheating: use each model's training RMSE to identify the weakest member, then drop it and average the two survivors. Compare against the mean of all three.

```r title="Exercise 2 starter"
# Hint: which.max() on the training RMSE vector names the weakest model.
# Use setdiff() to keep the other two columns, then rowMeans() them.

# Write your code below:

```

<details>
<summary>Click to reveal solution</summary>

```r title="Exercise 2 solution"
my_train_rmse <- c(ETS   = accuracy(fc_ets)["Training set", "RMSE"],
                   ARIMA = accuracy(fc_arima)["Training set", "RMSE"],
                   STL   = accuracy(fc_stl)["Training set", "RMSE"])

my_drop <- names(which.max(my_train_rmse))
my_keep <- cbind(ETS = fc_ets$mean, ARIMA = fc_arima$mean, STL = fc_stl$mean)[,
                 setdiff(names(my_train_rmse), my_drop)]

cat("dropped:", my_drop, "\n")
#> dropped: ARIMA

round(c(mean_of_all = rmse(rowMeans(cbind(fc_ets$mean, fc_arima$mean, fc_stl$mean))),
        screened    = rmse(rowMeans(my_keep))), 2)
#> mean_of_all    screened
#>       22.26       30.05
```

**Explanation:** Honest screening dropped ARIMA, which was the best model on the future and only looked worst on the past. The screened pair scored 30.05 against the unscreened 22.26, so the attempt to be clever raised the error by 35%. In-sample fit is a poor guide to out-of-sample skill, and that is the same force that makes estimated weights fail. Screening is for members you know are broken, not for members that fit the training data marginally less tightly.

</details>

### Exercise 3: Robust rules on a different series

Build a five-member ensemble on `USAccDeaths`, holding out 1978. Use ETS, ARIMA, STL, seasonal naive and drift, then compare the mean, median and trimmed mean. Decide which rule you would ship.

```r title="Exercise 3 starter"
# Hint: window(USAccDeaths, end = c(1977, 12)) for the training data.
# Reuse cbind() of the five $mean vectors, then rowMeans, median and trim = 0.2.

# Write your code below:

```

<details>
<summary>Click to reveal solution</summary>

```r title="Exercise 3 solution"
my_tr <- window(USAccDeaths, end = c(1977, 12))
my_te <- window(USAccDeaths, start = c(1978, 1))

my_five <- cbind(forecast(ets(my_tr),        h = 12)$mean,
                 forecast(auto.arima(my_tr), h = 12)$mean,
                 stlf(my_tr,                 h = 12)$mean,
                 snaive(my_tr,               h = 12)$mean,
                 rwf(my_tr, drift = TRUE,    h = 12)$mean)

my_r <- function(f) sqrt(mean((my_te - f)^2))

round(c(mean5   = my_r(rowMeans(my_five)),
        median5 = my_r(apply(my_five, 1, median)),
        trim5   = my_r(apply(my_five, 1, mean, trim = 0.2))), 2)
#>   mean5 median5   trim5
#>  361.39  277.03  290.51
```

**Explanation:** The median wins clearly at 277.03, cutting 23% off the plain mean's 361.39, with the trimmed mean close behind at 290.51. This reproduces the section four result on a completely different series, which is the kind of repetition that should raise your confidence in a finding. Ship the median whenever you have five or more members and cannot vouch for all of them.

</details>

## Frequently asked questions

### How many forecasts should I combine?

Three to five is the sweet spot for most work. Two models give you one cancellation opportunity per period, which is thin. Beyond about five, each extra member changes the average less and less, so the effort goes into finding a genuinely different method rather than adding a fourth variation on exponential smoothing. If you do go past five, switch from the mean to the median, because a large ensemble is much more likely to contain a broken member.

### Can I combine forecasts from models fitted on transformed data?

Yes, as long as you transform everything back to the original scale before averaging. If one model forecasts log passengers and another forecasts passengers, averaging them directly is meaningless. Exponentiate the log forecast first. Be aware that the exponential of a mean is not the mean of the exponentials, so back-transformed forecasts carry a small bias; `forecast()` handles this for you when you pass `lambda` and `biasadj = TRUE`.

### Should I combine a machine learning model with a statistical one?

That is often the best pairing you can build, precisely because the two make errors for different reasons. A gradient boosting model and an ARIMA will rarely be wrong in the same direction on the same month. The only requirement is that both produce forecasts for the same periods on the same scale. Everything in this article applies unchanged, since the combination never looks inside its members.

### My combination is worse than my single best model. What should I do?

First check whether you know it is your best model, or whether you only know it was best on the window you just measured. Exercise 2 above showed a model that looked worst on the training data and turned out best on the future. If you have several years of rolling evidence that one method consistently wins, then trusting it is reasonable. If you have one holdout window, you are probably looking at noise, and the combination is the safer choice.

### Do I have to refit all the models every time new data arrives?

Refit on the same schedule you would use for a single model. The combination adds no new fitting requirement, it just multiplies the work by the number of members. If refitting is expensive, note that the weights in an equal-weight combination never need re-estimating, which is one more practical advantage of the simple average over anything data-driven.

### Does this work for weekly or daily data?

The arithmetic is identical at any frequency. What changes is which members are worth including, since methods like `ets()` struggle with the long seasonal periods that daily and weekly data bring. For high-frequency series, build your ensemble from methods designed for it, such as `tbats()`, dynamic harmonic regression, or Prophet, then average them exactly as we did here.

## Summary

Combining forecasts is one of the few techniques in forecasting that is simultaneously trivial to implement and hard to beat. The arithmetic is a single division. Everything difficult about it is knowing what it does and does not promise.

![Choosing between the mean, the median and screening](screenshots/Combining-Forecasts-in-R-choosing-a-rule.webp)

*Figure 3: Choosing between the mean, the median and screening.*

| What you learned | The takeaway |
|---|---|
| How to combine | Average the `$mean` vectors of several forecast objects, then score as usual |
| Why it works | Errors of different sign cancel, and the ambiguity decomposition makes the gain exact |
| What is guaranteed | The combination can never be worse than the average member, on any data |
| What is not guaranteed | It may lose to the single best member, and on AirPassengers it lost to ARIMA 3 years in 5 |
| Which members to pick | Diversity beats individual accuracy, since correlated models leave nothing to cancel |
| When one member is bad | The equal-weight mean is poisoned; use the median with 5 or more members, or screen first |
| Whether to weight | Inverse-MSE barely moved the needle, and regression weights scored 3 times worse than a simple average |
| How to build intervals | Pool simulated futures across models; averaging the members' bounds understates uncertainty |
| Which package | `fable` for tidy workflows, plain `forecast` arithmetic for full control |

The single most useful habit from all of this is to stop treating model selection as a decision you must get right. If you have three plausible models and no strong reason to prefer one, average them and move on to a problem where your judgement actually adds value.

## References

1. Hyndman, R.J. & Athanasopoulos, G. *Forecasting: Principles and Practice*, 3rd edition, Section 13.4: Forecast combinations. [Link](https://otexts.com/fpp3/combinations.html)
2. Bates, J.M. & Granger, C.W.J. The Combination of Forecasts. *Operational Research Quarterly* 20(4), 451-468 (1969). The paper that started the field; it sits behind a paywall, and reference 3 summarises its argument.
3. Wang, X., Hyndman, R.J., Li, F. & Kang, Y. Forecast combinations: an over 50-year review. *International Journal of Forecasting* (2023). [Link](https://arxiv.org/abs/2205.04216)
4. Krogh, A. & Vedelsby, J. Neural Network Ensembles, Cross Validation, and Active Learning. *NeurIPS* (1994), the origin of the ambiguity decomposition. [Link](https://proceedings.neurips.cc/paper/1994/hash/b8c37e33defde51cf91e1e03e51657da-Abstract.html)
5. Lee, S. & Lee, T.-H. Solving the Forecast Combination Puzzle. University of California Riverside working paper 202514. [Link](https://economics.ucr.edu/repec/ucr/wpaper/202514.pdf)
6. Makridakis, S., Spiliotis, E. & Assimakopoulos, V. The M4 Competition, where combinations dominated the leaderboard. Methods and results archive. [Link](https://github.com/Mcompetitions/M4-methods)
7. Hyndman, R.J. *forecast: Forecasting Functions for Time Series and Linear Models*, CRAN reference manual. [Link](https://cran.r-project.org/package=forecast)
8. Hyndman, R.J. R packages for forecast combinations, comparing opera and forecastHybrid. [Link](https://robjhyndman.com/hyndsight/forecast-combinations/)
9. O'Hara-Wild, M., Hyndman, R.J. & Wang, E. *fable: Forecasting Models for Tidy Time Series*. [Link](https://fable.tidyverts.org/)
10. Hyndman, R.J. & Athanasopoulos, G. *Forecasting: Principles and Practice*, Section 5.10: Time series cross-validation. [Link](https://otexts.com/fpp3/tscv.html)

## Continue Learning

- [Forecast Accuracy in R](Forecast-Accuracy-in-R.html) covers RMSE, MAE, MAPE and MASE in depth, including which measure to trust when your series changes scale.
- [Time Series Cross-Validation in R](Time-Series-Cross-Validation-in-R.html) turns the five-origin test from section three into a proper automated procedure with `tsCV()`.
- [ETS vs ARIMA in R](ETS-vs-ARIMA-in-R.html) explains what the two main members of our ensemble actually do, and why their errors are so different.
- [Prediction Intervals in R](Prediction-Intervals-in-R.html) goes deeper on interval width, coverage and what breaks when residuals are not normal.

---
title: "Bootstrapping and Bagging Forecasts in R"
slug: "Bootstrap-Forecasting-in-R"
description: "Bootstrap a time series in R with bld.mbb.bootstrap(), then bag ETS forecasts using baggedETS(). Block resampling, honest intervals and the fable way."
keywords: "bootstrapping time series in R, bagging forecasts in R, bld.mbb.bootstrap, baggedETS, baggedModel, moving block bootstrap, bagged ETS forecast, bootstrap prediction intervals, STL bootstrap, forecast ensemble in R"
auto_link_terms: "bootstrapping time series|bootstrapped time series|bagging forecasts|bagged forecast|bagged ETS|moving block bootstrap|block bootstrap|bld.mbb.bootstrap()|baggedETS()|baggedModel()|bootstrap prediction intervals|forecast ensemble|bootstrap aggregating"
auto_link_case_sensitive: false
mathjax: true
webr: true
date: "2026-07-23"
curriculum_id: "TS2-3.7"
post_type: "C"
sidebar_section: "Time Series"
sidebar_title: "Bootstrapping and Bagging"
sidebar_order: "52"
difficulty: "Intermediate"
---

<p class="lead">Bootstrapping a time series means manufacturing many plausible alternative histories from the one history you actually observed. Bagging means fitting a forecast to each of those histories and averaging the answers. In R, <code>bld.mbb.bootstrap()</code> builds the alternative histories and <code>baggedETS()</code> turns them into a single, steadier forecast.</p>

## What does bootstrapping a time series actually do?

You only ever get one history. Every parameter your model estimates, and the model type itself, is a guess made from that single sample, and a slightly different sample would have produced slightly different guesses. Bootstrapping manufactures those "slightly different samples" so you can see how much your forecast depends on the luck of the draw. Here is what one history turned into four looks like.

```r title="Turn one history into four"
library(forecast)

set.seed(2026)
boot <- bld.mbb.bootstrap(AirPassengers, 4)

round(cbind(original = head(AirPassengers, 6),
            sim2     = head(boot[[2]], 6),
            sim3     = head(boot[[3]], 6),
            sim4     = head(boot[[4]], 6)), 1)
#>          original  sim2  sim3  sim4
#> Jan 1949      112 113.3 105.9 114.5
#> Feb 1949      118 112.1 112.9 108.3
#> Mar 1949      132 123.4 126.9 126.8
#> Apr 1949      129 123.3 126.2 122.8
#> May 1949      121 122.9 124.3 124.1
#> Jun 1949      135 141.0 143.5 146.7
```

`AirPassengers` is a built-in dataset: monthly totals of international airline passengers from 1949 to 1960. `bld.mbb.bootstrap(y, n)` takes that series and returns a list of `n` series, each the same length and each with the same overall shape.

Look at the columns side by side. January 1949 was 112 real passengers. In the three manufactured histories it is 113.3, 105.9 and 114.5. Every month wobbles a little, but the January-to-June climb is there in all four. These are not random numbers, they are answers to the question "what else could this series plausibly have looked like?"

[NOTE]
**The first element is the original series, not a bootstrap.** `bld.mbb.bootstrap()` returns the untouched input as element one, which is why the table above starts at `boot[[2]]`. It is a convenience so the ensemble always contains the real data, and it catches people out when they expect all `n` elements to be resampled.

Before going further, it helps to see the plain bootstrap on something much smaller than a time series. Suppose you measured five things and want to know how reliable their average is.

```r title="Resample five numbers with replacement"
x <- c(12, 15, 11, 18, 14)
mean(x)
#> [1] 14

set.seed(101)
sample(x, 5, replace = TRUE)
#> [1] 12 12 12 15 14
```

`sample(x, 5, replace = TRUE)` draws five values from `x`, putting each one back after drawing it. That is what "with replacement" means, and it is the entire trick. Here the draw picked 12 three times and never picked 11 or 18 at all.

That resample is a stand-in for "a different five measurements I could have taken." Its mean is 13, not 14. Do it a thousand times and the spread of those means tells you how much your estimate of 14 could have wobbled.

```r title="Build a bootstrap interval for the mean"
set.seed(202)
boot_means <- replicate(1000, mean(sample(x, 5, replace = TRUE)))

round(quantile(boot_means, c(0.025, 0.5, 0.975)), 2)
#>  2.5%   50% 97.5% 
#>    12    14    16
```

`replicate(1000, ...)` runs the resample-and-average step a thousand times and collects the results. `quantile()` then reads off the 2.5th, 50th and 97.5th percentiles of those thousand means.

The middle 95% of those means falls between 12 and 16. You never had to assume normality, never derived a standard error, never opened a textbook. Redrawing the five values you already have, a thousand times over, is enough to measure how far the answer moves. That is the bootstrap.

**Try it:** Repeat the same experiment for the **median** instead of the mean. Store the 1000 medians in `ex_medians` and print the 2.5%, 50% and 97.5% quantiles.

```r title="Your turn: bootstrap the median"
# Swap mean() for median() inside the replicate call
# ex_medians <- replicate(1000, median(sample(...)))
# your code here

# Then print: round(quantile(ex_medians, c(0.025, 0.5, 0.975)), 2)
# Expected: three numbers, spread wider than the mean's 12 to 16
```

<details>
<summary>Click to reveal solution</summary>

```r title="Bootstrap median solution"
set.seed(111)
ex_medians <- replicate(1000, median(sample(x, 5, replace = TRUE)))

round(quantile(ex_medians, c(0.025, 0.5, 0.975)), 2)
#>  2.5%   50% 97.5% 
#>    11    14    18
```

**Explanation:** Only the summary function changed, from `mean()` to `median()`. The median's interval runs 11 to 18, much wider than the mean's 12 to 16, because with only five values the median jumps to whichever value lands in the middle rather than smoothing across all of them.

</details>

## Why does plain resampling break a time series?

The five-number bootstrap worked because those five measurements were interchangeable. Shuffle them into any order and they still describe the same thing. A time series is the opposite: the order **is** the information. Here is what happens when you ignore that.

```r title="Shuffle a series and lose its memory"
set.seed(303)
shuffled <- ts(sample(AirPassengers, replace = TRUE),
               start = c(1949, 1), frequency = 12)

data.frame(lag       = c(1, 2, 12),
           original  = round(acf(AirPassengers, lag.max = 12, plot = FALSE)$acf[c(2, 3, 13)], 3),
           shuffled  = round(acf(shuffled,      lag.max = 12, plot = FALSE)$acf[c(2, 3, 13)], 3))
#>   lag original shuffled
#> 1   1    0.948    0.057
#> 2   2    0.876   -0.004
#> 3  12    0.760    0.074
```

`acf()` measures autocorrelation: how strongly a value resembles the value that came some number of steps before it. The `$acf` vector starts at lag 0, so positions 2, 3 and 13 give lags 1, 2 and 12. Lag 12 matters most here because the data is monthly, so lag 12 is "the same month last year."

Read the two columns. In the real series, this month looks 0.948 like last month and 0.760 like the same month a year ago. In the shuffled copy, both numbers collapse to roughly zero. The shuffle threw away every relationship the forecasting model was going to learn from.

That is the whole problem in one table. A bootstrap of a time series has to produce something a forecasting model would still recognise as the same kind of series. Independent resampling keeps every original value and their overall distribution, but destroys the ordering that carried the information.

[KEY INSIGHT]
**A bootstrap must preserve whatever structure the model is going to learn.** For five independent measurements, nothing needs preserving, so plain resampling works. For a time series, the trend, the seasonality and the month-to-month memory all need to survive the resampling, which is why time series bootstrapping needs a different mechanism.

**Try it:** Do the same check on `USAccDeaths`, a monthly count of accidental deaths in the US from 1973 to 1978. Shuffle it into `ex_shuffled` and compare the lag-12 autocorrelation with the original's.

```r title="Your turn: shuffle USAccDeaths"
# Wrap sample(USAccDeaths, replace = TRUE) in ts(..., start = c(1973, 1), frequency = 12)
# ex_shuffled <- ts(...)
# your code here

# Then compare acf(USAccDeaths, 12, plot = FALSE)$acf[13] with the same on ex_shuffled
# Expected: original clearly positive, shuffled near zero
```

<details>
<summary>Click to reveal solution</summary>

```r title="Shuffle USAccDeaths solution"
set.seed(222)
ex_shuffled <- ts(sample(USAccDeaths, replace = TRUE),
                  start = c(1973, 1), frequency = 12)

round(c(original = acf(USAccDeaths, 12, plot = FALSE)$acf[13],
        shuffled = acf(ex_shuffled, 12, plot = FALSE)$acf[13]), 3)
#> original shuffled 
#>    0.629   -0.125
```

**Explanation:** `USAccDeaths` peaks every July, so a value resembles the value 12 months earlier at 0.629. Shuffling drops that to -0.125, statistically indistinguishable from no relationship at all.

</details>

### How the moving block bootstrap keeps the pattern intact

The fix is almost obvious once you see the problem. If resampling one point at a time destroys the memory between neighbours, then resample **runs** of consecutive points instead. Inside a run, neighbours stay neighbours and the memory survives.

![The moving block bootstrap draws runs of consecutive values instead of single points](screenshots/Bootstrap-Forecasting-in-R-block-resample.webp)

*Figure 1: The moving block bootstrap draws runs of consecutive values, so neighbours stay neighbours.*

That mechanism is called the **moving block bootstrap**, and it is easiest to understand on twelve numbers you can read at a glance.

```r title="Draw three blocks by hand"
small <- 1:12

set.seed(409)
starts <- sample(1:(12 - 4 + 1), 3, replace = TRUE)
starts
#> [1] 7 2 9

lapply(starts, function(s) small[s:(s + 3)])
#> [[1]]
#> [1]  7  8  9 10
#> 
#> [[2]]
#> [1] 2 3 4 5
#> 
#> [[3]]
#> [1]  9 10 11 12

unlist(lapply(starts, function(s) small[s:(s + 3)]))
#>  [1]  7  8  9 10  2  3  4  5  9 10 11 12
```

The block length here is 4. `sample(1:9, 3, replace = TRUE)` picks three starting positions, `1:9` because a block of 4 starting at 10 or later would run off the end. Each start `s` then grabs `small[s:(s+3)]`, four consecutive values.

Look at the final line. The blocks are in a new order and block 9 was drawn twice, so the series has genuinely been reshuffled. But inside each block, 7 is still followed by 8, which is still followed by 9. The local structure is untouched; only the arrangement of the chunks changed.

The word "moving" refers to the blocks being allowed to start anywhere, not just at fixed cut points. That means blocks overlap, which gives far more distinct blocks to draw from and keeps the manufactured series from looking like a jigsaw of the same few pieces.

Here is the same idea as a reusable function, tested on a series with strong memory built in.

```r title="A minimal moving block bootstrap"
my_mbb <- function(z, block_size) {
  n        <- length(z)
  n_blocks <- floor(n / block_size) + 2
  starts   <- sample(1:(n - block_size + 1), n_blocks, replace = TRUE)
  long     <- unlist(lapply(starts, function(s) z[s:(s + block_size - 1)]))
  offset   <- sample(0:(block_size - 1), 1) + 1
  long[offset:(offset + n - 1)]
}

set.seed(505)
ar_series <- as.numeric(arima.sim(list(ar = 0.8), n = 200))
ar_block  <- my_mbb(ar_series, 24)

round(c(original = acf(ar_series, 1, plot = FALSE)$acf[2],
        blocks   = acf(ar_block,  1, plot = FALSE)$acf[2],
        shuffled = acf(sample(ar_series), 1, plot = FALSE)$acf[2]), 3)
#> original   blocks shuffled 
#>    0.792    0.729   -0.068
```

Walking through `my_mbb()`: it draws two extra blocks beyond what it needs so the concatenated string `long` is comfortably longer than the original, then trims back to exactly `n` values starting from a random `offset`. That random offset is what stops every bootstrap from beginning at a block boundary, which would leave a visible seam pattern.

`arima.sim(list(ar = 0.8), n = 200)` generates 200 points where each value is 0.8 times the previous one plus fresh noise, a deliberately sticky series. The result is the point of this whole section: block resampling keeps the lag-1 autocorrelation at 0.729 against an original of 0.792, while plain shuffling drops it to -0.068. Blocks preserve the memory; single-point resampling destroys it.

[TIP]
**Block size is the one knob that matters.** Too small and you are back to shuffling. Too large and every bootstrap is a near-copy of the original, so the ensemble has no variety. There is a section near the end of this tutorial that measures exactly where the trade-off lands.

**Try it:** Run `my_mbb()` on a fresh AR(1) series twice, once with `block_size = 2` and once with `block_size = 24`, and compare the lag-1 autocorrelations against the original.

```r title="Your turn: compare two block sizes"
set.seed(333)
ex_ar <- as.numeric(arima.sim(list(ar = 0.8), n = 200))

# Call my_mbb() on ex_ar twice, once with block size 2 and once with 24
# ex_small <- my_mbb(...)
# ex_big   <- my_mbb(...)
# your code here

# Then compare the lag-1 acf of ex_ar, ex_small and ex_big
# Expected: block 24 close to the original, block 2 much lower
```

<details>
<summary>Click to reveal solution</summary>

```r title="Compare two block sizes solution"
set.seed(333)
ex_ar    <- as.numeric(arima.sim(list(ar = 0.8), n = 200))
ex_small <- my_mbb(ex_ar, 2)
ex_big   <- my_mbb(ex_ar, 24)

round(c(original = acf(ex_ar,    1, plot = FALSE)$acf[2],
        block2   = acf(ex_small, 1, plot = FALSE)$acf[2],
        block24  = acf(ex_big,   1, plot = FALSE)$acf[2]), 3)
#> original   block2  block24 
#>    0.822    0.374    0.827
```

**Explanation:** With blocks of 2, only every other adjacency survives a join, so the recovered autocorrelation falls to 0.374, less than half the original. With blocks of 24, the joins are rare enough that 0.827 comes out essentially identical to the original 0.822.

</details>

## What are the steps inside bld.mbb.bootstrap()?

Block resampling alone is still not enough. `AirPassengers` has a rising trend and a repeating yearly wave, and if you block-resample the raw series you will happily paste a 1958 chunk in front of a 1950 chunk and produce a history that jumps backwards. `bld.mbb.bootstrap()` avoids that by resampling only the part of the series that has no trend or seasonality left in it.

![bld.mbb.bootstrap transforms, decomposes, resamples only the remainder, then rebuilds](screenshots/Bootstrap-Forecasting-in-R-bld-pipeline.webp)

*Figure 2: bld.mbb.bootstrap() only resamples the remainder, then puts the series back together.*

The name spells out the recipe. **BLD** stands for Box-Cox and Loess-based Decomposition, **MBB** for moving block bootstrap. Step one is the Box-Cox transformation.

```r title="Step 1: stabilise the variance"
lambda <- BoxCox.lambda(AirPassengers, lower = 0, upper = 1)
lambda
#> [1] 6.610696e-05

ap_bc <- BoxCox(AirPassengers, lambda)

round(c(sd_first_2yrs_raw = sd(head(AirPassengers, 24)),
        sd_last_2yrs_raw  = sd(tail(AirPassengers, 24)),
        sd_first_2yrs_bc  = sd(head(ap_bc, 24)),
        sd_last_2yrs_bc   = sd(tail(ap_bc, 24))), 3)
#> sd_first_2yrs_raw  sd_last_2yrs_raw  sd_first_2yrs_bc   sd_last_2yrs_bc 
#>            17.552            76.283             0.129             0.163
```

A Box-Cox transformation raises the series to a power `lambda`, with `lambda = 0` meaning "take logs." `BoxCox.lambda()` picks the power that makes the seasonal swings the same size throughout, and `lower = 0, upper = 1` confines that search to powers between logging and leaving the series alone, which is exactly the range `bld.mbb.bootstrap()` uses internally. Here it returns 0.0000661, so close to zero that this is effectively a log transform.

The four numbers show why that matters. In raw passenger counts, the last two years swing more than four times as much as the first two, 76.3 against 17.6. After transforming, the two swings are 0.163 and 0.129, near enough the same. Now a chunk of noise cut from 1958 is the right size to paste into 1950.

Step two splits the transformed series into the parts you want to keep and the part you want to resample.

```r title="Step 2: split into trend, season and remainder"
parts <- stl(ap_bc, s.window = "periodic")$time.series

round(head(parts, 3), 4)
#>          seasonal  trend remainder
#> Jan 1949  -0.0917 4.8302   -0.0193
#> Feb 1949  -0.1141 4.8311    0.0544
#> Mar 1949   0.0159 4.8321    0.0356

round(head(rowSums(parts), 3), 4)
#> [1] 4.7192 4.7714 4.8836
```

`stl()` is Seasonal and Trend decomposition using Loess. It slides a smoother along the series to extract a slow-moving `trend`, averages each calendar month to extract a repeating `seasonal` pattern, and calls whatever is left over the `remainder`. The argument `s.window = "periodic"` forces the seasonal pattern to be identical every year.

The second output is the sanity check: the three components add back up to the transformed series, 4.7192 for January 1949. Decomposition splits, it does not lose anything.

The remainder is the only piece with no trend and no seasonality left in it, which makes it the only piece that is safe to shuffle. Step three does exactly that and then reassembles.

```r title="Step 3: resample the remainder and rebuild"
set.seed(606)
new_remainder <- my_mbb(as.numeric(parts[, "remainder"]), 24)

rebuilt <- InvBoxCox(parts[, "trend"] + parts[, "seasonal"] + new_remainder, lambda)

round(cbind(original = head(AirPassengers, 6), rebuilt = head(rebuilt, 6)), 1)
#>          original rebuilt
#> Jan 1949      112   110.6
#> Feb 1949      118   111.2
#> Mar 1949      132   126.3
#> Apr 1949      129   124.0
#> May 1949      121   129.1
#> Jun 1949      135   144.1

round(c(mean_original = mean(AirPassengers), mean_rebuilt = mean(rebuilt)), 1)
#> mean_original  mean_rebuilt 
#>         280.3         279.6
```

The line does three things at once. `my_mbb(..., 24)` block-resamples the remainder using blocks of 24 months, which is two full seasonal cycles. Adding `trend` and `seasonal` back puts the structure in. `InvBoxCox()` undoes the transformation so the numbers are passenger counts again.

That is a complete bootstrap series, built from scratch, and it is what `bld.mbb.bootstrap()` returned in the very first code block. The monthly values differ from the original by a few passengers each, but the twelve-year mean lands at 279.6 against the real 280.3. The manufactured history is different in its details and identical in its character.

[WARNING]
**Never block-resample the raw series directly.** Trend and seasonality are systematic, not random, so shuffling chunks of the raw values moves 1960-sized numbers into 1949 and manufactures histories that could never have happened. The decomposition step exists precisely to quarantine the random part before any shuffling occurs.

**Try it:** Rebuild one more bootstrap series using blocks of 12 months instead of 24, store it in `ex_rebuilt`, and compare its overall mean against the original's.

```r title="Your turn: rebuild with 12-month blocks"
# Reuse the step-3 line but pass 12 instead of 24 to my_mbb()
# ex_rebuilt <- InvBoxCox(parts[, "trend"] + parts[, "seasonal"] + my_mbb(..., 12), lambda)
# your code here

# Then compare mean(AirPassengers) with mean(ex_rebuilt)
# Expected: two means within a few passengers of each other
```

<details>
<summary>Click to reveal solution</summary>

```r title="Rebuild with 12-month blocks solution"
set.seed(444)
ex_rebuilt <- InvBoxCox(parts[, "trend"] + parts[, "seasonal"] +
                          my_mbb(as.numeric(parts[, "remainder"]), 12), lambda)

round(c(mean_original = mean(AirPassengers), mean_rebuilt = mean(ex_rebuilt)), 1)
#> mean_original  mean_rebuilt 
#>         280.3         281.2
```

**Explanation:** Only the block size changed. The rebuilt mean of 281.2 sits within one passenger of the original 280.3, because trend and seasonality were added back untouched and only the small remainder was rearranged.

</details>

## How do you turn many series into one better forecast?

Now the payoff. You have a machine that turns one history into many. Fit a forecast to each one and average the answers, and you get a forecast that does not hinge on the quirks of the single history you happened to observe. That averaging step is called **bagging**, short for bootstrap aggregating.

![Bagging fits one model per bootstrap history and averages the point forecasts](screenshots/Bootstrap-Forecasting-in-R-bagging-flow.webp)

*Figure 3: Bagging fits one model per bootstrap history and averages the point forecasts.*

To be able to check the result honestly later, split the data first: fit on 1949 to 1958 and hold back the last two years.

```r title="Bag twenty ETS forecasts by hand"
train <- window(AirPassengers, end = c(1958, 12))
test  <- window(AirPassengers, start = c(1959, 1))

set.seed(707)
boot_train <- bld.mbb.bootstrap(train, 20)
fcs <- sapply(boot_train, function(s) forecast(ets(s), h = 24)$mean)
dim(fcs)
#> [1] 24 20

bagged_mean <- rowMeans(fcs)
round(head(bagged_mean, 4), 1)
#> [1] 359.6 355.0 406.4 393.6
```

`ets()` fits an exponential smoothing state space model, automatically choosing whether the error, trend and seasonal components should be additive or multiplicative. `forecast(fit, h = 24)$mean` pulls out the 24 monthly point forecasts. `sapply()` runs that over all twenty bootstrap series, producing a 24-by-20 matrix: one row per future month, one column per bootstrap history.

`rowMeans()` then collapses each row of twenty predictions into one. The bagged forecast for January 1959 is 359.6, the average of twenty separate opinions about January 1959.

The `forecast` package packages that whole loop into one function.

```r title="baggedETS does the same thing in one line"
fit_bag <- baggedETS(train, bootstrapped_series = boot_train)
fc_bag  <- forecast(fit_bag, h = 24)

round(head(fc_bag$mean, 4), 1)
#>        Jan   Feb   Mar   Apr
#> 1959 359.6 355.0 406.4 393.6

table(sapply(fit_bag$models, function(m) m$method))
#> 
#>  ETS(M,A,M) ETS(M,Ad,M) 
#>           1          19
```

`baggedETS(y, bootstrapped_series)` fits `ets()` to every series you hand it and stores the twenty fitted models in `fit_bag$models`. Passing `boot_train` reuses the exact ensemble from the previous block, which is why the four numbers match to the decimal. Left to itself, `baggedETS()` would call `bld.mbb.bootstrap(y, 100)` and build 100 series.

The `table()` output shows what the ensemble actually chose. Nineteen of the twenty bootstrap histories led `ets()` to an ETS(M,Ad,M) model, multiplicative error, damped additive trend, multiplicative seasonality. One led it somewhere slightly different. Which model type gets chosen depends on the particular sample, and bootstrapping is what makes that dependence visible.

Even where the model type agrees, the estimated parameters do not.

```r title="How much the ensemble disagrees"
alphas <- sapply(fit_bag$models, function(m) m$par["alpha"])
round(summary(as.numeric(alphas)), 3)
#>    Min. 1st Qu.  Median    Mean 3rd Qu.    Max. 
#>   0.602   0.662   0.729   0.706   0.746   0.775

round(ets(train)$par["alpha"], 3)
#> alpha 
#> 0.746
```

`alpha` is the smoothing weight ETS puts on the most recent observation. A high alpha means the model chases the latest value; a low alpha means it trusts the accumulated level instead.

Fitting once to the real data gives 0.746. Across the twenty bootstrap histories, alpha ranges from 0.602 to 0.775, and the ensemble average is 0.706. In other words, that single estimate of 0.746 sits near the top of a range the data cannot really distinguish between. The bagged forecast uses the whole range instead of betting everything on one draw.

If you like the algebra, here is why averaging helps. Suppose each ensemble member's forecast error has variance $\sigma^2$ and any two members' errors correlate at $\rho$. The variance of their average across $n$ members is:

$$\mathrm{Var}(\bar{f}) = \rho\sigma^2 + \frac{1 - \rho}{n}\sigma^2$$

Where:

- $\bar{f}$ = the bagged forecast, the average of $n$ individual forecasts
- $\sigma^2$ = the error variance of any one ensemble member
- $\rho$ = how strongly two members' errors move together
- $n$ = the number of bootstrap series

The second term shrinks toward zero as $n$ grows, and the first term does not. So averaging removes the part of the error that is specific to one draw of the data, and leaves the part every member shares. If you are not interested in the math, skip ahead: the practical rule is that bagging cuts the wobble, not the bias.

[KEY INSIGHT]
**Bagging cannot fix a wrong model, it only cuts the variance that came from estimating on one sample.** If every ensemble member is systematically too low, the average is still too low. That is the $\rho\sigma^2$ term, and no amount of extra bootstrap series will touch it.

**Try it:** The `fcs` matrix has one row per future month and one column per bootstrap series. Bag it with the **median** instead of the mean, store the result in `ex_median_bag`, and print the first four months of both side by side.

```r title="Your turn: bag with the median"
# apply() walks a matrix; margin 1 means "down each row"
# ex_median_bag <- apply(fcs, 1, ...)
# your code here

# Then print: round(head(cbind(rowMeans(fcs), ex_median_bag), 4), 1)
# Expected: two columns of very similar numbers
```

<details>
<summary>Click to reveal solution</summary>

```r title="Bag with the median solution"
ex_median_bag <- apply(fcs, 1, median)

round(head(cbind(mean_bag = rowMeans(fcs), median_bag = ex_median_bag), 4), 1)
#>      mean_bag median_bag
#> [1,]    359.6      360.2
#> [2,]    355.0      355.1
#> [3,]    406.4      405.0
#> [4,]    393.6      391.4
```

**Explanation:** `apply(fcs, 1, median)` applies `median()` down each row. The two columns agree to within about one passenger because the twenty forecasts are roughly symmetric with no wild outliers. On messier data with one runaway ensemble member, the median would be the safer choice.

</details>

## Does bagging actually beat a single ETS model?

Everything so far has been mechanism. Now the honest question: does the extra work buy anything? You held back 1959 and 1960, twenty-four months neither model has seen, so you can just score both.

```r title="Score both forecasts on held-out data"
fc_plain <- forecast(ets(train), h = 24)

round(rbind(single_ETS = accuracy(fc_plain, test)["Test set", c("RMSE", "MAPE", "MASE")],
            bagged_ETS = accuracy(fc_bag,   test)["Test set", c("RMSE", "MAPE", "MASE")]), 2)
#>             RMSE  MAPE MASE
#> single_ETS 72.55 13.30 2.21
#> bagged_ETS 52.06  8.98 1.51
```

`accuracy(forecast, actuals)` compares predictions against truth and returns a row of error measures. RMSE is the typical error in passengers, MAPE the typical error as a percentage, and MASE the error relative to a seasonal naive forecast, where anything above 1 means you did worse than simply repeating last year.

The bagged forecast is better on all three. Typical error drops from 72.6 passengers to 52.1, a 28% improvement. MAPE falls from 13.3% to 9.0%. MASE falls from 2.21 to 1.51, meaning both models still trail a seasonal naive benchmark here, but the bagged one trails it by much less.

The reason connects straight back to the previous section. The single fit landed on alpha 0.746, near the top of the plausible range, so it chased the last few noisy months too hard and over-extrapolated. Nineteen of the twenty bootstrap fits landed lower, and averaging pulled the forecast back toward the middle of what the data actually supports.

[NOTE]
**One series is one data point.** A 28% gain on `AirPassengers` is encouraging, not proof. The real evidence is Bergmeir, Hyndman and Benitez (2016), who ran bagged ETS across the 1,428 monthly series of the M3 competition and found consistent accuracy improvements over a single ETS fit. That paper is what put this method into the `forecast` package.

**Try it:** Score the bagged forecast on the first twelve months of the test set only. Slice the forecast with `head(fc_bag$mean, 12)`, rewrap it as a `ts` starting January 1959, and compare against `window(test, end = c(1959, 12))`.

```r title="Your turn: score the first year only"
ex_test12 <- window(test, end = c(1959, 12))

# Slice the first 12 bagged forecasts and rewrap them as a monthly ts
# ex_fc12 <- ts(head(fc_bag$mean, 12), start = c(1959, 1), frequency = 12)
# your code here

# Then print: round(accuracy(ex_fc12, ex_test12)[, c("RMSE", "MAPE")], 2)
# Expected: better than the 24-month numbers, because error grows with horizon
```

<details>
<summary>Click to reveal solution</summary>

```r title="Score the first year solution"
ex_test12 <- window(test, end = c(1959, 12))
ex_fc12   <- ts(head(fc_bag$mean, 12), start = c(1959, 1), frequency = 12)

round(accuracy(ex_fc12, ex_test12)[, c("RMSE", "MAPE")], 2)
#>  RMSE  MAPE 
#> 33.99  6.03
```

**Explanation:** Over twelve months the bagged RMSE is 34.0 against 52.1 over twenty-four. Forecast error grows with horizon, so a model always looks better when scored on a shorter window. Always compare models over the same horizon.

</details>

## Why are the intervals from a bagged model not prediction intervals?

This is the part most tutorials skip, and it is the part most likely to embarrass you in front of stakeholders. `forecast()` on a bagged model returns something that looks exactly like a prediction interval and is not one.

```r title="The bagged interval trap"
fc_bag$level
#> [1] 100

round(head(cbind(lower = fc_bag$lower, point = fc_bag$mean, upper = fc_bag$upper), 3), 1)
#>          lower point upper
#> Jan 1959 345.5 359.6 374.1
#> Feb 1959 342.0 355.0 368.8
#> Mar 1959 391.7 406.4 424.8

round(head(cbind(lower = fc_plain$lower[, "95%"], point = fc_plain$mean,
                 upper = fc_plain$upper[, "95%"]), 3), 1)
#>          lower point upper
#> Jan 1959 319.6 345.5 371.3
#> Feb 1959 309.9 342.0 374.2
#> Mar 1959 348.3 391.7 435.1
```

Compare the two tables. The bagged band for January 1959 runs 345.5 to 374.1, a width of 29 passengers, and it is labelled level 100. The ordinary ETS **95%** band for the same month runs 319.6 to 371.3, a width of 52. A supposedly 100% interval a little over half the width of a 95% interval is a contradiction, and the source code explains why.

Internally, `forecast.baggedModel()` sets `lower` to the minimum and `upper` to the maximum of the ensemble's **point** forecasts, then labels the result level 100. So the band answers "how much do my twenty models disagree with each other?" It says nothing about the noise a future month will actually contain, which is the thing a prediction interval is for.

That also explains a detail you can read off the two tables. The bagged lower bound for January 1959, 345.5, is exactly the plain ETS point forecast for that month. Element one of the bootstrap list is the original series, so one of the twenty ensemble members is the ordinary `ets(train)` fit, and here that member gave the lowest point forecast of the twenty.

[WARNING]
**Never report the bagged band as a prediction interval.** It is the spread of the ensemble's central estimates, not the spread of plausible future outcomes. Because it excludes observation noise entirely, it is always too narrow, and its width shrinks further as you add more bootstrap series.

To get a real interval, you need the future noise back. Simulate future sample paths from each ensemble member, then pool them all and read off percentiles.

```r title="Build real bootstrap prediction intervals"
set.seed(808)
paths <- do.call(cbind, lapply(boot_train, function(s) {
  replicate(10, simulate(ets(s, model = "MAM", damped = FALSE), nsim = 12))
}))
dim(paths)
#> [1]  12 200

boot_pi <- t(apply(paths, 1, quantile, c(0.05, 0.95)))
test12  <- window(test, end = c(1959, 12))
ets12   <- forecast(ets(train, model = "MAM", damped = FALSE), h = 12, level = 90)

round(c(width_bootstrap = mean(boot_pi[, 2] - boot_pi[, 1]),
        width_plain_ets = mean(ets12$upper - ets12$lower),
        cover_bootstrap = mean(test12 >= boot_pi[, 1] & test12 <= boot_pi[, 2]),
        cover_plain_ets = mean(test12 >= ets12$lower  & test12 <= ets12$upper)), 3)
#> width_bootstrap width_plain_ets cover_bootstrap cover_plain_ets 
#>          81.561          72.580           0.917           0.833
```

`simulate()` on a fitted ETS model draws a random future path rather than the average one, so each call returns a different plausible twelve months. Running it ten times per bootstrap series gives 200 paths in total, stacked into a 12-by-200 matrix. `apply(paths, 1, quantile, c(0.05, 0.95))` then reads the 5th and 95th percentile across those 200 futures for each month, giving a 90% interval. `model = "MAM", damped = FALSE` fixes the ETS specification so both approaches use the same model family and the comparison is fair.

Now compare like with like: both intervals below are nominally 90%. The bootstrap band averages 81.6 passengers wide and actually contains 91.7% of the twelve held-out months. The plain ETS band is narrower at 72.6 and contains only 83.3%. Coverage should sit near the nominal 90%, so the bootstrap band is close to honest and the plain one is overconfident.

That is the real argument for the bootstrap here. The standard ETS interval assumes the model form is correct and only accounts for noise. The bootstrap interval also carries the uncertainty about which model and which parameters were right, so it is wider where it should be.

**Try it:** The `paths` matrix already holds 200 simulated futures. Pull the 25th and 75th percentiles out of it into `ex_quartiles` and print the first three months.

```r title="Your turn: get the middle 50% band"
# Same call as boot_pi, but ask quantile() for 0.25 and 0.75
# ex_quartiles <- t(apply(paths, 1, quantile, ...))
# your code here

# Then print: round(head(ex_quartiles, 3), 1)
# Expected: a much narrower band than the 5% to 95% one
```

<details>
<summary>Click to reveal solution</summary>

```r title="Middle 50% band solution"
ex_quartiles <- t(apply(paths, 1, quantile, c(0.25, 0.75)))

round(head(ex_quartiles, 3), 1)
#>        25%   75%
#> [1,] 347.7 368.3
#> [2,] 343.6 364.6
#> [3,] 397.4 423.5
```

**Explanation:** Only the requested percentiles changed. The 25% to 75% band spans about 21 passengers in January against roughly 55 for the 5% to 95% band, which is what you would expect: half the future outcomes fall in a much tighter range than 90% of them.

</details>

## How do you bootstrap and bag the tidy way with fable?

Everything above uses the `forecast` package and base R `ts` objects. The modern tidyverse equivalent is `fable`, which works on `tsibble` objects and expresses the same idea as a pipeline. The advantage shows up when you have many series at once, because a `tsibble` can hold thousands of them keyed by an identifier and the same code handles all of them.

```r title="Generate bootstrap series with fable"
library(tsibble); library(fable); library(feasts); library(dplyr)

ap     <- as_tsibble(AirPassengers) |> rename(Month = index, Passengers = value)
ap_stl <- ap |> model(stl = STL(Passengers))

set.seed(909)
sims <- ap_stl |> generate(new_data = ap, times = 10, bootstrap_block_size = 24)

head(sims, 3)
#> # A tsibble: 3 x 5 [1M]
#> # Key:       .model, .rep [1]
#>   .model .rep     Month Passengers  .sim
#>   <chr>  <chr>    <mth>      <dbl> <dbl>
#> 1 stl    1     1949 Jan        112  103.
#> 2 stl    1     1949 Feb        118  102.
#> 3 stl    1     1949 Mar        132  138.
```

The `|>` symbol is R's native pipe: it feeds the value on its left into the first argument of the function on its right, so `ap |> model(...)` means the same as `model(ap, ...)`. `as_tsibble()` converts the `ts` object into a tidy table with one row per time point. `model(stl = STL(Passengers))` fits the same STL decomposition you did by hand earlier. `generate()` then block-bootstraps the remainder and rebuilds, exactly like `bld.mbb.bootstrap()`, but returns the results stacked in long form with a `.rep` column identifying which bootstrap each row belongs to.

The `.sim` column is the manufactured series. `Passengers` is the original, kept alongside for reference. With `times = 10` this table has 1,440 rows, ten copies of the 144-month history.

Because the ten series are stacked with `.rep` as a key, `fable` fits all ten models in one call.

```r title="Model every simulated series and bag"
bagged_tbl <- sims |>
  select(-.model, -Passengers) |>
  model(ets = ETS(.sim)) |>
  forecast(h = 12) |>
  as_tibble() |>
  group_by(Month) |>
  summarise(bagged = mean(.mean))

head(bagged_tbl, 4)
#> # A tibble: 4 × 2
#>      Month bagged
#>      <mth>  <dbl>
#> 1 1961 Jan   467.
#> 2 1961 Feb   454.
#> 3 1961 Mar   506.
#> 4 1961 Apr   503.
```

Reading the pipeline: `select()` drops the columns that would confuse the model call, `model(ets = ETS(.sim))` fits an ETS to each of the ten simulated series, and `forecast(h = 12)` produces twelve months ahead for each. `as_tibble()` drops the distribution column so plain `dplyr` verbs work, then `group_by(Month) |> summarise(mean(.mean))` averages across the ten forecasts for each month.

That last `summarise()` is the bagging step, written out in full. The `forecast` package hides it inside `baggedETS()`; `fable` leaves it visible, which is why the tidy version is easier to modify. Swap `mean` for `median`, or take quantiles instead, and you have changed the aggregation rule with one word.

[TIP]
**Use fable when you have many series, forecast when you have one.** `baggedETS()` is the shortest path for a single `ts` object. But a `tsibble` keyed by store, region or SKU runs the identical pipeline across every series at once, and that is where the tidy version earns its extra typing.

**Try it:** Generate only 4 bootstrap series instead of 10 into `ex_sims`, then report how many rows it has and how many distinct values are in its `.rep` column.

```r title="Your turn: generate four series"
# Change the times argument from 10 to 4
# ex_sims <- ap_stl |> generate(new_data = ap, times = ..., bootstrap_block_size = 24)
# your code here

# Then print: nrow(ex_sims) and length(unique(ex_sims$.rep))
# Expected: 4 times 144 rows, and 4 distinct reps
```

<details>
<summary>Click to reveal solution</summary>

```r title="Generate four series solution"
set.seed(777)
ex_sims <- ap_stl |> generate(new_data = ap, times = 4, bootstrap_block_size = 24)

nrow(ex_sims)
#> [1] 576
length(unique(ex_sims$.rep))
#> [1] 4
```

**Explanation:** `AirPassengers` has 144 months, so four bootstrap copies stack into 4 times 144 = 576 rows. The `.rep` column takes the values 1 to 4, which is what makes them separate series rather than one long one.

</details>

## How do you choose the block size and the number of series?

Two settings control this whole method, and both have defensible defaults you should understand rather than accept blindly. Start with block size, which you can measure directly: block-resample the remainder at several block sizes and check how much of the original autocorrelation survives.

```r title="Block size versus recovered autocorrelation"
rem <- as.numeric(parts[, "remainder"])

set.seed(1111)
block_tab <- t(sapply(c(1, 6, 12, 24, 48), function(b) {
  c(block_size     = b,
    recovered_acf1 = round(mean(replicate(50, acf(my_mbb(rem, b), 1, plot = FALSE)$acf[2])), 3))
}))

data.frame(block_tab, original_acf1 = round(acf(rem, 1, plot = FALSE)$acf[2], 3))
#>   block_size recovered_acf1 original_acf1
#> 1          1         -0.007         0.371
#> 2          6          0.320         0.371
#> 3         12          0.330         0.371
#> 4         24          0.361         0.371
#> 5         48          0.362         0.371
```

For each candidate block size, this runs `my_mbb()` fifty times, measures the lag-1 autocorrelation of each result, and averages. The `original_acf1` column is the target to hit.

The pattern is clear. A block size of 1 is plain shuffling and recovers nothing, -0.007 against a target of 0.371. By 6 months you recover 0.320, by 24 months 0.361, and going all the way to 48 buys almost nothing more. The curve flattens at two seasonal cycles, which is exactly where `bld.mbb.bootstrap()` sets its default: `2 * frequency(y)`, so 24 for monthly data and 8 for quarterly. If the series has no seasonality at all, `frequency(y)` is 1 and there is no cycle to key the block length to, so the function falls back to 8 months (or half the series length, whichever is smaller).

The second setting is how many bootstrap series to build. More series means a steadier average, and you can watch the steadiness arrive.

```r title="How stable is the bagged forecast?"
set.seed(1212)
stability <- sapply(c(2, 5, 10, 20), function(k) {
  sd(replicate(200, mean(rowMeans(fcs[, sample(20, k, replace = TRUE), drop = FALSE]))))
})

data.frame(n_series = c(2, 5, 10, 20), sd_of_bagged_forecast = round(stability, 2))
#>   n_series sd_of_bagged_forecast
#> 1        2                  7.82
#> 2        5                  4.44
#> 3       10                  3.75
#> 4       20                  2.86
```

For each ensemble size `k`, this draws `k` columns from the twenty available, bags them, then repeats 200 times. The standard deviation of those 200 bagged forecasts measures how much your answer would move if you reran the whole thing with a different random seed.

Bagging just two series leaves 7.82 passengers of seed-to-seed wobble. Twenty series cuts that to 2.86. The gain is steep at first and then flattens, which is the $\frac{1-\rho}{n}\sigma^2$ term from earlier doing its work. Roughly, halving the wobble costs four times the compute.

[TIP]
**Stick with the defaults unless you can measure a reason not to.** The package uses 100 bootstrap series and a block size of twice the seasonal period. At 100 series the seed-to-seed wobble is already small relative to forecast error, and pushing to 500 costs five times the runtime for a change you will not see in your accuracy metrics.

**Try it:** Add a block size of 36 to the comparison. Build a small table with just block sizes 24 and 36 and report the recovered autocorrelation for each.

```r title="Your turn: test a 36-month block"
# Reuse the block_tab code but pass c(24, 36) as the vector of block sizes
# ex_block_tab <- t(sapply(c(24, ...), function(b) { ... }))
# your code here

# Then print ex_block_tab
# Expected: 36 barely improves on 24
```

<details>
<summary>Click to reveal solution</summary>

```r title="36-month block solution"
set.seed(555)
ex_block_tab <- t(sapply(c(24, 36), function(b) {
  c(block_size     = b,
    recovered_acf1 = round(mean(replicate(50, acf(my_mbb(rem, b), 1, plot = FALSE)$acf[2])), 3))
}))
ex_block_tab
#>      block_size recovered_acf1
#> [1,]         24          0.365
#> [2,]         36          0.368

```

**Explanation:** Going from 24 to 36 months moves recovered autocorrelation from 0.365 to 0.368, a rounding error. Longer blocks also mean fewer distinct blocks to draw from, so the ensemble gets less varied for no measurable gain in structure.

</details>

### When bagging does not help at all

Bagging is not free and it is not universal. It costs one model fit per bootstrap series, so 100 series means 100 fits, and the payoff depends entirely on how much of your forecast error came from estimation wobble rather than from the model being wrong. Here is a series where it does not pay.

```r title="A series where bagging loses"
tr <- window(USAccDeaths, end = c(1977, 12))
te <- window(USAccDeaths, start = c(1978, 1))

set.seed(1414)
plain_us <- forecast(ets(tr), h = 12)
bag_us   <- forecast(baggedETS(tr, bld.mbb.bootstrap(tr, 20)), h = 12)

round(rbind(single_ETS = accuracy(plain_us, te)["Test set", c("RMSE", "MAPE", "MASE")],
            bagged_ETS = accuracy(bag_us,   te)["Test set", c("RMSE", "MAPE", "MASE")]), 2)
#>              RMSE MAPE MASE
#> single_ETS 289.62 2.66 0.48
#> bagged_ETS 316.60 2.73 0.50
```

The setup is identical to the `AirPassengers` test: fit on everything up to 1977, forecast the twelve months of 1978, score against reality. The only difference is the data.

Bagging loses here. RMSE rises from 289.6 to 316.6 and MASE from 0.48 to 0.50. Look at that MASE: the single ETS was already less than half the error of a seasonal naive benchmark, meaning it fit this series extremely well. There was very little estimation wobble to average away, so bagging spent twenty model fits to add a small amount of noise.

The pattern behind both results is the same. `USAccDeaths` is short, six years of very regular data with a stable July peak. `AirPassengers` is twelve years with a growing trend and multiplicative seasonality, where the choice of damping and the smoothing weights genuinely matter and a single fit can land badly.

![A quick check for whether bagging is likely to pay for its runtime](screenshots/Bootstrap-Forecasting-in-R-when-to-bag.webp)

*Figure 4: A quick check for whether bagging is likely to pay for its runtime.*

[KEY INSIGHT]
**Bagging pays where model uncertainty is large.** Long, seasonal, awkwardly-shaped series where you would struggle to defend one model choice over another are exactly where averaging helps. Short, clean, obviously-one-model series have nothing to average away, and the honest answer is to fit once and move on.

**Try it:** Try a third series. `nottem` is monthly air temperature at Nottingham Castle from 1920 to 1939. Fit on everything up to 1937, then forecast 24 months and score both approaches.

```r title="Your turn: does bagging win on nottem?"
# Copy the USAccDeaths block above and swap in nottem
# ex_tr <- window(nottem, end = c(1937, 12))
# ex_te <- window(nottem, start = c(1938, 1))
# ex_bag <- forecast(baggedETS(ex_tr, bld.mbb.bootstrap(ex_tr, 20)), h = 24)
# your code here

# Then score ex_plain and ex_bag against ex_te with accuracy()
# Expected: the two are almost tied
```

<details>
<summary>Click to reveal solution</summary>

```r title="Nottem comparison solution"
ex_tr <- window(nottem, end = c(1937, 12))
ex_te <- window(nottem, start = c(1938, 1))

set.seed(666)
ex_plain <- forecast(ets(ex_tr), h = 24)
ex_bag   <- forecast(baggedETS(ex_tr, bld.mbb.bootstrap(ex_tr, 20)), h = 24)

round(rbind(single_ETS = accuracy(ex_plain, ex_te)["Test set", c("RMSE", "MASE")],
            bagged_ETS = accuracy(ex_bag,   ex_te)["Test set", c("RMSE", "MASE")]), 3)
#>             RMSE  MASE
#> single_ETS 2.278 0.601
#> bagged_ETS 2.251 0.598
```

**Explanation:** Bagging wins by about 1%, essentially a tie. `nottem` is temperature data with a rock-solid annual cycle and no trend, so there is almost no ambiguity about the right model and almost nothing for averaging to fix. That is the middle of the three cases: no harm done, no real gain either.

</details>

## Complete Example: bootstrap, bag, and score in one pass

Here is the whole method wrapped into one reusable function. Hand it a series and a horizon, and it splits, bootstraps, bags, and scores both approaches so you can decide whether bagging earns its runtime on your data.

```r title="A reusable bag-and-score function"
bag_and_score <- function(y, h, n_boot = 20, seed = 1) {
  n     <- length(y)
  tr    <- subset(y, end = n - h)          # everything except the last h points
  te    <- subset(y, start = n - h + 1)    # the last h points, held back

  set.seed(seed)
  boots <- bld.mbb.bootstrap(tr, n_boot)   # manufacture the alternative histories
  plain <- forecast(ets(tr), h = h)                                   # one model
  bag   <- forecast(baggedETS(tr, bootstrapped_series = boots), h = h) # n_boot models

  round(rbind(single_ETS = accuracy(plain, te)["Test set", c("RMSE", "MAPE", "MASE")],
              bagged_ETS = accuracy(bag,   te)["Test set", c("RMSE", "MAPE", "MASE")]), 2)
}

bag_and_score(AirPassengers, h = 24, n_boot = 20, seed = 707)
#>             RMSE  MAPE MASE
#> single_ETS 72.55 13.30 2.21
#> bagged_ETS 52.06  8.98 1.51
```

The function does four things in order. `subset()` splits the series into a training portion and the last `h` points held back for scoring. `bld.mbb.bootstrap()` builds `n_boot` alternative histories from the training portion only, so nothing from the test period leaks in. Then it fits one plain `ets()` and one `baggedETS()`, and `accuracy()` scores both against the held-back truth.

The numbers reproduce the earlier result exactly, because the same seed produces the same twenty bootstrap series. That reproducibility is the point of the `seed` argument: rerun it with `seed = 999` and the numbers will shift slightly, which tells you how much of any apparent improvement is real and how much is luck. Point this at your own series before committing to bagging in production.

## Practice Exercises

### Exercise 1: Report the ensemble spread

Write a function `my_boot_spread(y, n_boot, h, seed)` that bootstraps `y` into `n_boot` series, fits `ets(s, model = "MAM", damped = FALSE)` to each, forecasts `h` steps, and returns the min, mean and max of the ensemble's forecast for step `h`. Run it on `train` with 20 series, `h = 1` and `seed = 88`.

```r title="Exercise 1 starter"
# Hint: set.seed(seed), then bld.mbb.bootstrap(y, n_boot)
# Hint: sapply over that list and grab $mean[h] from each forecast
# Hint: return c(min = ..., mean = ..., max = ...)

# my_boot_spread <- function(y, n_boot, h = 1, seed = 1) { ... }
# Write your code below:

# Then run: round(my_boot_spread(train, n_boot = 20, h = 1, seed = 88), 1)
```

<details>
<summary>Click to reveal solution</summary>

```r title="Ensemble spread solution"
my_boot_spread <- function(y, n_boot, h = 1, seed = 1) {
  set.seed(seed)
  boots <- bld.mbb.bootstrap(y, n_boot)
  ends  <- sapply(boots, function(s) {
    forecast(ets(s, model = "MAM", damped = FALSE), h = h)$mean[h]
  })
  c(min = min(ends), mean = mean(ends), max = max(ends))
}

round(my_boot_spread(train, n_boot = 20, h = 1, seed = 88), 1)
#>   min  mean   max 
#> 340.2 357.0 376.0
```

**Explanation:** `sapply()` returns one number per bootstrap series, the step-`h` point forecast. The twenty models disagree by 36 passengers about a single month, from 340.2 to 376.0, which is the estimation uncertainty bagging averages over. This min-to-max range is precisely what `forecast.baggedModel()` mislabels as a level-100 interval.

</details>

### Exercise 2: Bag with ARIMA instead of ETS

`baggedETS()` is a thin wrapper around `baggedModel()`, which accepts any forecasting function through its `fn` argument. Build a bagged forecast on `train` using `auto.arima` instead of `ets`, with 10 bootstrap series and `set.seed(999)`, then score it on `test`.

```r title="Exercise 2 starter"
# Hint: baggedModel(y, bootstrapped_series = ..., fn = auto.arima)
# Hint: then forecast(my_arima_bag, h = 24) as usual
# Note: this fits 10 ARIMA models and takes noticeably longer than ETS

# set.seed(999)
# my_arima_bag <- baggedModel(...)
# my_arima_fc  <- forecast(...)
# Write your code below:

# Then score it: accuracy(my_arima_fc, test)["Test set", c("RMSE", "MAPE", "MASE")]
```

<details>
<summary>Click to reveal solution</summary>

```r title="Bagged ARIMA solution"
set.seed(999)
my_arima_bag <- baggedModel(train,
                            bootstrapped_series = bld.mbb.bootstrap(train, 10),
                            fn = auto.arima)
my_arima_fc  <- forecast(my_arima_bag, h = 24)

round(rbind(bagged_ARIMA = accuracy(my_arima_fc, test)["Test set", c("RMSE", "MAPE", "MASE")]), 2)
#>               RMSE MAPE MASE
#> bagged_ARIMA 50.67 8.71 1.47
```

**Explanation:** `fn = auto.arima` swaps the model family without touching the bootstrap machinery, because the bootstrap knows nothing about what will be fitted to its output. Bagged ARIMA scores RMSE 50.67 here, slightly ahead of bagged ETS at 52.06 and well ahead of the single ETS at 72.55. The cost is runtime: `auto.arima` searches a larger model space than `ets`, so ten ARIMA fits take longer than twenty ETS fits.

</details>

### Exercise 3: Measure the coverage of an 80% bootstrap interval

Using the `boot_train` ensemble already in your session, simulate 10 future paths from each of the 20 bootstrap series (12 months each), extract an 80% interval from the pooled paths, and report both the average width and the share of the twelve held-out months of 1959 that fall inside it. Use `set.seed(1500)`.

```r title="Exercise 3 starter"
# Hint: an 80% interval is the 10th to 90th percentile
# Hint: simulate(fit, nsim = 12) draws one random future path
# Hint: reuse the paths code from the intervals section, then change the quantiles

# set.seed(1500)
# my_paths <- do.call(cbind, lapply(boot_train, ...))
# my_pi    <- t(apply(my_paths, 1, quantile, ...))
# my_test  <- window(test, end = c(1959, 12))
# Write your code below:

# Then report mean(my_pi[, 2] - my_pi[, 1]) and the share of my_test inside the band
```

<details>
<summary>Click to reveal solution</summary>

```r title="80% interval coverage solution"
set.seed(1500)
my_paths <- do.call(cbind, lapply(boot_train, function(s) {
  replicate(10, simulate(ets(s, model = "MAM", damped = FALSE), nsim = 12))
}))
my_pi   <- t(apply(my_paths, 1, quantile, c(0.10, 0.90)))
my_test <- window(test, end = c(1959, 12))

round(c(mean_width = mean(my_pi[, 2] - my_pi[, 1]),
        coverage   = mean(my_test >= my_pi[, 1] & my_test <= my_pi[, 2])), 3)
#> mean_width   coverage 
#>     70.034      0.917
```

**Explanation:** The 80% band averages 70.0 passengers wide and captures 91.7% of the twelve test months, so it is conservative here: it covers more than the 80% advertised. Twelve months is a small sample, so a single extra hit moves coverage by 8 percentage points. Judging interval quality properly needs many origins, not one.

</details>

## Frequently asked questions

**Is bagging the same as combining different models?** No. Combining averages forecasts from genuinely different model families, an ETS plus an ARIMA plus a neural net, on the same data. Bagging averages the same model family fitted to many perturbed copies of the data. Combining targets model-form error; bagging targets estimation error. They stack well together.

**How many bootstrap series should I use?** Start at the default of 100. The stability table above shows the seed-to-seed wobble falling steeply up to roughly 20 series and then flattening, so anything past 100 buys precision you will not detect in your accuracy metrics while multiplying runtime.

**Does this work with ARIMA?** Yes. `baggedModel(y, fn = auto.arima)` swaps the model family while keeping the same bootstrap, and Exercise 2 scores it. The bootstrap does not care what you fit to its output.

**Why is the first element returned by bld.mbb.bootstrap() identical to my data?** By design. Element one is the original series and elements two onward are bootstraps, so the ensemble always includes the real history. Index from `[[2]]` if you want only the manufactured ones.

**Is it worth the compute?** Bagging costs one model fit per bootstrap series. On a single monthly series with 100 replications that is seconds to a minute; across ten thousand SKUs it is an infrastructure decision. Run `bag_and_score()` on a handful of representative series first and only roll it out where it measurably wins.

## Summary

| Concept | Function | The rule |
|---|---|---|
| Plain bootstrap | `sample(x, replace = TRUE)` | Fine for independent values, destroys a time series |
| Moving block bootstrap | `bld.mbb.bootstrap()` | Resample runs, not points, so autocorrelation survives |
| Variance stabilisation | `BoxCox()` and `BoxCox.lambda()` | Makes early and late noise the same size before resampling |
| Structure quarantine | `stl()` | Only the remainder gets shuffled, trend and season are added back |
| Bagging | `baggedETS()`, `baggedModel()` | Average the point forecasts across the ensemble |
| Bagged "interval" | `fc$lower`, `fc$upper` | Ensemble min and max, **not** a prediction interval |
| Real bootstrap interval | `simulate()` plus `quantile()` | Pool many simulated paths, then read percentiles |
| Tidy equivalent | `generate(bootstrap_block_size =)` | Same method in `fable`, scales to many keyed series |
| Block size | `2 * frequency(y)` | Two seasonal cycles; longer buys nothing measurable |
| Ensemble size | 100 series | Wobble falls like one over the square root of n, then flattens |
| When it pays | Long seasonal series | Big gains where the model choice is genuinely uncertain |
| When it does not | Short clean series | Nothing to average away; fit once and move on |

## References

1. Bergmeir, C., Hyndman, R. J., and Benitez, J. M. (2016). Bagging Exponential Smoothing Methods using STL Decomposition and Box-Cox Transformation. *International Journal of Forecasting*, 32(2), 303-312. The paper this method comes from, with the M3 results quoted above. [Link](https://robjhyndman.com/publications/bagging-ets/)
2. Hyndman, R. J. and Athanasopoulos, G. *Forecasting: Principles and Practice*, 3rd edition, Section 12.5: Bootstrapping and bagging. The textbook treatment, in the `fable` syntax used in the tidy section. [Link](https://otexts.com/fpp3/bootstrap.html)
3. Hyndman, R. J. and Athanasopoulos, G. *Forecasting: Principles and Practice*, 2nd edition, Section 11.4. The same material written against `bld.mbb.bootstrap()` and `baggedETS()`. [Link](https://otexts.com/fpp2/bootstrap.html)
4. forecast package reference: `baggedModel()` and `baggedETS()`. Argument-level documentation, including the `fn` argument used in Exercise 2. [Link](https://pkg.robjhyndman.com/forecast/reference/baggedModel.html)
5. forecast package reference: `bld.mbb.bootstrap()`. Where the `block_size` default and the returned list structure are documented. [Link](https://rdrr.io/cran/forecast/man/bld.mbb.bootstrap.html)
6. Kunsch, H. R. (1989). The Jackknife and the Bootstrap for General Stationary Observations. *The Annals of Statistics*, 17(3), 1217-1241. The original moving block bootstrap. [Link](https://projecteuclid.org/journals/annals-of-statistics/volume-17/issue-3/The-Jackknife-and-the-Bootstrap-for-General-Stationary-Observations/10.1214/aos/1176347265.full)
7. Cleveland, R. B., Cleveland, W. S., McRae, J. E., and Terpenning, I. (1990). STL: A Seasonal-Trend Decomposition Procedure Based on Loess. *Journal of Official Statistics*, 6(1), 3-73. The decomposition that isolates the remainder before any resampling happens. [Link](https://www.scb.se/contentassets/ca21efb41fee47d293bbee5bf7be7fb3/stl-a-seasonal-trend-decomposition-procedure-based-on-loess.pdf)
8. fabletools reference: `generate.mdl_df()`, the tidy bootstrap entry point. Documents `times` and `bootstrap_block_size`. [Link](https://fabletools.tidyverts.org/reference/generate.mdl_df.html)

## Continue Learning

- [ETS Models in R: Error, Trend, and Seasonal Components](ETS-Models-in-R.html) explains the model that sits inside every bagged ensemble on this page, and what M, A and Ad actually mean.
- [Prediction Intervals in R: Quantify Forecast Uncertainty](Prediction-Intervals-in-R.html) goes deeper on what a prediction interval is supposed to cover, which is the distinction the bagged interval trap turns on.
- [Combining Forecasts in R: Ensemble Averaging](Combining-Forecasts-in-R.html) covers the other kind of averaging, across different model families rather than across bootstrapped data.

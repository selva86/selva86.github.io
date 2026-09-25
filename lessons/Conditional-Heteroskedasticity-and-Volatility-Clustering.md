---
title: "Volatility Modeling with ARCH and GARCH Lesson 1: Conditional heteroskedasticity and volatility clustering"
catalog_blurb: "Why return volatility comes in runs, and what that does to forecast intervals."
description: "Find volatility clustering in DAX returns with the ACF of squared returns, and see why a constant-variance 95% interval is too wide when volatility is low."
keywords: "conditional heteroskedasticity, volatility clustering, ACF of squared returns, rolling standard deviation, DAX returns, prediction interval coverage, ARCH effects, financial time series, R"
post_type: "LESSON"
curriculum_id: "5.100.1"
webr: true
mathjax: true
lesson_access: "pro"
course_id: "ts-volatility"
course_title: "Volatility Modeling with ARCH and GARCH"
course_lesson: "1"
course_total: "6"
course_landing: "Volatility-Modeling-ARCH-and-GARCH-Course.html"
course_next: "ARCH-Models.html"
course_prev: ""
---

=== step === cover
## Conditional heteroskedasticity and volatility clustering

Today let's understand why the size of the daily swings in a stock index keeps changing over time, and what that does to the forecasts we make from it.

Our running example is the DAX, the main stock index of the German market. Each trading day the index closes at some level, and that day's return is the percent change from the previous close. Below are 260 consecutive daily returns of the DAX, from late 1996 to late 1997.

::widget chart-plotter {"data": [{"x":1,"y":-0.07},{"x":2,"y":1.22},{"x":3,"y":0.24},{"x":4,"y":0.50},{"x":5,"y":0.58},{"x":6,"y":-1.15},{"x":7,"y":0.46},{"x":8,"y":-0.56},{"x":9,"y":-0.03},{"x":10,"y":0.15},{"x":11,"y":1.11},{"x":12,"y":0.29},{"x":13,"y":-0.53},{"x":14,"y":1.27},{"x":15,"y":0.67},{"x":16,"y":0.16},{"x":17,"y":1.64},{"x":18,"y":-0.69},{"x":19,"y":0.47},{"x":20,"y":-2.16},{"x":21,"y":1.32},{"x":22,"y":0.72},{"x":23,"y":-1.91},{"x":24,"y":0.37},{"x":25,"y":-1.10},{"x":26,"y":0.90},{"x":27,"y":-1.16},{"x":28,"y":0.20},{"x":29,"y":0.38},{"x":30,"y":0.38},{"x":31,"y":0.30},{"x":32,"y":0.00},{"x":33,"y":0.00},{"x":34,"y":0.00},{"x":35,"y":0.53},{"x":36,"y":0.73},{"x":37,"y":0.00},{"x":38,"y":0.00},{"x":39,"y":-2.08},{"x":40,"y":1.49},{"x":41,"y":0.94},{"x":42,"y":-0.48},{"x":43,"y":0.96},{"x":44,"y":1.12},{"x":45,"y":-0.71},{"x":46,"y":1.40},{"x":47,"y":0.74},{"x":48,"y":-0.08},{"x":49,"y":0.65},{"x":50,"y":0.36},{"x":51,"y":-0.26},{"x":52,"y":0.05},{"x":53,"y":0.86},{"x":54,"y":0.35},{"x":55,"y":-1.82},{"x":56,"y":0.33},{"x":57,"y":1.19},{"x":58,"y":-1.01},{"x":59,"y":0.69},{"x":60,"y":0.63},{"x":61,"y":0.88},{"x":62,"y":0.09},{"x":63,"y":1.53},{"x":64,"y":0.32},{"x":65,"y":1.16},{"x":66,"y":0.77},{"x":67,"y":0.18},{"x":68,"y":0.61},{"x":69,"y":1.42},{"x":70,"y":-0.24},{"x":71,"y":0.34},{"x":72,"y":-0.91},{"x":73,"y":-0.68},{"x":74,"y":-0.37},{"x":75,"y":0.21},{"x":76,"y":-0.73},{"x":77,"y":1.64},{"x":78,"y":0.36},{"x":79,"y":0.85},{"x":80,"y":-0.35},{"x":81,"y":-0.07},{"x":82,"y":2.62},{"x":83,"y":0.90},{"x":84,"y":0.62},{"x":85,"y":0.67},{"x":86,"y":0.21},{"x":87,"y":0.12},{"x":88,"y":-1.43},{"x":89,"y":-0.43},{"x":90,"y":1.08},{"x":91,"y":-1.99},{"x":92,"y":-1.43},{"x":93,"y":0.49},{"x":94,"y":-1.79},{"x":95,"y":1.27},{"x":96,"y":0.43},{"x":97,"y":2.17},{"x":98,"y":1.89},{"x":99,"y":-0.92},{"x":100,"y":0.00},{"x":101,"y":0.00},{"x":102,"y":-3.78},{"x":103,"y":-2.17},{"x":104,"y":0.06},{"x":105,"y":0.70},{"x":106,"y":3.27},{"x":107,"y":-0.44},{"x":108,"y":1.09},{"x":109,"y":-0.36},{"x":110,"y":-1.00},{"x":111,"y":-0.66},{"x":112,"y":2.15},{"x":113,"y":-0.65},{"x":114,"y":0.43},{"x":115,"y":-0.02},{"x":116,"y":-0.98},{"x":117,"y":0.61},{"x":118,"y":0.54},{"x":119,"y":0.88},{"x":120,"y":-1.15},{"x":121,"y":0.46},{"x":122,"y":1.56},{"x":123,"y":0.36},{"x":124,"y":0.00},{"x":125,"y":1.53},{"x":126,"y":2.11},{"x":127,"y":-0.48},{"x":128,"y":-0.31},{"x":129,"y":0.00},{"x":130,"y":-0.12},{"x":131,"y":1.68},{"x":132,"y":-0.95},{"x":133,"y":0.82},{"x":134,"y":-0.66},{"x":135,"y":0.12},{"x":136,"y":0.00},{"x":137,"y":-1.50},{"x":138,"y":2.37},{"x":139,"y":-0.70},{"x":140,"y":1.29},{"x":141,"y":1.31},{"x":142,"y":-0.11},{"x":143,"y":-1.07},{"x":144,"y":0.24},{"x":145,"y":-2.02},{"x":146,"y":0.94},{"x":147,"y":1.63},{"x":148,"y":-0.11},{"x":149,"y":0.90},{"x":150,"y":0.43},{"x":151,"y":-0.87},{"x":152,"y":0.07},{"x":153,"y":0.02},{"x":154,"y":1.76},{"x":155,"y":0.41},{"x":156,"y":-0.06},{"x":157,"y":-0.77},{"x":158,"y":0.25},{"x":159,"y":1.25},{"x":160,"y":0.29},{"x":161,"y":-1.05},{"x":162,"y":0.33},{"x":163,"y":1.54},{"x":164,"y":0.02},{"x":165,"y":-0.27},{"x":166,"y":-1.14},{"x":167,"y":1.79},{"x":168,"y":0.85},{"x":169,"y":1.85},{"x":170,"y":0.18},{"x":171,"y":1.42},{"x":172,"y":0.67},{"x":173,"y":-0.08},{"x":174,"y":-0.66},{"x":175,"y":1.82},{"x":176,"y":1.65},{"x":177,"y":-0.06},{"x":178,"y":2.01},{"x":179,"y":-0.47},{"x":180,"y":-1.73},{"x":181,"y":0.19},{"x":182,"y":3.74},{"x":183,"y":2.01},{"x":184,"y":-1.48},{"x":185,"y":1.11},{"x":186,"y":0.72},{"x":187,"y":-0.51},{"x":188,"y":1.83},{"x":189,"y":-1.20},{"x":190,"y":-1.57},{"x":191,"y":-0.80},{"x":192,"y":0.54},{"x":193,"y":0.88},{"x":194,"y":1.45},{"x":195,"y":-1.96},{"x":196,"y":-0.21},{"x":197,"y":1.02},{"x":198,"y":-3.26},{"x":199,"y":-0.98},{"x":200,"y":-2.85},{"x":201,"y":0.07},{"x":202,"y":2.66},{"x":203,"y":1.46},{"x":204,"y":-1.11},{"x":205,"y":-2.76},{"x":206,"y":-0.33},{"x":207,"y":-2.06},{"x":208,"y":-0.04},{"x":209,"y":-2.40},{"x":210,"y":0.57},{"x":211,"y":2.07},{"x":212,"y":3.09},{"x":213,"y":-1.59},{"x":214,"y":0.77},{"x":215,"y":-0.48},{"x":216,"y":1.40},{"x":217,"y":-0.65},{"x":218,"y":-1.88},{"x":219,"y":-3.48},{"x":220,"y":-2.44},{"x":221,"y":1.90},{"x":222,"y":3.21},{"x":223,"y":-0.63},{"x":224,"y":0.84},{"x":225,"y":-0.53},{"x":226,"y":2.82},{"x":227,"y":-0.12},{"x":228,"y":1.44},{"x":229,"y":-1.11},{"x":230,"y":0.73},{"x":231,"y":-0.45},{"x":232,"y":0.93},{"x":233,"y":2.57},{"x":234,"y":0.07},{"x":235,"y":0.00},{"x":236,"y":1.40},{"x":237,"y":-0.35},{"x":238,"y":-1.02},{"x":239,"y":-2.07},{"x":240,"y":-0.37},{"x":241,"y":1.45},{"x":242,"y":-0.24},{"x":243,"y":-1.11},{"x":244,"y":-0.45},{"x":245,"y":-2.46},{"x":246,"y":0.49},{"x":247,"y":2.50},{"x":248,"y":-1.15},{"x":249,"y":-3.67},{"x":250,"y":0.13},{"x":251,"y":-2.80},{"x":252,"y":-6.01},{"x":253,"y":4.32},{"x":254,"y":-1.53},{"x":255,"y":0.13},{"x":256,"y":2.48},{"x":257,"y":-1.65},{"x":258,"y":1.48},{"x":259,"y":-0.72},{"x":260,"y":-2.62}], "geoms": ["line", "point"], "x": "day", "y": "return_pct", "code": {"line": "ggplot(dax_window, aes(day, return_pct)) +\n  geom_line()", "point": "ggplot(dax_window, aes(day, return_pct)) +\n  geom_point()"}}

Compare the two ends of the plot. In the first 60 days the returns have a standard deviation of 0.879, and no day moves more than 2.16 percent in either direction. In the last 60 days the standard deviation is 1.952, and the returns swing much further, from -6.01 on day 252 to 4.32 on day 253.

=== step === concept
## From closing prices to daily returns

The DAX prices come with R. The built-in `EuStockMarkets` dataset holds the daily closing prices of four European stock indices from 1991 to 1998, and we take its DAX column.

We work with returns instead of prices. The daily log return, in percent, is

\[ r_t = 100 \times \left( \log P_t - \log P_{t-1} \right) \]

where \(P_t\) is the closing price on day \(t\). For small moves it is almost the same as the percent change from one close to the next. Unlike a change in index points, it means the same thing at any level of the index.

The code below computes the returns and prints the first few prices and returns.

```r
# Turn the DAX closing prices into daily log returns in percent
dax_price <- as.numeric(EuStockMarkets[, "DAX"])
dax_ret <- 100 * diff(log(dax_price))
length(dax_price)
#> [1] 1860
range(dax_price)
#> [1] 1402.34 6186.09
head(dax_price, 4)
#> [1] 1628.75 1613.63 1606.51 1621.04
round(head(dax_ret, 4), 3)
#> [1] -0.933 -0.442  0.900 -0.178
```

The first price fell from 1,628.75 to 1,613.63, so the first return is -0.933, a fall of about 0.9 percent. There are 1,860 prices but only 1,859 returns, because the first price has no day before it.

Here are the mean, standard deviation, smallest and largest return.

```r
# Summarise the daily returns
round(c(mean = mean(dax_ret), sd = sd(dax_ret), min = min(dax_ret), max = max(dax_ret)), 3)
#>   mean     sd    min    max 
#>  0.065  1.030 -9.628  5.076 
length(dax_ret)
#> [1] 1859
```

The mean daily return is 0.065 percent, which is small next to a standard deviation of 1.030. The worst day was a fall of 9.628 percent and the best day a rise of 5.076 percent.

The plot has the prices on top and the returns below, with a dashed line at the mean return.

```r
# Plot the prices above and the daily returns below
par(mfrow = c(2, 1), mar = c(4, 4, 2, 1))
plot(dax_price, type = "l", xlab = "trading day", ylab = "DAX index level")
plot(dax_ret, type = "l", xlab = "trading day", ylab = "daily return (%)")
abline(h = mean(dax_ret), lty = 2)
```

The prices trend upward, so there is no fixed level they move around. The returns move around their mean of 0.065, the dashed line close to 0. That makes them the series we can describe with a mean and a variance.

=== step === concept
## Rolling volatility over 60 trading days

Volatility is how widely the returns spread out, and it is measured as the standard deviation of the returns. So far we have one standard deviation for the whole series, 1.030. But is the spread the same everywhere in the series?

To find out, we compute the standard deviation over a moving window: days 1 to 60, then days 2 to 61, then days 3 to 62, and so on to the end. This is a rolling standard deviation, and 60 trading days is about three months. The 1,859 returns give 1,800 windows.

```r
# Compute the standard deviation of every 60-day window of returns
win_len <- 60
n_windows <- length(dax_ret) - win_len + 1
rolling_sd <- sapply(1:n_windows, function(i) sd(dax_ret[i:(i + win_len - 1)]))
n_windows
#> [1] 1800
round(c(min = min(rolling_sd), median = median(rolling_sd), max = max(rolling_sd)), 3)
#>    min median    max 
#>  0.478  0.879  1.987 
round(max(rolling_sd) / min(rolling_sd), 1)
#> [1] 4.2
```

Across the 1,800 windows the standard deviation runs from 0.478 up to 1.987, with a median of 0.879. The most volatile window is 4.2 times as volatile as the calmest one.

Next we find where those two windows start, and in which year.

```r
# Find where the calmest and the most volatile 60-day windows start, and in which year
low_start <- which.min(rolling_sd)
high_start <- which.max(rolling_sd)
c(low_start = low_start, high_start = high_start)
#>  low_start high_start 
#>       1323       1597 
round(time(EuStockMarkets)[c(low_start, high_start) + 1], 1)
#> [1] 1996.6 1997.6
```

The calmest window starts on day 1,323 and the most volatile on day 1,597. The dataset counts trading days as fractions of a year, so 1996.6 is about 60 percent of the way through 1996. The `+ 1` in the code matches each return to the date of the price that produced it.

The plot shows the returns above and their 60-day standard deviation below. The dashed line marks the 1.030 of the whole series, and the two dots mark the calmest and the most volatile window.

```r
# Plot the returns and their 60-day rolling standard deviation
par(mfrow = c(2, 1), mar = c(4, 4, 2, 1))
plot(dax_ret, type = "l", xlab = "trading day", ylab = "daily return (%)")
plot(rolling_sd, type = "l", xlab = "first trading day of the 60-day window", ylab = "standard deviation (%)")
abline(h = sd(dax_ret), lty = 2)
points(c(low_start, high_start), rolling_sd[c(low_start, high_start)], pch = 19)
```

The rolling standard deviation stays low for a long run of windows, then rises and stays high. Neighbouring windows share 59 of their 60 returns, so the line is smooth by construction. What matters is how far it travels, from 0.478 to 1.987.

This pattern has a name: **volatility clustering**. Large moves tend to be followed by large moves, and small moves by small ones, of either sign.

=== step === widget
## The lowest and the highest 60-day volatility side by side

The chart below puts the 60 returns of the calmest window and the 60 returns of the most volatile window on the same axes. Switch between the points and the boxplot, where each box holds the middle half of the returns.

We call these two sets of 60 returns the low volatility stretch and the high volatility stretch.

::widget chart-plotter {"data": [{"x":1,"y":0.22,"fill":"low volatility"},{"x":2,"y":0.20,"fill":"low volatility"},{"x":3,"y":0.11,"fill":"low volatility"},{"x":4,"y":-0.22,"fill":"low volatility"},{"x":5,"y":0.99,"fill":"low volatility"},{"x":6,"y":0.51,"fill":"low volatility"},{"x":7,"y":0.64,"fill":"low volatility"},{"x":8,"y":0.01,"fill":"low volatility"},{"x":9,"y":0.29,"fill":"low volatility"},{"x":10,"y":0.54,"fill":"low volatility"},{"x":11,"y":-0.27,"fill":"low volatility"},{"x":12,"y":-0.07,"fill":"low volatility"},{"x":13,"y":-0.15,"fill":"low volatility"},{"x":14,"y":0.65,"fill":"low volatility"},{"x":15,"y":-0.04,"fill":"low volatility"},{"x":16,"y":-0.07,"fill":"low volatility"},{"x":17,"y":0.99,"fill":"low volatility"},{"x":18,"y":-0.46,"fill":"low volatility"},{"x":19,"y":0.23,"fill":"low volatility"},{"x":20,"y":-1.09,"fill":"low volatility"},{"x":21,"y":0.98,"fill":"low volatility"},{"x":22,"y":0.11,"fill":"low volatility"},{"x":23,"y":-0.30,"fill":"low volatility"},{"x":24,"y":0.36,"fill":"low volatility"},{"x":25,"y":-0.27,"fill":"low volatility"},{"x":26,"y":-0.31,"fill":"low volatility"},{"x":27,"y":-0.56,"fill":"low volatility"},{"x":28,"y":0.15,"fill":"low volatility"},{"x":29,"y":-0.38,"fill":"low volatility"},{"x":30,"y":-0.10,"fill":"low volatility"},{"x":31,"y":0.25,"fill":"low volatility"},{"x":32,"y":0.40,"fill":"low volatility"},{"x":33,"y":0.27,"fill":"low volatility"},{"x":34,"y":0.74,"fill":"low volatility"},{"x":35,"y":0.00,"fill":"low volatility"},{"x":36,"y":0.75,"fill":"low volatility"},{"x":37,"y":1.02,"fill":"low volatility"},{"x":38,"y":0.60,"fill":"low volatility"},{"x":39,"y":-0.14,"fill":"low volatility"},{"x":40,"y":-0.20,"fill":"low volatility"},{"x":41,"y":0.16,"fill":"low volatility"},{"x":42,"y":0.61,"fill":"low volatility"},{"x":43,"y":-0.66,"fill":"low volatility"},{"x":44,"y":0.73,"fill":"low volatility"},{"x":45,"y":0.74,"fill":"low volatility"},{"x":46,"y":0.07,"fill":"low volatility"},{"x":47,"y":-0.19,"fill":"low volatility"},{"x":48,"y":-0.16,"fill":"low volatility"},{"x":49,"y":-0.04,"fill":"low volatility"},{"x":50,"y":1.16,"fill":"low volatility"},{"x":51,"y":0.00,"fill":"low volatility"},{"x":52,"y":0.70,"fill":"low volatility"},{"x":53,"y":0.04,"fill":"low volatility"},{"x":54,"y":-0.10,"fill":"low volatility"},{"x":55,"y":-0.64,"fill":"low volatility"},{"x":56,"y":-0.06,"fill":"low volatility"},{"x":57,"y":0.34,"fill":"low volatility"},{"x":58,"y":0.30,"fill":"low volatility"},{"x":59,"y":0.66,"fill":"low volatility"},{"x":60,"y":-0.50,"fill":"low volatility"},{"x":1,"y":-3.26,"fill":"high volatility"},{"x":2,"y":-0.98,"fill":"high volatility"},{"x":3,"y":-2.85,"fill":"high volatility"},{"x":4,"y":0.07,"fill":"high volatility"},{"x":5,"y":2.66,"fill":"high volatility"},{"x":6,"y":1.46,"fill":"high volatility"},{"x":7,"y":-1.11,"fill":"high volatility"},{"x":8,"y":-2.76,"fill":"high volatility"},{"x":9,"y":-0.33,"fill":"high volatility"},{"x":10,"y":-2.06,"fill":"high volatility"},{"x":11,"y":-0.04,"fill":"high volatility"},{"x":12,"y":-2.40,"fill":"high volatility"},{"x":13,"y":0.57,"fill":"high volatility"},{"x":14,"y":2.07,"fill":"high volatility"},{"x":15,"y":3.09,"fill":"high volatility"},{"x":16,"y":-1.59,"fill":"high volatility"},{"x":17,"y":0.77,"fill":"high volatility"},{"x":18,"y":-0.48,"fill":"high volatility"},{"x":19,"y":1.40,"fill":"high volatility"},{"x":20,"y":-0.65,"fill":"high volatility"},{"x":21,"y":-1.88,"fill":"high volatility"},{"x":22,"y":-3.48,"fill":"high volatility"},{"x":23,"y":-2.44,"fill":"high volatility"},{"x":24,"y":1.90,"fill":"high volatility"},{"x":25,"y":3.21,"fill":"high volatility"},{"x":26,"y":-0.63,"fill":"high volatility"},{"x":27,"y":0.84,"fill":"high volatility"},{"x":28,"y":-0.53,"fill":"high volatility"},{"x":29,"y":2.82,"fill":"high volatility"},{"x":30,"y":-0.12,"fill":"high volatility"},{"x":31,"y":1.44,"fill":"high volatility"},{"x":32,"y":-1.11,"fill":"high volatility"},{"x":33,"y":0.73,"fill":"high volatility"},{"x":34,"y":-0.45,"fill":"high volatility"},{"x":35,"y":0.93,"fill":"high volatility"},{"x":36,"y":2.57,"fill":"high volatility"},{"x":37,"y":0.07,"fill":"high volatility"},{"x":38,"y":0.00,"fill":"high volatility"},{"x":39,"y":1.40,"fill":"high volatility"},{"x":40,"y":-0.35,"fill":"high volatility"},{"x":41,"y":-1.02,"fill":"high volatility"},{"x":42,"y":-2.07,"fill":"high volatility"},{"x":43,"y":-0.37,"fill":"high volatility"},{"x":44,"y":1.45,"fill":"high volatility"},{"x":45,"y":-0.24,"fill":"high volatility"},{"x":46,"y":-1.11,"fill":"high volatility"},{"x":47,"y":-0.45,"fill":"high volatility"},{"x":48,"y":-2.46,"fill":"high volatility"},{"x":49,"y":0.49,"fill":"high volatility"},{"x":50,"y":2.50,"fill":"high volatility"},{"x":51,"y":-1.15,"fill":"high volatility"},{"x":52,"y":-3.67,"fill":"high volatility"},{"x":53,"y":0.13,"fill":"high volatility"},{"x":54,"y":-2.80,"fill":"high volatility"},{"x":55,"y":-6.01,"fill":"high volatility"},{"x":56,"y":4.32,"fill":"high volatility"},{"x":57,"y":-1.53,"fill":"high volatility"},{"x":58,"y":0.13,"fill":"high volatility"},{"x":59,"y":2.48,"fill":"high volatility"},{"x":60,"y":-1.65,"fill":"high volatility"}], "geoms": ["point", "boxplot"], "x": "day", "y": "return_pct", "code": {"point": "ggplot(low_high, aes(day, return_pct, colour = group)) +\n  geom_point()", "boxplot": "ggplot(low_high, aes(group, return_pct)) +\n  geom_boxplot()"}}

The code below gives the numbers behind the chart.

```r
# Summarise the low volatility and the high volatility stretches
low_stretch <- dax_ret[low_start:(low_start + win_len - 1)]
high_stretch <- dax_ret[high_start:(high_start + win_len - 1)]
stretches <- data.frame(
  stretch = c("low volatility", "high volatility"),
  mean = c(mean(low_stretch), mean(high_stretch)),
  sd = c(sd(low_stretch), sd(high_stretch)),
  min = c(min(low_stretch), min(high_stretch)),
  max = c(max(low_stretch), max(high_stretch))
)
stretches[, -1] <- round(stretches[, -1], 3)
stretches
#>           stretch   mean    sd    min   max
#> 1  low volatility  0.159 0.478 -1.086 1.159
#> 2 high volatility -0.242 1.987 -6.007 4.321
round(sd(high_stretch) / sd(low_stretch), 1)
#> [1] 4.2
```

Both stretches have a mean near 0, 0.159 in the low volatility one and -0.242 in the high volatility one. The standard deviations are far apart, 0.478 against 1.987, a ratio of 4.2. The low volatility returns stay between -1.086 and 1.159, while the high volatility returns run from -6.007 to 4.321.

Now compare both with the standard deviation of the whole series, 1.030. It is about twice the low volatility stretch's 0.478 and about half the high volatility stretch's 1.987. So that one number describes neither stretch.

=== step === concept
## Unconditional and conditional variance

The spread of the returns is not one fixed number, so we need words for what changes. Let's start with the two kinds of variance.

The **unconditional variance** is one number for the whole series: the variance of all 1,859 returns, whose square root is the 1.030 we have been using. It ignores when each return happened. A series is **heteroskedastic** when its variance is not constant over time, and **homoskedastic** when it is.

The **conditional variance** is the variance of today's return given what we know up to yesterday. We write it \(\sigma_t^2\), and the bar reads "given":

\[ \sigma_t^2 = \mathrm{Var}\left( r_t \mid r_{t-1}, r_{t-2}, \dots \right) \]

A return can then be written as

\[ r_t = \mu + \sigma_t z_t \]

where \(\mu\) is the mean return, \(z_t\) is a random shock with mean 0 and variance 1, and \(\sigma_t\) is the standard deviation that applies on day \(t\). When \(\sigma_t\) changes with the recent past, the series has **conditional heteroskedasticity**.

Does the recent past really tell us about the size of today's return? We measure recent volatility as the standard deviation of the previous 60 returns, the trailing standard deviation. Then we sort the days into three equal groups by it, low, mid and high, and measure the spread of the return that follows each window.

```r
# Split the days into thirds by the trailing 60-day standard deviation and measure today's return in each
trailing_sd <- rolling_sd[-length(rolling_sd)]
today <- dax_ret[(win_len + 1):length(dax_ret)]
cuts <- quantile(trailing_sd, c(1/3, 2/3))
third <- cut(trailing_sd, breaks = c(-Inf, cuts, Inf), labels = c("low", "mid", "high"))
round(unname(cuts), 3)
#> [1] 0.771 1.044
data.frame(
  days = as.vector(table(third)),
  sd_today = round(tapply(today, third, sd), 3),
  mean_today = round(tapply(today, third, mean), 3)
)
#>      days sd_today mean_today
#> low   600    0.736      0.029
#> mid   599    0.992      0.088
#> high  600    1.239      0.087
```

The last window has no day after it, so we drop it, which leaves 1,799 windows. `today` holds the return that follows each window, days 61 to 1,859. The cut points between the thirds are 0.771 and 1.044.

Now read the table. The standard deviation of today's return rises from 0.736 in the low third to 0.992 in the mid third and 1.239 in the high third. The mean stays near 0 in all three, at 0.029, 0.088 and 0.087.

So the average return does not change with recent volatility, but the spread of the return does. That is conditional heteroskedasticity in the DAX.

=== step === quiz
## Quick check: what does one standard deviation of 1.030 say about the two stretches?

The low volatility stretch has a standard deviation of 0.478 and the high volatility stretch has 1.987. The whole series has 1.030. Which statement is right?

::quiz {"correct": 3, "gate": true, "difficulty": "beginner"}
- The spreads differ because the means differ, 0.159 in one stretch and -0.242 in the other. ::no
- 1.030 is the average of the two standard deviations, so it describes the pair well. ::no
- 1.030 is about twice the low volatility stretch's 0.478 and about half the high volatility stretch's 1.987, so it describes neither stretch. ::ok Yes. One standard deviation for the whole series is an unconditional number, and here it is too big for the calm days and too small for the volatile days.
- Every 60-day stretch of the DAX returns has a standard deviation near 1.030, because it is a property of the whole series. ::no The two stretches have 0.478 and 1.987, and the rolling standard deviation ranged from 0.478 to 1.987 across all windows. Both means are near 0, so the difference in spread does not come from the means. The average of the two standard deviations is 1.23, not 1.030, and even a number like that would not describe either stretch.

=== step === concept
## The ACF of daily returns

The tool for asking whether a value depends on earlier values is the autocorrelation function, or ACF. The autocorrelation at lag k is the correlation between the return on day \(t\) and the return k days earlier. Lag 1 compares each day with the day before, and lag 2 compares it with two days before.

For lag k the formula is

\[ \hat{\rho}_k = \frac{\sum_{t=k+1}^{n} (r_t - \bar{r})(r_{t-k} - \bar{r})}{\sum_{t=1}^{n} (r_t - \bar{r})^2} \]

where \(\hat{\rho}_k\) is the autocorrelation at lag k, \(\bar{r}\) is the mean return and n is the number of returns.

The code computes lag 1 by hand as the sum of the products of neighbouring deviations from the mean, divided by the sum of the squared deviations. Then it compares the result with `acf()`.

```r
# Compute the lag 1 autocorrelation of the returns by hand and with acf()
n <- length(dax_ret)
dev_ret <- dax_ret - mean(dax_ret)
lag1_hand <- sum(dev_ret[-1] * dev_ret[-n]) / sum(dev_ret^2)
lag1_acf <- acf(dax_ret, plot = FALSE)$acf[2]
cat(sprintf("by hand: %.4f\nacf():   %.4f\n", lag1_hand, lag1_acf))
#> by hand: -0.0004
#> acf():   -0.0004
```

Both give -0.0004, essentially 0. Yesterday's return has almost no linear relationship with today's.

How far from 0 does an autocorrelation have to be before we count it? If the returns had no autocorrelation at all, a sample autocorrelation from n returns would be roughly normal with mean 0 and standard deviation \(1/\sqrt{n}\). A normal value falls within 1.96 standard deviations of its mean 95% of the time, where 1.96 is `qnorm(0.975)`. So the band is \(\pm 1.96/\sqrt{n}\), and about 1 lag in 20 falls outside it by chance alone.

The block below checks the 1.96, computes the band, prints the first five autocorrelations, lists the lags outside the band and plots the ACF up to lag 20.

```r
# Compare the ACF of the returns with the 95% band
round(qnorm(0.975), 2)
#> [1] 1.96
band <- 1.96 / sqrt(n)
round(band, 4)
#> [1] 0.0455
acf_ret <- acf(dax_ret, lag.max = 20, plot = FALSE)$acf[-1]
round(acf_ret[1:5], 3)
#> [1]  0.000 -0.027 -0.010  0.000 -0.032
which(abs(acf_ret) > band)
#> [1] 11 17
par(mfrow = c(1, 1))
acf(dax_ret, lag.max = 20, main = "ACF of the daily returns")
```

With 1,859 returns the band is 0.0455, and the dashed lines in the plot sit at plus and minus that value. Lags 1 to 5 are 0.000, -0.027, -0.010, 0.000 and -0.032, all inside the band, and so is every lag from 1 to 10.

Only lags 11 and 17 are outside. With 20 lags we expect about 1 outside by chance, so 2 is not a surprise. The tall spike at lag 0 is a return correlated with itself, always 1, and is not part of the test.

So the DAX returns show no linear dependence on earlier returns. But this ACF is computed on the returns themselves, so it cannot see whether the size of the swings depends on the past.

=== step === concept
## The ACF of squared returns

The variance is the average squared deviation from the mean. The mean return is 0.065, close to 0, so a day's squared return \(r_t^2\) is close to its squared deviation from the mean. That makes \(r_t^2\) a one-day measure of the variance.

If the variance moves in runs, the squared returns should be correlated with earlier squared returns. We compute their ACF with the same formula, starting with lag 1 by hand. The block also prints the largest squared return and the median one.

```r
# Compute the lag 1 autocorrelation of the squared returns by hand
sq_ret <- dax_ret^2
dev_sq <- sq_ret - mean(sq_ret)
lag1_sq <- sum(dev_sq[-1] * dev_sq[-n]) / sum(dev_sq^2)
round(lag1_sq, 4)
#> [1] 0.0789
round(c(largest_square = max(sq_ret), median_square = median(sq_ret)), 2)
#> largest_square  median_square 
#>          92.69           0.30 
```

Lag 1 is 0.0789, already outside the band of 0.0455. Next we compute the whole ACF of the squared returns and, for comparison, the ACF of the absolute returns \(|r_t|\), another measure of a day's size.

```r
# Compare the ACF of the squared returns with the ACF of the absolute returns
acf_sq <- acf(sq_ret, lag.max = 20, plot = FALSE)$acf[-1]
acf_abs <- acf(abs(dax_ret), lag.max = 20, plot = FALSE)$acf[-1]
round(acf_sq[1:5], 3)
#> [1] 0.079 0.171 0.074 0.078 0.053
which(abs(acf_sq) > band)
#> [1]  1  2  3  4  5  6  7 14 15
sum(abs(acf_abs) > band)
#> [1] 20
round(acf_abs[1], 3)
#> [1] 0.109
par(mfrow = c(1, 2))
acf(sq_ret, lag.max = 20, main = "Squared returns")
acf(abs(dax_ret), lag.max = 20, main = "Absolute returns")
```

The first five autocorrelations of the squared returns are all positive, and 9 of the 20 lags are outside the band, lags 1 to 7 plus 14 and 15. A large squared return tends to be followed by more large ones. For the absolute returns all 20 lags are outside the band, with 0.109 at lag 1.

Why is the pattern stronger for the absolute returns? One reason is that squaring gives the extreme days a huge weight. The return of -9.628 has a square of 92.69, while the median squared return is 0.30, so a few days dominate the sums in the ACF of the squares.

Now put the two ACFs side by side. The returns are inside the band at lags 1 to 10, and the squared returns are outside it at lags 1 to 7. The returns are uncorrelated, but their squares are not. So the returns are not independent, because independent returns would have uncorrelated squares too.

[KEY INSIGHT]
The ACF of the returns asks whether the direction of a return depends on the past. The ACF of the squared returns asks whether its size does. In the DAX returns the first is flat and the second is not.

=== step === concept
## How well a constant-variance 95% interval covers low- and high-volatility days

This matters because a forecast interval is built from a variance. A 95% prediction interval for the next return is a range the return should fall inside on 95% of days. Its **coverage** is the share of days whose return really does fall inside, so a 95% interval should have coverage near 95%.

If we assume one constant variance, the interval is the mean plus or minus 1.96 standard deviations. We compute it from the whole series, so any failure comes from assuming one variance and not from estimation error. Then we count the days it misses in each volatility third, and in the two stretches.

```r
# Build the constant-variance 95% interval and count its misses in each third
r_mean <- mean(dax_ret)
const_lo <- r_mean - 1.96 * sd(dax_ret)
const_hi <- r_mean + 1.96 * sd(dax_ret)
inside_const <- today >= const_lo & today <= const_hi
round(c(lower = const_lo, upper = const_hi, width = const_hi - const_lo), 2)
#> lower upper width 
#> -1.95  2.08  4.04 
round(100 * mean(inside_const), 1)
#> [1] 94.7
round(100 * tapply(inside_const, third, mean), 1)
#>  low  mid high 
#> 98.3 95.5 90.3 
tapply(!inside_const, third, sum)
#>  low  mid high 
#>   10   27   58 
sum(low_stretch < const_lo | low_stretch > const_hi)
#> [1] 0
sum(high_stretch < const_lo | high_stretch > const_hi)
#> [1] 20
```

The interval runs from -1.95 to 2.08, a width of 4.04 on every day. Over all 1,799 days its coverage is 94.7%, close to the 95% we set. But that average hides two errors that cancel.

In the low third the coverage is 98.3%, with 10 misses where about 30 are allowed, since 5% of 600 days is 30. In the high third it is 90.3%, with 58 misses. The same picture shows in the two stretches: the interval misses 0 of the 60 days in the low volatility stretch and 20 of the 60 in the high volatility stretch. So the interval is too wide when volatility is low and too narrow when it is high.

Now use the dependence we found. Instead of the constant standard deviation, we use the trailing standard deviation: the interval is the mean plus or minus 1.96 times the standard deviation of the previous 60 returns.

```r
# Build the interval that follows the trailing standard deviation and compare the two
trail_lo <- r_mean - 1.96 * trailing_sd
trail_hi <- r_mean + 1.96 * trailing_sd
inside_trail <- today >= trail_lo & today <= trail_hi
data.frame(
  constant_coverage = round(100 * tapply(inside_const, third, mean), 1),
  trailing_coverage = round(100 * tapply(inside_trail, third, mean), 1),
  constant_width = round(const_hi - const_lo, 2),
  trailing_width = round(tapply(trail_hi - trail_lo, third, mean), 2)
)
#>      constant_coverage trailing_coverage constant_width trailing_width
#> low               98.3              92.7           4.04           2.59
#> mid               95.5              92.7           4.04           3.50
#> high              90.3              95.8           4.04           5.24
round(100 * mean(inside_trail), 1)
#> [1] 93.7
```

The trailing interval changes its width with the volatility: 2.59 on average in the low third, 3.50 in the mid third and 5.24 in the high third. The constant width of 4.04 is 1.6 times the low third's trailing width and 0.77 of the high third's. The trailing interval's coverage is 92.7%, 92.7% and 95.8%, so every third is now within 2.3 points of 95%, where before they ranged from 98.3% to 90.3%.

The overall coverage of the trailing interval is 93.7%, a little under 95%. The block below counts the days more than 3 trailing standard deviations from the mean, and how many a normal curve allows.

```r
# Count the days beyond 3 trailing standard deviations against the count a normal curve allows
sum(abs(today - r_mean) > 3 * trailing_sd)
#> [1] 21
round(length(today) * 2 * pnorm(-3), 1)
#> [1] 4.9
```

There are 21 such days, against about 5 if the returns followed a normal curve. So, measured in trailing standard deviations, the returns have heavier tails than a normal curve, and the 1.96 in the interval does not allow for that. That keeps the coverage a little under 95%.

The plot shows 260 days of returns with both intervals. The dashed lines are the constant interval, and the green lines are the trailing interval.

```r
# Plot 260 days of returns with the constant interval and the trailing interval
show_days <- 1400:1659
par(mfrow = c(1, 1))
plot(show_days, dax_ret[show_days], pch = 16, cex = 0.6, xlab = "trading day", ylab = "daily return (%)")
abline(h = c(const_lo, const_hi), lty = 2)
lines(show_days, trail_lo[show_days - win_len], col = "#1f7a55", lwd = 2)
lines(show_days, trail_hi[show_days - win_len], col = "#1f7a55", lwd = 2)
legend("topleft", legend = c("constant interval", "trailing interval"), lty = c(2, 1), lwd = c(1, 2), col = c("black", "#1f7a55"), bty = "n")
```

The dashed band stays where it is, while the green band moves with the recent volatility.

[KEY INSIGHT]
A constant-variance interval can have the right coverage on average and still be wrong in both directions: too wide when the series is calm and too narrow when it is volatile.

=== step === widget
## How far can interval coverage fall when the variance is not constant?

The DAX interval broke the assumption of a constant variance. The widget below shows how much damage that assumption can do, but it runs its own simulated data and not the DAX.

It simulates a regression with 60 points whose error spread grows with x, so it fails the same equal-variance assumption, over x instead of over time. At every dial position it runs 2,000 studies and builds a 95% interval for the slope in each. Coverage is the share of those intervals that contain the true slope, and the widget shows it next to R-squared.

::widget assumption-dial {"assumption": "heteroskedasticity"}

Start with the spread constant. Coverage is 95.1% and R-squared is 0.503. Move the dial to a widest spread 3.7 times the narrowest, and coverage falls to 92.8%. At 5.8 times it is 90.8%.

The ratio between the DAX's highest and lowest 60-day standard deviation, 4.2, lies between these two positions.

At the top of the dial, with the widest spread 81.5 times the narrowest, coverage is 70.7%. But R-squared has only moved from 0.503 to 0.533. So the fit statistic most people check does not warn you that the interval is wrong. The DAX interval fails for the same reason: it assumes one variance.

=== step === quiz
## Quick check: which conclusion about the DAX interval is right?

The constant-variance 95% interval covers 94.7% of all days. Which conclusion follows from the coverage by volatility third and from the dial?

::quiz {"correct": 2, "gate": true, "difficulty": "intermediate"}
- 94.7% is close to 95%, so the assumption of a constant variance holds. ::no
- The average is right, but the coverage is 98.3% in the lowest-volatility third and 90.3% in the highest, so the interval is too wide when volatility is low and too narrow when it is high. ::ok Yes. The 94.7% is an average of two errors in opposite directions, and the assumption of one constant variance is what produces both.
- The flat ACF of the returns shows that the variance is constant, so the interval is fine. ::no
- A high R-squared would show that the interval is fine. ::no The average coverage can be right while the interval fails in calm and in volatile periods. The ACF of the returns only shows that their direction is not predictable, and it says nothing about the variance. In the dial, R-squared stayed between 0.503 and 0.533 while coverage fell from 95.1% to 70.7%, so a fit statistic does not check the interval.

=== step === tryit
## Your turn: test the CAC 40 for volatility clustering

Now apply the detection to a new series. The CAC 40 is the main French stock index, and it is in the same dataset as the DAX, in the column "CAC". It has the same 1,859 returns, so the band is the same 0.0455.

Compute the CAC 40 returns, then the lag 1 autocorrelation of the returns and of the squared returns. Decide whether each is inside or outside the band.

```r
# Compute the lag 1 autocorrelation of the CAC 40 returns and of the squared returns
# cac_ret: 100 times the differenced log of the CAC column of EuStockMarkets
# Use plot = FALSE and read the second element of the acf component, which is lag 1
# Three lines: build cac_ret, then one ACF call on the returns and one on the squared returns
```
::check {"regex": "(?=[\\s\\S]*acf\\s*[(])(?=[\\s\\S]*(cac_ret\\s*([\\^]|[*][*])\\s*2|abs\\s*[(]\\s*cac_ret))", "gate": true, "difficulty": "intermediate", "ok": "Right: 0.030 for the returns is inside the band of 0.0455, and 0.120 for the squared returns is 2.6 times the band. The CAC 40 also has uncorrelated returns and correlated squares, which is volatility clustering.", "no": "Build the returns like the DAX ones from the CAC column, then call acf() with plot = FALSE on cac_ret and again on cac_ret^2, and take the second element of the acf component, which is lag 1."}
::solution
```r
# Compute the lag 1 autocorrelation of the CAC 40 returns and of their squares
cac_ret <- 100 * diff(log(as.numeric(EuStockMarkets[, "CAC"])))
round(acf(cac_ret, plot = FALSE)$acf[2], 3)
#> [1] 0.03
round(acf(cac_ret^2, plot = FALSE)$acf[2], 3)
#> [1] 0.12
```

R prints 0.030 as 0.03. The lag 1 autocorrelation of the CAC 40 returns is inside the band, and that of the squared returns is 2.6 times the band. So the CAC 40 shows volatility clustering too.

=== step === concept
## References
::prose-only a list of sources

- [The Variation of Certain Speculative Prices](https://doi.org/10.1086/294632) - Mandelbrot (1963), Journal of Business 36(4), 394-419. Large changes tend to be followed by large changes.
- [Autoregressive Conditional Heteroscedasticity with Estimates of the Variance of United Kingdom Inflation](https://doi.org/10.2307/1912773) - Engle (1982), Econometrica 50(4), 987-1007. The model that makes the variance conditional.
- [Empirical properties of asset returns: stylized facts and statistical issues](https://doi.org/10.1080/713665670) - Cont (2001), Quantitative Finance 1(2), 223-236. Uncorrelated returns, correlated squares.
- [Forecasting: Principles and Practice, 3rd edition](https://otexts.com/fpp3/) - Hyndman and Athanasopoulos, sections 2.8 (autocorrelation) and 5.5 (prediction intervals).
- [Auto- and Cross- Covariance and -Correlation Function Estimation](https://stat.ethz.ch/R-manual/R-devel/library/stats/html/acf.html) - R Core Team, the documentation for `acf()` in the stats package.

=== step === complete
## Quick recap

You measured volatility clustering in the DAX and saw what it does to a forecast interval. To summarize:

- The 60-day standard deviation of the DAX returns runs from 0.478 to 1.987 while the mean stays near 0. That is volatility clustering.
- Conditional heteroskedasticity means the variance of a day's return depends on the recent returns. The standard deviation of today's return rose from 0.736 to 0.992 to 1.239 across the low, mid and high thirds of the trailing standard deviation.
- The ACF of the returns is inside the band at lags 1 to 10, and the ACF of the squared returns is outside it at lags 1 to 7. Uncorrelated returns with correlated squares are not independent.
- A constant-variance 95% interval covers 94.7% of days but 98.3%, 95.5% and 90.3% across the three thirds. An interval that follows the trailing standard deviation covers between 92.7% and 95.8% in every third.

In the next lesson, we write this conditional variance as an ARCH model.

---
title: "Machine Learning and Deep Forecasting Lesson 4: Forecasting with a neural network using NNETAR"
slug: "Neural-Network-Forecasts-NNETAR"
description: "See what nnetar fits, compute one forecast from its weights by hand, test its simulated prediction intervals, and compare it with ETS on airline data."
keywords: "nnetar, neural network forecasting in R, nnetar forecast, NNAR model, neural network time series, nnetar prediction intervals, nnetar vs ETS, forecast package"
mathjax: false
webr: true
date: "2026-09-27"
post_type: "LESSON"
course_id: "ts-ml"
course_title: "Machine Learning and Deep Forecasting"
course_lesson: "4"
course_total: "7"
course_landing: "Machine-Learning-and-Deep-Forecasting-Course.html"
course_prev: "Boosted-Trees-for-Forecasting"
course_next: "Deep-Learning-DeepAR-N-BEATS-and-N-HiTS"
curriculum_id: "5.130.4"
lesson_access: "pro"
catalog_blurb: "How a small neural network forecasts a series, and when it beats ETS."
---

=== step === cover
## Forecasting with a neural network using NNETAR

Today let's see how a small neural network forecasts a monthly series, and how to check whether it does the job better than a simpler method.

The series is AirPassengers, the monthly total of international airline passengers, in thousands, from January 1949 to December 1960. That is 144 months. The total starts at 112 in January 1949 and reaches 622 in July 1960.

To score a forecast honestly, we split the series in two. The first 120 months (1949 to 1958) are for fitting the model. The last 24 months (1959 and 1960) are the holdout: months that fitting never sees, kept only to compare against the forecast.

The model is `nnetar()` from the forecast package. It builds rows of lagged values from the series, fits a small neural network to them, and repeats that fit 20 times from different random starting weights. The question for this lesson is whether this model forecasts the series better than ETS, the exponential smoothing method.

The chart below shows the 144 months as a line, and switches to one boxplot per calendar year.

::widget chart-plotter {"x":"year","y":"passengers","geoms":["line","boxplot"],"data":[{"x":1949.0,"y":112,"fill":"1949"},{"x":1949.08,"y":118,"fill":"1949"},{"x":1949.17,"y":132,"fill":"1949"},{"x":1949.25,"y":129,"fill":"1949"},{"x":1949.33,"y":121,"fill":"1949"},{"x":1949.42,"y":135,"fill":"1949"},{"x":1949.5,"y":148,"fill":"1949"},{"x":1949.58,"y":148,"fill":"1949"},{"x":1949.67,"y":136,"fill":"1949"},{"x":1949.75,"y":119,"fill":"1949"},{"x":1949.83,"y":104,"fill":"1949"},{"x":1949.92,"y":118,"fill":"1949"},{"x":1950.0,"y":115,"fill":"1950"},{"x":1950.08,"y":126,"fill":"1950"},{"x":1950.17,"y":141,"fill":"1950"},{"x":1950.25,"y":135,"fill":"1950"},{"x":1950.33,"y":125,"fill":"1950"},{"x":1950.42,"y":149,"fill":"1950"},{"x":1950.5,"y":170,"fill":"1950"},{"x":1950.58,"y":170,"fill":"1950"},{"x":1950.67,"y":158,"fill":"1950"},{"x":1950.75,"y":133,"fill":"1950"},{"x":1950.83,"y":114,"fill":"1950"},{"x":1950.92,"y":140,"fill":"1950"},{"x":1951.0,"y":145,"fill":"1951"},{"x":1951.08,"y":150,"fill":"1951"},{"x":1951.17,"y":178,"fill":"1951"},{"x":1951.25,"y":163,"fill":"1951"},{"x":1951.33,"y":172,"fill":"1951"},{"x":1951.42,"y":178,"fill":"1951"},{"x":1951.5,"y":199,"fill":"1951"},{"x":1951.58,"y":199,"fill":"1951"},{"x":1951.67,"y":184,"fill":"1951"},{"x":1951.75,"y":162,"fill":"1951"},{"x":1951.83,"y":146,"fill":"1951"},{"x":1951.92,"y":166,"fill":"1951"},{"x":1952.0,"y":171,"fill":"1952"},{"x":1952.08,"y":180,"fill":"1952"},{"x":1952.17,"y":193,"fill":"1952"},{"x":1952.25,"y":181,"fill":"1952"},{"x":1952.33,"y":183,"fill":"1952"},{"x":1952.42,"y":218,"fill":"1952"},{"x":1952.5,"y":230,"fill":"1952"},{"x":1952.58,"y":242,"fill":"1952"},{"x":1952.67,"y":209,"fill":"1952"},{"x":1952.75,"y":191,"fill":"1952"},{"x":1952.83,"y":172,"fill":"1952"},{"x":1952.92,"y":194,"fill":"1952"},{"x":1953.0,"y":196,"fill":"1953"},{"x":1953.08,"y":196,"fill":"1953"},{"x":1953.17,"y":236,"fill":"1953"},{"x":1953.25,"y":235,"fill":"1953"},{"x":1953.33,"y":229,"fill":"1953"},{"x":1953.42,"y":243,"fill":"1953"},{"x":1953.5,"y":264,"fill":"1953"},{"x":1953.58,"y":272,"fill":"1953"},{"x":1953.67,"y":237,"fill":"1953"},{"x":1953.75,"y":211,"fill":"1953"},{"x":1953.83,"y":180,"fill":"1953"},{"x":1953.92,"y":201,"fill":"1953"},{"x":1954.0,"y":204,"fill":"1954"},{"x":1954.08,"y":188,"fill":"1954"},{"x":1954.17,"y":235,"fill":"1954"},{"x":1954.25,"y":227,"fill":"1954"},{"x":1954.33,"y":234,"fill":"1954"},{"x":1954.42,"y":264,"fill":"1954"},{"x":1954.5,"y":302,"fill":"1954"},{"x":1954.58,"y":293,"fill":"1954"},{"x":1954.67,"y":259,"fill":"1954"},{"x":1954.75,"y":229,"fill":"1954"},{"x":1954.83,"y":203,"fill":"1954"},{"x":1954.92,"y":229,"fill":"1954"},{"x":1955.0,"y":242,"fill":"1955"},{"x":1955.08,"y":233,"fill":"1955"},{"x":1955.17,"y":267,"fill":"1955"},{"x":1955.25,"y":269,"fill":"1955"},{"x":1955.33,"y":270,"fill":"1955"},{"x":1955.42,"y":315,"fill":"1955"},{"x":1955.5,"y":364,"fill":"1955"},{"x":1955.58,"y":347,"fill":"1955"},{"x":1955.67,"y":312,"fill":"1955"},{"x":1955.75,"y":274,"fill":"1955"},{"x":1955.83,"y":237,"fill":"1955"},{"x":1955.92,"y":278,"fill":"1955"},{"x":1956.0,"y":284,"fill":"1956"},{"x":1956.08,"y":277,"fill":"1956"},{"x":1956.17,"y":317,"fill":"1956"},{"x":1956.25,"y":313,"fill":"1956"},{"x":1956.33,"y":318,"fill":"1956"},{"x":1956.42,"y":374,"fill":"1956"},{"x":1956.5,"y":413,"fill":"1956"},{"x":1956.58,"y":405,"fill":"1956"},{"x":1956.67,"y":355,"fill":"1956"},{"x":1956.75,"y":306,"fill":"1956"},{"x":1956.83,"y":271,"fill":"1956"},{"x":1956.92,"y":306,"fill":"1956"},{"x":1957.0,"y":315,"fill":"1957"},{"x":1957.08,"y":301,"fill":"1957"},{"x":1957.17,"y":356,"fill":"1957"},{"x":1957.25,"y":348,"fill":"1957"},{"x":1957.33,"y":355,"fill":"1957"},{"x":1957.42,"y":422,"fill":"1957"},{"x":1957.5,"y":465,"fill":"1957"},{"x":1957.58,"y":467,"fill":"1957"},{"x":1957.67,"y":404,"fill":"1957"},{"x":1957.75,"y":347,"fill":"1957"},{"x":1957.83,"y":305,"fill":"1957"},{"x":1957.92,"y":336,"fill":"1957"},{"x":1958.0,"y":340,"fill":"1958"},{"x":1958.08,"y":318,"fill":"1958"},{"x":1958.17,"y":362,"fill":"1958"},{"x":1958.25,"y":348,"fill":"1958"},{"x":1958.33,"y":363,"fill":"1958"},{"x":1958.42,"y":435,"fill":"1958"},{"x":1958.5,"y":491,"fill":"1958"},{"x":1958.58,"y":505,"fill":"1958"},{"x":1958.67,"y":404,"fill":"1958"},{"x":1958.75,"y":359,"fill":"1958"},{"x":1958.83,"y":310,"fill":"1958"},{"x":1958.92,"y":337,"fill":"1958"},{"x":1959.0,"y":360,"fill":"1959"},{"x":1959.08,"y":342,"fill":"1959"},{"x":1959.17,"y":406,"fill":"1959"},{"x":1959.25,"y":396,"fill":"1959"},{"x":1959.33,"y":420,"fill":"1959"},{"x":1959.42,"y":472,"fill":"1959"},{"x":1959.5,"y":548,"fill":"1959"},{"x":1959.58,"y":559,"fill":"1959"},{"x":1959.67,"y":463,"fill":"1959"},{"x":1959.75,"y":407,"fill":"1959"},{"x":1959.83,"y":362,"fill":"1959"},{"x":1959.92,"y":405,"fill":"1959"},{"x":1960.0,"y":417,"fill":"1960"},{"x":1960.08,"y":391,"fill":"1960"},{"x":1960.17,"y":419,"fill":"1960"},{"x":1960.25,"y":461,"fill":"1960"},{"x":1960.33,"y":472,"fill":"1960"},{"x":1960.42,"y":535,"fill":"1960"},{"x":1960.5,"y":622,"fill":"1960"},{"x":1960.58,"y":606,"fill":"1960"},{"x":1960.67,"y":508,"fill":"1960"},{"x":1960.75,"y":461,"fill":"1960"},{"x":1960.83,"y":390,"fill":"1960"},{"x":1960.92,"y":432,"fill":"1960"}],"code":{"line":"ggplot(air_df, aes(year, passengers)) +\n  geom_line()","boxplot":"ggplot(air_df, aes(factor(group), passengers)) +\n  geom_boxplot()"}}

In the line view, every year peaks in summer and dips in winter, and the swing between the peak and the dip widens as the level rises. In the boxplot view, each year's box sits higher than the one before it, and the later boxes are taller than the early ones.

=== step === concept
## How nnetar turns a series into rows of lagged values

A neural network learns from rows: a target to predict, and inputs to predict it from. A time series is a single column, so `nnetar()` builds those rows itself, out of lagged values. A **lag** is the value from an earlier month: lag 1 is the previous month's total, and lag 12 is the total from the same month one year earlier.

The block below creates the 120 training months and the 24 holdout months.

```r
# Split AirPassengers into 120 training months and 24 holdout months
library(forecast)

train <- window(AirPassengers, end = c(1958, 12))
test  <- window(AirPassengers, start = c(1959, 1))

length(train)
#> [1] 120
length(test)
#> [1] 24
```

`window()` cuts a time series between two dates, so `train` holds 1949 to 1958 and `test` holds 1959 and 1960.

Next we build the table of rows, with each month's total as the target and its lag 1 and lag 12 values beside it.

```r
# Build the table of rows: a target month with its lag 1 and lag 12 values
air_train <- as.numeric(train)
n_train   <- length(air_train)

lag_table <- data.frame(
  target = air_train[13:n_train],
  lag1   = air_train[12:(n_train - 1)],
  lag12  = air_train[1:(n_train - 12)]
)

head(lag_table, 3)
#>   target lag1 lag12
#> 1    115  118   112
#> 2    126  115   118
#> 3    141  126   132
nrow(lag_table)
#> [1] 108
```

Read the first row like this. The target is 115 thousand passengers, the total for January 1950. Its lag 1 is 118, the total for December 1949, and its lag 12 is 112, the total for January 1949.

The table has 108 rows and not 120. The first 12 months have no value from 12 months earlier, so they cannot be a row.

Now we fit the model. `set.seed(1)` comes first because each network starts from random weights, so the seed makes your numbers match the ones on this page.

```r
# Fit nnetar to the 120 training months and print the fitted model
set.seed(1)
nn_fit <- nnetar(train)
nn_fit
#> Series: train
#> Model:  NNAR(1,1,2)[12]
#> Call:   nnetar(y = train)
#>
#> Average of 20 networks, each of which is
#> a 2-2-1 network with 9 weights
#> options were - linear output units
#>
#> sigma^2 estimated as 196.4
```

The header `NNAR(1,1,2)[12]` reads in four parts:

- The first 1 is p, the number of ordinary lags used as inputs. Here it is lag 1. `nnetar()` chose it by fitting a linear autoregression (a regression of each month on the months before it) to the series with its seasonal pattern removed. It kept the number of lags with the lowest AIC, a score that penalises extra lags.
- The second 1 is P, the number of seasonal lags. Here it is one seasonal lag, lag 12.
- The 2 is the number of hidden units. By default it is (number of inputs + 1) / 2, rounded, so 2 inputs give 1.5, which rounds to 2.
- The 12 in square brackets is the seasonal period, 12 months.

So each network has 2 inputs (lag 1 and lag 12), 2 hidden units and 1 output, which is the 2-2-1 in the printout. It has 9 weights, the numbers it learns during fitting, and we will open one up in a moment. The forecast is the average of 20 such networks.

The last line, sigma^2, is the mean squared residual. A residual is the actual value minus the fitted value, so this is the average squared gap between each of the 108 training rows and the value the network fitted for it: 196.4, in squared thousands of passengers.

=== step === concept
## How one forecast is computed from the network's 9 weights

A network is a short chain of small calculations, and its weights are the numbers in those calculations. The chain runs from the two inputs, through 2 hidden units, to 1 output.

A **hidden unit** combines the inputs and passes on one number. A **weight** is what one connection multiplies its value by, and a **bias** is a constant added inside a unit.

The block below pulls out the 9 weights of the first network, and the two numbers `nnetar()` used to scale the series.

```r
# Pull out the 9 weights of the first network and the scaling constants
net1 <- nn_fit$model[[1]]
w <- net1$wts
round(w, 4)
#> [1]  1.0290  0.2666  0.6055 -2.1960 -0.0017  0.7712 -3.3829  4.3015  4.8519

centre <- nn_fit$scalex$center
spread <- nn_fit$scalex$scale
round(c(centre, spread), 4)
#> [1] 245.9083  94.9421
```

`nnetar()` scales the series before fitting. It subtracts the mean, 245.9083, and divides by the standard deviation, 94.9421, so the inputs are small numbers centred on 0. The output therefore has to be scaled back at the end.

The 9 weights come in this order. For each hidden unit in turn: its bias, its weight on lag 1 and its weight on lag 12. Then the output unit's bias, and its weights on hidden unit 1 and hidden unit 2.

The drawing below puts each of the 9 weights on its connection.

```r
# Draw the 2-2-1 network with its 9 weights written on the connections
input_at  <- list(x = c(0.5, 0.5), y = c(2.1, 0.9))
hidden_at <- list(x = c(1.5, 1.5), y = c(2.1, 0.9))
output_at <- list(x = 2.5, y = 1.5)

plot(NULL, xlim = c(0, 3), ylim = c(0.2, 2.8), axes = FALSE, xlab = "", ylab = "")

# Connections from the two inputs to the two hidden units
edges <- list(c(1, 1, w[2]), c(1, 2, w[5]), c(2, 1, w[3]), c(2, 2, w[6]))
for (e in edges) {
  from_x <- input_at$x[e[1]]
  from_y <- input_at$y[e[1]]
  to_x   <- hidden_at$x[e[2]]
  to_y   <- hidden_at$y[e[2]]
  segments(from_x, from_y, to_x, to_y, col = "grey55")
  text(from_x + 0.3 * (to_x - from_x), from_y + 0.3 * (to_y - from_y) + 0.1,
       sprintf("%.4f", e[3]), cex = 0.75)
}

# Connections from the two hidden units to the output
for (j in 1:2) {
  segments(hidden_at$x[j], hidden_at$y[j], output_at$x, output_at$y, col = "grey55")
  text((hidden_at$x[j] + output_at$x) / 2, (hidden_at$y[j] + output_at$y) / 2 + 0.1,
       sprintf("%.4f", w[7 + j]), cex = 0.75)
}

# The units, with the bias of each hidden unit and of the output written beside it
points(c(input_at$x, hidden_at$x, output_at$x), c(input_at$y, hidden_at$y, output_at$y),
       pch = 21, cex = 6.5, bg = "white")
text(input_at$x, input_at$y, c("lag 1", "lag 12"), cex = 0.8)
text(hidden_at$x, hidden_at$y, c("h1", "h2"), cex = 0.9)
text(output_at$x, output_at$y, "output", cex = 0.8)
text(c(1.5, 1.5, 2.5), c(2.55, 0.45, 1.95), sprintf("bias %.4f", w[c(1, 4, 7)]), cex = 0.75)
```

Each hidden unit multiplies lag 1 and lag 12 by the weights on its two connections, adds its bias, and passes the total through the logistic function. The **logistic function**, 1 / (1 + exp(-z)), turns any number z into a value between 0 and 1.

The output unit does the same sum over the two hidden values, but it is **linear**: it passes the total on as it is, so the forecast can be any number. That is the "linear output units" line in the printout.

In numbers, hidden unit 1 is `logistic(1.0290 + 0.2666 * lag1 + 0.6055 * lag12)`, and hidden unit 2 is `logistic(-2.1960 - 0.0017 * lag1 + 0.7712 * lag12)`. To forecast January 1959, lag 1 is December 1958 (337) and lag 12 is January 1958 (340).

The block below scales those two values, runs both hidden units and the output, and scales the result back.

```r
# Compute the January 1959 forecast by hand from the 9 weights
logistic <- function(z) 1 / (1 + exp(-z))

inputs <- (c(337, 340) - centre) / spread
round(inputs, 4)
#> [1] 0.9594 0.9910

h1 <- logistic(w[1] + w[2] * inputs[1] + w[3] * inputs[2])
h2 <- logistic(w[4] + w[5] * inputs[1] + w[6] * inputs[2])
round(c(h1, h2), 4)
#> [1] 0.8682 0.1926

net_output <- w[7] + w[8] * h1 + w[9] * h2
round(net_output, 4)
#> [1] 1.286

# Scale the output back to thousands of passengers
round(net_output * spread + centre, 2)
#> [1] 368
```

The scaled inputs are 0.9594 and 0.9910. Hidden unit 1 gives 0.8682 and hidden unit 2 gives 0.1926. The output unit adds up to 1.286, and undoing the scaling gives 368 thousand passengers for January 1959.

`predict()` on the same network should give the same 1.286.

```r
# Check the hand computation against predict() on the same network
round(as.numeric(predict(net1, matrix(inputs, nrow = 1))), 4)
#> [1] 1.286
```

Notice that the weight on lag 1 for hidden unit 2 is -0.0017, almost zero. So hidden unit 2 depends almost only on lag 12, the value from a year earlier.

[KEY INSIGHT]
A forecast from `nnetar()` is this calculation and nothing else: scale the lagged values, run them through the hidden units and the output, and scale the result back. The forecast that `forecast()` returns is the average of 20 such networks.

=== step === widget
## Why nnetar averages 20 networks

The 368 came from one network. `nnetar()` fits 20 of them, and each one starts from its own random weights. Training moves the weights step by step to reduce the squared error. But where it stops depends on where it started, so the 20 networks do not end up with the same weights.

The block below gets the January 1959 forecast from each of the 20 networks separately, and counts how many land closer to the actual value than the average does.

```r
# Get the January 1959 forecast from each of the 20 networks separately
centre <- nn_fit$scalex$center
spread <- nn_fit$scalex$scale
inputs <- (c(337, 340) - centre) / spread

net_fc <- sapply(nn_fit$model, function(net) {
  predict(net, matrix(inputs, nrow = 1)) * spread + centre
})

round(range(net_fc), 1)
#> [1] 360.2 374.6
round(mean(net_fc), 1)
#> [1] 368.1
round(forecast(nn_fit, h = 1)$mean, 1)
#>        Jan
#> 1959 368.1
all.equal(mean(net_fc), as.numeric(forecast(nn_fit, h = 1)$mean))
#> [1] TRUE

# The actual January 1959 value, and the networks closer to it than the average
test[1]
#> [1] 360
sum(abs(net_fc - test[1]) < abs(mean(net_fc) - test[1]))
#> [1] 9
```

The 20 forecasts range from 360.2 to 374.6, and their mean, 368.1, is exactly the forecast that `forecast()` returns. The actual January 1959 value was 360. In all, 9 of the 20 networks came closer to it than the average did.

The chart below plots the 20 forecasts, one point per network, and switches to a boxplot of the same numbers.

::widget chart-plotter {"x":"network","y":"forecast","geoms":["point","boxplot"],"data":[{"x":1,"y":368.0,"fill":"20 networks"},{"x":2,"y":368.1,"fill":"20 networks"},{"x":3,"y":367.9,"fill":"20 networks"},{"x":4,"y":368.3,"fill":"20 networks"},{"x":5,"y":374.3,"fill":"20 networks"},{"x":6,"y":362.0,"fill":"20 networks"},{"x":7,"y":374.6,"fill":"20 networks"},{"x":8,"y":367.5,"fill":"20 networks"},{"x":9,"y":368.4,"fill":"20 networks"},{"x":10,"y":367.7,"fill":"20 networks"},{"x":11,"y":368.3,"fill":"20 networks"},{"x":12,"y":368.2,"fill":"20 networks"},{"x":13,"y":360.2,"fill":"20 networks"},{"x":14,"y":362.1,"fill":"20 networks"},{"x":15,"y":368.6,"fill":"20 networks"},{"x":16,"y":368.9,"fill":"20 networks"},{"x":17,"y":373.0,"fill":"20 networks"},{"x":18,"y":369.6,"fill":"20 networks"},{"x":19,"y":369.0,"fill":"20 networks"},{"x":20,"y":367.8,"fill":"20 networks"}],"code":{"point":"ggplot(net_df, aes(network, forecast)) +\n  geom_point() +\n  geom_hline(yintercept = mean(net_df$forecast), linetype = \"dashed\")","boxplot":"ggplot(net_df, aes(group, forecast)) +\n  geom_boxplot()"}}

Fourteen of the 20 networks land between 367.5 and 369.6. Three sit near 360 to 362, and three near 373 to 375. So the choice of starting weights spreads the forecasts of single networks over a range of 14.4 thousand passengers.

How much does averaging reduce that spread? The block below refits the model with seeds 1 to 6, once with a single network and once with 20 networks, and compares the January 1959 forecasts.

```r
# Refit with seeds 1 to 6 using one network, then 20 networks, and compare the forecasts
seed_forecast <- function(seed, repeats) {
  set.seed(seed)
  one_fit <- nnetar(train, repeats = repeats)
  as.numeric(forecast(one_fit, h = 1)$mean)
}

one_network     <- sapply(1:6, seed_forecast, repeats = 1)
twenty_networks <- sapply(1:6, seed_forecast, repeats = 20)

round(one_network, 1)
#> [1] 368.0 374.3 368.1 372.6 367.7 372.6
round(twenty_networks, 1)
#> [1] 368.1 368.1 369.0 368.4 369.5 369.7

round(diff(range(one_network)), 1)
#> [1] 6.5
round(diff(range(twenty_networks)), 1)
#> [1] 1.5
```

With a single network, the six forecasts run from 367.7 to 374.3, a range of 6.5. With 20 networks they run from 368.1 to 369.7, a range of 1.5. Every fit uses the same 108 rows, so the only thing that changes from one fit to the next is the starting weights.

So averaging does not pull the forecast toward the actual value. It makes the forecast depend much less on which starting weights happened to be drawn.

=== step === quiz
## Quick check: what does averaging 20 networks change?

All 20 networks are fitted to the same 108 rows and each has 2 hidden units. Which sentence describes what the average changes?

::quiz {"correct": 2, "gate": true, "difficulty": "beginner"}
- Each network is trained on a different resample of the rows, as in a random forest. ::no
- The forecast depends much less on which initial weights were drawn. ::ok Yes. The 20 networks differ only in their starting weights, and the forecast from 20 networks varied over a range of 1.5 across six seeds, against 6.5 for a single network.
- Each network has 20 hidden units instead of 2. ::no
- The average is always closer to the actual value than any single network. ::no The rows and the number of hidden units are the same in all 20 networks; only the starting weights differ. Averaging steadies the forecast across random starts, but it does not promise a better result for one month: 9 of the 20 networks were closer to the actual January 1959 value than their average.

=== step === concept
## How a 24-month forecast is built one month at a time

A network like this forecasts one month ahead: it takes lag 1 and lag 12 and returns the next month. To forecast 24 months, `nnetar()` feeds each forecast back in as the lag 1 input for the following month. This is called a **recursive forecast**.

The block below forecasts 3 months by hand, adding each forecast to the series before forecasting the next month.

```r
# Forecast 3 months by hand, feeding each forecast back in as the next lag 1
centre <- nn_fit$scalex$center
spread <- nn_fit$scalex$scale

net_forecast <- function(lag1, lag12) {
  scaled  <- (c(lag1, lag12) - centre) / spread
  outputs <- sapply(nn_fit$model, function(net) predict(net, matrix(scaled, nrow = 1)))
  mean(outputs) * spread + centre
}

values <- as.numeric(train)
for (month_ahead in 1:3) {
  next_value <- net_forecast(lag1  = values[length(values)],
                             lag12 = values[length(values) - 11])
  values <- c(values, next_value)
}

round(tail(values, 3), 1)
#> [1] 368.1 353.3 389.9
round(forecast(nn_fit, h = 3)$mean, 1)
#>        Jan   Feb   Mar
#> 1959 368.1 353.3 389.9
all.equal(tail(values, 3), as.numeric(forecast(nn_fit, h = 3)$mean))
#> [1] TRUE
```

The first pass forecasts January 1959 from lag 1 = 337 and lag 12 = 340. The second pass reads that January forecast as its lag 1, and February 1958 as its lag 12. The hand computation and `forecast()` agree on 368.1, 353.3 and 389.9, and `all.equal()` confirms they are the same numbers.

Lag 1 is always the previous forecast. Lag 12 is an observed value for the first 12 months ahead. From month 13 on, lag 12 is itself a forecast, so the second year of a 24-month forecast rests on forecasts of forecasts.

To score a forecast we need one number for the size of the misses. **RMSE**, the root mean squared error, squares each miss (actual minus forecast), averages the squares and takes the square root. It is in the units of the series, so here it is in thousands of passengers.

The block below forecasts all 24 holdout months and computes the RMSE over both years, then for 1959 and for 1960 separately.

```r
# Forecast the 24 holdout months and measure the miss with RMSE
rmse <- function(actual, predicted) sqrt(mean((actual - predicted)^2))

fc <- forecast(nn_fit, h = 24)

round(rmse(test, fc$mean), 1)
#> [1] 30.1
round(rmse(test[1:12], fc$mean[1:12]), 1)
#> [1] 20.2
round(rmse(test[13:24], fc$mean[13:24]), 1)
#> [1] 37.4
```

The holdout RMSE is 30.1, a typical miss of about 30 thousand passengers. It is 20.2 for 1959 and 37.4 for 1960, so the second year is worse than the first. That fits the fact that it rests on forecasts of forecasts.

Now let's look at the direction of the misses and the largest single miss.

```r
# Compare the average forecast with the average actual value, and find the largest miss
round(c(mean(fc$mean[1:12]), mean(fc$mean[13:24])), 1)
#> [1] 413.3 445.5
round(c(mean(test[1:12]), mean(test[13:24])), 1)
#> [1] 428.3 476.2

worst <- which.max(abs(test - fc$mean))
paste(month.abb[cycle(test)[worst]], floor(time(test)[worst]))
#> [1] "Jul 1960"
c(actual = test[worst], forecast = round(fc$mean[worst], 1))
#>   actual forecast
#>    622.0    546.6
```

On average the forecasts run low. The average forecast is 413.3 for 1959 and 445.5 for 1960, against actual averages of 428.3 and 476.2. The largest single miss is July 1960: the actual total was 622 and the forecast was 546.6, a miss of 75.4.

The plot below puts the 24-month forecast, dashed, next to the actual values.

```r
# Plot the 24-month forecast against the actual months
plot(window(AirPassengers, start = c(1957, 1)), lwd = 2,
     ylab = "Passengers (thousands)", xlab = "Year")
lines(fc$mean, col = "#1f7a55", lwd = 2, lty = 2)
abline(v = 1959, lty = 3)
legend("topleft", legend = c("Actual", "Forecast"), col = c("black", "#1f7a55"),
       lty = c(1, 2), lwd = 2, bty = "n")
```

The forecast follows the seasonal shape, with its peaks and dips in the right months. But its peaks are lower than the actual peaks, and the gap is widest in the summer of 1960.

=== step === concept
## What happens when the network gets bigger?

`nnetar()` lets you choose how many lags go in. More lags means more inputs and, by default, more hidden units, so more weights. First we measure how well the default network fits the months it was trained on.

```r
# Measure the in-sample residuals of the default network
resid_default <- residuals(nn_fit)

sum(!is.na(resid_default))
#> [1] 108
round(mean(resid_default^2, na.rm = TRUE), 1)
#> [1] 196.4
round(sd(resid_default, na.rm = TRUE), 2)
#> [1] 14.08
```

`residuals()` returns 120 values, and the first 12 are `NA` because those months have no lag 12. The mean of the squared residuals is the 196.4 printed with the fit. The standard deviation of the residuals is 14.08, and we will call it the in-sample residual SD: the typical size of a miss on months the network was fitted to.

The block below refits the network with p = 1, 3, 6 and 12 ordinary lags, and records the size of each network, its in-sample residual SD and its holdout RMSE.

```r
# Refit with more lags and compare the fit on the training months with the holdout error
sweep_rows <- lapply(c(1, 3, 6, 12), function(p) {
  set.seed(1)
  m <- nnetar(train, p = p)
  fc_m <- forecast(m, h = 24)
  data.frame(
    lags         = p,
    hidden       = m$size,
    weights      = length(m$model[[1]]$wts),
    insample_sd  = round(sd(residuals(m), na.rm = TRUE), 1),
    holdout_rmse = round(rmse(test, fc_m$mean), 1)
  )
})

capacity <- do.call(rbind, sweep_rows)
capacity
#>   lags hidden weights insample_sd holdout_rmse
#> 1    1      2       9        14.1         30.1
#> 2    3      2      13        12.6         51.7
#> 3    6      4      37         8.6         62.6
#> 4   12      6      85         3.3         70.7
```

The inputs are the p ordinary lags plus lag 12, so p = 1, 3 and 6 give 2, 4 and 7 inputs. For p = 12, lag 12 is already one of the ordinary lags, so there are 12 inputs and not 13.

The hidden units column follows the default rule, (inputs + 1) / 2, rounded. R rounds a half to the even number, so 4 inputs give 2, 7 inputs give 4 and 12 inputs give 6. The weights follow from the sizes: hidden * (inputs + 1) + (hidden + 1), which is 85 for 12 inputs and 6 hidden units.

Read the table from top to bottom. As the lags go from 1 to 12, the weights grow from 9 to 85 and the in-sample residual SD falls from 14.1 to 3.3. But the holdout RMSE rises from 30.1 to 70.7. The largest network has 85 weights and only 108 rows to fit them on.

One seed could be a coincidence. The block below repeats the sweep with seeds 2 and 3 and keeps only the holdout RMSE.

```r
# Repeat the sweep with seeds 2 and 3 and keep only the holdout RMSE
holdout_by_seed <- sapply(2:3, function(seed) {
  sapply(c(1, 3, 6, 12), function(p) {
    set.seed(seed)
    round(rmse(test, forecast(nnetar(train, p = p), h = 24)$mean), 1)
  })
})
colnames(holdout_by_seed) <- c("seed 2", "seed 3")
rownames(holdout_by_seed) <- c("p = 1", "p = 3", "p = 6", "p = 12")
holdout_by_seed
#>        seed 2 seed 3
#> p = 1    30.0   29.4
#> p = 3    49.5   51.2
#> p = 6    62.2   60.1
#> p = 12   71.6   71.2
```

The holdout RMSE rises with the number of lags under both seeds as well. The plot below puts both errors from the first sweep against the number of weights.

```r
# Plot the in-sample residual SD and the holdout RMSE against the number of weights
plot(capacity$weights, capacity$holdout_rmse, type = "b", pch = 19, col = "#b5631a",
     ylim = c(0, 80), xlab = "Number of weights", ylab = "Error (thousands of passengers)")
lines(capacity$weights, capacity$insample_sd, type = "b", pch = 19, col = "#1f7a55")
legend("topleft", legend = c("Holdout RMSE", "In-sample residual SD"),
       col = c("#b5631a", "#1f7a55"), pch = 19, lty = 1, bty = "n")
```

This is overfitting. With more weights the network follows the training months more closely, including movements that do not repeat in 1959 and 1960. The in-sample residual SD keeps falling, so it cannot tell you which network forecasts best. The holdout can.

=== step === concept
## How nnetar simulates prediction intervals

A forecast of 368 thousand passengers is a single number. A **prediction interval** is a range around it that should contain the actual value with a stated probability, such as 80%. A neural network has no formula for that range, so `nnetar()` builds it by simulation.

The simulation works like this:

1. Take the forecast for month 1, which is the average of the 20 networks.
2. Add a random error drawn from a normal distribution with mean 0 and an SD equal to the in-sample residual SD, 14.08. The sum is one simulated value for month 1.
3. Feed that simulated value in as lag 1 for month 2, forecast month 2 from the 20 networks, add a new random error, and continue to month 24. That is one simulated path.
4. Repeat for many paths. At each month the interval bounds are quantiles of the paths: the 10th and 90th percentiles for an 80% interval, and the 2.5th and 97.5th for a 95% interval.

`simulate()` with `future = TRUE` produces one path per call. The block below draws 5 of them.

```r
# Simulate 5 possible 24-month futures from the fitted networks
set.seed(3)
paths <- replicate(5, simulate(nn_fit, nsim = 24, future = TRUE))
paths_ts <- ts(paths, start = c(1959, 1), frequency = 12)

dim(paths)
#> [1] 24  5
round(paths[1:3, ], 1)
#>       [,1]  [,2]  [,3]  [,4]  [,5]
#> [1,] 354.6 361.3 361.7 382.5 361.6
#> [2,] 347.5 342.0 339.8 358.8 360.1
#> [3,] 392.7 404.6 398.2 393.9 403.9
```

`paths` has 24 rows, one per month, and 5 columns, one per path. In month 1 the five paths already run from 354.6 to 382.5.

The plot below draws the 5 paths after the last training months.

```r
# Plot the 5 simulated paths after the training months
ts.plot(window(train, start = c(1957, 1)), paths_ts,
        col = c("black", rep("#1f7a55", 5)), lwd = c(2, rep(1.5, 5)),
        ylab = "Passengers (thousands)", xlab = "Year")
```

Every path has the seasonal shape, and the paths spread apart because each one adds its own random errors.

Now let's look at the interval itself. `forecast()` returns no interval unless `PI = TRUE`, and `npaths` sets how many paths it simulates. The block below uses 100 paths. It prints the half-width of the 80% interval at months 1, 12 and 24, which is the upper bound minus the lower bound, divided by 2.

```r
# Forecast 24 months with simulated 80% and 95% prediction intervals
set.seed(2)
fc_pi <- forecast(nn_fit, h = 24, PI = TRUE, npaths = 100)

half_width <- (fc_pi$upper[, 1] - fc_pi$lower[, 1]) / 2
round(half_width[c(1, 12, 24)], 1)
#> [1] 17.7 17.3 25.2

# What errors alone would give: 1.2816 SDs on each side
resid_sd <- sd(residuals(nn_fit), na.rm = TRUE)
round(qnorm(0.9) * resid_sd, 1)
#> [1] 18
```

A normal distribution has 80% of its values within 1.2816 SDs of its mean, so errors with an SD of 14.08 give a half-width of 18. The simulated half-widths are 17.7 and 17.3 at months 1 and 12, and 25.2 at month 24. With 100 paths the bounds carry some simulation noise too. More paths smooth them and take proportionally longer to run.

An 80% interval that works should contain about 80% of the actual values, which is 19 of the 24 holdout months. The block below counts how many holdout months fall inside the 80% and the 95% interval.

```r
# Count the holdout months that fall inside each interval
inside_80 <- test >= fc_pi$lower[, 1] & test <= fc_pi$upper[, 1]
inside_95 <- test >= fc_pi$lower[, 2] & test <= fc_pi$upper[, 2]

sum(inside_80)
#> [1] 11
sum(inside_95)
#> [1] 16

# Actual minus forecast in December 1959 and December 1960
round((test - fc_pi$mean)[c(12, 24)], 1)
#> [1] 37.5 32.9
```

Only 11 of the 24 months (46%) fall inside the 80% interval, and 16 of 24 (67%) inside the 95% interval. In December 1959 and December 1960 the actual values are 37.5 and 32.9 above the forecast.

The plot below shows the forecast with its 80% interval (darker) and 95% interval (lighter), and the actual holdout months in red.

```r
# Plot the forecast with its intervals and the holdout months on top
plot(fc_pi, include = 36, ylab = "Passengers (thousands)", xlab = "Year", main = "")
lines(test, col = "red", lwd = 2)
```

The red line leaves the shaded area at the July 1960 peak, where the actual total was 622.

So what does this interval include? Only the random error from month to month, drawn at the in-sample residual SD. It leaves out two things:

- The uncertainty in the fitted function. The 20 networks are held fixed in every path, so a different training sample or different starting weights, which would give different networks, is not reflected.
- Holdout errors that are larger than the in-sample ones. The two errors above, 37.5 and 32.9, are more than twice the in-sample residual SD of 14.08.

[KEY INSIGHT]
The simulated interval has the width of the in-sample residual error. It shows how much random error is left after the fit, not how far a forecast can miss when the fitted function does not carry over to the coming months.

=== step === widget
## What a prediction interval is made of

Any fitted model has two sources of uncertainty. The first is the fitted function itself: it is estimated from a limited sample, so another sample would give a somewhat different function. The second is the random error around the function, which every new observation carries even when the function is exactly right.

A **confidence band** shows the first: where the fitted mean line could lie. A **prediction band** adds the second: where one new observation could land. The widget below draws both on a straight-line data set, and the slider sets how many points the line is fitted to.

The widget carries its own data, not the passengers series. Read its confidence band as the uncertainty in the fitted function, which for us is the 20 networks, and its prediction band as that plus the random error, which for us is the in-sample residual SD of 14.08.

::widget regression-intervals {}

At n = 20 the widget reports a confidence half-width of ±0.30 and a prediction half-width of ±1.35. Drag the slider to 300 and the confidence half-width falls to ±0.08, while the prediction half-width only moves to ±1.34.

More data estimates the function more precisely, so the confidence band shrinks toward the line. The random error stays the same size whatever n is, so the prediction band cannot shrink below it.

The simulated NNETAR interval includes only the random error. The 20 fitted networks are held fixed in every path, so nothing in it stands for the confidence band. Its width follows the in-sample residual SD, while the holdout RMSE in the second year is 37.4.

=== step === concept
## Does NNETAR beat ETS on this series?

So far one holdout period has decided everything, and one period is a single test. A **rolling-origin evaluation** repeats the test. At each forecast origin, the last month the model may use, we refit on the data up to that origin and forecast the next 12 months. Then the origin moves forward a year and we do it again.

We use 7 origins, from December 1953 to December 1959, and compare three methods:

- **NNETAR**, the network from this lesson, with `set.seed(1)` before each fit.
- **ETS**, an exponential smoothing state space model with three components: error, trend and seasonal. `ets()` tries the possible forms and keeps the one with the lowest AICc, an AIC corrected for small samples.
- **Seasonal naive**, `snaive()`, which forecasts each month with the value from the same month one year earlier. It is the simplest benchmark: a method that cannot beat it adds nothing.

The block below refits all three at each origin and collects the 12 forecast errors of each. It refits 7 networks and 7 ETS models, so it takes a few seconds.

```r
# Refit NNETAR, ETS and seasonal naive at each origin and collect their 12-month errors
origin_errors <- function(origin_year) {
  train_o <- window(AirPassengers, end = c(origin_year, 12))
  test_o  <- window(AirPassengers, start = c(origin_year + 1, 1), end = c(origin_year + 1, 12))

  set.seed(1)
  nn_o  <- nnetar(train_o)
  ets_o <- ets(train_o)

  forecasts <- list(
    nnetar = forecast(nn_o, h = 12)$mean,
    ets    = forecast(ets_o, h = 12)$mean,
    snaive = snaive(train_o, h = 12)$mean
  )

  rows <- lapply(names(forecasts), function(method) {
    data.frame(origin = origin_year, method = method, h = 1:12,
               error = as.numeric(test_o) - as.numeric(forecasts[[method]]))
  })
  do.call(rbind, rows)
}

errs <- do.call(rbind, lapply(1953:1959, origin_errors))
dim(errs)
#> [1] 252   4
```

`errs` has one row per origin, method and forecast month h, which is 7 * 3 * 12 = 252 rows. Its `error` column is the actual value minus the forecast.

ETS chooses its form again at every origin. The block below shows which form it chose.

```r
# Show which ETS form was chosen at each of the 7 origins
ets_labels <- sapply(1953:1959, function(origin_year) {
  ets(window(AirPassengers, end = c(origin_year, 12)))$method
})
table(ets_labels)
#> ets_labels
#>  ETS(M,A,M) ETS(M,Ad,M)
#>           1           6
```

ETS(M,Ad,M) means a multiplicative error, an additive trend that is damped, and a multiplicative seasonal component. It was chosen at 6 of the 7 origins.

Now we compute the RMSE of each method at each origin, over the 12 forecast months.

```r
# Compute the 12-month RMSE at each origin for the three methods
rmse_by_origin <- aggregate(error ~ origin + method, data = errs,
                            FUN = function(e) sqrt(mean(e^2)))
rmse_wide <- unstack(rmse_by_origin, error ~ method)
rownames(rmse_wide) <- 1953:1959

round(rmse_wide, 1)
#>       ets nnetar snaive
#> 1953 24.3   21.8   19.7
#> 1954 30.3   25.5   45.9
#> 1955 16.8   18.8   45.2
#> 1956 24.4   17.4   41.5
#> 1957 21.3   38.9   17.0
#> 1958 50.8   20.2   49.3
#> 1959 27.4   16.8   50.7
round(colMeans(rmse_wide), 1)
#>    ets nnetar snaive
#>   27.9   22.8   38.5
sum(rmse_wide$nnetar < rmse_wide$ets)
#> [1] 5
```

NNETAR has the lower RMSE than ETS at 5 of the 7 origins, and the lower mean RMSE: 22.8 against 27.9, with seasonal naive at 38.5. It loses at the 1955 and 1957 origins, and its RMSE of 38.9 at 1957 is its worst result. So NNETAR wins more often than it loses here, but not every time.

The RMSE over 12 months hides how the errors change with the forecast month. The block below compares the methods at 1 month and at 12 months ahead, and also averages the errors themselves.

```r
# Compare the methods at 1 and 12 months ahead, and by average error
rmse_h <- function(h) {
  round(tapply(errs$error[errs$h == h], errs$method[errs$h == h],
               function(e) sqrt(mean(e^2))), 1)
}
rmse_h(1)
#>    ets nnetar snaive
#>    7.9   15.1   34.9
rmse_h(12)
#>    ets nnetar snaive
#>   29.7   27.3   38.2

# Mean error, actual minus forecast, over the 84 forecasts of each method
round(tapply(errs$error, errs$method, mean), 1)
#>    ets nnetar snaive
#>   17.1   -3.3   35.9
```

One month ahead, ETS is better: its RMSE is 7.9 against 15.1. Twelve months ahead the order flips, with NNETAR at 27.3 and ETS at 29.7.

The mean error is actual minus forecast, so a positive mean means the forecasts run low. ETS averages +17.1, which means its forecasts were too low, and NNETAR averages -3.3, which means its forecasts were slightly too high. Seasonal naive, at +35.9, is too low by the most.

The plot below shows the RMSE of each method at each origin.

```r
# Plot the 12-month RMSE at each origin for the three methods
matplot(1953:1959, rmse_wide[, c("nnetar", "ets", "snaive")], type = "b", pch = 19, lty = 1,
        col = c("#1f7a55", "#b5631a", "grey50"), ylim = c(15, 60),
        xlab = "Forecast origin (December of the year)",
        ylab = "12-month RMSE (thousands of passengers)")
legend("top", legend = c("nnetar", "ets", "snaive"), col = c("#1f7a55", "#b5631a", "grey50"),
       pch = 19, lty = 1, horiz = TRUE, bty = "n")
```

[WARNING]
This is one series and 7 origins. It shows how to run the comparison and what it looked like here: NNETAR ahead on 12-month RMSE at 5 of 7 origins, ETS ahead at 1 month. It is not a general verdict on either method.

=== step === quiz
## Quick check: why does the 80% interval miss so often?

Only 11 of the 24 holdout months fell inside the simulated 80% interval. Which explanation fits what the simulation includes and leaves out?

::quiz {"correct": 2, "gate": true, "difficulty": "intermediate"}
- The simulation used only 100 paths, which is too few to place the bounds. ::no
- The interval's width follows the in-sample residual SD, about 18 on each side at 80%, while the holdout RMSE is 30.1. ::ok Yes. The paths add random error at the size the network showed on its training months, and nothing for the 20 fitted networks being held fixed. The holdout RMSE of 30.1, and the December misses of 37.5 and 32.9, are well beyond a half-width of 18.
- `nnetar()` should average more than 20 networks. ::no
- A bigger network would shrink the errors and fix the coverage. ::no None of these fixes it. The half-widths at months 1, 12 and 24 were 17.7, 17.3 and 25.2, short of the December misses of 37.5 and 32.9, so the number of paths was not the problem. Averaging more networks steadies the point forecast, but the interval's width still comes from the in-sample residual SD. A bigger network lowers that SD (14.1 to 3.3 at 85 weights), so the interval would get narrower while the holdout error grows.

=== step === tryit
## Your turn: which forecasts the holdout better, a bigger network or ETS?

`train`, `test` and `rmse()` are still in your session. The default network had an in-sample residual SD of 14.1 and a holdout RMSE of 30.1.

Refit the network with 8 hidden units instead of 2, using `set.seed(1)`, and fit `ets()` on the same training months. Then compute the holdout RMSE over the 24 months for each of them, and the in-sample residual SD for the network.

```r
# train, test and rmse() are in your session.
# The default network had an in-sample residual SD of 14.1 and a holdout RMSE of 30.1.
# Refit the network with 8 hidden units (set the seed first), and fit ETS on the training months.
# Print the network's in-sample residual SD and its holdout RMSE over 24 months.
# Print the ETS holdout RMSE over 24 months. Press Check when you have them.
```
::check {"regex": "^(?=[\\s\\S]*nnetar[(]\\s*(y\\s*=\\s*)?train\\s*,\\s*size\\s*=\\s*8)(?=[\\s\\S]*ets[(]\\s*(y\\s*=\\s*)?train\\b)", "gate": true, "difficulty": "intermediate", "ok": "Yes. The 8-unit network has 33 weights, an in-sample residual SD of 12.5 and a holdout RMSE of 39.4. ETS gets 72.5 on the same holdout. Neither beats the default network's 30.1.", "no": "Set the seed, then refit with `nnetar(train, size = 8)`, and fit ETS with `ets(train)`. Pass each 24-month forecast to `rmse(test, ...)` to get the holdout RMSE."}
::solution
```r
# Refit with 8 hidden units, fit ETS, and compare the holdout RMSE of each
set.seed(1)
fit8 <- nnetar(train, size = 8)
length(fit8$model[[1]]$wts)
#> [1] 33
round(sd(residuals(fit8), na.rm = TRUE), 1)
#> [1] 12.5
round(rmse(test, forecast(fit8, h = 24)$mean), 1)
#> [1] 39.4

ets_fit <- ets(train)
ets_fc  <- forecast(ets_fit, h = 24)$mean
round(rmse(test, ets_fc), 1)
#> [1] 72.5
round(c(year1 = rmse(test[1:12], ets_fc[1:12]), year2 = rmse(test[13:24], ets_fc[13:24])), 1)
#> year1 year2
#>  50.8  89.1
```

The 8-unit network has 33 weights. It fits the training months a little tighter than the default network (12.5 against 14.1) and forecasts the holdout worse (39.4 against 30.1), the same pattern as in the sweep over lags.

ETS has the largest holdout RMSE of the three, 72.5, and its second year is much worse than its first: 89.1 against 50.8. Over 12-month windows ETS averaged 27.9 in the rolling comparison. So the longer horizon is where it falls furthest behind the network on this series.

=== step === concept
## References

- [Forecasting: Principles and Practice, 3rd edition](https://otexts.com/fpp3/) - Hyndman and Athanasopoulos. The chapter on neural network models describes NNAR(p,P,k)[m], the model `nnetar()` fits.
- [The forecast package](https://pkg.robjhyndman.com/forecast/) - Hyndman and colleagues. The help pages for `nnetar()` and `forecast.nnetar()` document the defaults for p, P, the hidden units, the 20 repeats and the simulated prediction intervals.
- [Modern Applied Statistics with S, 4th edition](https://doi.org/10.1007/978-0-387-21706-2) - Venables and Ripley (2002), Springer. The book behind the nnet package, which fits each network.
- [Forecasting with artificial neural networks: the state of the art](https://doi.org/10.1016/S0169-2070(97)00044-7) - Zhang, Patuwo and Hu (1998), International Journal of Forecasting 14(1), 35-62.
- [Statistical and machine learning forecasting methods: concerns and ways forward](https://doi.org/10.1371/journal.pone.0194889) - Makridakis, Spiliotis and Assimakopoulos (2018), PLOS ONE 13(3).

=== step === complete
## Quick recap

You opened up `nnetar()`, computed a forecast from its weights by hand, and tested it against ETS on the same series. To summarize:

- `nnetar()` turns the series into 108 rows, each a target month with its lag 1 and lag 12 values, and fits networks with 2 hidden units and 9 weights each.
- One network's forecast is a short calculation: scale the two inputs, run the 2 hidden units and the output, and scale back. That gave 368 for January 1959.
- The forecast is the average of 20 networks fitted from different random starting weights. For seeds 1 to 6, single-network forecasts spread over 6.5 thousand passengers, and averaged forecasts over 1.5.
- A 24-month forecast is recursive, and here the second year was worse than the first (RMSE 20.2, then 37.4). More lags fit the training months better (in-sample residual SD 14.1 down to 3.3) and forecast the holdout worse (RMSE 30.1 up to 70.7).
- The simulated prediction interval adds random error at the in-sample residual SD and holds the 20 networks fixed. Its 80% interval contained 11 of the 24 holdout months.
- Against ETS over 7 rolling origins, NNETAR had the lower 12-month RMSE at 5 of them (mean 22.8 against 27.9), and ETS had the lower 1-month RMSE (7.9 against 15.1). That is one series, not a general verdict.

The next lesson covers DeepAR, N-BEATS and N-HiTS, the deep learning forecasters, from architecture diagrams and a small network built by hand.

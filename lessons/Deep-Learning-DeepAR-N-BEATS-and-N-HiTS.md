---
title: "Machine Learning and Deep Forecasting Lesson 5: How DeepAR, N-BEATS and N-HiTS forecast"
slug: "Deep-Learning-DeepAR-N-BEATS-and-N-HiTS"
description: "See what DeepAR, N-BEATS and N-HiTS each change in a neural forecaster, using 8 Australian takeaway food series, and score them against seasonal naive in R."
keywords: "DeepAR, N-BEATS, N-HiTS, deep learning forecasting, probabilistic forecasting, neural forecasting, negative log-likelihood, sample paths, time series in R"
mathjax: true
webr: true
date: "2026-09-27"
post_type: "LESSON"
course_id: "ts-ml"
course_title: "Machine Learning and Deep Forecasting"
course_lesson: "5"
course_total: "7"
course_landing: "Machine-Learning-and-Deep-Forecasting-Course.html"
course_prev: "Neural-Network-Forecasts-NNETAR"
course_next: "Temporal-Fusion-Transformers"
curriculum_id: "5.130.5"
lesson_access: "pro"
catalog_blurb: "How three deep forecasters differ, and how to check them against a naive benchmark."
---

=== step === cover
## How DeepAR, N-BEATS and N-HiTS forecast

Today let's see what DeepAR, N-BEATS and N-HiTS each change in a neural network to forecast a time series, and how to check whether that change actually helps.

Suppose you plan stock for a takeaway food chain in Australia. You need to forecast the monthly takeaway food turnover, which is the total sales of takeaway food outlets, for each of 8 states and territories. The forecast has to reach 12 months ahead, and the unit is million Australian dollars.

The numbers come from the Australian Bureau of Statistics retail trade survey. There is one monthly series per state, from April 1982 to December 2018. We will train on the data up to December 2017 and keep the 12 months of 2018 aside. That way, every forecast can be checked against what really happened.

The chart below shows one of the eight series, New South Wales (NSW), for the three years 2015 to 2017. Turnover climbs from one year to the next, and inside each year the same shape repeats: February is the lowest month and December the highest.

All 8 series have this kind of shape, at very different levels. We will forecast them with one neural network, and each of the three models changes one part of that network:

- DeepAR forecasts a probability distribution for each month, instead of a single number.
- N-BEATS builds the forecast from a chain of blocks, where each block explains part of the series and passes the rest on.
- N-HiTS is N-BEATS with a smaller input and a smaller output in each block, so that it stays cheap on long horizons.

::widget chart-plotter {"geoms": ["line", "bar"], "x": "month", "y": "turnover", "data": [{"x": 1, "y": 465}, {"x": 2, "y": 398.4}, {"x": 3, "y": 456.8}, {"x": 4, "y": 450.2}, {"x": 5, "y": 451.4}, {"x": 6, "y": 449}, {"x": 7, "y": 483.6}, {"x": 8, "y": 475.8}, {"x": 9, "y": 491.1}, {"x": 10, "y": 508.9}, {"x": 11, "y": 492.8}, {"x": 12, "y": 538.5}, {"x": 13, "y": 483.9}, {"x": 14, "y": 454.5}, {"x": 15, "y": 491.5}, {"x": 16, "y": 503.1}, {"x": 17, "y": 498.5}, {"x": 18, "y": 491.4}, {"x": 19, "y": 538.7}, {"x": 20, "y": 552.4}, {"x": 21, "y": 569.2}, {"x": 22, "y": 575.1}, {"x": 23, "y": 576}, {"x": 24, "y": 627.6}, {"x": 25, "y": 568.9}, {"x": 26, "y": 491.2}, {"x": 27, "y": 547}, {"x": 28, "y": 547.9}, {"x": 29, "y": 538}, {"x": 30, "y": 531.9}, {"x": 31, "y": 554.8}, {"x": 32, "y": 549.3}, {"x": 33, "y": 565.7}, {"x": 34, "y": 574.8}, {"x": 35, "y": 555.6}, {"x": 36, "y": 607.7}]}

Switch between the line and the bars above and look at how the yearly pattern sits on top of the upward climb.

=== step === concept
## Turning eight series into training windows

A neural network learns from examples. Here, one example is a pair: 24 past months as the input, and the 12 months right after them as the target. We cut these pairs out of the series and call each one a training window. The 24 months the network looks back on are the lookback, and the 12 months it forecasts are the horizon.

The first code block loads the takeaway food series, splits off the 12 months of 2018, and prints each state's average monthly turnover in the training period.

```r
# Load the takeaway food series for the 8 states and hold out the 12 months of 2018
library(tsibbledata)

retail <- as.data.frame(aus_retail)
takeaway <- retail[retail$Industry == "Takeaway food services", ]
state_code <- c(
  "Australian Capital Territory" = "ACT", "New South Wales" = "NSW",
  "Northern Territory" = "NT", "Queensland" = "QLD",
  "South Australia" = "SA", "Tasmania" = "TAS",
  "Victoria" = "VIC", "Western Australia" = "WA"
)
takeaway$state <- unname(state_code[takeaway$State])
states <- unname(state_code)

series <- list()
train <- list()
test <- list()
for (s in states) {
  rows <- takeaway[takeaway$state == s, ]
  rows <- rows[order(rows$Month), ]
  series[[s]] <- rows$Turnover
  train[[s]] <- head(rows$Turnover, -12)   # everything up to December 2017
  test[[s]] <- tail(rows$Turnover, 12)     # the 12 months of 2018
}

# Number of training months, then average monthly turnover in million Australian dollars
sapply(train, length)
#> ACT NSW  NT QLD  SA TAS VIC  WA
#> 429 429 357 429 429 429 429 429
round(sapply(train, mean), 1)
#>   ACT   NSW    NT   QLD    SA   TAS   VIC    WA
#>  11.6 239.2  10.6 159.7  48.5  14.6 164.3  73.1
round(mean(train$NSW) / mean(train$NT), 1)
#> [1] 22.6
```

NSW averages 239.2 million a month and the Northern Territory (NT) 10.6 million, so NSW is 22.6 times the size of NT. NT also has fewer months, because its series starts in April 1988.

One network has to learn from all eight series. But the squared error would be dominated by the big states, because a 5% miss on NSW is a much larger number than a 5% miss on NT. So we divide each window by the mean of its 24 input months, and subtract 1. A scaled value of 0 then means the average of that window, and -0.10 means 10% below it.

The network now sees only the shape of a window, whichever state it comes from. To get a forecast back in million dollars, we add 1 and multiply by the same window mean.

We slide the window one month at a time over the last 180 training months, January 2003 to December 2017. Every state has at least that much history, and 15 years keeps the training fast. Each state gives 145 windows: 180 months, minus the 24 of the input and the 12 of the target, plus 1.

The next block builds the 1,160 windows (8 states times 145) and prints the size of the input matrix X and the target matrix Y.

```r
# Build 1,160 training windows: 24 scaled months in, the next 12 scaled months out
n_train_months <- 180
lookback <- 24
horizon <- 12
n_windows <- n_train_months - lookback - horizon + 1

X_rows <- list()
Y_rows <- list()
window_state <- character(0)
for (s in states) {
  last_180 <- tail(train[[s]], n_train_months)
  for (i in seq_len(n_windows)) {
    input <- last_180[i:(i + lookback - 1)]
    target <- last_180[(i + lookback):(i + lookback + horizon - 1)]
    window_mean <- mean(input)
    X_rows[[length(X_rows) + 1]] <- input / window_mean - 1
    Y_rows[[length(Y_rows) + 1]] <- target / window_mean - 1
    window_state <- c(window_state, s)
  }
}
X <- do.call(rbind, X_rows)
Y <- do.call(rbind, Y_rows)

# Size of X and Y, then the first three scaled values of the first NSW window
dim(X)
#> [1] 1160   24
dim(Y)
#> [1] 1160   12
round(X[window_state == "NSW", ][1, 1:3], 3)
#> [1] -0.080 -0.260 -0.178
```

Each row of X is one window of 24 scaled months, and the same row of Y holds the 12 scaled months that followed it. The first NSW window starts in January 2003. That month is 8.0% below the average of its 24 months, and February 2003 is 26.0% below it.

=== step === concept
## What a one-hidden-layer network computes

The base network has 24 inputs, a hidden layer of 16 units, and 12 outputs, one for each month to forecast. Each hidden unit takes a weighted sum of the 24 inputs and adds a bias, which is a constant that is also learned. It then passes the result through tanh, which squeezes any number into the range -1 to 1.

The output layer does the same with the 16 hidden values, but without the tanh. Each of the 12 outputs is a weighted sum plus a bias.

\[ \text{hidden} = \tanh(X W_1 + b_1), \qquad \text{output} = \text{hidden}\, W_2 + b_2 \]

W1 holds 24 by 16 weights and W2 holds 16 by 12. With the 16 and 12 biases, that is 384 + 192 + 28 = 604 weights, and training has to find all of them.

The block below draws random starting weights, runs the forward pass on all 1,160 windows, and prints the number of weights and the shape of the output.

```r
# Draw random weights for a 24-16-12 network and run the forward pass on every window
set.seed(1)
init_weights <- function(n_in, n_hidden, n_out) {
  list(
    W1 = matrix(rnorm(n_in * n_hidden, sd = 0.3), n_in, n_hidden),
    b1 = rep(0, n_hidden),
    W2 = matrix(rnorm(n_hidden * n_out, sd = 0.3), n_hidden, n_out),
    b2 = rep(0, n_out)
  )
}
run_net <- function(w, X) {
  hidden <- tanh(sweep(X %*% w$W1, 2, w$b1, "+"))
  output <- sweep(hidden %*% w$W2, 2, w$b2, "+")
  list(hidden = hidden, output = output)
}

net0 <- init_weights(24, 16, 12)
sum(sapply(net0, length))
#> [1] 604
fwd <- run_net(net0, X)
dim(fwd$output)
#> [1] 1160   12
```

To say how good an output is, we use the mean squared error: the average of (output minus target) squared, over every window and every one of the 12 months. This is the loss, and training tries to make it small.

But small compared with what? The next block compares the loss of the untrained network with the loss of a constant forecast that says every month equals the window average, which is 0 on the scaled data.

```r
# Mean squared error of the untrained network, and of always forecasting the window mean
mse <- function(output, target) mean((output - target)^2)
round(mse(fwd$output, Y), 4)
#> [1] 0.0563
round(mse(0, Y), 4)
#> [1] 0.0302
```

The untrained network scores 0.0563, which is worse than the constant forecast at 0.0302. So training has to bring the loss well below 0.0302 before the network is worth using.

This is the base network. "Deep" means more layers, or more blocks like this one, stacked. DeepAR, N-BEATS and N-HiTS keep that idea and each changes one part of it. DeepAR changes the output, N-BEATS changes how the blocks are wired, and N-HiTS changes how finely each block reads its input and writes its output.

=== step === concept
## How to train the network and score it against seasonal naive

Training means finding the weights that make the loss small. For that we need the gradient: for every weight, how much the loss changes if that weight goes up a little. Backpropagation computes all the gradients by working backwards from the output error to the weights, using the chain rule. In matrix form it is one line for each group of weights: W2, b2, W1 and b1.

The block below defines backpropagation, the gradient of the squared-error loss, and the Adam training loop.

```r
# Backpropagation, the squared-error gradient, and the Adam training loop
backprop <- function(w, X, hidden, d_out) {
  d_hidden <- (d_out %*% t(w$W2)) * (1 - hidden^2)
  list(
    W2 = t(hidden) %*% d_out,
    b2 = colSums(d_out),
    W1 = t(X) %*% d_hidden,
    b1 = colSums(d_hidden)
  )
}

mse_grad <- function(w, X, Y) {
  fwd <- run_net(w, X)
  err <- fwd$output - Y
  d_out <- 2 * err / length(err)
  list(loss = mean(err^2), grad = backprop(w, X, fwd$hidden, d_out))
}

fit_net <- function(w, X, Y, grad_fn, epochs = 300, lr = 0.01) {
  avg_grad <- lapply(w, function(p) p * 0)
  avg_sq <- lapply(w, function(p) p * 0)
  losses <- numeric(epochs)
  for (epoch in seq_len(epochs)) {
    step <- grad_fn(w, X, Y)
    losses[epoch] <- step$loss
    for (k in names(w)) {
      g <- step$grad[[k]]
      avg_grad[[k]] <- 0.9 * avg_grad[[k]] + 0.1 * g
      avg_sq[[k]] <- 0.999 * avg_sq[[k]] + 0.001 * g^2
      g_hat <- avg_grad[[k]] / (1 - 0.9^epoch)
      sq_hat <- avg_sq[[k]] / (1 - 0.999^epoch)
      w[[k]] <- w[[k]] - lr * g_hat / (sqrt(sq_hat) + 1e-8)
    }
  }
  list(w = w, losses = losses)
}
```

Plain gradient descent moves every weight by the learning rate times its gradient. Adam adapts the step to each weight. It keeps a running average of each weight's gradient and of its squared gradient, and divides the first by the square root of the second. So a weight whose gradient keeps the same sign takes steady steps, and a weight whose gradient keeps flipping sign takes smaller ones.

We run it for 300 epochs with a learning rate of 0.01. An epoch is one pass over the training windows. Every update here uses all 1,160 windows, so 300 epochs means 300 updates.

```r
# Train the 604 weights and print the loss at epochs 1, 10, 50, 100 and 300
fit <- fit_net(net0, X, Y, mse_grad)
net <- fit$w
round(fit$losses[c(1, 10, 50, 100, 300)], 4)
#> [1] 0.0563 0.0228 0.0132 0.0125 0.0122
```

The loss falls from 0.0563 to 0.0122, well under the 0.0302 of the constant forecast. Most of the fall happens in the first 50 epochs.

A low training loss only says the network fits the windows it learned from. What we care about is 2018, which the network has never seen. So we need a score for a forecast, and a benchmark to compare that score with.

The score is MAPE, the mean absolute percentage error. For each of the 12 months, take the absolute error divided by the actual value. Then average the 12 numbers and multiply by 100. It is a percentage, so it can be compared across states of very different sizes.

The benchmark is seasonal naive, which forecasts each month of 2018 with the same month of 2017. It has no parameters to fit, so any model that costs more should beat it to be worth the extra work.

The block below forecasts 2018 for each state with the network and with seasonal naive. The network's forecast is its output for the state's last 24 training months, plus 1, times the window mean.

```r
# Forecast 2018 for each state with the network and with seasonal naive
mape <- function(actual, forecast) mean(abs(actual - forecast) / abs(actual)) * 100

fc_net <- list()
fc_sn <- list()
for (s in states) {
  last_window <- tail(train[[s]], lookback)
  window_mean <- mean(last_window)
  scaled_window <- matrix(last_window / window_mean - 1, nrow = 1)
  fc_net[[s]] <- (run_net(net, scaled_window)$output[1, ] + 1) * window_mean
  fc_sn[[s]] <- tail(train[[s]], 12)    # the same month of 2017
}
```

Now the MAPE of both forecasts for every state, with the mean over the 8 states in the last row.

```r
# MAPE against the 2018 actuals: the network and seasonal naive, by state
mape_net <- sapply(states, function(s) mape(test[[s]], fc_net[[s]]))
mape_sn <- sapply(states, function(s) mape(test[[s]], fc_sn[[s]]))
mape_table <- data.frame(
  state = c(states, "mean"),
  network = round(c(mape_net, mean(mape_net)), 2),
  seasonal_naive = round(c(mape_sn, mean(mape_sn)), 2)
)
print(mape_table, row.names = FALSE)
#>  state network seasonal_naive
#>    ACT    6.93           7.67
#>    NSW    2.64           2.57
#>     NT    2.38           5.71
#>    QLD    6.62           1.99
#>     SA    9.81           3.92
#>    TAS    7.18           4.34
#>    VIC    5.50           4.61
#>     WA    6.24           2.33
#>   mean    5.91           4.14
```

The network's mean MAPE is 5.91% and seasonal naive's is 4.14%. The network is ahead in 2 of the 8 states (ACT and NT) and behind in the other 6. So on this holdout, last year's values are the better forecast.

This comes from one 12-month holdout per state, so it is a rough comparison. But it is the one every later model in this lesson is compared against.

=== step === concept
## What does DeepAR output, and what loss does it minimize?

The network above gives one number per month, and nothing in it says how large the error of that number is likely to be. DeepAR changes exactly this. For the next month, the network outputs a probability distribution instead of a number.

For real-valued series like turnover, the distribution is Gaussian, which is the normal distribution. So the network outputs two numbers: the mean μ and the standard deviation σ. For count data, the DeepAR paper uses a negative binomial distribution instead.

Two more parts of DeepAR carry over to what we build here:

- One set of weights is trained on all the series together, as we did with the 1,160 windows.
- Each series is divided by a scale taken from its own window, so series of very different sizes can share those weights. The paper divides by 1 plus the mean of the window, and we divide by the window mean.

The network inside DeepAR is an LSTM, a recurrent network that reads the months one at a time and carries a hidden state forward. We use the 24-16 network from before as a stand-in. It has 2 outputs, μ and log σ, for the next single month (taking the exponential of log σ keeps σ positive). Then the only things that change are the output and the loss.

How do we train a network that outputs a distribution? We take the actual value and ask how likely it is under the Gaussian that the network output. Training makes that likelihood high. Minus the logarithm of the likelihood is the negative log-likelihood (NLL), and it is the loss to minimize. With y as the actual scaled value:

\[ \text{NLL} = \tfrac{1}{2}\log(2\pi) + \log\sigma + \frac{(y - \mu)^2}{2\sigma^2} \]

Lower is better. The log σ term is a penalty on a wide σ, and the last term is a penalty on an error that is large compared with σ.

Take NSW in January 2018. The 24 months before it average 541.45 million, and the actual value was 541.9, which scaled is 0.0008. The block below puts the mean at 0.04 and computes the NLL for three values of σ.

```r
# Gaussian negative log-likelihood of NSW January 2018 for three values of sigma
nsw_window_mean <- mean(tail(train$NSW, lookback))
nsw_actual <- test$NSW[1]
nsw_scaled <- nsw_actual / nsw_window_mean - 1
round(c(window_mean = nsw_window_mean, actual = nsw_actual, scaled = nsw_scaled), 4)
#> window_mean      actual      scaled
#>    541.4458    541.9000      0.0008

gaussian_nll <- function(target, mu, sigma) {
  0.5 * log(2 * pi) + log(sigma) + (target - mu)^2 / (2 * sigma^2)
}
sigma_grid <- c(0.005, 0.05, 0.3)
round(gaussian_nll(nsw_scaled, mu = 0.04, sigma = sigma_grid), 2)
#> [1] 26.29 -1.77 -0.28
```

The error is 0.04 minus 0.0008, which is 0.0392. A σ of 0.005 is almost 8 times smaller than that error, so the last term blows up and the NLL is 26.29. A σ of 0.3 avoids the big error penalty, but the log σ term penalizes the wide spread, giving -0.28. The lowest value, -1.77, comes at σ = 0.05, close to the size of the error.

So minimizing the NLL over many windows pushes σ towards the typical size of the error at that kind of window. That is why the σ the network outputs measures how large its errors typically are.

To train the stand-in, we need one-step windows: 24 scaled months in and the next single scaled month out. From the same 180 months, each state gives 156 of them, so 1,248 in all.

```r
# Build one-step windows: 24 scaled months in, the next scaled month out
X1_rows <- list()
y1 <- numeric(0)
for (s in states) {
  last_180 <- tail(train[[s]], n_train_months)
  for (i in seq_len(n_train_months - lookback)) {
    input <- last_180[i:(i + lookback - 1)]
    window_mean <- mean(input)
    X1_rows[[length(X1_rows) + 1]] <- input / window_mean - 1
    y1 <- c(y1, last_180[i + lookback] / window_mean - 1)
  }
}
X1 <- do.call(rbind, X1_rows)
dim(X1)
#> [1] 1248   24
```

Next comes the gradient of the NLL with respect to μ and log σ. It plugs into the same backprop function and the same Adam loop as before, so only the loss is new.

```r
# Train the network with two outputs (mean and log sigma) on the negative log-likelihood
nll_grad <- function(w, X, target) {
  fwd <- run_net(w, X)
  mu <- fwd$output[, 1]
  log_sigma <- fwd$output[, 2]
  err <- target - mu
  nll <- 0.5 * log(2 * pi) + log_sigma + err^2 / (2 * exp(2 * log_sigma))
  d_mu <- -err / exp(2 * log_sigma) / length(target)
  d_log_sigma <- (1 - err^2 / exp(2 * log_sigma)) / length(target)
  d_out <- cbind(d_mu, d_log_sigma)
  list(loss = mean(nll), grad = backprop(w, X, fwd$hidden, d_out))
}

set.seed(1)
dnet0 <- init_weights(24, 16, 2)
dfit <- fit_net(dnet0, X1, y1, nll_grad)
dnet <- dfit$w
round(dfit$losses[c(1, 10, 50, 100, 300)], 3)
#> [1]  0.952  0.281 -1.402 -1.489 -1.591
```

The NLL falls from 0.952 to -1.591 over the 300 epochs. The next block prints the σ the trained network outputs for the 1,248 windows, the standard deviation of the scaled target, and the standard deviation of the errors that μ leaves.

```r
# The sigma the trained network outputs, the spread of the target, and the spread of the errors of mu
sigma_hat <- exp(run_net(dnet, X1)$output[, 2])
round(c(mean = mean(sigma_hat), min = min(sigma_hat), max = max(sigma_hat)), 3)
#>  mean   min   max
#> 0.052 0.023 0.185
round(sd(y1), 3)
#> [1] 0.117
round(sd(y1 - run_net(dnet, X1)$output[, 1]), 3)
#> [1] 0.056
```

The scaled target has a standard deviation of 0.117, and the errors that μ leaves have a standard deviation of 0.056. That is close to the average σ of 0.052, so σ describes the size of the errors that are left. And σ varies by window, from 0.023 to 0.185: the network outputs a much wider spread for some windows than for others.

In torch, the same loss is a few tensor operations. This code is shown for you to run locally, where torch is installed.

```r-static
# Gaussian negative log-likelihood as tensor operations
library(torch)

torch_gaussian_nll <- function(target, mu, log_sigma) {
  sigma <- torch_exp(log_sigma)
  nll <- 0.5 * log(2 * pi) + log_sigma + (target - mu)^2 / (2 * sigma^2)
  torch_mean(nll)
}
```

=== step === concept
## How does DeepAR turn sampled paths into an interval?

To forecast 12 months, DeepAR samples one month at a time. The network outputs μ and σ for month 1, and we draw one value from that Gaussian. We treat the draw as if it were the observed month 1. It goes on the end of the window, the oldest month drops off, and the network outputs μ and σ for month 2.

Repeating this 12 times gives one sample path, which is one possible version of 2018. The actual months are never used once the forecast starts, only the draws. The block below builds 1,000 sample paths for each state.

```r
# Forecast each state by sampling 1,000 paths, one month at a time
sample_paths <- function(series_train, w, n_paths = 1000) {
  last_window <- tail(series_train, lookback)
  window_mean <- mean(last_window)
  windows <- matrix(last_window / window_mean - 1, n_paths, lookback, byrow = TRUE)
  paths <- matrix(0, n_paths, horizon)
  for (h in seq_len(horizon)) {
    out <- run_net(w, windows)$output
    draw <- rnorm(n_paths, mean = out[, 1], sd = exp(out[, 2]))
    paths[, h] <- (draw + 1) * window_mean
    windows <- cbind(windows[, -1], draw)
  }
  paths
}

set.seed(7)
paths <- list()
for (s in states) {
  paths[[s]] <- sample_paths(train[[s]], dnet)
}
dim(paths$NSW)
#> [1] 1000   12
```

Each state now has a matrix with 1,000 rows (paths) and 12 columns (months). To summarize the paths, we take three percentiles of the 1,000 values at each month: p10, p50 and p90. The p50 is the median, and we call the p50 of the 12 months the median path. 80% of the values lie between p10 and p90, so p10 to p90 is an 80% interval.

```r
# The p10, p50 and p90 of the 1,000 NSW paths at months 1 and 12, and the 2018 actuals
q <- lapply(paths, function(p) apply(p, 2, quantile, probs = c(0.1, 0.5, 0.9)))
round(q$NSW[, c(1, 12)], 1)
#>      [,1]  [,2]
#> 10% 528.7 513.8
#> 50% 564.1 572.7
#> 90% 600.0 639.2
test$NSW[c(1, 12)]
#> [1] 541.9 630.3

# Width of the p10 to p90 band at months 1, 6 and 12
round((q$NSW[3, ] - q$NSW[1, ])[c(1, 6, 12)], 1)
#> [1]  71.3 108.5 125.4
```

In January 2018 the NSW interval runs from 528.7 to 600.0 around a median of 564.1, and the actual value was 541.9. In December it runs from 513.8 to 639.2 around a median of 572.7, and the actual was 630.3.

The band is 71.3 wide at month 1, 108.5 at month 6 and 125.4 at month 12. It widens with the horizon because every sampled month is an input to the next one. So the spread of the early months carries into the later ones.

The chart below draws the NSW forecast: the p10 to p90 band, the median path, and the actual values as dots.

```r
# Draw the NSW 2018 forecast: median path, p10 to p90 band and the actual values
library(ggplot2)
fan <- data.frame(
  month = 1:12,
  p10 = q$NSW[1, ], p50 = q$NSW[2, ], p90 = q$NSW[3, ],
  actual = test$NSW
)
ggplot(fan, aes(month)) +
  geom_ribbon(aes(ymin = p10, ymax = p90), fill = "#1f7a55", alpha = 0.25) +
  geom_line(aes(y = p50), colour = "#1f7a55", linewidth = 1) +
  geom_point(aes(y = actual), size = 2) +
  scale_x_continuous(breaks = 1:12) +
  labs(x = "Month of 2018", y = "Turnover, million Australian dollars")
```

All 12 dots sit inside the band. To check this for all 8 states, we use coverage: the share of the actual values that fall inside the interval. For an 80% interval, the coverage should be close to 80%.

```r
# Coverage of the p10 to p90 interval: months inside it, by state and overall
inside <- sapply(states, function(s) test[[s]] >= q[[s]][1, ] & test[[s]] <= q[[s]][3, ])
colSums(inside)
#> ACT NSW  NT QLD  SA TAS VIC  WA
#>   2  12   8  12  12  12  10  10
sum(inside)
#> [1] 78
round(100 * mean(inside), 2)
#> [1] 81.25
```

The interval contains the actual value in 78 of the 96 state-months, a coverage of 81.25%. But it is uneven by state. NSW, QLD, SA and TAS contain all 12 months, VIC and WA contain 10, NT contains 8, and ACT contains only 2. So a good average does not mean every series is well covered.

The interval is what DeepAR adds. But how accurate is the median path as a point forecast?

```r
# MAPE of the median path, next to the network and seasonal naive
mape_med <- sapply(states, function(s) mape(test[[s]], q[[s]][2, ]))
round(c(median_path = mean(mape_med), network = mean(mape_net), seasonal_naive = mean(mape_sn)), 2)
#>    median_path        network seasonal_naive
#>           6.48           5.91           4.14
```

The median path has a mean MAPE of 6.48%, against 5.91% for the network and 4.14% for seasonal naive. So the sampled paths give an interval that a single-number forecast does not have, but they do not lower the error.

Our stand-in differs from the DeepAR of the paper in three ways. The paper uses an LSTM in place of the feed-forward network, covariates such as the month of the year as extra inputs, and a negative binomial in place of the Gaussian when the series are counts.

=== step === concept
## How an N-BEATS block works: basis, backcast and forecast

N-BEATS uses the same scaled windows as before: 24 months in, the next 12 months out. What changes is the inside of the network.

The network is built from blocks. In one block, a few fully connected layers with ReLU (4 of them in the paper) read the window and end in a small set of coefficients. ReLU keeps a positive value and turns a negative one into 0.

The coefficients are multiplied by a basis. A basis is a set of curves defined over time, and the coefficients say how much of each curve to use. The block applies the basis twice. Over the 24 months of the window it gives the backcast, which is the block's reconstruction of its own input. Over the next 12 months it gives the block's forecast.

The next block does not receive the window again. It receives the window minus the backcast, which is the residual: what the first block could not reproduce. The final forecast is the sum of the forecasts of all the blocks.

In the generic version, the network learns the basis. In the interpretable version, the basis is fixed and the blocks come in two stacks. A trend stack comes first and uses a polynomial basis: a constant, a straight line and a curve (1, t and t squared). A seasonality stack follows and uses a Fourier basis: sines and cosines that complete 1, 2, 3 and more cycles over the horizon, which is 12 months here. The paper reports results on the M3, M4 and Tourism datasets.

The diagram below follows one scaled window through the blocks.

::widget process-flow {"steps":[{"title":"Window enters block 1","sub":"the 24 scaled months are the block input"},{"title":"Layers output coefficients","sub":"fully connected ReLU layers end in coefficients"},{"title":"Basis gives backcast and forecast","sub":"basis times coefficients, over 24 and 12 months"},{"title":"Residual feeds the next block","sub":"input window minus the backcast is the next input"},{"title":"Forecasts add up","sub":"the block forecasts sum to the final forecast"}]}

In torch, one generic block is four ReLU layers followed by two heads. Each head outputs coefficients, and a linear layer without a bias turns them into the backcast (24 values) or the forecast (12 values). This code is shown for you to run locally.

```r-static
# One generic N-BEATS block, and a model that chains three of them
library(torch)

nbeats_block <- nn_module(
  "nbeats_block",
  initialize = function(lookback = 24, horizon = 12, width = 64, n_coef = 8) {
    self$layers <- nn_module_list(list(
      nn_linear(lookback, width), nn_linear(width, width),
      nn_linear(width, width), nn_linear(width, width)
    ))
    self$coef_back <- nn_linear(width, n_coef)
    self$coef_fore <- nn_linear(width, n_coef)
    self$basis_back <- nn_linear(n_coef, lookback, bias = FALSE)
    self$basis_fore <- nn_linear(n_coef, horizon, bias = FALSE)
  },
  forward = function(window) {
    h <- window
    for (i in seq_len(4)) {
      h <- nnf_relu(self$layers[[i]](h))
    }
    list(
      backcast = self$basis_back(self$coef_back(h)),
      forecast = self$basis_fore(self$coef_fore(h))
    )
  }
)

nbeats <- nn_module(
  "nbeats",
  initialize = function(n_blocks = 3) {
    self$n_blocks <- n_blocks
    self$blocks <- nn_module_list(lapply(seq_len(n_blocks), function(i) nbeats_block()))
  },
  forward = function(window) {
    residual <- window
    forecast <- 0
    for (i in seq_len(self$n_blocks)) {
      out <- self$blocks[[i]](residual)
      residual <- residual - out$backcast
      forecast <- forecast + out$forecast
    }
    forecast
  }
)
```

The loop in `forward` is the whole idea: each block gets the residual, and the forecasts add up.

=== step === widget
## The trend block and the seasonal block, fitted by hand

To see what the two interpretable blocks remove from a window, we fit them by hand on the NSW window, January 2016 to December 2017. Ordinary least squares (`lm.fit`) plays the role of the network here, and finds the coefficients.

The trend block uses the basis 1, t/12 and (t/12) squared. Here t is the month number: 1 to 24 for the window months, and 25 to 36 for the 12 forecast months.

```r
# Trend block: fit a polynomial basis to the scaled NSW window
win <- tail(train$NSW, lookback)
win_mean <- mean(win)
z <- win / win_mean - 1
round(win_mean, 2)
#> [1] 541.45

month_idx <- 1:36
trend_basis <- cbind(constant = 1, time = month_idx / 12, time_sq = (month_idx / 12)^2)
th_t <- lm.fit(trend_basis[1:24, ], z)$coefficients
round(th_t, 4)
#> constant     time  time_sq
#>  -0.1412   0.2385  -0.0757

back_t <- as.vector(trend_basis[1:24, ] %*% th_t)
fore_t <- as.vector(trend_basis[25:36, ] %*% th_t)
r1 <- z - back_t
round(c(window = sd(z), residual = sd(r1)), 4)
#>   window residual
#>   0.0768   0.0557
```

The window mean is 541.45 million, and z is the window scaled the way we scaled every window. The coefficients are -0.1412, 0.2385 and -0.0757. The basis times the coefficients over months 1 to 24 is the backcast, and over months 25 to 36 it is the forecast.

The residual r1 is the window minus the backcast. Its standard deviation is 0.0557, down from 0.0768 for the window. That residual is what the seasonal block receives.

The seasonal block uses 3 harmonics of the 12-month period: a cosine and a sine at 1, 2 and 3 cycles per year. That makes 6 columns, and we fit them to r1.

```r
# Seasonal block: fit 3 harmonics of a 12-month period to the trend residual
season_basis <- cbind(
  cos1 = cos(2 * pi * 1 * month_idx / 12), sin1 = sin(2 * pi * 1 * month_idx / 12),
  cos2 = cos(2 * pi * 2 * month_idx / 12), sin2 = sin(2 * pi * 2 * month_idx / 12),
  cos3 = cos(2 * pi * 3 * month_idx / 12), sin3 = sin(2 * pi * 3 * month_idx / 12)
)
th_s <- lm.fit(season_basis[1:24, ], r1)$coefficients
round(th_s, 4)
#>    cos1    sin1    cos2    sin2    cos3    sin3
#>  0.0361 -0.0321  0.0130 -0.0108  0.0352  0.0012

back_s <- as.vector(season_basis[1:24, ] %*% th_s)
fore_s <- as.vector(season_basis[25:36, ] %*% th_s)
r2 <- r1 - back_s
round(c(after_trend = sd(r1), after_seasonal = sd(r2)), 4)
#>    after_trend after_seasonal
#>         0.0557         0.0330
```

The seasonal block brings the standard deviation of the residual from 0.0557 down to 0.0330. The summed forecast is the trend forecast plus the seasonal forecast, and the next block scores it against 2018.

```r
# Sum the two block forecasts, undo the scaling, and compute the MAPE for NSW 2018
fore_sum <- fore_t + fore_s
fc_blocks <- (fore_sum + 1) * win_mean
fc_trend_only <- (fore_t + 1) * win_mean
round(c(
  trend_only = mape(test$NSW, fc_trend_only),
  trend_plus_seasonal = mape(test$NSW, fc_blocks),
  seasonal_naive = mape(test$NSW, fc_sn$NSW)
), 2)
#>          trend_only trend_plus_seasonal      seasonal_naive
#>                8.75                8.04                2.57
```

The trend block alone has a MAPE of 8.75%, and adding the seasonal block lowers it to 8.04%. Seasonal naive has 2.57%, so these two hand-fitted blocks do not beat it.

Why not? Because `lm.fit` chose the coefficients to fit the 24 window months, not the next 12. N-BEATS trains its network so that the summed forecast fits the next 12 months, over many windows. The structure is the same, but the coefficients come from a different objective.

The widget shows the six stages on the NSW window, and every value comes from the code above.

::widget facet-grid {"geom": "point", "x": "month", "y": "scaled_value", "facetVar": "stage", "data": [{"x": 1, "y": -0.106, "facet": "1 input window"}, {"x": 2, "y": -0.161, "facet": "1 input window"}, {"x": 3, "y": -0.092, "facet": "1 input window"}, {"x": 4, "y": -0.071, "facet": "1 input window"}, {"x": 5, "y": -0.079, "facet": "1 input window"}, {"x": 6, "y": -0.092, "facet": "1 input window"}, {"x": 7, "y": -0.005, "facet": "1 input window"}, {"x": 8, "y": 0.02, "facet": "1 input window"}, {"x": 9, "y": 0.051, "facet": "1 input window"}, {"x": 10, "y": 0.062, "facet": "1 input window"}, {"x": 11, "y": 0.064, "facet": "1 input window"}, {"x": 12, "y": 0.159, "facet": "1 input window"}, {"x": 13, "y": 0.051, "facet": "1 input window"}, {"x": 14, "y": -0.093, "facet": "1 input window"}, {"x": 15, "y": 0.01, "facet": "1 input window"}, {"x": 16, "y": 0.012, "facet": "1 input window"}, {"x": 17, "y": -0.006, "facet": "1 input window"}, {"x": 18, "y": -0.018, "facet": "1 input window"}, {"x": 19, "y": 0.025, "facet": "1 input window"}, {"x": 20, "y": 0.015, "facet": "1 input window"}, {"x": 21, "y": 0.045, "facet": "1 input window"}, {"x": 22, "y": 0.062, "facet": "1 input window"}, {"x": 23, "y": 0.026, "facet": "1 input window"}, {"x": 24, "y": 0.122, "facet": "1 input window"}, {"x": 1, "y": -0.122, "facet": "2 trend block"}, {"x": 2, "y": -0.104, "facet": "2 trend block"}, {"x": 3, "y": -0.086, "facet": "2 trend block"}, {"x": 4, "y": -0.07, "facet": "2 trend block"}, {"x": 5, "y": -0.055, "facet": "2 trend block"}, {"x": 6, "y": -0.041, "facet": "2 trend block"}, {"x": 7, "y": -0.028, "facet": "2 trend block"}, {"x": 8, "y": -0.016, "facet": "2 trend block"}, {"x": 9, "y": -0.005, "facet": "2 trend block"}, {"x": 10, "y": 0.005, "facet": "2 trend block"}, {"x": 11, "y": 0.014, "facet": "2 trend block"}, {"x": 12, "y": 0.022, "facet": "2 trend block"}, {"x": 13, "y": 0.028, "facet": "2 trend block"}, {"x": 14, "y": 0.034, "facet": "2 trend block"}, {"x": 15, "y": 0.039, "facet": "2 trend block"}, {"x": 16, "y": 0.042, "facet": "2 trend block"}, {"x": 17, "y": 0.045, "facet": "2 trend block"}, {"x": 18, "y": 0.046, "facet": "2 trend block"}, {"x": 19, "y": 0.047, "facet": "2 trend block"}, {"x": 20, "y": 0.046, "facet": "2 trend block"}, {"x": 21, "y": 0.045, "facet": "2 trend block"}, {"x": 22, "y": 0.042, "facet": "2 trend block"}, {"x": 23, "y": 0.038, "facet": "2 trend block"}, {"x": 24, "y": 0.033, "facet": "2 trend block"}, {"x": 25, "y": 0.027, "facet": "2 trend block"}, {"x": 26, "y": 0.02, "facet": "2 trend block"}, {"x": 27, "y": 0.012, "facet": "2 trend block"}, {"x": 28, "y": 0.003, "facet": "2 trend block"}, {"x": 29, "y": -0.007, "facet": "2 trend block"}, {"x": 30, "y": -0.018, "facet": "2 trend block"}, {"x": 31, "y": -0.03, "facet": "2 trend block"}, {"x": 32, "y": -0.043, "facet": "2 trend block"}, {"x": 33, "y": -0.057, "facet": "2 trend block"}, {"x": 34, "y": -0.073, "facet": "2 trend block"}, {"x": 35, "y": -0.089, "facet": "2 trend block"}, {"x": 36, "y": -0.107, "facet": "2 trend block"}, {"x": 1, "y": 0.016, "facet": "3 residual after trend"}, {"x": 2, "y": -0.057, "facet": "3 residual after trend"}, {"x": 3, "y": -0.006, "facet": "3 residual after trend"}, {"x": 4, "y": -0.001, "facet": "3 residual after trend"}, {"x": 5, "y": -0.024, "facet": "3 residual after trend"}, {"x": 6, "y": -0.052, "facet": "3 residual after trend"}, {"x": 7, "y": 0.023, "facet": "3 residual after trend"}, {"x": 8, "y": 0.036, "facet": "3 residual after trend"}, {"x": 9, "y": 0.056, "facet": "3 residual after trend"}, {"x": 10, "y": 0.057, "facet": "3 residual after trend"}, {"x": 11, "y": 0.05, "facet": "3 residual after trend"}, {"x": 12, "y": 0.137, "facet": "3 residual after trend"}, {"x": 13, "y": 0.022, "facet": "3 residual after trend"}, {"x": 14, "y": -0.127, "facet": "3 residual after trend"}, {"x": 15, "y": -0.028, "facet": "3 residual after trend"}, {"x": 16, "y": -0.03, "facet": "3 residual after trend"}, {"x": 17, "y": -0.051, "facet": "3 residual after trend"}, {"x": 18, "y": -0.064, "facet": "3 residual after trend"}, {"x": 19, "y": -0.022, "facet": "3 residual after trend"}, {"x": 20, "y": -0.032, "facet": "3 residual after trend"}, {"x": 21, "y": 0, "facet": "3 residual after trend"}, {"x": 22, "y": 0.02, "facet": "3 residual after trend"}, {"x": 23, "y": -0.012, "facet": "3 residual after trend"}, {"x": 24, "y": 0.089, "facet": "3 residual after trend"}, {"x": 1, "y": 0.014, "facet": "4 seasonal block"}, {"x": 2, "y": -0.061, "facet": "4 seasonal block"}, {"x": 3, "y": -0.046, "facet": "4 seasonal block"}, {"x": 4, "y": -0.008, "facet": "4 seasonal block"}, {"x": 5, "y": -0.03, "facet": "4 seasonal block"}, {"x": 6, "y": -0.058, "facet": "4 seasonal block"}, {"x": 7, "y": -0.019, "facet": "4 seasonal block"}, {"x": 8, "y": 0.029, "facet": "4 seasonal block"}, {"x": 9, "y": 0.02, "facet": "4 seasonal block"}, {"x": 10, "y": 0.013, "facet": "4 seasonal block"}, {"x": 11, "y": 0.062, "facet": "4 seasonal block"}, {"x": 12, "y": 0.084, "facet": "4 seasonal block"}, {"x": 13, "y": 0.014, "facet": "4 seasonal block"}, {"x": 14, "y": -0.061, "facet": "4 seasonal block"}, {"x": 15, "y": -0.046, "facet": "4 seasonal block"}, {"x": 16, "y": -0.008, "facet": "4 seasonal block"}, {"x": 17, "y": -0.03, "facet": "4 seasonal block"}, {"x": 18, "y": -0.058, "facet": "4 seasonal block"}, {"x": 19, "y": -0.019, "facet": "4 seasonal block"}, {"x": 20, "y": 0.029, "facet": "4 seasonal block"}, {"x": 21, "y": 0.02, "facet": "4 seasonal block"}, {"x": 22, "y": 0.013, "facet": "4 seasonal block"}, {"x": 23, "y": 0.062, "facet": "4 seasonal block"}, {"x": 24, "y": 0.084, "facet": "4 seasonal block"}, {"x": 25, "y": 0.014, "facet": "4 seasonal block"}, {"x": 26, "y": -0.061, "facet": "4 seasonal block"}, {"x": 27, "y": -0.046, "facet": "4 seasonal block"}, {"x": 28, "y": -0.008, "facet": "4 seasonal block"}, {"x": 29, "y": -0.03, "facet": "4 seasonal block"}, {"x": 30, "y": -0.058, "facet": "4 seasonal block"}, {"x": 31, "y": -0.019, "facet": "4 seasonal block"}, {"x": 32, "y": 0.029, "facet": "4 seasonal block"}, {"x": 33, "y": 0.02, "facet": "4 seasonal block"}, {"x": 34, "y": 0.013, "facet": "4 seasonal block"}, {"x": 35, "y": 0.062, "facet": "4 seasonal block"}, {"x": 36, "y": 0.084, "facet": "4 seasonal block"}, {"x": 1, "y": 0.002, "facet": "5 residual after seasonal"}, {"x": 2, "y": 0.004, "facet": "5 residual after seasonal"}, {"x": 3, "y": 0.04, "facet": "5 residual after seasonal"}, {"x": 4, "y": 0.007, "facet": "5 residual after seasonal"}, {"x": 5, "y": 0.006, "facet": "5 residual after seasonal"}, {"x": 6, "y": 0.007, "facet": "5 residual after seasonal"}, {"x": 7, "y": 0.042, "facet": "5 residual after seasonal"}, {"x": 8, "y": 0.007, "facet": "5 residual after seasonal"}, {"x": 9, "y": 0.036, "facet": "5 residual after seasonal"}, {"x": 10, "y": 0.044, "facet": "5 residual after seasonal"}, {"x": 11, "y": -0.012, "facet": "5 residual after seasonal"}, {"x": 12, "y": 0.053, "facet": "5 residual after seasonal"}, {"x": 13, "y": 0.009, "facet": "5 residual after seasonal"}, {"x": 14, "y": -0.066, "facet": "5 residual after seasonal"}, {"x": 15, "y": 0.018, "facet": "5 residual after seasonal"}, {"x": 16, "y": -0.023, "facet": "5 residual after seasonal"}, {"x": 17, "y": -0.021, "facet": "5 residual after seasonal"}, {"x": 18, "y": -0.006, "facet": "5 residual after seasonal"}, {"x": 19, "y": -0.003, "facet": "5 residual after seasonal"}, {"x": 20, "y": -0.061, "facet": "5 residual after seasonal"}, {"x": 21, "y": -0.02, "facet": "5 residual after seasonal"}, {"x": 22, "y": 0.006, "facet": "5 residual after seasonal"}, {"x": 23, "y": -0.074, "facet": "5 residual after seasonal"}, {"x": 24, "y": 0.005, "facet": "5 residual after seasonal"}, {"x": 25, "y": 0.041, "facet": "6 forecast sum"}, {"x": 26, "y": -0.04, "facet": "6 forecast sum"}, {"x": 27, "y": -0.034, "facet": "6 forecast sum"}, {"x": 28, "y": -0.004, "facet": "6 forecast sum"}, {"x": 29, "y": -0.037, "facet": "6 forecast sum"}, {"x": 30, "y": -0.076, "facet": "6 forecast sum"}, {"x": 31, "y": -0.049, "facet": "6 forecast sum"}, {"x": 32, "y": -0.014, "facet": "6 forecast sum"}, {"x": 33, "y": -0.037, "facet": "6 forecast sum"}, {"x": 34, "y": -0.059, "facet": "6 forecast sum"}, {"x": 35, "y": -0.027, "facet": "6 forecast sum"}, {"x": 36, "y": -0.022, "facet": "6 forecast sum"}]}

The first panel is the input window, and the second is the trend block: a smooth curve over the 24 window months and the 12 forecast months. The third panel is the residual after the trend, and the fourth is the seasonal block. The fifth is the residual after the seasonal block, and the sixth is the summed forecast for the next 12 months.

Compare the spread of the points in panel 1, panel 3 and panel 5. It falls from 0.0768 to 0.0557 to 0.0330, one block at a time.

=== step === quiz
## Quick check: what does the seasonal block receive?

The trend block has just produced its backcast and forecast for the NSW window. What is the input of the seasonal block?

::quiz {"correct": 3, "gate": true, "difficulty": "intermediate"}
- The trend block's backcast, the smooth curve it fitted to the window. ::no
- The original scaled window, the same input the trend block received. ::no
- The residual: the scaled window minus the trend block's backcast. ::ok Yes. The seasonal block fits what the trend block left behind. That is why the spread of the points is 0.0557 before the seasonal block starts, and 0.0330 after it.
- The trend block's forecast for the next 12 months. ::no The seasonal block never takes the trend block's backcast, the original window or the trend block's forecast as its input. It receives the window minus the trend block's backcast, the residual with a spread of 0.0557, and removes the seasonal shape from that, which leaves 0.0330. Passing on the residual is what lets each block explain a different part of the series.

=== step === widget
## How N-HiTS shrinks each block's input and output

N-HiTS keeps the residual stacking of N-BEATS and changes two things about each block: what goes in and what comes out. The input comes first.

Before a block reads the window, N-HiTS max-pools it. Max pooling with a kernel of k splits the window into groups of k consecutive months and keeps the largest value of each group. The block below pools the scaled NSW window with a kernel of 1, 3, 6 and 12.

```r
# Max-pool the scaled NSW window at kernel sizes 1, 3, 6 and 12
max_pool <- function(v, kernel) {
  groups <- rep(seq_len(length(v) / kernel), each = kernel)
  as.vector(tapply(v, groups, max))
}
kernels <- c(1, 3, 6, 12)
pooled <- lapply(kernels, function(k) max_pool(z, k))
names(pooled) <- paste0("kernel_", kernels)
sapply(pooled, length)
#>  kernel_1  kernel_3  kernel_6 kernel_12
#>        24         8         4         2
round(pooled$kernel_6, 3)
#> [1] -0.071  0.159  0.051  0.122
```

A kernel of 1 keeps all 24 values, and the kernels 3, 6 and 12 leave 8, 4 and 2. With a kernel of 6, the four values are -0.071, 0.159, 0.051 and 0.122: the largest value of each half year.

Each stack gets its own kernel. In the paper's setup, the first stacks use large kernels and see a coarse picture of the window. The later stacks use small kernels and see more detail.

The widget below shows the pooled window for each kernel, with every point placed at the middle month of its group.

::widget facet-grid {"geom": "point", "x": "month", "y": "pooled_value", "facetVar": "kernel", "data": [{"x": 1, "y": -0.106, "facet": "kernel 01"}, {"x": 2, "y": -0.161, "facet": "kernel 01"}, {"x": 3, "y": -0.092, "facet": "kernel 01"}, {"x": 4, "y": -0.071, "facet": "kernel 01"}, {"x": 5, "y": -0.079, "facet": "kernel 01"}, {"x": 6, "y": -0.092, "facet": "kernel 01"}, {"x": 7, "y": -0.005, "facet": "kernel 01"}, {"x": 8, "y": 0.02, "facet": "kernel 01"}, {"x": 9, "y": 0.051, "facet": "kernel 01"}, {"x": 10, "y": 0.062, "facet": "kernel 01"}, {"x": 11, "y": 0.064, "facet": "kernel 01"}, {"x": 12, "y": 0.159, "facet": "kernel 01"}, {"x": 13, "y": 0.051, "facet": "kernel 01"}, {"x": 14, "y": -0.093, "facet": "kernel 01"}, {"x": 15, "y": 0.01, "facet": "kernel 01"}, {"x": 16, "y": 0.012, "facet": "kernel 01"}, {"x": 17, "y": -0.006, "facet": "kernel 01"}, {"x": 18, "y": -0.018, "facet": "kernel 01"}, {"x": 19, "y": 0.025, "facet": "kernel 01"}, {"x": 20, "y": 0.015, "facet": "kernel 01"}, {"x": 21, "y": 0.045, "facet": "kernel 01"}, {"x": 22, "y": 0.062, "facet": "kernel 01"}, {"x": 23, "y": 0.026, "facet": "kernel 01"}, {"x": 24, "y": 0.122, "facet": "kernel 01"}, {"x": 2, "y": -0.092, "facet": "kernel 03"}, {"x": 5, "y": -0.071, "facet": "kernel 03"}, {"x": 8, "y": 0.051, "facet": "kernel 03"}, {"x": 11, "y": 0.159, "facet": "kernel 03"}, {"x": 14, "y": 0.051, "facet": "kernel 03"}, {"x": 17, "y": 0.012, "facet": "kernel 03"}, {"x": 20, "y": 0.045, "facet": "kernel 03"}, {"x": 23, "y": 0.122, "facet": "kernel 03"}, {"x": 3.5, "y": -0.071, "facet": "kernel 06"}, {"x": 9.5, "y": 0.159, "facet": "kernel 06"}, {"x": 15.5, "y": 0.051, "facet": "kernel 06"}, {"x": 21.5, "y": 0.122, "facet": "kernel 06"}, {"x": 6.5, "y": 0.159, "facet": "kernel 12"}, {"x": 18.5, "y": 0.122, "facet": "kernel 12"}]}

The kernel 1 panel has the 24 values of the window, and the kernel 12 panel has only 2 points, the largest value of each year.

The output side changes too. A block does not output a value for every forecast month. It outputs values at a few chosen months, called knots, and the months in between are filled in by linear interpolation. The block below tests how much of the NSW 2018 series can be carried by 3 knots (months 1, 6 and 12) and by 5 knots (months 1, 4, 7, 10 and 12).

```r
# Rebuild the 12 actual NSW months of 2018 from a few knots by linear interpolation
rebuild <- function(actual_year, knots) {
  approx(x = knots, y = actual_year[knots], xout = 1:12)$y
}
knots3 <- c(1, 6, 12)
knots5 <- c(1, 4, 7, 10, 12)
round(c(
  knots3 = mape(test$NSW, rebuild(test$NSW, knots3)),
  knots5 = mape(test$NSW, rebuild(test$NSW, knots5))
), 2)
#> knots3 knots5
#>   2.88   2.42
```

This is not a forecast. It scores how well the straight lines between the knots reproduce the 12 actual values, and the MAPE is 2.88% with 3 knots and 2.42% with 5. So a handful of numbers holds most of the shape of the year.

The saving shows up in the number of weights. The next block uses a hidden layer of width 64. It counts the weights of the first layer for each kernel, and the weights that produce the forecast for different numbers of outputs. Biases are not counted, and the backcast has its own outputs, which are left out.

```r
# Weights of the first layer and of the forecast output layer at hidden width 64
width <- 64
width * sapply(pooled, length)
#>  kernel_1  kernel_3  kernel_6 kernel_12
#>      1536       512       256       128
width * c(months_12 = 12, knots_3 = 3, months_96 = 96, knots_8 = 8)
#> months_12   knots_3 months_96   knots_8
#>       768       192      6144       512
```

The first layer has 1,536 weights at a kernel of 1 and 128 at a kernel of 12. On the output side, 12 outputs need 768 weights and 3 knots need 192. For a 96-month horizon, the forecast output layer needs 6,144 weights for 96 outputs, but only 512 for 8 knots.

The paper aims at less volatile forecasts and lower computation on long horizons. Fewer weights means less computation, and that is the saving you see here.

=== step === quiz
## Quick check: which change serves which need?

The analyst now wants the NSW forecast extended to 96 months, with an 80% interval for each month. Which pair of changes serves those two needs?

::quiz {"correct": 2, "gate": true, "difficulty": "intermediate"}
- The N-BEATS backcast gives the interval, and interpolation between N-HiTS knots keeps the forecast output layer small. ::no
- Sampled paths from a DeepAR-style distribution give the interval, and interpolation between N-HiTS knots keeps the forecast output layer small. ::ok Yes. The interval comes from the p10 and p90 of the sampled paths, and the knots cut the forecast output layer from 6,144 weights for 96 outputs to 512 weights for 8 knots at width 64, a twelfth of its size.
- Sampled paths give the interval, and max pooling with a kernel of 12 leaves 8 inputs, so the forecast output layer stays small. ::no
- The N-BEATS residual gives the interval, and interpolation between N-HiTS knots produces the uncertainty. ::no The interval comes from sampling: DeepAR draws many paths from the distribution the network outputs, and the p10 to p90 band of those paths is the 80% interval. The N-BEATS backcast and residual only reconstruct the window, and interpolation between knots shrinks the forecast output layer without producing any uncertainty. Also, a kernel of 12 leaves 2 of the 24 inputs, not 8, and pooling acts on the input, not on the forecast output layer.

=== step === tryit
## Your turn: which forecast wins for Northern Territory?

Three forecasts of the Northern Territory (NT) for 2018 are in your session: the network (`fc_net$NT`), seasonal naive (`fc_sn$NT`) and the median path of the DeepAR-style sample paths (row 2 of `q$NT`). Compute the MAPE of each against the actual values in `test$NT`, and print the name of the forecast with the lowest MAPE.

```r
# fc_net, fc_sn and q hold the forecasts, test holds the 2018 actual values,
# and mape() is the function used earlier.
# Compute the MAPE of the network, seasonal naive and the DeepAR median path for NT,
# then print the name of the forecast with the lowest MAPE.
# Press Check when you have them.
```
::check {"regex": "(?=[\\s\\S]*mape[(][^)]*fc_sn)(?=[\\s\\S]*mape[(][^)]*q)(?=[\\s\\S]*min[(])", "gate": true, "difficulty": "intermediate", "ok": "Yes: 2.38 for the network, 5.71 for seasonal naive and 7.84 for the DeepAR median, so the network wins for NT. That is the opposite of most states, where seasonal naive is lowest.", "no": "Call mape() three times on the NT actual values: once with the network forecast for NT, once with the seasonal naive forecast for NT and once with row 2 of the DeepAR quantiles for NT. Put the three results in one named vector and pick the smallest with which.min()."}
::solution
```r
# Score three forecasts of Northern Territory for 2018 and name the best one
nt_mape <- c(
  network = mape(test$NT, fc_net$NT),
  seasonal_naive = mape(test$NT, fc_sn$NT),
  deepar_median = mape(test$NT, q$NT[2, ])
)
round(nt_mape, 2)
#>        network seasonal_naive  deepar_median
#>           2.38           5.71           7.84
names(which.min(nt_mape))
#> [1] "network"
```

For NT the network wins with 2.38%, ahead of seasonal naive at 5.71% and the DeepAR median at 7.84%. Across the 8 states, seasonal naive has the lowest MAPE in 5, the network in 2 (ACT and NT), and the DeepAR median in 1 (SA). The winner changes from series to series. That is why each forecast is benchmarked against seasonal naive on the series it is meant for.

=== step === concept
## References

- [DeepAR: Probabilistic forecasting with autoregressive recurrent networks](https://doi.org/10.1016/j.ijforecast.2019.07.001) - Salinas, Flunkert, Gasthaus and Januschowski (2020), International Journal of Forecasting 36(3). The distribution output, the Gaussian and negative binomial likelihoods, and forecasting by sampling paths.
- [N-BEATS: Neural basis expansion analysis for interpretable time series forecasting](https://arxiv.org/abs/1905.10437) - Oreshkin, Carpov, Chapados and Bengio (2020), ICLR 2020. The block, the backcast and forecast, and the trend and seasonality stacks.
- [N-HiTS: Neural hierarchical interpolation for time series forecasting](https://arxiv.org/abs/2201.12886) - Challu, Olivares, Oreshkin, Garza, Mergenthaler-Canseco and Dubrawski (2023), AAAI 2023. The max-pooled input and the interpolated output.
- [Forecasting: Principles and Practice, 3rd edition](https://otexts.com/fpp3/) - Hyndman and Athanasopoulos (2021), OTexts. The accuracy measures and the seasonal naive benchmark.
- [torch for R](https://torch.mlverse.org/) - the documentation for tensors, `nn_module` and `nn_linear`.

=== step === complete
## Quick recap

You took the ideas behind DeepAR, N-BEATS and N-HiTS apart on one running example, the takeaway food turnover of 8 Australian states, with seasonal naive as the benchmark. To summarize:

- DeepAR changes the output: the network gives a mean and a standard deviation, it is trained on the negative log-likelihood, and it forecasts by sampling paths. From 1,000 paths per state you read an 80% interval, which contained 78 of the 96 actual state-months.
- N-BEATS changes the block: coefficients on a basis give a backcast and a forecast, the next block receives the window minus the backcast, and the block forecasts add up.
- N-HiTS keeps that structure and shrinks each block: max pooling reduces the input, and a few interpolated knots replace the full forecast output. For 96 months at width 64, that is 512 weights against 6,144.
- The seasonal naive benchmark comes first. Here it had a mean MAPE of 4.14% against 5.91% for the network, and the winner changed from state to state.

In practice, these three run in Python libraries such as GluonTS (DeepAR) and neuralforecast (N-BEATS and N-HiTS), and R can call them through reticulate.

The next lesson covers Temporal Fusion Transformers.

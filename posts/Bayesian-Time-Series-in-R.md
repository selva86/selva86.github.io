---
title: "Bayesian Time Series in R: Forecasting with bsts"
slug: "Bayesian-Time-Series-in-R"
description: "Forecast time series in R with the bsts package: build Bayesian state space models with trend and seasonality, and read every forecast as an honest interval."
keywords: "bsts, Bayesian time series, Bayesian structural time series, state space model, Bayesian forecasting in R, spike-and-slab regression, credible interval forecast, time series forecasting in R"
auto_link_terms: "bsts|bsts package|Bayesian time series|Bayesian structural time series|Bayesian forecasting in R|state space model|structural time series|spike-and-slab prior|AddLocalLinearTrend|AddSeasonal|Bayesian time series in R|local linear trend"
auto_link_case_sensitive: false
mathjax: true
webr: true
date: "2026-08-01"
curriculum_id: "FR-baye-9"
post_type: "FR"
difficulty: "Advanced"
fr_parent: "Bayesian-Workflow-in-R.html"
---

<p class="lead">Bayesian time series forecasting treats the future as a range of possibilities, not a single guess. The bsts package (short for Bayesian structural time series) builds a forecast by breaking a series into interpretable pieces, a trend, a seasonal cycle, and optional predictors, then reports each future value as a full probability distribution you can read as a credible interval. This tutorial builds that idea from scratch in R and forecasts a real series, checking every number against what actually happened.</p>

## What makes a Bayesian forecast different?

Most forecasting tools hand you one number per future period: "next month will be 425 passengers." That single number is almost never exactly right, and worse, it hides how unsure the model is. A Bayesian forecast fixes this by returning a whole distribution for each future period. Instead of one line into the future, you get a shaded band that says "we are 95% sure the true value lands in here." That honesty about uncertainty is the whole point.

We will forecast a classic dataset that ships with R: `AirPassengers`, the monthly count of international airline passengers from 1949 to 1960. It has a clear upward trend and a strong yearly cycle, which makes it perfect for learning. Let us load it and set aside the final 12 months as a test set, so later we can check the forecast against reality.

```r title="Load the data and split off a test year"
# Monthly airline passengers, 1949 to 1960 (a built-in R dataset)
pass  <- AirPassengers
train <- window(log10(pass), end = c(1959, 12))    # first 11 years, on a log scale
test  <- window(log10(pass), start = c(1960, 1))    # the final 12 months, held out
c(train_months = length(train), test_months = length(test))
#> train_months  test_months
#>          132           12
```

Two things happened in that block. First, we split the series into 132 training months and 12 held-out months. We will fit the model on the training part only, then forecast the 12 months we hid and see how close we got. Second, we took `log10()` of the counts before splitting. Airline traffic swings wider in busy years than in quiet ones, and taking logs turns those growing swings into a steady percentage, which a simple model handles far better. We forecast on the log scale and convert back to passengers with `10^` at the very end.

[TIP]
**Take logs when the seasonal swings grow with the level.** If the up-and-down wiggles get visibly bigger as the series climbs, model the logarithm instead of the raw values, then exponentiate the forecast back. It turns a hard multiplicative pattern into an easy additive one.

So what does "a forecast is a distribution" actually mean in code? Suppose the model tells us next month's log-passengers is centered at 2.628 with a standard deviation of about 0.018. That is not a single answer, it is a bell curve of possible answers. We can draw thousands of samples from it, convert each back to a passenger count, and read the middle 95% as our credible interval.

```r title="Turn a forecast distribution into an interval"
set.seed(1)
draws  <- rnorm(10000, mean = 2.628, sd = 0.0177)   # 10,000 possible log-passenger values
counts <- 10^draws                                    # each converted back to a passenger count
round(quantile(counts, c(0.025, 0.5, 0.975)))
#>  2.5%   50% 97.5%
#>   391   424   460
```

Read the three numbers. The median forecast is about 424 passengers, and the 2.5% and 97.5% quantiles mark a 95% credible interval running from roughly 391 to 460. A credible interval means exactly what people wish a confidence interval meant: given the model, there is a 95% probability the true value sits inside this range. That interval, not the single median, is the deliverable of a Bayesian forecast. Everything bsts does is a principled way of producing distributions like this one, for every future month at once.

**Try it:** A forecast for a different month is centered at 2.71 on the log10 scale with a standard deviation of 0.02. Turn it into a 95% credible interval in passenger counts, using the fact that a 95% interval spans about 1.96 standard deviations on each side of the center.

```r title="Your turn: build a credible interval"
# Center = 2.71 (log10 scale), sd = 0.02.
# Build the low and high ends, then convert both back with 10^.
ex_ci <- NA
# Expected: two numbers near 469 and 561
```

<details>
<summary>Click to reveal solution</summary>

```r title="Credible interval solution"
round(10^(2.71 + c(-1, 1) * 1.96 * 0.02))
#> [1] 469 561
```

**Explanation:** The center plus and minus 1.96 standard deviations gives the interval on the log scale, and `10^` converts each end back to passengers. The 95% credible interval runs from about 469 to 561.

</details>

## What is a state space (structural) time series model?

The word "structural" in Bayesian structural time series is the key idea. Rather than treating the series as one tangled signal, a structural model assumes the series is a sum of hidden building blocks that each tell part of the story: a slow-moving trend, a repeating seasonal pattern, and (optionally) the effect of outside predictors. You observe only the total, and the model's job is to pull the pieces apart.

![bsts splits a series into a trend, a seasonal cycle, and regressors that add up to what you observe](screenshots/Bayesian-Time-Series-in-R-decomposition.webp)
*Figure 1: A structural time series model assumes the observed series is the sum of a trend, a seasonal cycle, and optional regressors. bsts estimates each hidden piece.*

The simplest building block is the "local level," and you can understand it with a short simulation. Picture a hidden level that drifts a little each month by a random amount (a random walk), while all you get to see is that level plus measurement noise. Let us generate exactly that.

```r title="Simulate a local level (a drifting hidden state)"
set.seed(42)
n <- 60
level <- numeric(n); level[1] <- 100
for (t in 2:n) level[t] <- level[t - 1] + rnorm(1, 0, 2)   # the level drifts (a random walk)
observed <- level + rnorm(n, 0, 3)                          # we only ever see level + noise
round(head(data.frame(level = level, observed = observed), 4), 1)
#>   level observed
#> 1 100.0    100.9
#> 2 102.7    101.6
#> 3 101.6    102.2
#> 4 102.3    104.1
```

This is a state space model in miniature. The `level` column is the hidden state that evolves on its own, and `observed` is what a data logger would record: the state blurred by noise. The model never sees `level` directly. It has to infer where the true level is at each moment from noisy observations, and it also gets to say how uncertain it is. That inference-with-uncertainty is what makes the approach Bayesian.

A trend is more than a level, because a series can be climbing, not just sitting still. The "local linear trend" adds a second drifting piece, the slope, on top of the level. Both the level and the slope wander over time, which lets the trend bend gently instead of being a rigid straight line. Here is that richer state in action.

```r title="Simulate a local linear trend (level plus a drifting slope)"
set.seed(7)
lev <- 100; slp <- 1.5
series <- numeric(40)
for (t in 1:40) {
  slp <- slp + rnorm(1, 0, 0.10)     # the slope itself drifts a little each step
  lev <- lev + slp + rnorm(1, 0, 0.5) # the level moves by the current slope, plus noise
  series[t] <- lev
}
round(series[c(1, 10, 20, 40)], 1)
#> [1] 101.1 119.8 142.2 194.3
```

The series climbs from about 101 to 194 over 40 steps, and because the slope drifts, the climb speeds up and slows down instead of holding one fixed rate. This is precisely the flexibility bsts gives you through its `AddLocalLinearTrend()` building block, which we will use in a moment.

If you like a compact statement, here is the local linear trend written as equations. The observed value is the level plus noise, the level moves by the current slope plus its own shock, and the slope drifts too:

$$ y_t = \mu_t + \varepsilon_t, \qquad \mu_{t+1} = \mu_t + \delta_t + \eta_t, \qquad \delta_{t+1} = \delta_t + \zeta_t $$

Where $\mu_t$ is the level and $\delta_t$ is the slope, and $\varepsilon_t$, $\eta_t$, and $\zeta_t$ are small random shocks (a seasonal term $\tau_t$ joins these equations later). If the notation is not your thing, skip it: the two simulations above already showed everything the equations say.

[KEY INSIGHT]
**A state space model treats the trend and season as things that can drift, not fixed numbers.** Because the level, slope, and seasonal pattern each evolve over time, the model adapts to a series whose behavior changes, which is exactly why it forecasts recent dynamics well.

**Try it:** A pure random walk is the local level with no drift target. Start at 100, take 12 random steps each drawn from a Normal with mean 0 and standard deviation 2, using seed 42, and report the final level rounded to one decimal.

```r title="Your turn: simulate a random walk"
# Start at 100. Add 12 steps, each rnorm(1, 0, 2). Use set.seed(42) first.
# Report the final level, rounded to 1 decimal.
ex_walk <- NA
# Expected: a single number near 118
```

<details>
<summary>Click to reveal solution</summary>

```r title="Random walk solution"
set.seed(42)
round(100 + sum(rnorm(12, 0, 2)), 1)
#> [1] 118.1
```

**Explanation:** Summing 12 random steps onto the starting value of 100 lands at about 118.1. Each run with a different seed ends somewhere else, which is the whole idea of a drifting state: where it goes is uncertain, and the model tracks that uncertainty.

</details>

## How do you fit your first bsts model?

Fitting a bsts model is a three-part recipe. First you declare the state, the building blocks the series is made of, by starting an empty list and adding pieces to it. Then you hand that state specification to `bsts()` along with a number of MCMC iterations. MCMC (Markov chain Monte Carlo) is the sampling engine: each iteration draws one plausible set of parameter values, and the draws together trace out the posterior, the updated range of what those values could be after seeing the data. Finally you read or forecast from the fitted object. Let us picture the whole flow before writing it.

![The four steps of a bsts forecast: build the state, fit, predict, and read the intervals](screenshots/Bayesian-Time-Series-in-R-workflow.webp)
*Figure 2: The bsts forecasting workflow: build a state specification, fit it with MCMC, then predict a horizon and read the credible intervals.*

We start with the simplest sensible model for a trending series: a local linear trend and nothing else. The `AddLocalLinearTrend()` function takes the current state list (empty to begin) and the series, and returns a state list with the trend piece attached. Then `bsts()` runs the sampler.

```r-static title="Fit a trend-only bsts model"
library(bsts)

# 1. Build the state: just a drifting trend for now
ss <- AddLocalLinearTrend(list(), train)

# 2. Fit with MCMC (ping = 0 keeps it quiet; the seed makes it reproducible)
model_trend <- bsts(train, state.specification = ss, niter = 1000, ping = 0, seed = 8675309)

# 3. How much of the training series does the trend alone explain?
round(summary(model_trend)$rsquare, 4)
#> [1] 0.9958
```

The trend-only model already explains about 99.58% of the variation in the log series, which sounds excellent. It is not enough, though, and here is why: the leftover 0.42% is not random noise, it is the entire yearly cycle that a pure trend cannot capture. Airline traffic peaks every summer and dips every winter, and a smooth trend cannot bend up and down twelve times within a single year. We will see that structure jump into the model the moment we add a seasonal piece.

[NOTE]
**The bsts fits run in a local R session, everything else runs in your browser.** The bsts package compiles heavy C++ under the hood, so blocks that call `bsts()` are marked to run locally in RStudio. Every base-R block, the simulations and the forecast evaluation, runs right here so you can experiment as you read.

**Try it:** The trend-only model has an R-squared of about 0.9958. Compute the percent of variance it leaves unexplained, rounded to two decimals.

```r title="Your turn: unexplained variance"
# R-squared is 0.9958. Turn the leftover into a percentage, rounded to 2 decimals.
ex_unexplained <- NA
# Expected: a small percentage near 0.42
```

<details>
<summary>Click to reveal solution</summary>

```r title="Unexplained variance solution"
round((1 - 0.9958) * 100, 2)
#> [1] 0.42
```

**Explanation:** One minus R-squared is the unexplained fraction, and multiplying by 100 makes it a percent. That 0.42% is small in size but structured, the seasonal cycle waiting to be modeled.

</details>

## How do you add seasonality to the model?

Adding a seasonal component is one more line. The `AddSeasonal()` function attaches a repeating pattern to the state, and you tell it how many seasons complete one cycle with `nseasons`. For monthly data with a yearly cycle, that is 12. We build on the same `ss` list we already have, so the model now carries both a drifting trend and a 12-month season.

```r-static title="Add a seasonal component and refit"
# Attach a 12-month seasonal cycle to the trend we already specified
ss <- AddSeasonal(ss, train, nseasons = 12)

model_seasonal <- bsts(train, state.specification = ss, niter = 1000, ping = 0, seed = 8675309)
summary(model_seasonal)
#> $residual.sd
#> [1] 0.007729217
#>
#> $prediction.sd
#> [1] 0.02451862
#>
#> $rsquare
#> [1] 0.9981717
#>
#> $relative.gof
#> [1] 0.7155362
```

Look at what the seasonal piece bought us. The `residual.sd` (the typical size of a leftover error on the log scale) is now about 0.0077, and R-squared climbed to 0.9982. More importantly, the leftover errors no longer contain a yearly wave, because the model now has a dedicated component for it. The `prediction.sd` of about 0.0245 is the model's own estimate of how far off a one-step forecast typically lands, and it is the seed of the credible intervals we are about to read.

[KEY INSIGHT]
**Each state component removes a specific, named pattern from the residuals.** The trend absorbs the long climb and the seasonal component absorbs the yearly wave, so what is left over is close to pure noise. That is what "structural" buys you: a model whose parts you can name and inspect, not a black box.

**Try it:** The seasonal model's R-squared is about 0.9982. Convert that into the percent of variance it leaves unexplained, rounded to two decimals.

```r title="Your turn: variance the seasonal model leaves"
# R-squared is 0.9982. Report the percent of variance left unexplained (2 decimals).
ex_left <- NA
# Expected: a small percentage near 0.18
```

<details>
<summary>Click to reveal solution</summary>

```r title="Seasonal unexplained variance solution"
round((1 - 0.9982) * 100, 2)
#> [1] 0.18
```

**Explanation:** The seasonal model leaves about 0.18% of variance unexplained, down from the trend-only model's 0.42%. Adding the yearly cycle cut the unexplained variation by more than half.

</details>

## How do you forecast and read the credible intervals?

A fitted bsts model forecasts with `predict()`. You give it a `horizon` (how many periods ahead) and, optionally, the quantiles you want for the interval. It returns the mean forecast for each future period plus the interval bounds, all on the model's scale (log10 here). We then convert back to passenger counts with `10^`.

```r-static title="Forecast the next 12 months"
pred <- predict(model_seasonal, horizon = 12, seed = 123, quantiles = c(0.025, 0.975))

# Convert the mean forecast from log10 back to passenger counts
forecast_counts <- round(10^pred$mean)
forecast_counts
#>  [1] 425 409 479 459 469 534 598 606 517 459 405 454
```

Those 12 numbers are the model's best single guess for each month of 1960, and you can already see the seasonal shape: a summer peak around months 7 and 8 (about 598 and 606 passengers) and winter dips at the ends. But a Bayesian forecast is more than the means. `pred` also carries the 95% interval for every month. Here are the forecast, its interval, and what actually happened, lined up so we can grade the model. The forecast and interval numbers below are read straight from the fit above; `actual` is the held-out year back on the passenger scale.

```r title="Score the forecast against the held-out year"
# Read from the model above: the 12 monthly forecasts and their 95% interval bounds
forecast <- c(425, 409, 479, 459, 469, 534, 598, 606, 517, 459, 405, 454)
lo       <- c(393, 372, 426, 402, 404, 450, 503, 505, 416, 367, 319, 356)
hi       <- c(461, 449, 535, 516, 540, 628, 714, 723, 635, 564, 503, 574)

# The same held-out months, back on the passenger scale
actual   <- as.numeric(window(AirPassengers, start = c(1960, 1)))

mape     <- mean(abs(forecast - actual) / actual) * 100      # average percent error
coverage <- mean(actual >= lo & actual <= hi) * 100          # percent inside the 95% band
c(MAPE_percent = round(mape, 1), coverage_percent = round(coverage))
#>     MAPE_percent coverage_percent
#>              3.1             92.0
```

Two numbers summarize a full year of forecasting. The mean absolute percentage error (MAPE) is 3.1%, meaning the point forecasts were off by about 3% on average, which is very good for a whole year ahead. The coverage is 92%, meaning 11 of the 12 actual values fell inside their 95% credible interval. Coverage near the promised 95% is the real prize: it says the model's uncertainty was honest, not too smug and not too timid. A single held-out point landed just outside its band, which for 12 months is exactly what a well-calibrated 95% interval should do.

An important property of these intervals is that they widen the further out you forecast, because the future gets genuinely harder to pin down. Let us look at how the interval width grows across the horizon.

```r title="See the intervals widen with the horizon"
width <- hi - lo
round(c(month1 = width[1], month6 = width[6], month12 = width[12]))
#>  month1  month6 month12
#>      68     178     218
cor(seq_along(width), width) > 0.7   # width rises steadily with the horizon
#> [1] TRUE
```

The 95% interval spans about 68 passengers one month out but roughly 218 passengers a year out, and the positive correlation confirms the widening is steady, not random. That growth is correct: a one-month-ahead forecast rests on far more nearby information than a twelve-month-ahead one, so the uncertainty is genuinely larger the further out you look. Classical methods can produce widening intervals too, but bsts gets them from the same coherent Bayesian machinery that produced the point forecast, so the whole picture hangs together.

[KEY INSIGHT]
**A calibrated interval that widens with the horizon is the honest output of a forecast.** The point forecast tells you the model's best guess; the interval tells you how much to trust it, and the widening tells you trust it less the further ahead you look.

**Try it:** Using `lo` and `hi` from above, compute the average width (in passengers) of the twelve 95% intervals, rounded to a whole number.

```r title="Your turn: average interval width"
# lo and hi hold the 12 monthly interval bounds. Average their difference.
ex_width <- NA
# Expected: a whole number near 161
```

<details>
<summary>Click to reveal solution</summary>

```r title="Average interval width solution"
round(mean(hi - lo))
#> [1] 161
```

**Explanation:** The average 95% interval spans about 161 passengers across the forecast year. Averaging the twelve widths gives a single sense of how uncertain the whole forecast is.

</details>

## How do you use predictors with spike-and-slab regression?

So far the series predicted itself from its own trend and season. The signature strength of bsts is that it can also fold in outside predictors, and it does so while automatically deciding which predictors are worth keeping. This is what Google's original bsts use case, "nowcasting" economic activity from search-query data, was built for: you throw dozens of candidate predictors at the model and let it pick.

The package ships a real example. The `initial.claims` dataset holds weekly US unemployment claims plus ten Google Trends search series that might help predict them. We add a regression component just by using a formula (`iclaimsNSA ~ .` means "explain claims using every other column") on top of the usual trend and seasonal state.

```r-static title="Fit a bsts model with many predictors"
data(iclaims)

# State: trend + a 52-week seasonal cycle for weekly data
ss_reg <- AddLocalLinearTrend(list(), initial.claims$iclaimsNSA)
ss_reg <- AddSeasonal(ss_reg, initial.claims$iclaimsNSA, nseasons = 52)

# The formula adds a regression on all 10 Google Trends predictors
model_reg <- bsts(iclaimsNSA ~ ., state.specification = ss_reg,
                  data = initial.claims, niter = 1000, ping = 0, seed = 42)

# How often did each predictor make it into the model? (its inclusion probability)
burn      <- SuggestBurn(0.1, model_reg)
inclusion <- sort(colMeans(model_reg$coefficients[-(1:burn), ] != 0), decreasing = TRUE)
round(head(inclusion, 5), 3)
#>        idaho.unemployment       unemployment.office       filing.unemployment
#>                     1.000                     1.000                     0.034
#>       unemployment.filing pennsylvania.unemployment
#>                     0.007                     0.002
```

The numbers are inclusion probabilities: the fraction of MCMC draws in which each predictor had a nonzero coefficient. This comes from a "spike-and-slab" prior, which is worth understanding because it is what makes bsts a genuine variable-selection tool. The prior puts a tall spike of probability on a coefficient being exactly zero (the predictor is out) and a wide slab of probability over nonzero values (the predictor is in). The sampler then spends more time including predictors that genuinely help and quickly drops the rest.

The result is a clean verdict. Two search series, `idaho.unemployment` and `unemployment.office`, have inclusion probability 1.000, so the model keeps them in every single draw. The other eight predictors sit near zero, meaning they almost never earn their place. We can act on that by keeping only the predictors that clear a sensible threshold.

```r title="Keep only the predictors the model trusts"
# The inclusion probabilities read from the model above
inclusion <- c(idaho.unemployment = 1.000, unemployment.office = 1.000,
               filing.unemployment = 0.034, unemployment.filing = 0.007,
               pennsylvania.unemployment = 0.002)

names(inclusion)[inclusion > 0.5]   # predictors the model keeps more than half the time
#> [1] "idaho.unemployment"  "unemployment.office"
```

With a threshold of 0.5, only two predictors survive. bsts did the feature selection for you, and crucially, it did it while accounting for the trend and season at the same time, so a predictor only gets credit for signal the trend and season did not already explain. You never had to fit dozens of models by hand or run a separate stepwise search.

[WARNING]
**A high inclusion probability means predictive, not causal.** Spike-and-slab tells you a predictor helps forecast the series, not that it drives it. Two search terms predicting unemployment claims are useful signals, but reading them as causes would be a mistake. Keep the two roles separate.

**Try it:** Using the `inclusion` vector above, list the predictors with an inclusion probability below 0.10, the ones the model effectively drops.

```r title="Your turn: which predictors get dropped"
# inclusion holds each predictor's inclusion probability.
# List the names whose probability is below 0.10.
ex_dropped <- NA
# Expected: the three low-probability search terms
```

<details>
<summary>Click to reveal solution</summary>

```r title="Dropped predictors solution"
names(inclusion)[inclusion < 0.10]
#> [1] "filing.unemployment"       "unemployment.filing"       "pennsylvania.unemployment"
```

**Explanation:** Three predictors fall below 0.10 and are effectively excluded. Spike-and-slab does not just rank predictors, it puts real probability on leaving them out entirely, which is what makes the selection so decisive.

</details>

## Putting it together: a complete forecast

Here is the entire workflow in one script, from raw data to a scored forecast. It mirrors the steps we walked through: log-transform and split, build the state, fit, predict, convert back, and grade against the held-out year. Run it in a local R session with bsts installed to reproduce every number in this tutorial.

```r-static title="The complete bsts forecast, end to end"
library(bsts)

# 1. Model the log of monthly passengers; hold out the final year
y     <- log10(AirPassengers)
train <- window(y, end = c(1959, 12))
test  <- as.numeric(window(AirPassengers, start = c(1960, 1)))

# 2. Build the state: a drifting trend plus a 12-month seasonal cycle
state <- AddLocalLinearTrend(list(), train)
state <- AddSeasonal(state, train, nseasons = 12)

# 3. Fit with MCMC
model <- bsts(train, state.specification = state, niter = 1000, ping = 0, seed = 8675309)

# 4. Forecast 12 months and convert back to passenger counts
fc       <- predict(model, horizon = 12, seed = 123, quantiles = c(0.025, 0.975))
forecast <- round(10^fc$mean)

# 5. Score the point forecast against what actually happened
mape <- mean(abs(forecast - test) / test) * 100
cat("12-month forecast:", forecast, "\n")
cat("MAPE:", round(mape, 1), "%\n")
#> 12-month forecast: 425 409 479 459 469 534 598 606 517 459 405 454
#> MAPE: 3.1 %
```

That is a full Bayesian structural time series forecast in about a dozen lines: interpretable components, a point forecast within roughly 3% of reality, and a credible interval (in `fc$interval`) for every month. Swap `AirPassengers` for your own series, adjust `nseasons`, and add a regression formula when you have predictors, and the same recipe carries over.

## Practice Exercises

These use the objects you built earlier: `forecast`, `lo`, `hi`, and `actual` from the forecast-scoring section. Each runs in your browser, so change a number and rerun to see what happens.

### Exercise 1: Find the busiest forecast month

The forecast is a 12-element vector for the months of 1960. Find which month has the highest forecast passenger count, map its index to a month name with `month.name`, and report both the month and the count.

```r title="Exercise 1: busiest forecast month"
# forecast holds the 12 monthly forecasts. Find the largest and name its month.
# Hint: which.max() gives the index; month.name[index] gives the name.

# Write your code below:

```

<details>
<summary>Click to reveal solution</summary>

```r title="Exercise 1 solution"
peak <- which.max(forecast)
cat("Peak month:", month.name[peak], "with", forecast[peak], "passengers\n")
#> Peak month: August with 606 passengers
```

**Explanation:** August (month 8) carries the highest forecast at 606 passengers, matching the summer travel peak the seasonal component learned from eleven earlier years.

</details>

### Exercise 2: Which months did the model under-forecast?

A forecast is not perfect. Find the months where the actual passenger count came in above the model's forecast, and return their names. This tells you where the model was too cautious.

```r title="Exercise 2: months the model under-forecast"
# Compare actual to forecast element by element.
# Return the names of months where actual was greater than forecast.

# Write your code below:

```

<details>
<summary>Click to reveal solution</summary>

```r title="Exercise 2 solution"
month.name[which(actual > forecast)]
#> [1] "April"   "May"     "June"    "July"    "October"
```

**Explanation:** In five months the real traffic beat the forecast, clustered around the busy spring and summer. 1960 grew a little faster than the model expected, which is the kind of small, honest miss a credible interval is meant to absorb.

</details>

### Exercise 3: How wide are the intervals, relative to the forecast?

An interval of 60 passengers means something different around a forecast of 400 than around 600. For each month, express the 95% interval width as a percent of that month's forecast, then report the smallest and largest of those percentages.

```r title="Exercise 3: relative interval width"
# For each month: (hi - lo) / forecast * 100, rounded.
# Report the min and the max of those 12 relative widths.

# Write your code below:

```

<details>
<summary>Click to reveal solution</summary>

```r title="Exercise 3 solution"
rel <- round((hi - lo) / forecast * 100)
c(min = min(rel), max = max(rel))
#> min max
#>  16  48
```

**Explanation:** The tightest month's interval is about 16% of its forecast and the widest is about 48%. Relative width grows toward the end of the year, the same widening-with-horizon effect seen earlier, now expressed as a percentage.

</details>

## Frequently Asked Questions

#### What does bsts stand for, and how is it different from ARIMA?

bsts stands for Bayesian structural time series. Where ARIMA models a series through abstract autoregressive and moving-average terms, bsts builds it from named, interpretable components (trend, season, regression) and returns a full posterior distribution rather than point estimates. That gives you honest credible intervals and easy variable selection, at the cost of running an MCMC sampler.

#### How many MCMC iterations should I use?

Start around 1,000 for exploration, as we did here, and increase to several thousand for a final model. bsts discards an initial "burn-in" fraction automatically; `SuggestBurn(0.1, model)` drops the first 10%. If your inclusion probabilities or forecasts shift noticeably when you raise the iteration count, you have not run enough.

#### What does the seed argument do?

It makes the MCMC reproducible. The sampler is random, so two runs differ slightly unless you fix the seed. Passing `seed` to both `bsts()` and `predict()` means you get the same fit and the same forecast every time, which is why every number in this tutorial is stable.

#### Do I have to log-transform my data?

Only when the seasonal swings grow with the level, as airline traffic does. Logging turns that multiplicative pattern into an additive one the model handles better. If your series has stable-sized seasonal swings, model it directly and skip the transform.

#### When should I add a regression component?

Add predictors when you have outside series that plausibly carry early signal about your target, such as search trends or weather. The spike-and-slab prior means you can include many candidates safely, because the model will down-weight the ones that do not help. With no useful predictors, a trend-plus-seasonal model is often all you need.

#### Can bsts handle multiple seasonal cycles?

Yes. You can add more than one seasonal component, for example a weekly cycle (`nseasons = 7`) and a yearly one, by calling `AddSeasonal()` twice on the same state list. Each component is estimated separately, which is another benefit of the structural approach.

## Summary

Bayesian structural time series forecasting, through the bsts package, turns a messy series into a sum of interpretable pieces and forecasts each future period as a distribution you can read as a credible interval. On the classic airline-passengers series, a trend-plus-seasonal model forecast a full held-out year to within about 3% on average, with 92% of actual values landing inside their 95% intervals, and a spike-and-slab regression picked the two useful predictors out of ten on its own.

| Step | Function | What it does |
|---|---|---|
| Build the trend | `AddLocalLinearTrend()` | Adds a drifting level and slope to the state |
| Add seasonality | `AddSeasonal(nseasons = ...)` | Adds a repeating cycle (12 for monthly) |
| Add predictors | formula in `bsts()` | Regression with automatic spike-and-slab selection |
| Fit the model | `bsts(niter, seed)` | Runs the MCMC sampler over the posterior |
| Forecast | `predict(horizon, quantiles)` | Returns mean forecasts and credible intervals |

The lasting idea is that a good forecast is a range, not a point. bsts gives you that range from a model whose parts you can name and inspect, which is what makes it both trustworthy and easy to explain. Build the state from clear components, keep enough iterations, fix your seeds, and read the interval, not just the mean.

#### Continue learning

- [The Bayesian Workflow in R](Bayesian-Workflow-in-R.html): the five-step loop of setting priors, fitting, checking, and revising that underpins any Bayesian model, including this one.
- [ARIMA in R](ARIMA-in-R.html): the classical forecasting approach bsts is often compared with, useful for seeing what the structural components replace.
- [Distributional Forecasts in R](Distributional-Forecasts-in-R.html): more on treating a forecast as a full distribution and reading prediction intervals correctly.

## References

1. Scott, S. L., and Varian, H. R. Predicting the Present with Bayesian Structural Time Series. International Journal of Mathematical Modelling and Numerical Optimisation (2014). [Link](https://research.google/pubs/pub41335/) - the paper that introduced the bsts nowcasting approach and the initial-claims example.
2. bsts package documentation on CRAN. [Link](https://cran.r-project.org/package=bsts) - the reference manual for `bsts()`, `AddLocalLinearTrend()`, `AddSeasonal()`, and `predict()`.
3. Brodersen, K. H., Gallusser, F., Koehler, J., Remy, N., and Scott, S. L. Inferring Causal Impact Using Bayesian Structural Time Series Models. Annals of Applied Statistics (2015). [Link](https://research.google/pubs/pub41854/) - shows how the same state space machinery powers causal-impact analysis.
4. Petris, G., Petrone, S., and Campagnoli, P. Dynamic Linear Models with R. Springer (2009). [Link](https://link.springer.com/book/10.1007/b135794) - a hands-on treatment of state space and dynamic linear models with worked R code.
5. Hyndman, R. J., and Athanasopoulos, G. Forecasting: Principles and Practice, 3rd Edition. [Link](https://otexts.com/fpp3/) - a modern, free forecasting textbook covering evaluation metrics like MAPE and interval calibration.
6. Scott, S. L. Fitting Bayesian structural time series with the bsts R package. The Unofficial Google Data Science Blog (2017). [Link](http://www.unofficialgoogledatascience.com/2017/07/fitting-bayesian-structural-time-series.html) - a practical, worked walkthrough from the package author.

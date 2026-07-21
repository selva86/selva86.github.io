---
title: "NNETAR Model in R: Neural Network Time Series Forecasting"
slug: "NNETAR-Model-in-R"
description: "Fit an NNETAR model in R with nnetar(). Learn what NNAR(p,P,k)[m] means, how the network builds a forecast, how to tune it, and when it beats ARIMA and ETS."
keywords: "NNETAR model in R, nnetar function, neural network time series forecasting, NNAR model, forecast package, neural network autoregression, nnetar vs ARIMA, time series neural network R, nnetar prediction intervals"
auto_link_terms: "NNETAR model|NNETAR models|NNETAR model in R|nnetar()|NNAR model|NNAR models|neural network autoregression|neural network time series forecasting|neural network forecasting in R|neural network forecast model"
auto_link_case_sensitive: false
mathjax: true
webr: true
date: "2026-07-22"
curriculum_id: "FR-adva-2"
post_type: "C"
sidebar_section: "Time Series"
sidebar_title: "NNETAR Models"
sidebar_order: 21
difficulty: "Intermediate"
---

<p class="lead">An NNETAR model is a neural network that forecasts a time series from its own past values. It is the nonlinear cousin of an AR model: the same lagged inputs go in, but they pass through a small hidden layer of neurons before they come out as a forecast. The <code>nnetar()</code> function in the forecast package fits one in a single line and chooses the architecture for you. This post shows what the model is, what the numbers in its name mean, how the network turns past values into a forecast, how to tune it, and, honestly, when it loses to ARIMA and ETS.</p>

## What is an NNETAR model, and when should you use it?

The `lynx` series counts Canadian lynx trapped each year from 1821 to 1934. It rises and crashes on a roughly ten-year cycle, and the rises are steeper than the falls. That asymmetry is nonlinear, which is exactly the shape a straight-line rule built from past values cannot bend to. One line of code fits a neural network to it instead. Press Run on the block below.

```r title="Fit a neural network to the lynx series"
library(forecast)

set.seed(2026)
fit_lynx <- nnetar(lynx)
fit_lynx
#> Series: lynx
#> Model:  NNAR(8,4)
#> Call:   nnetar(y = lynx)
#>
#> Average of 20 networks, each of which is
#> a 8-4-1 network with 41 weights
#> options were - linear output units
#>
#> sigma^2 estimated as 90719
```

Read that printout from the top. `NNAR(8,4)` is the model R chose on its own: it decided to feed in the last 8 years of lynx counts and pass them through 4 hidden neurons. The line below says `a 8-4-1 network with 41 weights`, which is the same thing spelled out as an architecture: 8 inputs, 4 hidden units, 1 output. And `Average of 20 networks` means R did not fit one network, it fitted twenty and averaged them. The last line, `sigma^2`, is the average squared error the fitted network makes on the very data it trained on, so treat it as a description of the fit and not as a measure of forecast quality. We will unpack every one of those numbers.

For now, notice what you did not have to do. You did not choose lags, you did not choose a hidden layer size, you did not scale the data, and you did not initialise any weights. `nnetar()` made all of those decisions from the series itself.

An **AR(p)** model predicts the next value as a weighted sum of the last `p` values, and that weighted sum is a straight line. An NNAR model uses the same `p` lagged inputs, but routes them through neurons that bend. That single change is the whole idea.

Now let's turn the fitted model into an actual forecast and look at it.

```r title="Forecast 20 years ahead and plot"
fc_lynx <- forecast(fit_lynx, h = 20)
autoplot(fc_lynx)

round(head(fc_lynx$mean, 6), 1)
#> Time Series:
#> Start = 1935
#> End = 1940
#> Frequency = 1
#> [1] 3892.9 3155.7 1497.7  232.3  333.3  407.5
```

`forecast(fit_lynx, h = 20)` runs the network forward 20 years. `autoplot()` draws the history in black with the forecast continuing on the right, and `fc_lynx$mean` holds the forecast numbers themselves, which is what we printed.

Look at the shape of those six numbers: 3892, then 3155, then a collapse to 232, then a slow climb back. The model has learned the boom-and-crash cycle and is projecting the next crash. A linear AR model fitted to this series produces a much rounder, more symmetric wave, because a straight-line rule cannot make the fall steeper than the rise.

[KEY INSIGHT]
**An NNETAR model is an AR model with a bend in it.** The inputs are identical, lagged values of the series itself, and the only difference is that the weighted sum passes through nonlinear neurons before it becomes a forecast. That is why it fits cyclical, asymmetric series like lynx and sunspots better than a linear model can, and why it adds nothing on a series whose dynamics are already close to linear.

So when should you reach for it? Use `nnetar()` when the series is long (roughly 100 observations or more), when the dynamics look nonlinear, and when point accuracy matters more to you than being able to explain the model to a stakeholder. Skip it when the series is short, when it has a strong trend (the limitations section below shows exactly why this breaks), or when you need prediction intervals you would defend in a meeting.

**Try it:** Fit an automatic NNETAR model to a different built-in series, `sunspot.year` (yearly sunspot counts from 1700 to 1988), and print just its model name with `$method`. The starter below fits `lynx` again, so change the series.

```r title="Your turn: fit a network to sunspots"
# Goal: fit nnetar() to sunspot.year and read off its model name.
set.seed(600)
ex_sun <- nnetar(lynx)   # <- swap lynx for sunspot.year
ex_sun$method
#> [1] "NNAR(8,4)"
```

<details>
<summary>Click to reveal solution</summary>

```r title="Neural network on yearly sunspots"
set.seed(600)
ex_sun <- nnetar(sunspot.year)
ex_sun$method
#> [1] "NNAR(9,5)"
```

**Explanation:** For sunspots R picks 9 lagged inputs and 5 hidden neurons. Sunspots have a longer cycle than lynx (about 11 years), so the model reaches further back to see a full cycle.

</details>

## What do p, P, and k mean in NNAR(p,P,k)[m]?

You have now seen two model names, `NNAR(8,4)` and `NNAR(9,5)`. The general form has four slots, and each one answers a different question about the network.

| Symbol | Name | What it controls |
|---|---|---|
| `p` | non-seasonal lags | How many recent values feed the network: lags 1 through `p` |
| `P` | seasonal lags | How many seasonal values feed it: lags `m`, `2m`, up to `Pm` |
| `k` | hidden nodes | How many neurons sit in the hidden layer |
| `m` | season length | Observations per cycle, 12 for monthly, 4 for quarterly |

For a series with no seasonality, `P` and `m` are dropped and the short form `NNAR(p,k)` is used. So `NNAR(8,4)` means 8 lagged inputs and 4 hidden nodes, which is exactly the `8-4-1` architecture the printout reported.

Here is where those two numbers came from. When you do not supply `p`, `nnetar()` quietly fits a plain linear AR model first and lets AIC pick its order. AIC is a model-selection score that rewards a close fit but charges a penalty for every extra lag, so the order it picks is the smallest one that still explains the series well. Whatever order that search lands on becomes the network's lag count. Let's check that claim directly.

```r title="Confirm where p and k came from"
fit_lynx$lags
#> [1] 1 2 3 4 5 6 7 8

fit_lynx$size
#> [1] 4

ar(lynx)$order
#> [1] 8
```

`fit_lynx$lags` lists the actual input lags, years 1 through 8 back. `fit_lynx$size` is the hidden layer width. And `ar(lynx)$order` is the AIC-optimal order of a linear AR model on the same series, which returns 8. That is not a coincidence: it is the rule.

The hidden layer size follows a formula. R sets $k = (p + P + 1)/2$, rounded. For lynx that is $(8 + 0 + 1)/2 = 4.5$, and R rounds a trailing .5 to the nearest even number, which gives 4 rather than 5.

Seasonal series get one extra ingredient. Let's fit `AirPassengers`, the classic 144-month record of international airline passengers from 1949 to 1960, counted in thousands. The call below carries one new argument, `lambda = 0`, which is unpacked in the note just after the printout.

```r title="Fit a seasonal network to AirPassengers"
set.seed(1105)
fit_air <- nnetar(AirPassengers, lambda = 0)
fit_air
#> Series: AirPassengers
#> Model:  NNAR(1,1,2)[12]
#> Call:   nnetar(y = AirPassengers, lambda = 0)
#>
#> Average of 20 networks, each of which is
#> a 2-2-1 network with 9 weights
#> options were - linear output units
#>
#> sigma^2 estimated as 0.002807
```

Now the name has all four slots: `NNAR(1,1,2)[12]`. Decode it left to right. `p = 1` means one recent lag, last month. `P = 1` means one seasonal lag. `k = 2` means two hidden neurons. `[12]` says the season is 12 observations long, which R read off the monthly series automatically.

So which two lags actually feed this network? Let's ask.

```r title="List the input lags of the seasonal model"
fit_air$lags
#> [1]  1 12
```

Lag 1 and lag 12. To predict next month, the network looks at last month and at the same month one year ago. That is a remarkably small model, just 9 weights, and the head-to-head comparison later shows it still forecasts respectably.

[NOTE]
**The lambda = 0 argument applies a log transform before fitting.** Passenger counts cannot be negative and their seasonal swings grow as the series grows, so modelling on the log scale keeps forecasts positive and makes the seasonal pattern a constant size. R back-transforms automatically when it forecasts, so the numbers you get out are still passengers.

The weight count is also arithmetic, not magic. Every hidden node gets one weight per input plus a bias, and the output node gets one weight per hidden node plus a bias. For `fit_air` that is $(2 + 1) \times 2 + (2 + 1) \times 1 = 9$. For lynx it is $(8 + 1) \times 4 + (4 + 1) \times 1 = 41$, matching the printout exactly.

**Try it:** Fit `AirPassengers` with 3 non-seasonal lags instead of 1, keeping `P = 1` and `size = 2`, then count the weights. Before you run it, work out the answer on paper: the inputs are lags 1, 2, 3 and 12, so 4 inputs.

```r title="Your turn: change p to 3 and count weights"
# Goal: set p = 3, then check the model name and weight count.
set.seed(77)
ex_air3 <- nnetar(AirPassengers, p = 1, P = 1, size = 2, lambda = 0)   # <- change p to 3
ex_air3$method
#> [1] "NNAR(1,1,2)[12]"
```

<details>
<summary>Click to reveal solution</summary>

```r title="Three non-seasonal lags solution"
set.seed(77)
ex_air3 <- nnetar(AirPassengers, p = 3, P = 1, size = 2, lambda = 0)
ex_air3$method
#> [1] "NNAR(3,1,2)[12]"

length(ex_air3$model[[1]]$wts)
#> [1] 13
```

**Explanation:** Four inputs (lags 1, 2, 3 and 12) into 2 hidden nodes gives $(4 + 1) \times 2 = 10$ weights, plus $(2 + 1) \times 1 = 3$ for the output, so 13 in total.

</details>

## How does the network actually turn past values into a number?

"Neural network" is usually where a tutorial stops explaining and starts calling it a black box. It does not have to be. A network this small is a handful of numbers and one curve, and in this section we are going to reproduce `forecast()`'s answer by hand with a calculator's worth of arithmetic.

To make that possible, let's deliberately build the smallest useful network. Two inputs feed a single hidden node, and we switch off the averaging so there is exactly one set of weights to look at.

```r title="Build a deliberately tiny network"
set.seed(7)
net_small <- nnetar(lynx, p = 2, P = 0, size = 1, repeats = 1)
net_small
#> Series: lynx
#> Model:  NNAR(2,1)
#> Call:   nnetar(y = lynx, p = 2, P = 0, size = 1, repeats = 1)
#>
#> Average of 1 networks, each of which is
#> a 2-1-1 network with 5 weights
#> options were - linear output units
#>
#> sigma^2 estimated as 653537
```

A `2-1-1` network with 5 weights. That whole model, the thing that will produce a forecast, is five numbers. Let's look at them.

```r title="Print all five weights"
w <- round(net_small$model[[1]]$wts, 4)
w
#> [1]  0.6772 -2.2486  1.3845  2.1217 -3.3008
```

They come in a fixed order. The first three belong to the hidden node: a bias of 0.6772, then a weight of -2.2486 on lag 1 and 1.3845 on lag 2. The last two belong to the output: a bias of 2.1217 and a weight of -3.3008 on the hidden node's value.

A weight is the multiplier applied to one input, and a bias is a constant added on top no matter what the inputs are, exactly like the intercept in `lm()`. Every node in the network has one bias and one weight per incoming connection.

![An NNAR(2,1) network sends two lagged inputs into one hidden node, which feeds a single forecast output.](screenshots/NNETAR-Model-in-R-network-architecture.webp)

*Figure 1: An NNAR(2,1) network: two lagged inputs, one hidden node, one forecast out.*

Before the arithmetic, there is one preprocessing step to know about. By default `nnetar()` standardises its inputs, subtracting the mean of the series and dividing by its standard deviation, because neurons behave badly when fed raw values in the thousands. Those two numbers are stored on the model.

```r title="Read the input scaling constants"
ctr <- net_small$scalex$center
scl <- net_small$scalex$scale
c(center = ctr, scale = scl)
#>   center    scale
#> 1538.018 1585.844
```

Now we have everything. The last two lynx observations are 2657 in 1933 and 3396 in 1934. To forecast 1935 the network takes lag 1 (3396) and lag 2 (2657), scales them, pushes them through the hidden node, and reads off the output.

If you would rather skip the equations, the code block after them does the same thing and you can jump straight there. Each hidden node computes a weighted sum of its inputs plus a bias, then squashes the result with the logistic sigmoid:

$$h = \sigma\left(b + \sum_{i=1}^{n} w_i x_i\right), \qquad \sigma(z) = \frac{1}{1 + e^{-z}}$$

Where:

- $h$ = the hidden node's output, always between 0 and 1
- $b$ = the hidden node's bias, 0.6772 here
- $w_i$ = the weight on input $i$
- $x_i$ = the scaled value of lag $i$
- $\sigma$ = the sigmoid, the curve that does all the bending

The output node then takes a plain weighted sum of the hidden values, with no sigmoid (that is what `linear output units` meant in the printout):

$$\hat{y}_{\text{scaled}} = b_o + \sum_{j=1}^{k} v_j h_j$$

Where $b_o$ is the output bias (2.1217), $v_j$ is the weight on hidden node $j$ (-3.3008), and $h_j$ is that node's value. Finally we undo the scaling with $\hat{y} = \hat{y}_{\text{scaled}} \times s + c$.

Let's run exactly that, one line per step.

```r title="Compute the forecast by hand"
x1 <- (3396 - ctr) / scl        # lag 1, scaled
x2 <- (2657 - ctr) / scl        # lag 2, scaled

h_in       <- w[1] + w[2] * x1 + w[3] * x2
h_out      <- 1 / (1 + exp(-h_in))
out_scaled <- w[4] + w[5] * h_out

round(c(x1 = x1, x2 = x2, h_in = h_in, h_out = h_out), 4)
#>      x1      x2    h_in   h_out
#>  1.1716  0.7056 -0.9804  0.2728
```

Follow it through. Scaling turns 3396 into 1.1716 and 2657 into 0.7056, so both years were above the long-run average. The hidden node combines them into -0.9804. The sigmoid squashes that into 0.2728, a number between 0 and 1.

Now the last two steps: the output node, then undoing the scaling. Then we check the result against `forecast()`.

```r title="Compare the hand calculation to forecast()"
round(out_scaled * scl + ctr, 3)
#> [1] 3474.608

round(as.numeric(forecast(net_small, h = 1)$mean), 3)
#> [1] 3474.611
```

3474.608 by hand against 3474.611 from `forecast()`. The gap of three thousandths is entirely because we rounded the weights to four decimal places before using them. Otherwise the numbers are the same, because they are the same calculation.

[KEY INSIGHT]
**The network is not doing anything you cannot follow.** Multiply, add, squash with a sigmoid, multiply, add, unscale. What makes a real network hard to read is not the arithmetic, it is that a 41-weight model does this 4 times in parallel and no single weight means anything on its own.

**Try it:** The sigmoid is the only nonlinear part of the whole model, so it is worth being able to compute it yourself. Change `ex_h_in` below to -0.9804 (the value our hidden node received) and check that the sigmoid returns 0.2728.

```r title="Your turn: compute a sigmoid by hand"
# Goal: apply the sigmoid to -0.9804 and confirm you get 0.2728.
ex_h_in  <- 0                       # <- change this to -0.9804
ex_h_out <- 1 / (1 + exp(-ex_h_in))
round(ex_h_out, 4)
#> [1] 0.5
```

<details>
<summary>Click to reveal solution</summary>

```r title="Sigmoid of the hidden node input"
ex_h_in  <- -0.9804
ex_h_out <- 1 / (1 + exp(-ex_h_in))
round(ex_h_out, 4)
#> [1] 0.2728
```

**Explanation:** The sigmoid maps any real number into the range 0 to 1. It returns exactly 0.5 at an input of 0, drifts toward 0 for negative inputs and toward 1 for positive ones. Our input of -0.9804 sits below zero, so the output 0.2728 sits below 0.5.

</details>

### Why does nnetar fit 20 networks and average them?

Every printout so far has said `Average of 20 networks`. That is the `repeats` argument, and its default of 20 exists for a specific reason: a neural network's answer depends on where its weights started.

Training begins from random weights and walks downhill until the error stops improving. But the error surface has many valleys, so a different random start can settle in a different valley and give you a different model. Let's make that visible by fitting single networks, twice, from different starting points.

```r title="Fit one network twice from different starts"
set.seed(101); one_a <- nnetar(lynx, repeats = 1)
set.seed(202); one_b <- nnetar(lynx, repeats = 1)

round(forecast(one_a, h = 3)$mean, 1)
#> [1] 4637.6 5026.3 5514.9

round(forecast(one_b, h = 3)$mean, 1)
#> [1] 4566.1 3569.0 1389.2
```

Same function, same data, same settings. The only difference is the random seed, and the two models disagree completely. The first says lynx numbers keep climbing to 5515. The second says they crash to 1389. If you shipped either one as "the forecast", the number you shipped was decided by the random seed rather than by the data.

Now let's do exactly the same thing with the default of 20 networks averaged.

```r title="Average 20 networks from the same two starts"
set.seed(101); avg_a <- nnetar(lynx, repeats = 20)
set.seed(202); avg_b <- nnetar(lynx, repeats = 20)

round(forecast(avg_a, h = 3)$mean, 1)
#> [1] 3806.4 3270.0 1793.0

round(forecast(avg_b, h = 3)$mean, 1)
#> [1] 4126.5 3432.5 1592.3
```

The two runs now tell the same story: a value near 4000, then a decline, then a further decline into the 1500 to 1800 range. They still are not identical, but the disagreement has shrunk from "crash versus boom" to a difference of a few hundred animals. Averaging cancels the luck of individual starting points.

There is a second thing worth understanding about these numbers. `nnetar()` trains the network to predict one step ahead, and nothing more. So how does it produce step 3?

![Each forecast is fed back in as an input to produce the next one, so errors accumulate along the horizon.](screenshots/NNETAR-Model-in-R-recursive-forecast.webp)

*Figure 2: Forecasts beyond step 1 are fed back in as inputs, so errors compound.*

It feeds its own output back in. Step 1 uses real observations. Step 2 uses the step-1 forecast in place of the value it does not have yet. Step 3 uses steps 1 and 2. This is called recursive forecasting, and it explains why long-horizon neural network forecasts drift toward a flat line: after enough steps, the network is looking almost entirely at its own guesses.

[WARNING]
**Without set.seed() your forecast changes every time you run the script.** Because training starts from random weights, the same code gives different numbers on Monday and Tuesday. Put a `set.seed()` line immediately before every `nnetar()` call in anything you will rerun or hand to someone else.

**Try it:** Confirm the seed rule for yourself. The starter uses two different seeds, so the check returns `FALSE`. Change the second seed to match the first and the two forecasts should become identical.

```r title="Your turn: make two fits identical"
# Goal: use the SAME seed for both fits so identical() returns TRUE.
set.seed(500); ex_seed_a <- nnetar(lynx, repeats = 1)
set.seed(999); ex_seed_b <- nnetar(lynx, repeats = 1)   # <- change 999 to 500

identical(round(forecast(ex_seed_a, h = 3)$mean, 4),
          round(forecast(ex_seed_b, h = 3)$mean, 4))
#> [1] FALSE
```

<details>
<summary>Click to reveal solution</summary>

```r title="Same seed gives an identical model"
set.seed(500); ex_seed_a <- nnetar(lynx, repeats = 1)
set.seed(500); ex_seed_b <- nnetar(lynx, repeats = 1)

identical(round(forecast(ex_seed_a, h = 3)$mean, 4),
          round(forecast(ex_seed_b, h = 3)$mean, 4))
#> [1] TRUE
```

**Explanation:** The seed fixes the random starting weights, so training follows the same path and lands on the same model. This is what makes a neural network forecast reproducible.

</details>

## How do you forecast seasonal data with nnetar()?

We fitted `fit_air` earlier and found it uses just two inputs, lag 1 and lag 12. Now let's push it forward two years and see whether two inputs are enough to reproduce an annual travel pattern.

```r title="Forecast two years of air passengers"
fc_air <- forecast(fit_air, h = 24)
autoplot(fc_air)

round(head(fc_air$mean, 6), 1)
#>        Jan   Feb   Mar   Apr   May   Jun
#> 1961 457.6 436.9 460.3 502.5 519.1 578.6
```

The plot shows the forecast picking up the series in 1961 and continuing the familiar sawtooth. The printed numbers say the same thing in figures: January 457, a dip in February to 436, then a steady climb into the summer peak, reaching 578 in June.

That shape is not something we told the model about. It emerged from the lag-12 input. Every time the network predicts a month, it is looking at what happened in that same month a year earlier, so February's dip and June's surge propagate forward on their own.

Note also that the forecasts sit above the historical values for those months, because the lag-1 input carries the series' upward drift into the first few predictions. The limitations section explains why that drift does not last as far as you might hope.

[TIP]
**Reach for lambda = 0 whenever the series is strictly positive and its seasonal swings grow with its level.** Passenger counts, sales, and web traffic almost always qualify. The log transform makes those swings a constant size for the model to learn, and it guarantees the back-transformed forecasts never go negative.

**Try it:** Fit a network to `USAccDeaths`, the monthly count of accidental deaths in the United States from 1973 to 1978, and read the season length off the model name. The starter fits `lynx`, which is yearly, so it has no seasonal slot at all.

```r title="Your turn: fit a monthly series"
# Goal: fit nnetar() to USAccDeaths and read the [m] in the model name.
set.seed(311)
ex_deaths <- nnetar(lynx)   # <- swap lynx for USAccDeaths
ex_deaths$method
#> [1] "NNAR(8,4)"
```

<details>
<summary>Click to reveal solution</summary>

```r title="Monthly accidental deaths network"
set.seed(311)
ex_deaths <- nnetar(USAccDeaths)
ex_deaths$method
#> [1] "NNAR(2,1,2)[12]"

frequency(USAccDeaths)
#> [1] 12
```

**Explanation:** The `[12]` comes straight from `frequency(USAccDeaths)`, which is 12 because the data is monthly. R never asks you for the season length, it reads it from the `ts` object, which is why storing data as a proper `ts` matters.

</details>

## How do you get prediction intervals from a neural network?

Every forecast so far has been a single line. Real forecasts need a range, and here NNETAR is genuinely different from ARIMA or ETS. Those models have a probability distribution built into their definition, so their intervals come from a formula. A neural network has no such distribution, so R has to simulate one.

The recipe is straightforward. Take the fitted network, forecast one step, add a randomly drawn error to it, feed that noisy value back in as a lag, and continue to the horizon. That gives one possible future. Do it a few hundred times and the spread of those futures is your prediction interval. Because that is real work, R does not do it unless you ask with `PI = TRUE`.

```r title="Simulate prediction intervals"
set.seed(55)
fc_pi <- forecast(fit_air, h = 12, PI = TRUE, npaths = 200)
round(head(as.data.frame(fc_pi), 4), 1)
#>          Point Forecast Lo 80 Hi 80 Lo 95 Hi 95
#> Jan 1961          457.6 425.8 485.3 409.4 502.9
#> Feb 1961          436.9 408.0 469.1 389.3 479.2
#> Mar 1961          460.3 433.0 486.2 412.1 516.0
#> Apr 1961          502.5 473.5 542.1 462.0 560.4
```

`npaths = 200` is the number of simulated futures, kept modest here so the block runs quickly (the default is 1000, which is better for real work). Each row gives the point forecast plus four bounds. For January 1961, the model's best guess is 457.6 thousand passengers, it is 80% confident the truth lands between 425.8 and 485.3, and 95% confident it lands between 409.4 and 502.9.

Notice the intervals widening as you read down: January spans about 93 thousand at the 95% level, April spans about 98. That widening is the recursive feedback we saw earlier showing up as uncertainty. The further out you go, the more the network is forecasting from its own forecasts.

By default the simulated errors are drawn from a normal distribution. If your residuals are skewed or heavy-tailed, `bootstrap = TRUE` resamples actual historical residuals instead, which makes no distributional assumption.

[WARNING]
**These intervals are too narrow, and you should say so out loud.** The simulation treats the fitted network as if it were the true data-generating process, so it captures the noise around the model but not the risk that the model itself is wrong. Treat an NNETAR interval as a lower bound on your real uncertainty.

**Try it:** Switch the error simulation from the normal default to bootstrapped residuals and compare the average width of the 95% interval. Add `bootstrap = TRUE` to the call below.

```r title="Your turn: bootstrap the residuals"
# Goal: add bootstrap = TRUE and see how the average 95% interval width changes.
set.seed(66)
ex_boot <- forecast(fit_air, h = 6, PI = TRUE, npaths = 200)
round(mean(ex_boot$upper[, 2] - ex_boot$lower[, 2]), 1)
#> [1] 103.1
```

<details>
<summary>Click to reveal solution</summary>

```r title="Bootstrapped prediction intervals"
set.seed(66)
ex_boot <- forecast(fit_air, h = 6, PI = TRUE, npaths = 200,
                    bootstrap = TRUE)
round(mean(ex_boot$upper[, 2] - ex_boot$lower[, 2]), 1)
#> [1] 104.1
```

**Explanation:** The average 95% interval widens slightly, from 103.1 to 104.1 thousand passengers. The two are close here because this model's residuals are already near-normal. On a series with occasional large shocks the bootstrap version would be noticeably wider, and more honest.

</details>

## How do you tune nnetar with size, decay, and xreg?

The defaults are a reasonable starting point, not an answer. The argument that matters most is `size`, the number of hidden nodes, because it decides how much the model is able to memorise. Let's see what happens when we give it far too much capacity.

First we need an honest test. We hold back the last two years of `AirPassengers` so the model never sees them during training. `window()` is the base R function for cutting a `ts` object by date: `end = c(1958, 12)` keeps everything up to December 1958, and `start = c(1959, 1)` keeps everything after it.

```r title="Split the data and overfit on purpose"
train <- window(AirPassengers, end = c(1958, 12))
test  <- window(AirPassengers, start = c(1959, 1))

set.seed(21)
big <- nnetar(train, p = 12, P = 1, size = 10, lambda = 0)
big
#> Series: train
#> Model:  NNAR(12,1,10)[12]
#> Call:   nnetar(y = train, p = 12, P = 1, size = 10, lambda = 0)
#>
#> Average of 20 networks, each of which is
#> a 12-10-1 network with 141 weights
#> options were - linear output units
#>
#> sigma^2 estimated as 9.587e-05
```

141 weights fitted to 108 usable training rows. `train` holds 120 months, but with `p = 12` the first 12 are consumed as lags for the thirteenth, so only 108 rows can actually be predicted. There are more parameters than data points, which should worry you. Let's score it on both sets and see whether it does.

```r title="Score the overfitted model"
round(accuracy(forecast(big, h = 24), test)[, c("RMSE", "MAE", "MAPE")], 2)
#>               RMSE   MAE  MAPE
#> Training set  2.13  1.41  0.48
#> Test set     69.29 63.15 13.84
```

`accuracy()` scores a forecast against the truth, and the three columns are the standard error measures. RMSE is the root mean squared error, the typical miss in passenger units with big misses weighted heavily. MAE is the mean absolute error, the typical miss with every miss weighted equally. MAPE is the mean absolute percentage error, the typical miss as a percentage of the actual value.

Read the two rows against each other. On data it trained on, the model is off by 2.13 thousand passengers on average, which looks superb. On data it has never seen, it is off by 69.29, more than thirty times worse. The model did not learn the pattern, it memorised the training years.

The fix is `decay`, which penalises large weights during training and so pushes the network toward simpler behaviour. Let's add it and change nothing else.

```r title="Add weight decay to the same model"
set.seed(21)
reg <- nnetar(train, p = 12, P = 1, size = 10, decay = 0.1, lambda = 0)
round(accuracy(forecast(reg, h = 24), test)[, c("RMSE", "MAE", "MAPE")], 2)
#>               RMSE   MAE MAPE
#> Training set 12.76  9.90 4.07
#> Test set     51.68 42.61 8.81
```

The training error got six times worse and the test error improved by a quarter. That trade is the entire point of regularisation: we gave up a fit we could not trust for a fit that generalises better.

[KEY INSIGHT]
**Judge an NNETAR model only on data it has not seen.** The `sigma^2` on the printout and the training-set row of `accuracy()` both measure how well the network memorised its own training data, and a big enough network can drive both to nearly zero while forecasting terribly. The test-set row is the only number that answers your actual question.

**Try it:** The oversized model above has 10 hidden nodes. Reduce `size` to 2 and see what the test RMSE does. Everything else stays the same.

```r title="Your turn: shrink the hidden layer"
# Goal: change size from 10 to 2 and compare the test RMSE (baseline: 69.29).
set.seed(21)
ex_two <- nnetar(train, p = 12, P = 1, size = 10, lambda = 0)   # <- change size to 2
round(accuracy(forecast(ex_two, h = 24), test)["Test set", "RMSE"], 2)
#> [1] 69.29
```

<details>
<summary>Click to reveal solution</summary>

```r title="Two hidden nodes solution"
set.seed(21)
ex_two <- nnetar(train, p = 12, P = 1, size = 2, lambda = 0)
round(accuracy(forecast(ex_two, h = 24), test)["Test set", "RMSE"], 2)
#> [1] 42.98
```

**Explanation:** Test RMSE drops from 69.29 to 42.98 just by removing hidden nodes. Shrinking the network beat adding regularisation to the large one (51.68), which is a common pattern: the cheapest fix for overfitting is usually a smaller model.

</details>

### Can nnetar use external regressors with xreg?

Sometimes the series' own past is not the whole story. A promotion, a holiday, a price change, or a temperature reading can drive the value you are forecasting, and `nnetar()` accepts those as extra inputs through `xreg`. Each column of `xreg` simply becomes another input node alongside the lags.

To see the effect cleanly, let's build a series where we know an external driver matters, because we put it there. Monthly sales follow a seasonal wave, and in months with a promotion they jump by 25 units.

```r title="Build a sales series driven by promotions"
set.seed(808)
promo     <- rbinom(132, 1, 0.25)
seasonal  <- 100 + 20 * sin(2 * pi * (1:132) / 12)
sales_all <- seasonal + 25 * promo + rnorm(132, 0, 3)

sales        <- ts(sales_all[1:120], frequency = 12)
sales_test   <- ts(sales_all[121:132], frequency = 12, start = c(11, 1))
promo_train  <- promo[1:120]
promo_future <- promo[121:132]

round(head(sales, 6), 1)
#>     Jan   Feb   Mar   Apr   May   Jun
#> 1 133.9 117.1 126.4 139.6 134.0  98.5

head(promo_train, 12)
#>  [1] 1 0 0 1 1 0 0 1 0 0 1 0
```

We made 132 months, kept the first 120 for training and held back the last 12 for testing. `promo` is a 0/1 indicator that is on about a quarter of the time. Notice that we also kept `promo_future`, the indicator values for the test months. You must have future values of any regressor to forecast with it, which is the practical catch with `xreg`.

Now fit the same series twice, once blind to the promotions and once told about them.

```r title="Fit with and without the promotion regressor"
set.seed(31); nn_no  <- nnetar(sales)
set.seed(31); nn_yes <- nnetar(sales, xreg = promo_train)

c(no_xreg   = length(nn_no$model[[1]]$wts),
  with_xreg = length(nn_yes$model[[1]]$wts))
#>   no_xreg with_xreg
#>         9        11
```

Both models chose the same `NNAR(1,1,2)[12]` shape, but the second has 11 weights instead of 9. Those two extra weights are the promotion input wiring into each of the two hidden nodes. Let's see whether they earn their keep.

```r title="Compare test accuracy with and without xreg"
round(accuracy(forecast(nn_no, h = 12), sales_test)["Test set", c("RMSE", "MAE", "MAPE")], 2)
#>  RMSE   MAE  MAPE
#> 12.44 10.89 10.65

round(accuracy(forecast(nn_yes, xreg = promo_future, h = 12),
               sales_test)["Test set", c("RMSE", "MAE", "MAPE")], 2)
#> RMSE  MAE MAPE
#> 5.82 4.67 4.66
```

Test RMSE more than halves, from 12.44 to 5.82. The blind model can only average over promotion and non-promotion months and land somewhere in between. The informed model knows which months get the 25-unit bump and moves its forecast accordingly.

Note the syntax difference in the second call: when a model was fitted with `xreg`, `forecast()` demands the future regressor values through `xreg =` as well. Forget it and R throws an error rather than guessing.

[WARNING]
**Do not feed a raw time index as an xreg to fake a trend.** It is a tempting trick, but it makes forecasts worse, not better. The network standardises its inputs using the training range, so a time index for future periods arrives as a value larger than anything seen in training, and the network has no idea what to do out there. The limitations section covers the workaround that actually works.

**Try it:** Confirm the input count directly rather than inferring it from the weights. `nn_yes$model[[1]]$n` holds the network's layer sizes as a vector of three numbers: inputs, hidden nodes, outputs.

```r title="Your turn: read the layer sizes"
# Goal: print the layer sizes of BOTH models and compare the input counts.
nn_no$model[[1]]$n
#> [1] 2 2 1
```

<details>
<summary>Click to reveal solution</summary>

```r title="Layer sizes of both models"
rbind(no_xreg   = nn_no$model[[1]]$n,
      with_xreg = nn_yes$model[[1]]$n)
#>           [,1] [,2] [,3]
#> no_xreg      2    2    1
#> with_xreg    3    2    1
```

**Explanation:** The first column is the input count: 2 lags alone, versus 2 lags plus 1 regressor. The hidden layer (2) and output layer (1) are unchanged, which is why the weight count went up by exactly 2, one connection from the new input to each hidden node.

</details>

## Does nnetar actually beat ARIMA and ETS?

Most tutorials on this topic never answer it. Neural networks sound more powerful than the classical methods, so it is easy to assume they forecast better. Let's just measure it, on the same train and test split we built while tuning.

```r title="Fit three model families on the same data"
set.seed(9)
m_nn <- nnetar(train, lambda = 0)
m_ar <- auto.arima(train, lambda = 0)
m_et <- ets(train, lambda = 0)

c(nnetar = m_nn$method, arima = as.character(m_ar), ets = m_et$method)
#>                    nnetar                     arima                       ets
#>         "NNAR(1,1,2)[12]" "ARIMA(0,1,1)(0,1,1)[12]"              "ETS(A,A,A)"
```

Three automatic model selections, three different answers. The neural network chose a 9-weight `NNAR(1,1,2)[12]`, `auto.arima()` chose the airline model, and `ets()` chose additive error, trend and seasonality. All three saw exactly the same 120 months of training data. Now we score them on the 24 months none of them saw.

```r title="Score all three on the held-out years"
rbind(
  nnetar = accuracy(forecast(m_nn, h = 24), test)["Test set", c("RMSE", "MAE", "MAPE")],
  arima  = accuracy(forecast(m_ar, h = 24), test)["Test set", c("RMSE", "MAE", "MAPE")],
  ets    = accuracy(forecast(m_et, h = 24), test)["Test set", c("RMSE", "MAE", "MAPE")]
) |> round(2)
#>         RMSE   MAE MAPE
#> nnetar 37.33 27.66 5.59
#> arima  43.18 39.45 8.52
#> ets    26.54 21.42 4.47
```

Read the RMSE column. ETS wins at 26.54, the neural network is second at 37.33, and ARIMA comes last at 43.18. MAPE tells the same story: ETS is off by 4.47% on average, NNETAR by 5.59%, ARIMA by 8.52%.

So the honest answer is: sometimes, and not here. The neural network comfortably beat ARIMA on this series while using a fraction of the parameters, but a classical exponential smoothing model beat both. That is a very typical result. Neural networks earn their advantage on nonlinear dynamics, and monthly airline passengers are mostly trend plus seasonality, which is precisely what ETS was designed for.

[NOTE]
**One series and one split is one data point, not evidence.** Change the split date or the seed and the ranking can move. To decide which family suits your data, use rolling-origin time series cross-validation with `tsCV()`, which scores each model over many origins instead of one.

**Try it:** Add a fourth contender, the seasonal naive forecast, which simply repeats last year's value for each month. If a model cannot beat that, it is not earning its complexity.

```r title="Your turn: add the seasonal naive benchmark"
# Goal: score snaive() on the same test set and compare with the three above.
ex_naive <- snaive(train, h = 24)
round(accuracy(ex_naive, test)["Test set", c("RMSE", "MAE", "MAPE")], 2)
#>  RMSE   MAE  MAPE
#> 76.99 71.25 15.52
```

<details>
<summary>Click to reveal solution</summary>

The starter already runs the benchmark, so the exercise is reading it. Seasonal naive scores a test RMSE of 76.99, well behind all three fitted models.

```r title="Seasonal naive versus the neural network"
round(c(snaive = accuracy(snaive(train, h = 24), test)["Test set", "RMSE"],
        nnetar = accuracy(forecast(m_nn, h = 24), test)["Test set", "RMSE"]), 2)
#> snaive nnetar
#>  76.99  37.33
```

**Explanation:** The neural network halves the naive error, so it is genuinely learning something. Always run this check. On a series with a weaker signal, a model that looks respectable in isolation can turn out to be no better than repeating last year.

</details>

## What are nnetar's limitations, and how do you work around them?

Here are the five failure modes you will run into in practice, with the biggest one demonstrated in code.

| Limitation | Why it happens | What to do |
|---|---|---|
| Cannot extrapolate a trend | `nnetar()` never differences the series | Difference it yourself, or use ARIMA or ETS |
| Needs a long history | Many weights, few observations | Prefer classical models under roughly 100 points |
| No interpretable coefficients | Weights have no individual meaning | Use ARIMA if you must explain the model |
| Optimistic prediction intervals | Simulation assumes the model is correct | Report them as a lower bound |
| Different answer every run | Random starting weights | Always `set.seed()`, keep `repeats` at 20 or more |

The trend problem is the one that surprises people, so let's watch it happen. This series is about as easy as forecasting gets: it starts at 50 and climbs by exactly 2 per period, with a little noise.

```r title="Fit a network to a straight upward trend"
set.seed(3)
trend_ts <- ts(50 + 2 * (1:60) + rnorm(60, 0, 4))

set.seed(3)
nn_tr <- nnetar(trend_ts)
round(forecast(nn_tr, h = 10)$mean, 1)
#> Time Series:
#> Start = 61
#> End = 70
#> Frequency = 1
#>  [1] 166.2 165.7 165.2 164.9 164.6 164.3 164.1 163.9 163.8 163.7
```

The series ends around 170 and should continue to roughly 190 over the next ten periods. Instead the forecast flattens at 166 and then edges slightly *down*. The model does not merely fail to project the trend, it reverses it.

The reason is not that the network is weak, it is that the trend takes the inputs somewhere the network has never been. Predicting period 61 requires an input around 170, which is at the very edge of the training range, and every step after that would need inputs beyond it. A sigmoid flattens out at both ends of its range, so once the inputs push past the training range it returns almost the same value for every one of them, and the forecast goes flat.

A model that does difference the series has no such problem. Same data, one line.

```r title="ARIMA on the same trending series"
round(forecast(auto.arima(trend_ts), h = 10)$mean, 1)
#> Time Series:
#> Start = 61
#> End = 70
#> Frequency = 1
#>  [1] 170.1 172.0 175.0 177.4 179.1 181.0 182.9 184.9 187.0 189.0
```

`auto.arima()` climbs from 170.1 to 189.0, almost exactly the true path. The difference is not intelligence, it is differencing: ARIMA models the period-to-period *changes*, which have no trend at all and so stay comfortably inside the range it was trained on.

That points straight at the fix. If you want a neural network on a trending series, difference it first, model the changes, then add them back up.

```r title="Difference first, then undo the differencing"
d_ts <- diff(trend_ts)

set.seed(3)
nn_d <- nnetar(d_ts)
fc_d <- forecast(nn_d, h = 10)$mean

undiff <- as.numeric(tail(trend_ts, 1)) + cumsum(as.numeric(fc_d))
round(undiff, 1)
#>  [1] 171.5 174.4 179.7 179.5 178.2 184.0 184.0 188.8 188.1 192.1
```

Three steps. `diff()` converts levels into changes. The network forecasts the changes, which hover around 2 and stay well inside the range it learned. Then `cumsum()` adds those changes onto the last observed value to rebuild levels.

The result climbs from 171.5 to 192.1, tracking the real trend. It is bumpier than the ARIMA path because the network is also modelling noise in the differences, but the systematic failure is gone.

[WARNING]
**nnetar() never differences your data, and it will not warn you.** ARIMA reports its differencing in the model name, so `ARIMA(0,1,1)` tells you it worked on first differences. An NNAR name has no such slot, because there is no such step. Checking your series for trend before you fit is your job, not the function's.

**Try it:** Compare the model that `nnetar()` chooses on the original trending series against the one it chooses on the differenced series. The two are already fitted above as `nn_tr` and `nn_d`.

```r title="Your turn: compare the two chosen models"
# Goal: print BOTH model names side by side, not just the differenced one.
nn_d$method
#> [1] "NNAR(4,2)"
```

<details>
<summary>Click to reveal solution</summary>

```r title="Original versus differenced model choice"
c(original = nn_tr$method, differenced = nn_d$method)
#>    original differenced
#> "NNAR(1,1)" "NNAR(4,2)"
```

**Explanation:** On the raw trending series R picks `NNAR(1,1)`, a single lag into a single neuron, because a trend is almost perfectly predicted by the previous value and nothing else adds much. After differencing, the trend is gone and the genuine short-run structure becomes visible, so R reaches for 4 lags and 2 neurons.

</details>

## Complete Example: forecasting US accidental deaths

Let's run the whole workflow end to end on a series we have not modelled yet: `USAccDeaths`, monthly accidental deaths in the United States from 1973 to 1978. We will split the data, fit a network, benchmark it against something dumb, and only then decide what to ship.

```r title="Split the series and fit a network"
ud_train <- window(USAccDeaths, end = c(1977, 12))
ud_test  <- window(USAccDeaths, start = c(1978, 1))

set.seed(410)
ud_fit <- nnetar(ud_train, lambda = 0)
ud_fit
#> Series: ud_train
#> Model:  NNAR(2,1,2)[12]
#> Call:   nnetar(y = ud_train, lambda = 0)
#>
#> Average of 20 networks, each of which is
#> a 3-2-1 network with 11 weights
#> options were - linear output units
#>
#> sigma^2 estimated as 0.002223
```

Sixty months of training data, and R fits an `NNAR(2,1,2)[12]` with 11 weights: lags 1, 2 and 12 into two hidden nodes. That is a sensibly small model for a short series. Now the step most people skip.

```r title="Benchmark against seasonal naive"
ud_snaive <- snaive(ud_train, h = 12)

rbind(
  nnetar = accuracy(forecast(ud_fit, h = 12), ud_test)["Test set", c("RMSE", "MAE", "MAPE")],
  snaive = accuracy(ud_snaive, ud_test)["Test set", c("RMSE", "MAE", "MAPE")]
) |> round(2)
#>          RMSE    MAE MAPE
#> nnetar 546.64 483.67 5.33
#> snaive 341.16 259.50 2.85
```

The neural network loses. Repeating last year's figures beats it on every measure, with an RMSE of 341 against 547 and a MAPE of 2.85% against 5.33%.

This is a real result, and the reason matters. `USAccDeaths` is a strongly seasonal series with only 60 training months, which means the network sees each calendar month just five times. There is not enough history for it to learn the seasonal shape better than simply copying it, and the tuning grid below confirms that no hidden layer size rescues it.

```r title="Try a grid of hidden layer sizes"
ud_grid <- sapply(c(1, 2, 3, 5), function(k) {
  set.seed(410)
  m <- nnetar(ud_train, size = k, lambda = 0)
  accuracy(forecast(m, h = 12), ud_test)["Test set", "RMSE"]
})
names(ud_grid) <- paste0("size=", c(1, 2, 3, 5))
round(ud_grid, 2)
#> size=1 size=2 size=3 size=5
#> 571.50 546.64 619.57 565.16
```

Every size lands between 546 and 620, all worse than seasonal naive's 341. The right decision here is to ship `snaive()` for this series, or to try ETS, and to record that NNETAR was tested and rejected. A workflow that can return "no" is worth more than one that always returns a neural network.

For completeness, here is what shipping the network would have looked like: refit on all 72 months and forecast the next year with intervals.

```r title="Refit on all the data and forecast with intervals"
set.seed(410)
ud_full <- nnetar(USAccDeaths, lambda = 0)

set.seed(411)
ud_fc <- forecast(ud_full, h = 12, PI = TRUE, npaths = 200)
round(head(as.data.frame(ud_fc), 3), 0)
#>          Point Forecast Lo 80 Hi 80 Lo 95 Hi 95
#> Jan 1979           8466  7941  9064  7724  9254
#> Feb 1979           7519  6874  8299  6554  8648
#> Mar 1979           7805  7265  8229  7012  8564
```

Refitting on the full series before forecasting is standard practice: the split existed only to choose a model, so once chosen, the model should learn from every observation you have.

![A safe nnetar workflow runs split, seed, fit, tune, score, then refit on all the data.](screenshots/NNETAR-Model-in-R-workflow.webp)

*Figure 3: A safe nnetar workflow: split, seed, tune, score, then refit on everything.*

## Practice Exercises

These combine several ideas from the tutorial. They use variable names starting with `my_` so they will not disturb anything fitted above.

### Exercise 1: Find the best hidden layer size for AirPassengers

The default `nnetar(train, lambda = 0)` scored a test RMSE of 37.33 in the head-to-head comparison. Loop `size` from 1 to 6, refit each time on `train` with `set.seed(88)` inside the loop, score each on `test` at `h = 24`, and report which size wins.

```r title="Exercise 1: tune size with a grid search"
# Hint: sapply() over 1:6, and inside the function call set.seed(88)
# then nnetar(train, size = k, lambda = 0).
# Score with accuracy(forecast(m, h = 24), test)["Test set", "RMSE"]

# Write your code below:

```

<details>
<summary>Click to reveal solution</summary>

```r title="Grid search over hidden layer size"
my_grid <- sapply(1:6, function(k) {
  set.seed(88)
  m <- nnetar(train, size = k, lambda = 0)
  accuracy(forecast(m, h = 24), test)["Test set", "RMSE"]
})
names(my_grid) <- paste0("size=", 1:6)
round(my_grid, 2)
#> size=1 size=2 size=3 size=4 size=5 size=6
#>  40.74  36.60  32.36  32.32  29.88  31.42

which.min(my_grid)
#> size=5
#>      5
```

**Explanation:** Five hidden nodes wins with a test RMSE of 29.88, well ahead of the default's 37.33 and now close to the 26.54 that ETS managed. The curve falls to a minimum at 5 and rises again at 6, which is the overfitting from the tuning section starting to appear. Note that `set.seed()` goes *inside* the function so every candidate starts from the same random weights and the comparison is fair.

</details>

### Exercise 2: Rescue the default model on lynx

The automatic choice for `lynx` was `NNAR(8,4)`, 8 lags into 4 neurons. Test whether that is actually a good choice: train on `lynx` up to 1920, test on 1921 onward (14 years), and compare `p` values of 2, 4, 8 and 12 with `set.seed(12)`. Use `window()` to build the split.

```r title="Exercise 2: does the default p win on lynx?"
# Hint: lx_train <- window(lynx, end = 1920); lx_test <- window(lynx, start = 1921)
# Then sapply() over c(2, 4, 8, 12) fitting nnetar(lx_train, p = pp)
# and scoring accuracy(forecast(m, h = 14), lx_test)["Test set", "RMSE"]

# Write your code below:

```

<details>
<summary>Click to reveal solution</summary>

```r title="Lag search on a held-out lynx split"
lx_train <- window(lynx, end = 1920)
lx_test  <- window(lynx, start = 1921)

my_res <- sapply(c(2, 4, 8, 12), function(pp) {
  set.seed(12)
  m <- nnetar(lx_train, p = pp)
  accuracy(forecast(m, h = 14), lx_test)["Test set", "RMSE"]
})
names(my_res) <- paste0("p=", c(2, 4, 8, 12))
round(my_res, 1)
#>    p=2    p=4    p=8   p=12
#>  418.5  799.0 1682.9 1436.8
```

**Explanation:** Two lags beat eight by a factor of four, 418.5 against 1682.9. The default `p` comes from an AIC fit on the *training* data, which rewards explaining the past rather than predicting the future. On a 14-year horizon the small model wins because its forecasts have far less room to compound their own errors. Never assume the automatic order is the best forecasting order.

</details>

### Exercise 3: Write a reusable differenced-nnetar function

The limitations section showed the difference-then-undo trick as loose lines of code. Package it into a function `nnetar_diff(y, h, seed)` that differences the series, fits a network, forecasts `h` steps, and returns forecasts on the original scale. Test it on `my_series`, a trending series built the same way as `trend_ts`.

```r title="Exercise 3: wrap the differencing workaround"
# Hint: inside the function, dy <- diff(y); set.seed(seed); m <- nnetar(dy)
# fc <- as.numeric(forecast(m, h = h)$mean)
# return as.numeric(tail(y, 1)) + cumsum(fc)

set.seed(3)
my_series <- ts(50 + 2 * (1:60) + rnorm(60, 0, 4))

# Write your function below:

```

<details>
<summary>Click to reveal solution</summary>

```r title="A reusable differenced-network forecaster"
nnetar_diff <- function(y, h = 10, seed = 1) {
  dy <- diff(y)
  set.seed(seed)
  m  <- nnetar(dy)
  fc <- as.numeric(forecast(m, h = h)$mean)
  as.numeric(tail(y, 1)) + cumsum(fc)
}

round(nnetar_diff(my_series, h = 5, seed = 3), 1)
#> [1] 171.5 174.4 179.7 179.5 178.2
```

**Explanation:** The function reproduces the earlier numbers exactly, which is the point: same recipe, now reusable. Taking `seed` as an argument keeps results reproducible while letting you check stability across seeds. One caveat to remember, the returned values are point forecasts only. Prediction intervals do not survive `cumsum()`, because summing the bounds of each step ignores how the errors accumulate.

</details>

## Frequently Asked Questions

**Is NNETAR a deep learning model like an LSTM?**
No. NNETAR has exactly one hidden layer and typically fewer than 50 weights, while an LSTM has many layers, a memory mechanism, and thousands of parameters. NNETAR is a small, fast, classical neural network aimed at series with a few hundred observations. On short business series that simplicity is usually an advantage rather than a compromise.

**Why do I get different forecasts every time I run the same code?**
Training starts from random weights, so each run explores a different path. Put `set.seed()` immediately before every `nnetar()` call, and leave `repeats` at 20 or higher so the averaging smooths out whatever start you got.

**How much data does nnetar need?**
As a rough rule, at least 100 observations, and for a seasonal series at least several full cycles so the network sees each seasonal position many times. The complete example above shows what happens with only 5 years of monthly data: the network loses to a naive benchmark.

**Do I need to make the series stationary first?**
Not for seasonality, which the seasonal lag handles. But yes for trend, because `nnetar()` never differences. If your series trends, difference it yourself as shown in the limitations section, or use a model that differences for you.

**Why is PI = TRUE so slow?**
Because it does not use a formula, it simulates. With the default `npaths = 1000` R runs the whole recursive forecast a thousand times. Drop `npaths` while you are exploring, and raise it for the final run.

**What is the difference between nnetar() and NNETAR() in fable?**
They fit the same model with the same defaults. `nnetar()` from forecast works on `ts` objects, while `NNETAR()` from fable works on `tsibble` objects inside a `model()` call. Pick whichever package the rest of your pipeline uses.

**Can NNETAR handle multiple seasonal periods, like daily data with weekly and yearly cycles?**
Not directly. `nnetar()` reads a single `frequency()` from the series. For multiple seasonality, supply Fourier terms as `xreg`, or use a model built for it such as TBATS.

## Summary

| Concept | What to remember |
|---|---|
| What it is | A feed-forward neural network fed lagged values of the series, a nonlinear AR model |
| Model name | `NNAR(p,P,k)[m]`: `p` recent lags, `P` seasonal lags, `k` hidden nodes, `m` season length |
| Defaults | `p` from an AIC-optimal linear AR fit, `P = 1`, `k = (p+P+1)/2` rounded |
| Weight count | $(\text{inputs} + 1) \times k + (k + 1)$ |
| `repeats = 20` | Fits 20 networks from random starts and averages them, cancelling the luck of initialisation |
| Reproducibility | `set.seed()` before every fit, or the forecast changes on every run |
| Multi-step forecasts | Built recursively by feeding each forecast back in, so errors compound with horizon |
| Prediction intervals | Need `PI = TRUE`, come from simulation, and are optimistically narrow |
| Tuning | `size` first, then `decay` to regularise; judge only on held-out data |
| `xreg` | Extra input nodes for external drivers; you must supply their future values |
| Biggest limitation | No differencing, so it cannot extrapolate a trend. Difference the series yourself |
| Honest expectation | Strong on nonlinear cyclical series, often beaten by ETS on trend-plus-season data |

## References

1. Hyndman, R.J. & Athanasopoulos, G. *Forecasting: Principles and Practice*, 3rd edition, Section 12.4: Neural network models. [Link](https://otexts.com/fpp3/nnetar.html)
2. Hyndman, R.J. & Athanasopoulos, G. *Forecasting: Principles and Practice*, 2nd edition, Section 11.3: Neural network models. [Link](https://otexts.com/fpp2/nnetar.html)
3. forecast package reference, `nnetar()`: Neural Network Time Series Forecasts. [Link](https://pkg.robjhyndman.com/forecast/reference/nnetar.html)
4. forecast package reference, `forecast.nnetar()`: Forecasting using neural network models. [Link](https://pkg.robjhyndman.com/forecast/reference/forecast.nnetar.html)
5. Hyndman, R.J. Prediction intervals for NNETAR models, Hyndsight blog. [Link](https://robjhyndman.com/hyndsight/nnetar-prediction-intervals/)
6. nnet package on CRAN, the feed-forward network engine `nnetar()` calls. [Link](https://cran.r-project.org/package=nnet)
7. forecast source code for `nnetar()`, robjhyndman/forecast on GitHub. [Link](https://github.com/robjhyndman/forecast/blob/master/R/nnetar.R)
8. fable package reference, `NNETAR()` for tsibble workflows. [Link](https://fable.tidyverts.org/reference/NNETAR.html)

## Continue Learning

- [ARIMA Models in R](ARIMA-in-R.html) walks through the model family that beat NNETAR on trending data, and explains the differencing step NNETAR lacks.
- [ETS Models in R](ETS-Models-in-R.html) covers the exponential smoothing framework that won the head-to-head comparison in this post.
- [Forecast Accuracy in R](Forecast-Accuracy-in-R.html) explains what RMSE, MAE and MAPE actually measure, and which one to trust when they disagree.
- [Time Series Cross-Validation in R](Time-Series-Cross-Validation-in-R.html) shows how to score models over many rolling origins instead of a single split, which is the right way to settle the NNETAR versus ETS question on your own data.

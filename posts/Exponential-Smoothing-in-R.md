---
title: "Exponential Smoothing in R: ses() and the Alpha Parameter"
slug: "Exponential-Smoothing-in-R"
description: "Simple exponential smoothing in R: how alpha controls forgetting, how ses() in the forecast package optimises it for you, and when SES is the wrong model."
keywords: "exponential smoothing in R, simple exponential smoothing, ses function R, alpha parameter smoothing, forecast package R, SES forecast R, smoothing parameter alpha, holt winters R"
auto_link_terms: "exponential smoothing|simple exponential smoothing|exponential smoothing in R|SES|ses()|smoothing parameter|the alpha parameter|smoothing constant|flat forecast|forecast the level|level of a series|weighted average of past observations|Holt's method|holt()"
auto_link_case_sensitive: false
mathjax: true
webr: true
date: "2026-07-17"
curriculum_id: "3.8.7"
post_type: "C"
sidebar_section: "Time Series"
sidebar_title: "Exponential Smoothing"
sidebar_order: 11
difficulty: "Beginner"
---

<p class="lead">Simple exponential smoothing forecasts a series by taking a weighted average of everything you have seen so far, with the most recent observation weighted heaviest and older ones fading away geometrically. One number, <b>alpha</b>, controls how fast that fade happens: high alpha means the forecast chases the latest value, low alpha means it barely moves. In R, <code>ses()</code> from the forecast package fits the model and picks alpha for you by minimising squared forecast error. This post builds the whole method by hand in six lines, checks it against <code>ses()</code> to the last decimal, and shows you exactly what alpha is doing and when the method quietly stops working.</p>

Everything below uses one dataset, so you always have something concrete to picture.

**Ridge Road Bakery** sells sourdough loaves. Someone at the counter has written down the number of loaves sold each week for the last **24 weeks**. There is no yearly cycle in it (24 weeks is too short to see one) and no steady climb or decline. What there is, is a level that wanders: the bakery was selling around 120 loaves a week at the start, sagged to 103 in week 13 when a cafe opened down the road, and has clawed its way back to 123 by week 24.

The bakery wants one number: **how many loaves should they prep for week 25?** Hold on to that question. Every section below is a different answer to it, and the last section is about the week when this method would give them a bad one.

## What does exponential smoothing actually forecast?

Simple exponential smoothing (SES for short) answers the bakery's question by estimating one quantity: the **level** of the series, meaning the typical value the series is wandering around *right now*, at the end of the data. Not the average over all 24 weeks, and not last week's number, but a current best guess at where the series sits today. Once it has that, the forecast for week 25 is the level. The forecast for week 26 is also the level. So is week 30's. SES has no notion of the series going anywhere, so its forecast is a flat line.

Here is the whole thing, working, before any explanation.

```r title="Forecast the bakery's next four weeks"
suppressMessages(library(forecast))

# Sourdough loaves sold per week at Ridge Road Bakery, weeks 1 to 24.
loaves <- c(117, 125, 116, 119, 119, 107, 110, 110, 110, 113, 108, 106,
            103, 106, 106, 113, 115, 114, 124, 114, 115, 118, 127, 123)
bakery <- ts(loaves, start = 1)

# Fit simple exponential smoothing and forecast the next 4 weeks.
fit <- ses(bakery, h = 4)
fit
#>    Point Forecast    Lo 80    Hi 80    Lo 95    Hi 95
#> 25       123.0575 116.2432 129.8718 112.6360 133.4790
#> 26       123.0575 115.0634 131.0516 110.8315 135.2834
#> 27       123.0575 114.0365 132.0784 109.2611 136.8539
#> 28       123.0575 113.1152 132.9998 107.8520 138.2629
```

Read that line by line. The first line attaches the `forecast` package, which is where `ses()` lives. (`suppressMessages()` just keeps the package's startup chatter out of the way; the code works the same without it.) The next lines write the bakery's 24 numbers into a plain vector, then `ts()` turns that vector into a **time series object**, which is R's way of saying "these numbers are in time order, starting at time 1". If `ts()` is new to you, [Time Series Objects in R](Time-Series-Objects-in-R.html) covers it properly; for this post all you need to know is that it labels the weeks 1 to 24 for us.

Then the real line: `ses(bakery, h = 4)`. The `h` argument is the **forecast horizon**, meaning how many periods ahead you want. We asked for 4, so R gave us weeks 25, 26, 27, and 28.

Now look at what it says. The `Point Forecast` column is the single best guess: **123.06 loaves**, and it is the same 123.06 for all four weeks. That is the flat line. The four other columns are **prediction intervals**: R is 80% confident week 25 will land between 116.24 and 129.87, and 95% confident it will land between 112.64 and 133.48. Notice those intervals get wider as you go further out (week 28's 95% interval spans 107.85 to 138.26, about 30 loaves, versus week 25's 21) even though the point forecast never changes. The best guess stays put; the uncertainty about it grows.

So the bakery should prep about 123 loaves. Where did 123.06 come from? It is not the average of the 24 weeks, and it is not last week's number. It is a weighted average of all 24 weeks, and the rest of this post is about the weighting.

**Try it:** Ask the same model for a longer horizon and confirm the point forecast really is flat forever.

```r title="Your turn: forecast further out"
ex_long <- ses(bakery, h = 12)

# 1. Print ex_long$mean and look at all twelve numbers
# 2. Before you run it: how many DIFFERENT values do you expect to see?
```

<details><summary>Click to reveal solution</summary>

```r title="Longer horizon solution"
ex_long <- ses(bakery, h = 12)
round(as.numeric(ex_long$mean), 4)
#>  [1] 123.0575 123.0575 123.0575 123.0575 123.0575 123.0575 123.0575 123.0575 123.0575 123.0575
#> [11] 123.0575 123.0575
```

Twelve weeks out, the same 123.0575. SES will happily forecast a thousand weeks ahead and give you 123.0575 for every one of them. That is not a bug, it is the model's honest position: it has found no evidence the level is heading anywhere, so its best guess for any future week is wherever the level is now. Only the prediction intervals widen.

</details>

## Why not just use the last value or the average?

Before accepting 123.06, it is worth seeing the two obvious alternatives fail, because SES is precisely the compromise between them.

The first alternative is the **naive forecast**: use last week's number and be done. Week 24 sold 123 loaves, so predict 123. This takes the most recent information seriously, which is good, but it stakes everything on a single week. If week 24 happened to be a fluke (a festival, a rainy Saturday), the forecast inherits the fluke.

The second alternative is the **mean forecast**: average all 24 weeks and predict that. This uses every observation, which is good, but it treats week 1 as exactly as relevant as week 24. For a series whose level has moved, that is a real problem: the bakery's slump around week 13 gets a full vote in a forecast for week 25, even though the slump is over.

Here are all three side by side.

```r title="Three candidate answers for week 25"
candidates <- c(naive   = tail(loaves, 1),
                average = mean(loaves),
                ses     = as.numeric(fit$mean[1]))
round(candidates, 2)
#>   naive average     ses
#>  123.00  114.08  123.06

plot(bakery, type = "o", pch = 16, col = "grey40", xlim = c(1, 28), ylim = c(100, 135),
     xlab = "week", ylab = "loaves sold",
     main = "Ridge Road Bakery: three ways to guess week 25")
abline(h = mean(loaves), col = "steelblue", lwd = 2, lty = 2)
lines(fit$mean, col = "tomato", lwd = 3)
legend("bottomleft", bty = "n",
       legend = c("weekly sales", "mean forecast (114.08)", "SES forecast (123.06)"),
       col = c("grey40", "steelblue", "tomato"), lwd = c(1, 2, 3), lty = c(1, 2, 1))
```

The `candidates` vector holds the three answers. `tail(loaves, 1)` grabs the last element of the vector, which is week 24's 123 loaves. `mean(loaves)` averages all 24. `fit$mean` is where `ses()` stores its point forecasts, and `[1]` pulls out the first one (`as.numeric()` just strips the time-series labelling so the three numbers print in one tidy row).

The plot draws the sales as connected dots, the mean forecast as a dashed blue horizontal line, and the SES forecast as a thick red line extending past week 24. You can see the problem with the blue line immediately: it sits at 114.08, well below where the series has been for the last six weeks. It is being dragged down by the slump around week 13, which is over. The red SES line sits at 123.06, up where the series actually is now.

> **Note:** The mean forecast is not always wrong. If the bakery's level truly never moved and every wobble were random noise, the mean would be the *best* possible forecast, and SES would agree with it. We will see exactly that happen in the last section. What makes the mean wrong *here* is that the level moved.

So SES landed at 123.06, close to the naive 123 but not identical to it. It is a compromise that happens to sit near the naive end of the scale for this data. What decides where on that scale it lands is alpha.

## What is alpha actually doing?

Here is the entire model, in one line of arithmetic. Every week, SES updates its estimate of the level by blending the number that just came in with the estimate it already had:

$$\ell_t = \alpha \, y_t + (1 - \alpha) \, \ell_{t-1}$$

Take that apart symbol by symbol. \(y_t\) is the actual value observed at time \(t\), so \(y_{24} = 123\) loaves. \(\ell_t\) (a script letter L, for "level") is the model's estimate of the level after seeing week \(t\). \(\ell_{t-1}\) is what that estimate was a week earlier. And \(\alpha\) (alpha) is a single number between 0 and 1 that decides how much of each to use. The forecast for the next week is just the current level, \(\hat{y}_{t+1|t} = \ell_t\), where the notation \(\hat{y}_{t+1|t}\) reads as "the forecast for time \(t+1\), made using data up to time \(t\)".

Because the two weights \(\alpha\) and \(1 - \alpha\) always add to 1, the new level is a genuine weighted average of exactly two things: the news, and everything you thought before the news. That is the whole model.

![Diagram of one exponential smoothing step, where this week's actual value and last week's forecast are blended by weights alpha and one minus alpha into a new level, which becomes both the forecast and next week's input](screenshots/Exponential-Smoothing-in-R-recursion.webp)
*Figure 1: One step of simple exponential smoothing. The new observation and the old forecast are blended into a new level. That level is both the forecast for every future period and the input to next week's blend, which is what makes this a loop rather than a formula.*

Now, alpha in words. Set \(\alpha = 0.9\) and the new level is 90% this week's number: the model believes the news and nearly forgets what it thought before. Set \(\alpha = 0.1\) and the new level is 90% the old level: the model shrugs off the news and holds its position. Alpha is a **forgetting dial**.

The best way to believe the formula is to run it. Below, we pull the fitted alpha out of the model R already gave us, run the one-line update by hand across all 24 weeks in a `for` loop, and check the result against `ses()`.

```r title="The whole model, hand-rolled in six lines"
alpha <- as.numeric(fit$model$par["alpha"])   # the alpha ses() fitted
l0    <- as.numeric(fit$model$par["l"])       # the level before week 1 (more on this soon)
round(c(alpha = alpha, l0 = l0), 4)
#>    alpha       l0
#>   0.6134 118.8258

level <- numeric(24)
prev  <- l0
for (t in 1:24) {
  level[t] <- alpha * loaves[t] + (1 - alpha) * prev   # the update rule, verbatim
  prev     <- level[t]
}

# The level after the last week IS the forecast for week 25.
round(level[24], 4)
#> [1] 123.0575
```

Walk through it. `fit$model$par` is a named vector holding the parameters `ses()` estimated, so `["alpha"]` gives us 0.6134 and `["l"]` gives us 118.8258 (that is \(\ell_0\), the level the model reckons the series started at, just before week 1). We will come back to where both numbers came from in the next section; for now we are borrowing them to test the formula.

Then the loop. `level` is an empty 24-slot vector waiting to be filled. `prev` starts at \(\ell_0\). Each pass through the loop does the update rule exactly as written above and then hands the result forward to become the next pass's `prev`. Six lines, no package.

And the payoff: `level[24]` came out to **123.0575**, which is the number `ses()` printed in the very first code block. The hand-rolled loop and the package agree exactly, which means the one line of arithmetic above genuinely is the whole model.

We can push the check further. `fitted(fit)` gives the model's one-step-ahead forecast for every week in the data, meaning what it would have predicted for week \(t\) knowing only weeks 1 to \(t-1\). By the rule \(\hat{y}_{t+1|t} = \ell_t\), that should be our `level` vector shifted forward by one, with \(\ell_0\) at the front.

```r title="Check every fitted value, not just the last"
mine <- c(l0, level[1:23])   # forecast for week t is the level after week t-1

round(head(mine, 6), 4)
#> [1] 118.8258 117.7059 122.1801 118.3892 118.7639 118.9087
round(head(as.numeric(fitted(fit)), 6), 4)
#> [1] 118.8258 117.7059 122.1801 118.3892 118.7639 118.9087

all.equal(as.numeric(fitted(fit)), mine)
#> [1] TRUE
```

`mine` builds what our loop says the 24 one-step forecasts should be: \(\ell_0\) is the forecast for week 1 (nothing has been observed yet), the level after week 1 is the forecast for week 2, and so on. Printing the first six of ours and the first six of R's shows the same numbers. `all.equal()` is R's tolerant equality check, and it returned `TRUE`, meaning all 24 values match. Our six lines are `ses()`.

### Why "exponential"?

The recursion explains the mechanics but hides the reason for the name. Unroll it. The level after week 24 uses week 24 and \(\ell_{23}\). But \(\ell_{23}\) was itself \(\alpha y_{23} + (1-\alpha)\ell_{22}\). Substitute all the way down and every past observation reappears, each with its own weight:

$$\hat{y}_{T+1|T} = \alpha y_T + \alpha(1-\alpha) y_{T-1} + \alpha(1-\alpha)^2 y_{T-2} + \cdots + (1-\alpha)^{T} \ell_0$$

Here \(T\) is the last week you have data for, so \(T = 24\) for the bakery and \(\hat{y}_{25|24}\) is the forecast for week 25. The observation \(j\) weeks back gets weight \(\alpha(1-\alpha)^{j}\). Each step further into the past multiplies the weight by \((1-\alpha)\) again, so the weights shrink geometrically. That decaying-by-a-constant-factor pattern is what "exponential" refers to. It is not that anything is raised to a power of \(e\); it is that the influence of the past decays exponentially.

Those weights are not abstract. Let us just print them.

```r title="How much does each past week actually count?"
j <- 0:9                      # 0 = this week, 1 = last week, ...
w <- alpha * (1 - alpha)^j    # the weight each one gets

round(w, 4)
#>  [1] 0.6134 0.2371 0.0917 0.0354 0.0137 0.0053 0.0020 0.0008 0.0003 0.0001
round(sum(w), 4)
#> [1] 0.9999
round(cumsum(w), 3)
#>  [1] 0.613 0.851 0.942 0.978 0.991 0.997 0.999 1.000 1.000 1.000
```

`j` counts weeks into the past, `w` applies the weight formula to each, and the three prints ask three questions of it.

First, the individual weights. Week 24 (the most recent) gets a weight of 0.6134. Week 23 gets 0.2371. Week 22 gets 0.0917. By ten weeks back the weight is 0.0001, which is to say that week has effectively no vote.

Second, `sum(w)` is 0.9999, near enough to 1. The weights form a proper weighted average on their own, without needing the older terms. That is why SES can use "all the data" and still be nimble.

Third, `cumsum(w)` is the running total, and it is the most useful line here. The three most recent weeks carry **94.2%** of the forecast between them. Six weeks carry 99.7%. With alpha at 0.6134, this model is effectively looking at the last month and a half of the bakery's life and ignoring the rest. That is why the slump in week 13 had no say in the 123.06.

> **Watch out:** "SES uses all past observations" is technically true and practically misleading. With a high alpha the effective memory is a handful of periods. If you have 500 observations and a fitted alpha of 0.6, you do not have a forecast built on 500 numbers; you have one built on about 5.

**Try it:** Compute the same weights for a much lower alpha and see how far back the memory reaches.

```r title="Your turn: the weights at alpha = 0.1"
ex_alpha <- 0.1

# 1. Build the weights for j = 0:9 using ex_alpha, the same formula as above
# 2. Look at cumsum() of them: how much of the forecast do ten weeks account for?
```

<details><summary>Click to reveal solution</summary>

```r title="Low-alpha weights solution"
ex_w <- ex_alpha * (1 - ex_alpha)^(0:9)
round(ex_w, 4)
#>  [1] 0.1000 0.0900 0.0810 0.0729 0.0656 0.0590 0.0531 0.0478 0.0430 0.0387
round(cumsum(ex_w), 3)
#>  [1] 0.100 0.190 0.271 0.344 0.410 0.469 0.522 0.570 0.613 0.651
```

At alpha = 0.1 the weights barely decay: this week gets 0.1000 and nine weeks ago still gets 0.0387, well over a third of what this week gets. Ten weeks of data account for just 65.1% of the forecast, so the other 35% is coming from weeks 11 and older. Compare that with alpha = 0.6134, where ten weeks accounted for essentially 100%. Same model, same data, and the effective memory went from about six weeks to well past twenty-four.

</details>

## How does R choose alpha for you?

We borrowed alpha = 0.6134 from `ses()` without asking where it came from. Here is the answer: R did not choose it by judgement or by rule of thumb. It **fitted** it, the same way `lm()` fits a slope, by finding the value that makes the model's past mistakes as small as possible.

Define the mistake precisely. For each week \(t\), the model had a one-step-ahead forecast \(\hat{y}_{t|t-1}\) made without seeing week \(t\). The **forecast error** is the gap between what happened and what was predicted, \(e_t = y_t - \hat{y}_{t|t-1}\). Square each error (so that being 5 under and 5 over both count as mistakes) and add them all up:

$$\text{SSE}(\alpha, \ell_0) = \sum_{t=1}^{T} \left( y_t - \hat{y}_{t|t-1} \right)^2$$

That total is the **sum of squared errors**, or SSE. It depends on alpha, because a different alpha produces different forecasts and therefore different errors. It also depends on \(\ell_0\), the starting level, which is why `ses()` reported two numbers back in `fit$model$par`: both are estimated, together, to make SSE as small as possible. There is no closed-form answer, so R searches numerically.

We can reproduce that search. Below we write SSE as a function of alpha, evaluate it across a grid of 99 candidate values, and see where it bottoms out.

```r title="Reproduce R's search for alpha"
sse <- function(a) {
  prev  <- l0
  total <- 0
  for (t in 1:24) {
    total <- total + (loaves[t] - prev)^2          # this week's squared error
    prev  <- a * loaves[t] + (1 - a) * prev        # then update the level
  }
  total
}

grid <- seq(0.01, 0.99, by = 0.01)
curve_sse <- sapply(grid, sse)

grid[which.min(curve_sse)]     # our best alpha
#> [1] 0.61
round(min(curve_sse), 2)       # the SSE it achieves
#> [1] 622.01
```

Read `sse()` first. It walks the same loop as before, but with one addition: at each week, *before* updating the level, it records how badly the current level would have predicted this week, and squares that. Note the order matters. The prediction has to be made before the value is seen, otherwise the model would be marking its own homework.

Then `seq(0.01, 0.99, by = 0.01)` makes 99 candidate alphas, `sapply()` runs `sse()` on each, `which.min()` finds the position of the smallest, and `grid[...]` reports which alpha that was.

The grid's answer is **0.61**, achieving an SSE of 622.01. And `ses()` said 0.6134. The two agree to the resolution of our grid, which is the point: R's optimiser is doing exactly this search, just with a proper numerical routine instead of 99 guesses, so it can report the extra decimals.

Plotting the curve makes the shape of the problem visible, and the shape is the interesting part.

```r title="The SSE curve, and why the minimum is where it is"
plot(grid, curve_sse, type = "l", lwd = 3, col = "steelblue",
     xlab = "alpha", ylab = "sum of squared errors",
     main = "SSE across every alpha, for the bakery data")
abline(v = alpha, col = "tomato", lwd = 2, lty = 2)
text(alpha, max(curve_sse) * 0.95, paste("ses() picked", round(alpha, 4)),
     pos = 4, col = "tomato")

round(c(at_0.1 = sse(0.1), at_0.5 = sse(0.5), at_0.9 = sse(0.9)), 1)
#>  at_0.1  at_0.5  at_0.9
#> 1091.0   633.7   680.4
```

The plot draws SSE against alpha, with a dashed red line marking where `ses()` landed. The curve comes down steeply from the left, flattens into a broad basin, and rises gently again toward alpha = 1. The red line sits at the bottom of the basin.

The three numbers underneath quantify the shape. At alpha = 0.1 the SSE is 1091.0, badly worse than the best. At alpha = 0.5 it is 633.7, and at alpha = 0.9 it is 680.4, both within about 10% of the optimum of 622.01. So the penalty for being *too sluggish* is severe, while the basin between roughly 0.4 and 0.9 is almost flat. This is typical, and it is a useful thing to know: alpha is usually not estimated precisely, and any alpha in the basin would forecast about as well. What matters is not landing on the far left.

**Try it:** Your grid found 0.61 because that is the resolution you gave it. Make the grid finer and watch it converge on what `ses()` reported.

```r title="Your turn: a finer grid"
ex_grid <- seq(0.55, 0.70, by = 0.0001)

# 1. Evaluate sse() over ex_grid with sapply(), as before
# 2. Use which.min() to find the minimising alpha, and compare it with 0.6134
```

<details><summary>Click to reveal solution</summary>

```r title="Finer-grid solution"
ex_grid <- seq(0.55, 0.70, by = 0.0001)
ex_best <- ex_grid[which.min(sapply(ex_grid, sse))]
round(ex_best, 4)
#> [1] 0.6134
```

With a grid step of 0.0001 the brute-force search returns 0.6134, matching `ses()` to four decimals. There is nothing hidden in the package: it minimises the same SSE our loop computes, over the same one parameter, and arrives where we did. (One difference worth naming: our `sse()` held \(\ell_0\) fixed at the value `ses()` had already fitted, while `ses()` optimises alpha and \(\ell_0\) jointly. On this data it changes nothing to four decimals.)

</details>

## How do you read the ses() output?

You have now seen where every number in the model comes from, so the full model print should read as plain English rather than as a wall of statistics. Here it is.

```r title="Every line of the fitted model"
fit$model
#> Simple exponential smoothing
#>
#> Call:
#>  ses(y = bakery, h = 4)
#>
#>   Smoothing parameters:
#>     alpha = 0.6134
#>
#>   Initial states:
#>     l = 118.8258
#>
#>   sigma:  5.3172
#>
#>      AIC     AICc      BIC
#> 160.3905 161.5905 163.9247
```

Line by line. **`Simple exponential smoothing`** and **`Call`** just restate the model and the command that produced it. **`alpha = 0.6134`** is the forgetting dial, fitted by the SSE search from the previous section. **`l = 118.8258`** is \(\ell_0\), the estimated level just before week 1, fitted alongside alpha. It is not week 1's actual value (that was 117); it is the starting point that makes the whole 24-week run of forecasts as accurate as possible.

**`sigma: 5.3172`** is the estimated standard deviation of the one-step-ahead errors, in loaves. This is the number the prediction intervals in the first code block were built from: roughly, week 25's 95% interval is the point forecast plus or minus about two sigma, which is where 123.06 plus or minus 10.4 came from. It is also the single most useful line for the bakery, because it says something plain: even a correct model expects to be off by about 5 loaves in a typical week. Those intervals do rest on an assumption worth naming out loud: that the week-to-week errors are uncorrelated with each other and roughly bell-shaped. The `ACF1` line in the next code block is how you check the first half of that.

**`AIC`, `AICc`, `BIC`** are model-comparison scores. Each one balances how well the model fits against how many parameters it used, and on all three, lower is better. They are meaningless on their own (160.39 is not good or bad) and only mean something when compared against another model fitted to *the same* series, which is what the last section does with `holt()`.

For accuracy in units you can act on, `accuracy()` is the better tool.

```r title="Error measures in loaves"
round(accuracy(fit), 4)
#>                  ME   RMSE    MAE    MPE   MAPE   MASE    ACF1
#> Training set 0.2874 5.0908 3.7527 0.1035 3.2629 0.8807 -0.0301
```

Take the useful ones. **ME** (mean error) is 0.2874, the average signed miss. It is near zero, which is what you want; a large ME would mean the model is biased, consistently over- or under-forecasting. **RMSE** (root mean squared error) is 5.0908 loaves, and **MAE** (mean absolute error) is 3.7527 loaves, both plain-language answers to "how far off is this model typically?" MAE says the forecast misses by under 4 loaves in a typical week. **MAPE** (mean absolute percentage error) says the same thing as a percentage: **3.26%**.

**MASE** is the one worth pausing on. It compares this model against the naive forecast: below 1 means you are beating naive, above 1 means you are losing to it. Ours is 0.8807, so SES is about 12% better than just using last week's number. Real, but modest, which is honest for a series this noisy. **ACF1** is the correlation between consecutive residuals, and at -0.0301 it is essentially zero. That is good news: it means the model has not left any obvious pattern behind in its errors. If ACF1 were large, the residuals would still contain structure the model failed to capture, which is the main symptom the last section is about.

## What does changing alpha do to the forecast?

Alpha is fitted for you, so most of the time you never set it. But you should still know what it does, both to read someone else's fitted alpha and because `ses()` lets you fix it by hand when you have a reason to.

The clean way to see it is to hold everything else constant and vary only alpha. Passing `alpha = ` to `ses()` fixes the value instead of fitting it, and `initial = "simple"` tells R to start every model at \(\ell_0 = y_1\) (week 1's actual 117) rather than fitting a different \(\ell_0\) for each. Now alpha is genuinely the only thing that differs.

```r title="Three alphas, everything else held fixed"
alphas <- c(0.1, 0.5, 0.9)
fits   <- lapply(alphas, function(a) ses(bakery, h = 4, alpha = a, initial = "simple"))

sapply(fits, function(f) round(as.numeric(f$mean[1]), 3))
#> [1] 115.923 122.455 123.307
```

`lapply()` fits one model per alpha and keeps all three in a list; `sapply()` then pulls the week-25 point forecast out of each. The three answers are **115.92, 122.46, and 123.31**.

Look at how they are spread. Remember from the second section that the mean forecast was 114.08 and the naive forecast was 123.00. The alpha = 0.1 model landed at 115.92, close to the mean. The alpha = 0.9 model landed at 123.31, close to naive. Alpha = 0.5 sits at 122.46, in between. Alpha slides the forecast along a spectrum whose two ends you already know:

- **alpha near 0**: the level barely updates, and the forecast approaches the average of all the data.
- **alpha near 1**: the level jumps straight to the newest value, and the forecast approaches last week's number.

The naive forecast and the mean forecast were never really rivals to SES. They are its two endpoints, and fitting alpha is choosing the point between them that this particular series deserves.

Watching the fitted levels track the data makes it obvious.

```r title="How closely each alpha follows the data"
plot(bakery, type = "o", pch = 16, col = "grey60", ylim = c(100, 135),
     xlab = "week", ylab = "loaves sold",
     main = "The same data smoothed at three different alphas")
cols <- c("steelblue", "darkgreen", "tomato")
for (i in seq_along(fits)) {
  lines(fitted(fits[[i]]), col = cols[i], lwd = 2)
}
legend("bottomleft", legend = paste("alpha =", alphas),
       col = cols, lwd = 2, bty = "n")
```

Three smoothed lines are drawn through the grey data. The blue alpha = 0.1 line is almost straight: it drifts down slowly through the slump and has still not climbed back by week 24, because at that alpha the model needs many weeks to be persuaded of anything. The red alpha = 0.9 line is jagged and clings to the data, repeating almost every wobble one week late, which is what "trust the newest value" looks like. The green alpha = 0.5 line does what you actually want, following the slump and the recovery while ignoring the week-to-week noise.

That picture is the trade-off in full. Low alpha is stable but slow to react to real change. High alpha reacts instantly but also faithfully reproduces every meaningless fluctuation. Fitting alpha by minimising SSE is how you let the data settle the argument instead of guessing.

> **Note:** A fitted alpha is worth reading as a diagnostic, not just a setting. An alpha near 1 says "the past is useless here, the series is close to a random walk". An alpha near 0 says "the level never moves, use the mean". Both are the model telling you something about your data, and both are cases where you should ask whether SES is what you want at all. The next section takes each in turn.

## When does SES break down?

SES models the level and nothing else. That single sentence is the source of every one of its failures. If your series has something in it that is not a level, SES cannot represent it and will not warn you.

Take the low-alpha case first. Suppose the bakery's numbers had wobbled around a level that never actually moved, pure noise around 123 loaves.

```r title="Failure 1: a level that never moves"
flat <- ts(c(118, 124, 115, 131, 121, 109, 126, 122, 133, 117, 128, 119,
             125, 136, 114, 123, 130, 120, 127, 116, 132, 122, 129, 121),
           start = 1)
fit_flat <- ses(flat, h = 4)

round(fit_flat$model$par, 4)
#>    alpha        l
#>   0.0001 123.2500
round(c(ses_forecast = as.numeric(fit_flat$mean[1]), plain_mean = mean(flat)), 4)
#> ses_forecast   plain_mean
#>       123.25       123.25
```

The optimiser drove alpha to **0.0001**, effectively zero, and the forecast came out at 123.25, which is exactly `mean(flat)` to four decimals. This is not a failure of the fitting; it is the fitting working perfectly and reporting that SES has nothing to add. When the level genuinely does not move, the best possible estimate of it is the average of everything, and SES says so by switching itself off. Read a near-zero alpha as "you could have used the mean".

The other direction is worse, because the model gives you a confident answer that is wrong. Suppose Ridge Road had landed a contract supplying a cafe chain in week 1, and sales had climbed steadily ever since.

```r title="Failure 2: a level that goes somewhere"
growth <- ts(c(121, 110, 114, 118, 119, 121, 131, 130, 133, 144, 139, 151,
               152, 147, 156, 153, 150, 155, 159, 165, 167, 169, 174, 166),
             start = 1)
fit_growth <- ses(growth, h = 6)

round(as.numeric(fit_growth$model$par["alpha"]), 4)
#> [1] 0.8576
round(as.numeric(fit_growth$mean), 2)
#> [1] 167.03 167.03 167.03 167.03 167.03 167.03
```

This series climbs for 24 straight weeks: it averages about 116 loaves over the opening four weeks and about 169 over the closing four, which works out to growth of roughly 2.6 loaves a week. SES fitted alpha = 0.8576 (nearly 1, chasing the newest value, which is the only way a level-only model can keep up with a rising series at all) and then forecast **167.03 for every one of the next six weeks**.

That forecast is flat. The series is not. The model is stating that a bakery which has grown every month for six months will sell the same amount in six weeks as it does today. Nothing in the output flags this: the point forecasts print in a tidy column, the intervals look reasonable, and the number is wrong. SES has no trend term, so it cannot extrapolate a trend, and a fitted alpha near 1 is the loudest hint you will get that it is straining.

The fix is a model with a trend term. **Holt's linear method** adds a second component, a slope, updated by a second smoothing parameter (`beta`) in exactly the same weighted-average way. In the forecast package it is `holt()`, and the call is otherwise identical.

```r title="Holt's method: the same idea, plus a slope"
fit_holt <- holt(growth, h = 6)
round(as.numeric(fit_holt$mean), 2)
#> [1] 176.64 179.29 181.93 184.58 187.22 189.87

round(c(ses = accuracy(fit_growth)[, "RMSE"],
        holt = accuracy(fit_holt)[, "RMSE"]), 3)
#>   ses  holt
#> 5.902 4.623
```

Holt forecasts 176.64 for next week and keeps climbing to 189.87 by week 30, extrapolating the roughly 2.6-per-week slope it detected. That is a forecast that at least believes what the data has been saying for six months. Its RMSE on the training data is 4.623 loaves against SES's 5.902, so it also fits better by about 22%.

The same logic extends once more. If the series also repeats on a fixed calendar cycle (a bakery selling more every weekend, or an airline busier every summer), you need a third component, and the method is **Holt-Winters**, `hw()`. And if you would rather not decide, `ets()` fits the whole family and selects between them using the AIC scores you met earlier.

![Decision diagram for choosing between ses, holt, hw and ets based on whether the series has a trend and whether it has a seasonal cycle](screenshots/Exponential-Smoothing-in-R-method-choice.webp)
*Figure 2: SES is the bottom-left corner of a family. Each question adds a component to the model, and each component brings its own smoothing parameter, fitted the same way alpha is. If you cannot answer the questions confidently, ets() answers them for you.*

So the honest scope of `ses()` is narrow: a series with no trend and no seasonality, where the level wanders. That is exactly Ridge Road Bakery's 24 weeks, which is why 123.06 was a reasonable answer there. Before reaching for it on your own data, plot the series and check that the two questions in the diagram both come back "no". [Time Series Decomposition in R](Time-Series-Decomposition-in-R.html) is the tool for answering them when the eye is not enough.

**Try it:** Fit both `ses()` and `holt()` to the *original* bakery data, which has no trend in it, then compare their AIC. Adding a trend component to a series that has no trend should not pay for itself.

```r title="Your turn: does Holt help the original bakery?"
ex_ses  <- ses(bakery, h = 4)
ex_holt <- holt(bakery, h = 4)

# 1. Compare ex_ses$model$aic with ex_holt$model$aic; lower is better
# 2. Ask yourself what Holt spent its two extra parameters on
```

<details><summary>Click to reveal solution</summary>

```r title="AIC comparison solution"
round(c(ses = ex_ses$model$aic, holt = ex_holt$model$aic), 3)
#>     ses    holt
#> 160.391 164.575
```

SES scores 160.391 and Holt scores 164.575, so SES wins by about 4.2 AIC points. Holt had two extra parameters to play with and still could not justify them, because there is no trend in the bakery's 24 weeks for a trend component to capture. This is what the AIC line is for: not judging a model alone, but settling a question like this one. More components is not better, it is just more.

</details>

## FAQ

**What is a good value for alpha in exponential smoothing?**
There is no universally good value, which is why R fits it. If you must set one by hand, alpha between 0.1 and 0.3 is a common default for series where the level moves slowly, and higher values suit series that shift quickly. Better advice: let `ses()` fit it, then read the result as a diagnostic. A fitted alpha near 0 says use the mean; near 1 says your series is close to a random walk or has a trend that SES cannot see.

**What is the difference between `ses()` and `ets()`?**
`ses()` fits one specific model: level only, additive errors. `ets()` fits the whole exponential smoothing family (level, plus optional trend, plus optional seasonality, each additive or multiplicative) and picks the best member using AIC. `ses(y)` is close to `ets(y, model = "ANN")`. Use `ses()` when you know the series has no trend or season; use `ets()` when you want the choice made for you.

**Why is my exponential smoothing forecast a flat line?**
Because that is what SES does. It estimates the level and forecasts the level, so every horizon gets the same number and only the prediction intervals widen. If a flat forecast is obviously wrong for your series, that is a signal your series has a trend, and you want `holt()` or `ets()` instead.

**Should I use `ses()` or a moving average?**
They answer different questions. A moving average describes the past: it smooths the series so you can *see* the shape. SES forecasts the future: it produces a level estimate plus prediction intervals. A moving average also weights every value in its window equally and has no notion of forecasting past the end of the data. See [Moving Averages in R](Moving-Averages-in-R.html) for that side of the comparison.

**Can SES handle seasonal data?**
No. It has no seasonal component, so it will average the seasonality away and forecast a flat line straight through your peaks and troughs. Use `hw()` (Holt-Winters) or `ets()`, or remove the seasonality first via decomposition and apply SES to the seasonally adjusted series.

**What does `initial = "simple"` versus `initial = "optimal"` change?**
It decides where \(\ell_0\), the level before the first observation, comes from. `"simple"` sets it to the first observation. `"optimal"` (the default) fits it alongside alpha to minimise SSE. Optimal is almost always the better choice; `"simple"` is useful when you want to compare several fixed alphas with everything else held constant, which is exactly what we used it for above.

## Summary

Ridge Road Bakery should prep about **123 loaves** for week 25, and expect to be off by about 5 either way. That number came from a model with exactly one parameter, which you have now built from nothing in six lines and then broken on purpose.

| Idea | What it means | In R |
|---|---|---|
| The model | New level = alpha times this week + (1 - alpha) times old level | `ses(y, h = 4)` |
| The forecast | The current level, repeated flat for every horizon | `fit$mean` |
| alpha | Forgetting dial in [0, 1]; weight on the newest value | `fit$model$par["alpha"]` |
| Exponential decay | Observation j periods back gets weight alpha(1 - alpha)^j | `alpha * (1 - alpha)^(0:9)` |
| Fitting alpha | Chosen to minimise the sum of squared one-step errors | done automatically |
| Initial level | \(\ell_0\), fitted jointly with alpha | `fit$model$par["l"]` |
| Typical error | Standard deviation of one-step errors, in your units | `sigma` in `fit$model` |
| alpha near 0 | Level never moves; SES collapses to the mean | consider `mean()` |
| alpha near 1 | Level moves constantly; often a hidden trend | try `holt()` |
| Trend present | SES forecasts flat through it and is wrong | `holt()` |
| Seasonality present | SES averages it away | `hw()` or `ets()` |

The two things worth carrying away: the flat forecast is a feature, not a bug (SES has no opinion about where the series is going, so it says so), and the fitted alpha is a message about your data rather than just a setting. Read it every time.

## References

1. Hyndman, R. J. & Athanasopoulos, G. *Forecasting: Principles and Practice*, 3rd ed., section 8.1. The canonical treatment of SES, including the weighted-average and component forms used above. [otexts.com/fpp3/ses.html](https://otexts.com/fpp3/ses.html)
2. Hyndman, R. J. & Athanasopoulos, G. *Forecasting: Principles and Practice*, 3rd ed., chapter 8. Where SES sits in the full exponential smoothing family, through Holt and Holt-Winters to `ets()`. [otexts.com/fpp3/expsmooth.html](https://otexts.com/fpp3/expsmooth.html)
3. `ses()` reference manual, forecast package. The argument list, including `alpha`, `initial`, and `h`. [pkg.robjhyndman.com/forecast/reference/ses.html](https://pkg.robjhyndman.com/forecast/reference/ses.html)
4. `ets()` reference manual, forecast package. The automatic model-selection function this post points to when SES is not enough. [pkg.robjhyndman.com/forecast/reference/ets.html](https://pkg.robjhyndman.com/forecast/reference/ets.html)
5. Hyndman, R. J. & Khandakar, Y. "Automatic Time Series Forecasting: The forecast Package for R." *Journal of Statistical Software* 27(3), 2008. The paper describing how the package fits and selects these models. [jstatsoft.org/article/view/v027i03](https://www.jstatsoft.org/article/view/v027i03)
6. NIST/SEMATECH *e-Handbook of Statistical Methods*, section 6.4.3.1: Single Exponential Smoothing. A short, independent derivation of the same recursion. [itl.nist.gov/div898/handbook/pmc/section4/pmc431.htm](https://www.itl.nist.gov/div898/handbook/pmc/section4/pmc431.htm)
7. forecast package on CRAN. The version history and the full reference manual for every function used here. [cran.r-project.org/package=forecast](https://cran.r-project.org/package=forecast)

## Continue Learning

- [Moving Averages in R](Moving-Averages-in-R.html), the other way to smooth a series. It describes the past where SES forecasts the future, and its exponential moving average is the same weighting scheme seen from a different angle.
- [Time Series Decomposition in R](Time-Series-Decomposition-in-R.html), how to check the two questions in Figure 2 before choosing a method: does the series have a trend, and does it have a season?
- [Time Series Forecasting With R](Time-Series-Forecasting-With-R.html), the wider tour of forecasting methods, including where the ARIMA family picks up problems the smoothing family cannot handle.

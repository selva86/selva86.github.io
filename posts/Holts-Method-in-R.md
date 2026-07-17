---
title: "Holt's Method in R: Forecast Trend Without Seasonality"
slug: "Holts-Method-in-R"
description: "Holt's linear trend method in R: how holt() adds a slope to exponential smoothing, what beta really controls, and why damping usually forecasts better."
keywords: "holt's method in R, holt linear trend method, holt() function R, damped trend forecast, beta parameter smoothing, forecast package R, trend forecasting in R, exponential smoothing with trend"
auto_link_terms: "Holt's method|Holt's linear trend method|Holt's linear method|holt()|damped trend|damped trend method|damping parameter|trend component|slope component|the beta parameter|linear trend method|Holt's method in R|forecast a trend"
auto_link_case_sensitive: false
mathjax: true
webr: true
date: "2026-07-17"
curriculum_id: "FR-ets-1"
post_type: "FR"
fr_parent: "Exponential-Smoothing-in-R.html"
difficulty: "Intermediate"
---

<p class="lead">Holt's linear trend method forecasts a series that is going somewhere. It keeps the level that simple exponential smoothing tracks and adds a second component, a <b>slope</b>, so the forecast is a sloped line instead of a flat one. In R it is <code>holt()</code> from the forecast package, and it costs one extra smoothing parameter, <b>beta</b>, which controls how fast the slope is allowed to change its mind. This post builds the method by hand until it reproduces <code>holt()</code> to four decimals, shows what beta really does, and explains why the damped version usually forecasts better than the straight-line one.</p>

Everything below uses one dataset, so you always have something concrete to picture.

**Ridge Road Bakery** sells sourdough loaves. In week 1 it landed a contract supplying a cafe chain, and weekly sales have climbed ever since: about 116 loaves a week over the opening four weeks, about 169 over the closing four, which works out to growth of roughly 2.6 loaves a week across 24 weeks. There is no yearly cycle in it (24 weeks is too short to see one). What there is, is a level that keeps moving in one direction.

The bakery wants one number: **how many loaves should they prep for week 30, six weeks out?** Hold on to that question. Every section below is a different answer to it, and two of those answers differ by 58 loaves.

> **Coming from [Exponential Smoothing in R](Exponential-Smoothing-in-R.html)?** This is the same bakery and the same 24 numbers that post ended on, picked up where it left off. If you have not read it, you only need two ideas from it: the **level** is the model's estimate of where the series sits right now, and **alpha** is the dial that decides how fast that estimate reacts to new data. Both are restated here as they come up.

## What does Holt's method forecast that SES cannot?

Simple exponential smoothing (SES) models the level and nothing else. Its forecast for every future week is the current level, so its forecast is a flat line. That is the right model for a series that wanders around a stable value, and the wrong one for a bakery that has grown for six straight months.

Holt's linear trend method fixes exactly that by tracking a second quantity alongside the level: the **slope**, meaning how much the level is moving per period. The forecast then starts at the level and walks forward along that slope. Here is the whole thing, working, before any explanation.

```r title="Forecast the bakery's next six weeks with Holt's method"
suppressMessages(library(forecast))

# Sourdough loaves sold per week at Ridge Road Bakery, weeks 1 to 24.
# Week 1 is when the cafe-chain contract started.
loaves <- c(121, 110, 114, 118, 119, 121, 131, 130, 133, 144, 139, 151,
            152, 147, 156, 153, 150, 155, 159, 165, 167, 169, 174, 166)
bakery <- ts(loaves, start = 1)

fit <- holt(bakery, h = 6)
fit
#>    Point Forecast    Lo 80    Hi 80    Lo 95    Hi 95
#> 25       176.6402 170.1500 183.1304 166.7144 186.5660
#> 26       179.2863 172.7961 185.7765 169.3605 189.2122
#> 27       181.9324 175.4423 188.4226 172.0066 191.8583
#> 28       184.5785 178.0884 191.0687 174.6527 194.5044
#> 29       187.2246 180.7345 193.7148 177.2988 197.1505
#> 30       189.8707 183.3806 196.3609 179.9449 199.7966
```

Read that line by line. The first line attaches the `forecast` package, which is where `holt()` lives. (`suppressMessages()` just keeps the package's startup chatter out of the way; the code works the same without it.) The next lines write the bakery's 24 numbers into a plain vector, then `ts()` turns that vector into a **time series object**, which is R's way of saying "these numbers are in time order, starting at time 1". If `ts()` is new to you, [Time Series Objects in R](Time-Series-Objects-in-R.html) covers it properly; here it just labels the weeks 1 to 24.

Then the real line: `holt(bakery, h = 6)`. The `h` argument is the **forecast horizon**, meaning how many periods ahead you want. We asked for 6, so R gave us weeks 25 through 30.

Now look at what it says. The `Point Forecast` column is the single best guess for each week, and unlike SES it is a **different number every week**: 176.64 for week 25, climbing steadily to 189.87 for week 30. The gap between consecutive weeks is 2.65 loaves, every time. That constant step is the slope, and the fact that it is constant is why this is called the *linear* trend method: the point forecasts lie exactly on a straight line. The other four columns are **prediction intervals**, the same as in SES: R is 80% confident week 25 lands between 170.15 and 183.13, and 95% confident it lands between 166.71 and 186.57. They widen as the horizon grows, because forecasting further out is harder.

So the bakery should prep about 177 loaves for next week and about 190 for week 30. Put that next to what SES says about the same 24 numbers.

```r title="SES says one number forever; Holt says a line"
fit_ses <- ses(bakery, h = 6)

round(rbind(ses  = as.numeric(fit_ses$mean),
            holt = as.numeric(fit$mean)), 2)
#>        [,1]   [,2]   [,3]   [,4]   [,5]   [,6]
#> ses  167.03 167.03 167.03 167.03 167.03 167.03
#> holt 176.64 179.29 181.93 184.58 187.22 189.87
```

`$mean` is where a forecast object keeps its point forecasts, and `rbind()` stacks the two sets of six numbers into a small matrix so they line up under each other.

SES answers 167.03 for week 25 and 167.03 for week 30, because a level-only model has no way to say "and it is still going up". It is not being lazy; it genuinely cannot represent a direction. Holt answers 176.64 and 189.87. By week 30 the two methods disagree by nearly 23 loaves, and the bakery's own history of climbing every month is the reason to believe Holt.

That difference comes entirely from one new thing: a second component. The rest of this post is about what that component is, how it updates, and when it will lie to you.

## What are the two equations actually doing?

SES had one equation. Holt has two, because it has two things to keep track of, and then a third line that turns them into a forecast.

Start with the level, which is the SES equation with one change. Each week, the model blends the number that just came in with the estimate it already had. The change is what "the estimate it already had" means. SES compares the news against last week's level, \(\ell_{t-1}\). Holt compares it against last week's level *plus* last week's slope, because if the series is climbing by 2.6 a week, then last week's honest guess for this week was never \(\ell_{t-1}\); it was \(\ell_{t-1} + b_{t-1}\):

$$\ell_t = \alpha \, y_t + (1 - \alpha)(\ell_{t-1} + b_{t-1})$$

Then the slope gets its own equation, built the same way. How much is the level moving per week? The freshest evidence is how much it just moved, \(\ell_t - \ell_{t-1}\). The prior belief is what we thought the slope was last week, \(b_{t-1}\). Blend them:

$$b_t = \beta^{*} (\ell_t - \ell_{t-1}) + (1 - \beta^{*}) \, b_{t-1}$$

Take those apart symbol by symbol. \(y_t\) is the actual value observed at time \(t\), so \(y_{24} = 166\) loaves. \(\ell_t\) (a script letter L, for "level") is the model's estimate of the level after seeing week \(t\). \(b_t\) is its estimate of the slope after seeing week \(t\), measured in loaves per week. \(\alpha\) (alpha) is a number between 0 and 1 deciding how much of the news moves the level, exactly as in SES. And \(\beta^{*}\) (beta-star) is a number between 0 and 1 deciding how much of the freshest slope evidence moves the slope. Both equations are weighted averages of two things whose weights add to 1, which is what makes this exponential smoothing rather than something new.

Finally, the forecast. The level says where the series is now; the slope says where it is heading. Walking \(h\) periods forward means starting at the level and taking \(h\) steps of size \(b_t\):

$$\hat{y}_{t+h|t} = \ell_t + h \, b_t$$

The notation \(\hat{y}_{t+h|t}\) reads as "the forecast for time \(t+h\), made using data up to time \(t\)". This one line explains everything we saw in the first block. The forecasts sit on a straight line because \(h\) enters linearly. They step by exactly 2.65 each week because that step *is* \(b_t\). And SES is the special case \(b_t = 0\), which collapses the line back to a flat one.

There is a second way to write those same two equations, and it is the one R actually runs. Instead of blending, work from the mistake. Last week's guess for this week was \(\ell_{t-1} + b_{t-1}\). Call the gap between that guess and reality the **forecast error**:

$$e_t = y_t - (\ell_{t-1} + b_{t-1})$$

Then the level and the slope each take a share of that one error:

$$\ell_t = \ell_{t-1} + b_{t-1} + \alpha \, e_t \qquad b_t = b_{t-1} + \beta \, e_t$$

This is the **innovations state space form**, and it is algebraically identical to the blending form above. It just makes the mechanism obvious: one surprise arrives each week, alpha decides how much of it moves the level, and beta decides how much of it bends the slope. Everything the model learns, it learns from \(e_t\).

![Flow diagram of one week of Holt's method, where last week's level and slope produce a guess, the new observation produces a forecast error, and that error updates the level by alpha and the slope by beta before the forecast extends h weeks along the new slope](screenshots/Holts-Method-in-R-update.webp)
*Figure 1: One week of Holt's method. A single forecast error is computed once, then spent twice: alpha decides how much of it moves the level, beta decides how much of it bends the slope. The updated pair becomes both the forecast and next week's starting point, which is what makes this a loop rather than a formula.*

Notice the \(\beta\) in the innovations form has lost its star. That is not a typo, and it is the single most common way to get these equations wrong in practice. We will come back to it in a moment, because first we need the numbers R fitted.

```r title="The four numbers holt() estimated"
round(fit$model$par, 4)
#>    alpha     beta        l        b 
#>   0.0001   0.0001 110.4871   2.6463 
```

`fit$model$par` is a named vector holding everything `holt()` estimated. There are four numbers, not two. `alpha` and `beta` are the smoothing parameters from the equations. `l` and `b` are \(\ell_0\) and \(b_0\), the level and slope the model reckons the series had *just before week 1*, which the equations need to have something to start from. SES had to estimate \(\ell_0\) for the same reason; Holt needs a starting slope too. R fits all four together by minimising squared forecast error, so \(b_0 = 2.6463\) is not a guess anyone made, it is the starting slope that made the whole 24-week history fit best.

Both alpha and beta came out at 0.0001, which is the lower bound R allows. Read that as the optimiser saying something specific: *do not react to the wiggles*. With alpha near zero, the level almost ignores each week's surprise and just follows its own trajectory. With beta near zero, the slope barely changes at all. Watch what that looks like in the fitted slope over the final three weeks.

```r title="The slope R fitted barely moves"
round(tail(fit$model$states, 3), 3)
#> Time Series:
#> Start = 22 
#> End = 24 
#> Frequency = 1 
#>          l     b
#> 22 168.701 2.647
#> 23 171.348 2.647
#> 24 173.994 2.646
```

`fit$model$states` is the full history of the model's internal state, one row per week, with a column for the level `l` and a column for the slope `b`. `tail(..., 3)` shows the last three weeks. The level climbs 168.70, 171.35, 173.99, gaining about 2.65 a week. The slope sits at 2.647, 2.647, 2.646, essentially frozen.

So the model Holt fitted to this bakery is close to "draw the best straight line through 24 weeks and extend it". That is a legitimate answer, not a failure. The bakery's growth has been steady enough that the honest estimate of the slope is a constant, and the level after week 24 is 173.994. Add six steps of 2.646 and you are at week 30's forecast.

## Can you reproduce holt() by hand?

The equations above are only worth trusting if they produce R's numbers. Let us take the four fitted parameters, run the innovations form across all 24 weeks in a plain `for` loop, and see whether we land where `holt()` landed.

```r title="Holt's method, hand-rolled in five lines"
alpha <- fit$model$par[["alpha"]]
beta  <- fit$model$par[["beta"]]
level <- fit$model$par[["l"]]   # l_0, the starting level
slope <- fit$model$par[["b"]]   # b_0, the starting slope

for (t in seq_along(loaves)) {
  error <- loaves[t] - (level + slope)        # how wrong last week's guess was
  level <- level + slope + alpha * error      # alpha's share of the surprise
  slope <- slope + beta * error               # beta's share of the surprise
}

round(c(hand_level = level, hand_slope = slope), 3)
#> hand_level hand_slope 
#>    173.994      2.646 
```

Walk through the loop. `level` and `slope` start at \(\ell_0\) and \(b_0\), the two starting values R fitted. Each pass computes `error`, the gap between what actually happened that week and what the model would have predicted knowing only the weeks before it. Then the level moves by `alpha * error` on top of its own momentum, and the slope bends by `beta * error`. The double brackets in `par[["alpha"]]` pull out the bare number rather than a one-element named vector, which keeps the arithmetic clean.

After 24 passes our hand-rolled level is 173.994 and our slope is 2.646. Compare those to the last row of `fit$model$states` in the previous block: 173.994 and 2.646. The same numbers. Five lines of base R just reproduced the state that `holt()` arrived at.

Now push it one step further and turn our state into a forecast, using \(\hat{y}_{t+h|t} = \ell_t + h b_t\) exactly as written.

```r title="Our state, R's forecast"
round(level + (1:6) * slope, 4)
#> [1] 176.6402 179.2863 181.9324 184.5785 187.2246 189.8707
round(as.numeric(fit$mean), 4)
#> [1] 176.6402 179.2863 181.9324 184.5785 187.2246 189.8707
```

`(1:6)` is the vector of horizons, so `level + (1:6) * slope` evaluates the forecast equation at every \(h\) from 1 to 6 in one go. The two lines agree to all four decimals across all six weeks. The forecast equation is not an approximation of what `holt()` does; it is what `holt()` does.

Now back to that missing star. Our loop used the innovations form with the `beta` R reported, and it matched. If instead you take the blending form from the previous section and plug R's reported `beta` in where \(\beta^{*}\) belongs, you get the wrong answer, because they are not the same quantity.

> **Watch out:** `holt()` and `ets()` report \(\beta = \alpha \beta^{*}\), not \(\beta^{*}\). The textbook writes Holt's method with \(\beta^{*}\); R prints \(\beta\). To recover the textbook's \(\beta^{*}\), divide: \(\beta^{*} = \beta / \alpha\). This is also why R's constraint is \(0 < \beta < \alpha\) rather than \(0 < \beta < 1\), which surprises people who have only seen the textbook form.

That claim is testable, so test it. Recover \(\beta^{*}\) by division, then run the *blending* form and see whether it lands in the same place.

```r title="The textbook form, with beta-star recovered"
beta_star <- beta / alpha
round(beta_star, 6)
#> [1] 0.999998

lev2 <- fit$model$par[["l"]]
slo2 <- fit$model$par[["b"]]
for (t in seq_along(loaves)) {
  prev <- lev2
  lev2 <- alpha * loaves[t] + (1 - alpha) * (prev + slo2)
  slo2 <- beta_star * (lev2 - prev) + (1 - beta_star) * slo2
}
round(c(component_level = lev2, component_slope = slo2), 3)
#> component_level component_slope 
#>         173.994           2.646 
```

The blending form lands on 173.994 and 2.646, the same state the innovations form and `holt()` both reached. The two ways of writing Holt's method really are the same method, once \(\beta^{*}\) is the right number.

And look at what \(\beta^{*}\) actually is here: 0.999998, essentially 1. In textbook terms that reads as "the slope reacts completely to the latest change in level", which sounds like the opposite of the frozen slope we saw. Both are true, and that is the whole point of the reparameterisation. Because alpha is near zero, the level barely reacts to anything, so \(\ell_t - \ell_{t-1}\) is itself just \(b_{t-1}\). A slope reacting fully to a change that is only ever its own previous value does not move. The product \(\beta = \alpha \beta^{*} = 0.0001\) is the number that actually describes the behaviour, which is exactly why R reports that one.

## What does beta actually control?

Beta decides how much of each week's surprise is allowed to bend the slope. Low beta means the slope is stubborn: it was fitted from the whole history and one odd week will not move it. High beta means the slope is credulous: it rewrites its opinion of the bakery's growth rate from whatever just happened.

The cleanest way to see it is to pin alpha and sweep beta. We hold `alpha = 0.9` fixed so the level behaves identically in every run, then vary beta across its allowed range and look at what happens to the fitted slope and to week 30.

```r title="Same level dynamics, four different betas"
compare_beta <- function(b) {
  f  <- holt(bakery, h = 6, alpha = 0.9, beta = b)
  st <- tail(f$model$states, 1)
  c(beta      = b,
    beta_star = round(b / 0.9, 3),
    slope     = round(unname(st[1, "b"]), 3),
    week_30   = round(as.numeric(f$mean[6]), 2),
    RMSE      = round(unname(accuracy(f)[, "RMSE"]), 3))
}
t(sapply(c(0.01, 0.1, 0.45, 0.85), compare_beta))
#>      beta beta_star  slope week_30  RMSE
#> [1,] 0.01     0.011  2.052  179.30 5.503
#> [2,] 0.10     0.111  1.704  177.27 5.732
#> [3,] 0.45     0.500 -1.486  158.23 6.456
#> [4,] 0.85     0.944 -5.872  131.98 7.660
```

The helper fits one model per beta and pulls out five things: the beta we passed, the textbook \(\beta^{*}\) it corresponds to, the final fitted slope, the week-30 forecast, and the in-sample RMSE. `accuracy()` computes fit statistics for a forecast object, and `RMSE` (root mean squared error) is the typical size of a one-week-ahead miss, in loaves. `unname()` strips the labels R attaches to those pieces so the table prints cleanly. `sapply()` runs the helper over the four betas and `t()` transposes the result so each beta is a row.

Read the `slope` column top to bottom, because it tells the story. At `beta = 0.01` the slope is 2.052 loaves a week, close to the steady growth the whole history shows. At `beta = 0.85` the slope is **-5.872**: the model now believes the bakery is losing almost six loaves a week. Nothing about the bakery changed between those two rows. The only difference is how much attention the slope pays to the most recent surprises, and the most recent surprise was week 24, where sales fell from 174 to 166. A high-beta slope reads that single drop as news about the growth rate itself and forecasts the bakery down to 131.98 loaves by week 30. That is 47 loaves below the low-beta row directly above it, and 58 below the 189.87 that `holt()` forecast back in the first section, off the very same 24 numbers.

The RMSE column settles the argument. It rises from 5.503 to 7.660 as beta climbs, so a jumpy slope does not merely produce a scarier forecast, it fits the actual history worse. This series wants a stable slope.

> **Note:** the `beta_star` column also shows why R constrains \(\beta < \alpha\). We pinned `alpha = 0.9`, so beta could go no higher than 0.9, and `beta = 0.85` already puts \(\beta^{*}\) at 0.944. Passing `beta` larger than `alpha` would ask for \(\beta^{*} > 1\), which is not a weighted average at all.

In practice you rarely set beta by hand. You let R fit it, and then read the fitted value as a diagnostic, the same way you read alpha. A fitted beta at the lower bound says the growth rate is steady. A large fitted beta says the growth rate itself is moving around, which is worth knowing before you trust any long forecast.

## Why should you damp the trend?

Here is the uncomfortable part of \(\hat{y}_{t+h|t} = \ell_t + h b_t\). The forecast is a straight line, and a straight line never stops. Ask Holt for a forecast far enough out and it will confidently tell you the bakery sells any number you like.

```r title="What the straight line says a year out"
long_u <- holt(bakery, h = 52)
long_d <- holt(bakery, h = 52, damped = TRUE)

round(rbind(undamped = as.numeric(long_u$mean)[c(6, 26, 52)],
            damped   = as.numeric(long_d$mean)[c(6, 26, 52)]), 1)
#>           [,1]  [,2]  [,3]
#> undamped 189.9 242.8 311.6
#> damped   181.5 205.2 221.0
```

We fit the same data twice, once as before and once with `damped = TRUE`, ask both for a year of forecasts, and print weeks 30, 50, and 76. The undamped model says the bakery will sell **311.6 loaves** in week 76, nearly double its current 166, purely because 2.6 times 52 is 137 and nothing in the model ever says stop. No bakery grows in a straight line for a year. Ovens have capacity, the cafe chain has a finite number of cafes, and growth from a one-off contract flattens once the contract is fully ramped.

Damping is the fix, and it is a small one. Add a fourth parameter \(\phi\) (phi) between 0 and 1, and shrink the slope by a factor of \(\phi\) at every step into the future:

$$\hat{y}_{t+h|t} = \ell_t + (\phi + \phi^2 + \cdots + \phi^h) \, b_t$$

Instead of \(h\) full steps, the forecast takes \(h\) shrinking ones. The level and slope equations get the same treatment: wherever \(b_{t-1}\) appeared, it becomes \(\phi b_{t-1}\). With \(\phi = 1\) nothing shrinks and you have ordinary Holt back, so on paper damped Holt contains plain Holt as a special case. R will not actually go there: `holt()` keeps \(\phi\) between 0.8 and 0.98 and refuses anything outside that range. The reasoning is that a \(\phi\) close to 1 is indistinguishable from no damping at all, while a small \(\phi\) damps the trend so hard the forecast flattens almost at once. With \(\phi\) slightly below 1 the near-term forecast is barely touched while the long-term one is pulled up short.

```r title="The damped fit adds one parameter"
fit_damped <- holt(bakery, h = 6, damped = TRUE)
round(fit_damped$model$par, 4)
#>    alpha     beta      phi        l        b 
#>   0.0001   0.0001   0.9711 106.3242   3.8262 
```

There are now five numbers instead of four, and the new one is `phi = 0.9711`. R fitted that from the data the same way it fitted the rest. Alpha and beta are still pinned at their lower bound, so this is still a near-deterministic trend, just one that is allowed to tire.

The starting slope moved too, from 2.6463 in the undamped fit to 3.8262 here. That is damping working backwards. Every week multiplies the slope by 0.9711, so to have the middle of the series still climbing at the roughly 2.6 loaves a week the data actually shows, the model has to start steeper: \(3.8262 \times 0.9711^{12} = 2.69\) by week 12. Keep going and \(3.8262 \times 0.9711^{24} = 1.89\) by week 24, which is the slope the next block reports.

```r title="Damped versus undamped, six weeks out"
round(rbind(undamped = as.numeric(fit$mean),
            damped   = as.numeric(fit_damped$mean)), 2)
#>            [,1]   [,2]   [,3]   [,4]   [,5]   [,6]
#> undamped 176.64 179.29 181.93 184.58 187.22 189.87
#> damped   173.12 174.90 176.63 178.32 179.95 181.54
```

At week 25 the two differ by 3.5 loaves. By week 30 they differ by 8.3, and the damped forecast's own steps are visibly shrinking: 1.78, then 1.73, then 1.69, where the undamped model steps by 2.65 every single time. Damping does not disagree about where the bakery is. It disagrees about how long the climb lasts.

The geometric series has a limit, which means a damped forecast has a **ceiling** it approaches but never passes:

$$\lim_{h \to \infty} \hat{y}_{t+h|t} = \ell_t + \frac{\phi}{1 - \phi} \, b_t$$

That is a claim with a number attached, so check it.

```r title="The damped forecast has a ceiling, and R hits it"
last  <- tail(fit_damped$model$states, 1)
phi   <- fit_damped$model$par[["phi"]]
l_end <- last[1, "l"]
b_end <- last[1, "b"]

ceiling_fc <- l_end + b_end * phi / (1 - phi)
round(c(level = unname(l_end), slope = unname(b_end),
        phi = phi, ceiling = unname(ceiling_fc)), 3)
#>   level   slope     phi ceiling 
#> 171.279   1.892   0.971 234.856 

far <- holt(bakery, h = 400, damped = TRUE)
round(as.numeric(far$mean)[c(52, 200, 400)], 2)
#> [1] 221.02 234.68 234.86
```

We pull the final level and slope out of the fitted states, apply the limit formula, and get a ceiling of **234.856 loaves**. Then we ask R for 400 weeks of damped forecasts: week 76 is at 221.02, week 224 has reached 234.68, and week 424 sits at 234.86. The formula predicted where the model would settle, and the model settled there. Compare that with the undamped forecast, which passed 311 loaves before its first year was out and kept going.

> **Tip:** damping is not pessimism, it is honesty about horizon. A trend estimated from 24 weeks is evidence about the next few weeks and much weaker evidence about the next few years. Damped trend methods are among the best performers in large-scale forecasting competitions for exactly this reason, which is why `ets()` includes damped variants in the family it searches.

## How do you choose between SES, Holt and damped Holt?

Three models, three different answers for week 30: 167.03, 189.87, 181.54. You cannot pick by eye. Two tools decide it, and they are worth understanding separately because they can disagree.

The first is **AIC** (Akaike information criterion), a score that rewards fitting the data well and charges a penalty per parameter. Lower is better, and it is only comparable between models fitted to the same data.

```r title="AIC and in-sample RMSE for all three"
round(c(ses    = fit_ses$model$aic,
        holt   = fit$model$aic,
        damped = fit_damped$model$aic), 3)
#>     ses    holt  damped 
#> 167.488 159.764 160.155 

round(c(ses    = accuracy(fit_ses)[, "RMSE"],
        holt   = accuracy(fit)[, "RMSE"],
        damped = accuracy(fit_damped)[, "RMSE"]), 3)
#>    ses   holt damped 
#>  5.902  4.623  4.471 
```

Read the two lines against each other, because they do not agree. On AIC, plain Holt wins at 159.764, damped Holt is a hair behind at 160.155, and SES is far back at 167.488. On in-sample RMSE, the order flips at the top: damped Holt fits best at 4.471, then Holt at 4.623, then SES at 5.902.

The disagreement is the lesson. Damped Holt has one more parameter than Holt, and that extra dial gives the optimiser one more way to bend the fitted line toward the data it can already see, so it will nearly always score better on in-sample error. (Only nearly: R's \(\phi \le 0.98\) stops damped Holt from collapsing exactly onto plain Holt, so it is not guaranteed. Here it did score better.) So RMSE preferring damped Holt is close to uninformative, because it mostly reports which model had more freedom. AIC charges for that freedom, and once charged, the improvement no longer covers its cost: the 0.4-point gap says the two models are about equally good, with Holt marginally ahead on parsimony. What both agree on emphatically is that SES does not belong here.

Both of those numbers are still measured on data the models were fitted to. The question the bakery actually has is about weeks nobody has seen. So hide some.

```r title="Fit on the first 18 weeks, forecast the last 6"
train <- window(bakery, end = 18)
test  <- window(bakery, start = 19)

h_train <- holt(train, h = 6)
s_train <- ses(train, h = 6)
d_train <- holt(train, h = 6, damped = TRUE)

round(rbind(ses    = as.numeric(s_train$mean),
            holt   = as.numeric(h_train$mean),
            damped = as.numeric(d_train$mean),
            actual = as.numeric(test)), 1)
#>         [,1]  [,2]  [,3]  [,4]  [,5]  [,6]
#> ses    154.1 154.1 154.1 154.1 154.1 154.1
#> holt   162.1 164.9 167.7 170.4 173.2 176.0
#> damped 161.4 163.8 166.0 168.2 170.4 172.5
#> actual 159.0 165.0 167.0 169.0 174.0 166.0
```

`window()` cuts a time series by time, so `train` is weeks 1 to 18 and `test` is weeks 19 to 24. Each model sees only the training weeks, then forecasts six ahead, and the last row is what really happened. Now the comparison is honest: none of these models has ever seen the numbers in the `actual` row.

Look down the columns. SES sits at 154.1 while the bakery climbs past it to 174. Holt tracks the middle four weeks almost exactly (164.9 against 165, 167.7 against 167, 170.4 against 169) and then overshoots the final week, forecasting 176.0 when sales dipped to 166. Damped Holt is slightly low early and closer at the end. Score them.

```r title="Out-of-sample RMSE: the honest comparison"
round(c(ses    = accuracy(s_train, test)["Test set", "RMSE"],
        holt   = accuracy(h_train, test)["Test set", "RMSE"],
        damped = accuracy(d_train, test)["Test set", "RMSE"]), 3)
#>    ses   holt damped 
#> 13.320  4.322  3.281 
```

Passing `test` as a second argument to `accuracy()` makes it score the forecasts against the held-out truth and report a `Test set` row. SES misses by 13.3 loaves on average, three times worse than either trend model. Damped Holt wins at 3.281, ahead of Holt's 4.322.

So the in-sample AIC narrowly preferred plain Holt and the holdout preferred damped Holt. Both comparisons are legitimate; they answer different questions, and with a 24-point series and a 6-point test set neither margin is large enough to be worth much confidence. The defensible reading is that this bakery has a real trend (every method that models one beats the method that does not, by a wide margin) and that the choice between damped and undamped is close, with damping the safer default the further out you forecast.

If you would rather not run the comparison yourself, `ets()` will search the family and score it for you.

```r title="What ets() picks unprompted"
auto <- ets(bakery)
auto$method
#> [1] "ETS(A,A,N)"
round(auto$aic, 3)
#> [1] 159.764
```

`ets()` fits the whole exponential smoothing family and selects on AIC. It chose `ETS(A,A,N)`, which reads as additive error, additive trend, no seasonality, and that is precisely Holt's linear method. Its AIC of 159.764 is identical to what `holt()` reported, because it fitted the same model. The three letters are worth knowing properly; [ETS Models in R](ETS-Models-in-R.html) walks through what each slot means and why there are thirty combinations.

## When does Holt's method break?

Holt models a level and a slope, and nothing else. Every failure follows from that sentence.

The first failure is the one you invite by reaching for Holt too eagerly: a series with no trend at all. The model will still fit a slope, because it has one and it must put a number in it. Here is the bakery's *other* 24 weeks, the ones from before the contract, when sales just wobbled around a stable level.

```r title="Failure 1: no trend, and Holt invents one anyway"
flat <- ts(c(118, 124, 115, 131, 121, 109, 126, 122, 133, 117, 128, 119,
             125, 136, 114, 123, 130, 120, 127, 116, 132, 122, 129, 121),
           start = 1)

flat_holt <- holt(flat, h = 4)
flat_ses  <- ses(flat, h = 4)

round(flat_holt$model$par, 4)
#>    alpha     beta        l        b 
#>   0.0001   0.0001 120.9238   0.1867 
round(rbind(ses  = as.numeric(flat_ses$mean),
            holt = as.numeric(flat_holt$mean)), 2)
#>        [,1]   [,2]   [,3]   [,4]
#> ses  123.25 123.25 123.25 123.25
#> holt 125.59 125.78 125.96 126.15
```

These 24 numbers have no trend in them; they are noise around roughly 123 loaves. Holt fitted a starting slope of **0.1867 loaves a week** regardless, and forecasts the bakery drifting up to 126.15 by week 28 while SES holds flat at 123.25. The slope is not real. It is Holt fitting a faint upward tilt to a cloud of noise, and it will keep extrapolating that tilt for as long as you ask.

Here is the part that catches people, and it is why the two numbers in the next block matter more than they look.

```r title="RMSE says use Holt; AIC says do not"
round(c(ses_aic = flat_ses$model$aic, holt_aic = flat_holt$model$aic), 3)
#>  ses_aic holt_aic 
#>  172.695  175.735 
round(c(ses_rmse = accuracy(flat_ses)[, "RMSE"], holt_rmse = accuracy(flat_holt)[, "RMSE"]), 3)
#>  ses_rmse holt_rmse 
#>     6.578     6.448 
```

In-sample RMSE prefers Holt: 6.448 against SES's 6.578. Of course it does. Holt has two more parameters and can bend slightly toward the noise, so it *always* fits the training data at least as well. If RMSE on the fitted data were your selection rule, you would pick the model with the invented slope every time. AIC charges for those parameters and reverses the verdict: 175.735 for Holt against 172.695 for SES, a 3-point win for the simpler model. This is the whole reason model selection uses AIC or a holdout instead of in-sample error.

The second failure is seasonality. A slope is a straight line and a season is a repeating wave, and no amount of slope will make a line wave. Suppose the bakery's weekly numbers were quarterly ones, with a large spike every fourth quarter.

```r title="A series with a strong quarterly cycle"
set.seed(11)
seas <- ts(rep(c(90, 95, 100, 140), 8) + round(rnorm(32, 0, 4)) + rep(0:7 * 2, each = 4),
           frequency = 4, start = 1)
as.numeric(seas)
#>  [1]  88  95  94 135  97  93 107 144  94  95 101 143  90 100 101 146  97 107 106 145  97 105 108 151
#> [25] 102 107 111 149 103 105 110 150
```

This builds 8 years of quarterly data: a repeating pattern of roughly 90, 95, 100, 140 (so Q4 is the big one), plus random noise via `rnorm()`, plus a gentle upward drift of 2 per year. `set.seed(11)` fixes the random numbers so you get the same series shown here. `frequency = 4` tells R these are quarters, which is how `hw()` will know a cycle is four periods long.

```r title="Failure 2: Holt averages the season away"
seas_holt <- holt(seas, h = 4)
seas_hw   <- hw(seas, h = 4)

round(rbind(holt = as.numeric(seas_holt$mean),
            hw   = as.numeric(seas_hw$mean)), 2)
#>        [,1]   [,2]  [,3]   [,4]
#> holt 123.29 123.99 124.7 125.40
#> hw   104.61 109.44 113.7 154.44
round(c(holt_RMSE = accuracy(seas_holt)[, "RMSE"],
        hw_RMSE   = accuracy(seas_hw)[, "RMSE"]), 3)
#> holt_RMSE   hw_RMSE 
#>    19.303     2.780 
```

Holt forecasts the next four quarters as 123.29, 123.99, 124.70, 125.40: a gentle upward line straight through the middle of a pattern that actually swings from about 103 to about 150. It has averaged the season away, because averaging is the only thing a level-and-slope model can do with a wave. `hw()` (Holt-Winters) adds a third component for the seasonal pattern and forecasts 104.61, 109.44, 113.70, and then **154.44** for the Q4 spike. The RMSE gap is not subtle: 19.303 for Holt against 2.780 for Holt-Winters, a seven-fold difference. If your series has a cycle, Holt is the wrong member of the family and [Holt-Winters in R](Holt-Winters-in-R.html) is the right one.

The third failure is more subtle: Holt's trend is **additive**, meaning it adds a fixed number of loaves per period. A business growing at 5% a week is not adding a fixed amount, it is multiplying, and the gap between those two shapes widens the further you forecast. Suppose Ridge Road opened a second location that grows that way.

```r title="Failure 3: percentage growth is not a fixed number of loaves"
set.seed(3)
# A second location growing 5% a week, rather than +2.6 loaves a week.
pct <- ts(round(100 * 1.05^(0:23) + rnorm(24, 0, 3)), start = 1)

add_fit <- holt(pct, h = 6)
log_fit <- holt(pct, h = 6, lambda = 0, biasadj = TRUE)

round(rbind(additive  = as.numeric(add_fit$mean),
            log_scale = as.numeric(log_fit$mean)), 1)
#>            [,1]  [,2]  [,3]  [,4]  [,5]  [,6]
#> additive  315.7 328.4 341.2 354.0 366.7 379.5
#> log_scale 321.5 337.6 354.5 372.3 391.0 410.6
round(c(additive  = accuracy(add_fit)[, "RMSE"],
        log_scale = accuracy(log_fit)[, "RMSE"]), 3)
#>  additive log_scale 
#>     3.067     2.294
```

The fix is to model `log(y)` and Holt the logs, since a constant additive trend on the log scale is constant percentage growth on the original scale. The `lambda` argument does the transformation inside the call: `lambda = 0` means take logs before fitting and undo them afterwards, and `biasadj = TRUE` corrects the back-transformed forecast so it is a mean rather than a median.

Compare the two rows. The additive fit steps by a flat 12.77 loaves a week and keeps stepping by 12.77 no matter how large the bakery gets, because that is the only shape it has. The log-scale fit steps by 16.1, then 16.9, then 17.8, growing as the series grows, which is what 5% a week actually looks like. It also fits the history better, 2.294 against 3.067. Multiplicative trend models exist in the ETS family too, though Hyndman advises against them in practice because they extrapolate explosively.

The honest scope of `holt()` is therefore narrow. Use it on a series with a real, roughly linear trend and no seasonal cycle, over a horizon short enough that "the trend continues" is a defensible sentence. That is the bakery's 24 weeks, over 6 weeks, which is why 176.64 was a reasonable answer. Before reaching for it on your own data, plot the series and check both conditions. [Time Series Decomposition in R](Time-Series-Decomposition-in-R.html) is the tool for answering them when the eye is not enough.

## FAQ

**What is the difference between Holt's method and Holt-Winters?**
Holt's method tracks two components, a level and a slope, using two smoothing parameters (alpha and beta). Holt-Winters adds a third component for a repeating seasonal pattern and a third parameter (gamma) to smooth it. Use `holt()` when the series trends but has no cycle; use `hw()` when it has both. In the seasonal example above, that choice was worth a seven-fold difference in RMSE.

**Why is my fitted beta 0.0001?**
That is R's lower bound, and it means the optimiser found no evidence the growth rate is changing. The model has settled on a near-constant slope, so it is behaving much like a straight line fitted through your data and extended. This is a normal, healthy result for a series with steady growth, not an error. Read it the same way you read a near-zero alpha in SES: as the fit telling you something about your data.

**Should I always use damped = TRUE?**
Not always, but it is a sensible default for anything beyond a short horizon. Damping adds a single parameter, and when phi is fitted near the top of R's allowed range (0.8 to 0.98) the near-term forecast barely differs from undamped Holt while the long-term one is protected from the straight line that never stops. On the bakery's data, damping won the out-of-sample comparison (3.281 against 4.322) while losing narrowly on AIC. If your horizon is a handful of periods and AIC prefers the undamped fit, plain `holt()` is defensible.

**Why does R's beta not match the beta in my textbook?**
Because they are different quantities. The textbook (including Hyndman's fpp3) writes the slope equation with \(\beta^{*}\), while `holt()` and `ets()` report \(\beta = \alpha \beta^{*}\). Divide R's beta by R's alpha to recover the textbook's \(\beta^{*}\). This also explains R's constraint \(0 < \beta < \alpha\), which looks strange until you know that \(\beta^{*} = \beta / \alpha\) is the thing that has to stay below 1.

**Can Holt's method handle a series that grows by a percentage each period?**
Not directly, because its trend is additive: it adds a fixed quantity each period rather than multiplying. Fit it to `log(y)` instead, where constant percentage growth becomes a constant additive trend, then back-transform. In the forecast package, pass `lambda = 0` to do the log transform inside the call, and add `biasadj = TRUE` so the back-transformed forecast is a mean rather than a median.

**Should I use holt() or ets(model = "AAN")?**
They fit the same model, and on the bakery's data they returned an identical AIC of 159.764. Use `holt()` when you have already decided the series has a trend and no season, since the call is shorter and the arguments (`damped`, `beta`) are right there. Use `ets()` when you want the selection made for you or want to compare across the whole family on AIC.

## Summary

Holt's linear trend method is SES plus a slope. That single addition turns a flat forecast into a line. It also brings one new parameter to understand and one new way to be wrong.

| Piece | What it does | What to watch |
|---|---|---|
| Level \(\ell_t\) | Where the series sits now | Same role as in SES |
| Slope \(b_t\) | How much the level moves per period | The whole reason to use Holt |
| \(\alpha\) | How much of each surprise moves the level | Near 0 means a near-deterministic fit |
| \(\beta\) | How much of each surprise bends the slope | R reports \(\alpha\beta^{*}\), not \(\beta^{*}\); constrained \(0 < \beta < \alpha\) |
| \(\phi\) (damped only) | Shrinks the slope by \(\phi\) each step ahead | Gives the forecast a ceiling at \(\ell_t + \tfrac{\phi}{1-\phi} b_t\) |
| \(\hat{y}_{t+h|t} = \ell_t + h b_t\) | The forecast: a straight line out of the level | Never stops climbing without damping |
| `holt(y, h)` | Fits it and picks all parameters by minimising squared error | `damped = TRUE` adds \(\phi\) |

For Ridge Road Bakery, the answer to "how many for week 30" is about 190 loaves undamped, 182 damped, against SES's 167. The out-of-sample test preferred the damped answer. Use `holt()` when the series has a real trend and no seasonal cycle, prefer `damped = TRUE` as the horizon grows, select with AIC or a holdout rather than in-sample RMSE, and move to `hw()` the moment a cycle appears.

## References

1. Hyndman, R. J. & Athanasopoulos, G. *Forecasting: Principles and Practice*, 3rd ed., Section 8.2 "Methods with trend". [otexts.com/fpp3/holt.html](https://otexts.com/fpp3/holt.html). The canonical treatment of Holt's method and the damped trend, and the source of the \(\beta^{*}\) notation used here.
2. Hyndman & Athanasopoulos, *FPP3*, Section 8.1 "Simple exponential smoothing". [otexts.com/fpp3/ses.html](https://otexts.com/fpp3/ses.html). The level-only model Holt extends; read this first if alpha is unfamiliar.
3. Hyndman & Athanasopoulos, *FPP3*, Section 8.4 "A taxonomy of exponential smoothing methods". [otexts.com/fpp3/taxonomy.html](https://otexts.com/fpp3/taxonomy.html). Where Holt's method sits in the ETS family and what `ETS(A,A,N)` means.
4. Hyndman, R. J. & Khandakar, Y. "Automatic Time Series Forecasting: The forecast Package for R." *Journal of Statistical Software* 27(3), 2008. [jstatsoft.org/article/view/v027i03](https://www.jstatsoft.org/article/view/v027i03). The paper behind `ets()` and `holt()`, including the state space form and the parameter constraints.
5. Hyndman, R. J., Koehler, A. B., Snyder, R. D. & Grose, S. "A state space framework for automatic forecasting using exponential smoothing methods." *International Journal of Forecasting* 18(3), 2002, pp. 439-454. [robjhyndman.com/papers/hksg.pdf](https://robjhyndman.com/papers/hksg.pdf). Where the innovations state space form used in this post's hand-rolled loop comes from.
6. `forecast` package on CRAN. [cran.r-project.org/package=forecast](https://cran.r-project.org/package=forecast). Current version plus the full reference manual and changelog.
7. `ses()` / `holt()` / `hw()` function reference. [pkg.robjhyndman.com/forecast/reference/ses.html](https://pkg.robjhyndman.com/forecast/reference/ses.html). Every argument of `holt()`, including `damped`, `lambda`, and `biasadj`.

## Continue Learning

- [Exponential Smoothing in R](Exponential-Smoothing-in-R.html), the level-only method Holt extends. It builds alpha and the level from scratch on this same bakery, and ends where this post begins.
- [Holt-Winters in R](Holt-Winters-in-R.html), the next component along. Add a seasonal term when your series repeats on a fixed cycle, as the quarterly failure above showed.
- [ETS Models in R](ETS-Models-in-R.html), the family that contains all of these. `ETS(A,A,N)` is Holt's method; the post explains the other twenty-nine combinations and how `ets()` chooses.

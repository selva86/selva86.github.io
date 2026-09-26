---
title: "Multivariate Time Series Lesson 5: Cointegration and the VECM"
slug: "Cointegration-and-the-VECM"
description: "Two prices can each wander and still be tied together. Spot a spurious regression, count cointegrating relations with the Johansen test, and read a VECM in R."
keywords: "cointegration, VECM, vector error correction model, Johansen test, ca.jo, cajorls, spurious regression, error correction term, adjustment coefficient, half-life, R"
mathjax: true
webr: true
date: "2026-09-26"
post_type: "LESSON"
course_id: "ts-multivariate"
course_title: "Multivariate Time Series"
course_lesson: "5"
course_total: "6"
course_landing: "Multivariate-Time-Series-Course.html"
course_prev: "Impulse-Response-Functions.html"
course_next: "Forecasting-Multiple-Related-Series.html"
curriculum_id: "5.110.5"
lesson_access: "pro"
catalog_blurb: "Tell a genuine long-run link between two prices from a spurious one."
---

=== step === cover
## Cointegration and the VECM

Today let's understand how two prices that each wander can still be tied together, and how to model that tie.

Let's say you are an analyst at a grain co-op. Every trading day you record the wheat price at two elevators, one inland and one on the river, and you now have 250 days of both.

Plot them and each price does the same thing: it drifts around and never settles at one level. Over the 250 days, each price ranges over more than 2 dollars.

But the two prices are clearly related. The gap between them, called the spread, stays close to the same value all the time.

So here is the question: how do you model two prices that each wander, but stay tied together? The answer has three parts.

::widget process-flow {"steps":[{"title":"Each price is non-stationary","sub":"the price wanders and has no fixed mean"},{"title":"A combination of the prices is stationary","sub":"the spread stays near a fixed level"},{"title":"A VECM models the way back to equilibrium","sub":"how fast the spread returns to its usual level"}]}

That is the whole plan. Everything from here on fills in one of the three boxes, using these two wheat prices.

=== step === concept
## How to tell a non-stationary price from a stationary one

Cointegration is about series that wander, so let's first be precise about what wandering means.

A series is **stationary** when its mean and its variance stay the same over time. It keeps coming back to the same level. A **non-stationary** series does not: it can drift away from where it started and stay away, so its mean is not constant.

Let's build the prices we will use for the whole lesson. The block simulates 250 days of inland and river wheat prices, plus a coffee price that is simulated on its own and has nothing to do with wheat. The simulation builds in a freight gap of 0.40 dollars between the two wheat prices and a daily pull back toward it, so later we can check our estimates against those values.

```r
# Simulate 250 days of inland and river wheat prices and an unrelated coffee price
n <- 250

set.seed(42)
common_shock <- rnorm(n, 0, 0.07)
shock_inland <- common_shock + rnorm(n, 0, 0.03)
shock_river <- common_shock + rnorm(n, 0, 0.03)

inland <- numeric(n)
river <- numeric(n)
inland[1] <- 6.40
river[1] <- 6.00
change_inland <- 0
change_river <- 0

for (day in 2:n) {
  equilibrium_error <- inland[day - 1] - river[day - 1] - 0.40
  change_inland <- -0.20 * equilibrium_error + 0.3 * change_inland + shock_inland[day]
  change_river <- 0.10 * equilibrium_error + 0.3 * change_river + shock_river[day]
  inland[day] <- inland[day - 1] + change_inland
  river[day] <- river[day - 1] + change_river
}

set.seed(21)
coffee <- 4 + cumsum(rnorm(n, 0, 0.07))

prices <- data.frame(
  day = 1:n,
  inland = round(inland, 2),
  river = round(river, 2),
  coffee = round(coffee, 2)
)
head(prices)
#>   day inland river coffee
#> 1   1   6.40  6.00   4.06
#> 2   2   6.36  5.99   4.09
#> 3   3   6.35  6.01   4.21
#> 4   4   6.40  6.05   4.13
#> 5   5   6.50  6.07   4.28
#> 6   6   6.48  6.06   4.31
```

Each row is one trading day. Now let's plot the two wheat prices and print how far each one ranges.

```r
# Plot both wheat prices and print each price's range over the 250 days
plot(prices$day, prices$inland, type = "l", col = "#1f7a55", lwd = 2,
     ylim = range(prices$inland, prices$river), xlab = "Day", ylab = "Price (dollars)")
lines(prices$day, prices$river, col = "#2563a8", lwd = 2)
legend("topright", legend = c("inland", "river"), col = c("#1f7a55", "#2563a8"), lwd = 2, bty = "n")

sapply(prices[, c("inland", "river")], range)
#>      inland river
#> [1,]   4.81  4.41
#> [2,]   7.04  6.67
```

Both prices drift down over the 250 days, and neither has a fixed mean. Inland moves between 4.81 and 7.04 dollars, and river between 4.41 and 6.67 dollars.

But a plot is only an impression, so let's test it. The augmented Dickey-Fuller (ADF) test asks whether a series has a **unit root**: today's value is yesterday's value plus a random change, so a shock never fades out. That is its null hypothesis, and a small p-value rejects it. The `adf.test()` function in the tseries package runs it, and it also allows for a linear trend.

We run it on each price and on its daily changes, meaning today's price minus yesterday's. The prices themselves are called the **levels**.

```r
# Run an augmented Dickey-Fuller test on each price and on its daily changes
suppressMessages(library(tseries))

adf_p <- function(x) suppressWarnings(adf.test(x)$p.value)
series <- c("inland", "river", "coffee")

adf_table <- data.frame(
  series = series,
  levels = round(sapply(prices[series], adf_p), 3),
  changes = round(sapply(prices[series], function(x) adf_p(diff(x))), 3),
  row.names = NULL
)
adf_table
#>   series levels changes
#> 1 inland  0.275    0.01
#> 2  river  0.317    0.01
#> 3 coffee  0.536    0.01
```

On the levels the p-values are 0.275, 0.317 and 0.536, all well above 0.05, so none of the three prices can rule out a unit root. On the daily changes the p-value is 0.01 for all three. That is the smallest value the function reports, so the true p-value is at most 0.01 and the changes are stationary.

A series that becomes stationary after differencing once is called **integrated of order 1**, written I(1). So inland, river and coffee are all I(1).

=== step === widget
## Can two unrelated prices have a high correlation?

Coffee is our test case. It was simulated on its own, so it has no link to wheat. It starts near 4 dollars, and each day it adds a random change with a standard deviation of 0.07 dollars, independent of every other day.

A series built like this is called a **random walk**: the running total of independent daily changes. The changes are pure noise, but a running total of noise can move in one direction for a long stretch. So two random walks with nothing in common often end up moving together.

The chart below plots inland wheat against coffee for the 50 weekly closes, which are every fifth day of the 250.

::widget chart-plotter {"data": [{"x": 4.28, "y": 6.5}, {"x": 4.14, "y": 6.69}, {"x": 4.05, "y": 6.88}, {"x": 4.19, "y": 6.55}, {"x": 4.04, "y": 6.7}, {"x": 3.94, "y": 6.7}, {"x": 3.96, "y": 6.71}, {"x": 4.3, "y": 6.15}, {"x": 4.33, "y": 6.08}, {"x": 4.44, "y": 6.18}, {"x": 4.52, "y": 6.44}, {"x": 4.67, "y": 6.34}, {"x": 4.56, "y": 6.39}, {"x": 4.58, "y": 6.71}, {"x": 4.46, "y": 6.55}, {"x": 4.52, "y": 6.5}, {"x": 4.59, "y": 6.58}, {"x": 4.46, "y": 6.52}, {"x": 4.59, "y": 6.77}, {"x": 4.51, "y": 6.51}, {"x": 4.22, "y": 6.76}, {"x": 4.41, "y": 6.77}, {"x": 4.2, "y": 6.45}, {"x": 4.09, "y": 6.56}, {"x": 4.05, "y": 6.31}, {"x": 4.08, "y": 5.89}, {"x": 4.3, "y": 6.19}, {"x": 4.14, "y": 6.27}, {"x": 4.11, "y": 5.99}, {"x": 4.01, "y": 5.91}, {"x": 3.95, "y": 5.76}, {"x": 3.95, "y": 5.56}, {"x": 3.82, "y": 5.36}, {"x": 3.91, "y": 5.65}, {"x": 3.66, "y": 5.79}, {"x": 3.56, "y": 5.72}, {"x": 3.45, "y": 5.64}, {"x": 3.52, "y": 5.44}, {"x": 3.51, "y": 5.24}, {"x": 3.8, "y": 5.42}, {"x": 3.79, "y": 5.4}, {"x": 3.81, "y": 5.06}, {"x": 4.05, "y": 5.11}, {"x": 3.95, "y": 5.14}, {"x": 3.9, "y": 4.93}, {"x": 3.79, "y": 5.06}, {"x": 3.96, "y": 4.83}, {"x": 4.13, "y": 4.87}, {"x": 4.05, "y": 5.04}, {"x": 3.91, "y": 5.2}], "geoms": ["point", "line"], "x": "coffee", "y": "inland", "code": {"point": "ggplot(df, aes(coffee, inland)) +\n  geom_point() +\n  geom_smooth(method = \"lm\", formula = y ~ x)", "line": "ggplot(df, aes(coffee, inland)) +\n  geom_path()"}}

The point view draws each weekly close with a fitted line, and the widget labels its correlation r: 0.62. The line view joins the same 50 points in day order.

Let's check that using every day instead of every fifth one changes little.

```r
# Compare the correlation on all 250 days with the one on the 50 weekly closes
weekly <- prices[seq(5, n, by = 5), ]

round(cor(prices$inland, prices$coffee), 3)
#> [1] 0.61
round(cor(weekly$inland, weekly$coffee), 3)
#> [1] 0.623
```

The correlation is 0.61 over all 250 days and 0.623 over the 50 weekly closes. Coffee has no effect on inland wheat, and still the correlation is strong. So a correlation between the levels of two non-stationary series does not show a relationship.

=== step === concept
## What is a spurious regression?

The correlation is not the only number that misleads when the series are random walks. A regression of one series on another, when the two have no relationship at all, is called a **spurious regression**.

Here is one. We regress inland wheat on coffee across all 250 days and read the slope's t statistic.

```r
# Regress inland wheat on coffee and check whether the residuals are independent
fit <- lm(inland ~ coffee, data = prices)

round(coef(summary(fit)), 3)
#>             Estimate Std. Error t value Pr(>|t|)
#> (Intercept)    0.834      0.429   1.947    0.053
#> coffee         1.260      0.104  12.110    0.000
round(summary(fit)$r.squared, 3)
#> [1] 0.372

residual_acf <- acf(resid(fit), plot = FALSE)
round(residual_acf$acf[2], 3)   # lag-1 autocorrelation (element 1 is lag 0)
#> [1] 0.968
```

The slope is 1.26 with a standard error of 0.104, which makes the t statistic 12.11. R-squared is 0.372. By the usual rules that is a very strong result, and yet coffee has nothing to do with wheat.

So why does the regression look so convincing? The t test assumes every residual is independent of the one before it. Here each residual is very close to the one before it: the lag-1 autocorrelation, the correlation between a residual and the previous day's residual, is 0.968. The standard error is computed as if the residuals were independent, so it comes out far too small and the t statistic far too big.

Was that just bad luck with one pair? Let's find out. The block below draws 1,000 pairs of independent random walks of length 250, regresses one on the other each time, and keeps the slope's t statistic.

```r
# Regress one random walk on another 1,000 times and keep the slope t statistic each time
set.seed(7)
t_stats <- replicate(1000, {
  walk_a <- cumsum(rnorm(n))
  walk_b <- cumsum(rnorm(n))
  coef(summary(lm(walk_a ~ walk_b)))[2, "t value"]
})

mean(abs(t_stats) > 2)
#> [1] 0.844
round(median(abs(t_stats)), 2)
#> [1] 7.26

hist(t_stats, breaks = 40, col = "#9fc9b5", border = "white", main = "",
     xlab = "Slope t statistic from 1,000 pairs of independent random walks")
abline(v = c(-2, 2), lty = 2, lwd = 2)
```

84.4% of the 1,000 regressions have an absolute t above 2, and the median absolute t is 7.26. A valid test would give an absolute t above 2 in only about 5% of them. The dashed lines mark -2 and 2, and most of the histogram sits outside them.

=== step === quiz
## Quick check: what do a correlation of 0.62 and a slope t of 12.11 say?

Inland wheat and coffee show a correlation of 0.62 on the weekly closes, and the regression of inland on coffee gives a slope t statistic of 12.11. What do those two numbers tell you about the two prices?

::quiz {"correct": 2, "gate": true, "difficulty": "intermediate"}
- Coffee moves the inland wheat price, because the slope is large and its t statistic is far above 2. ::no
- Very little, because two independent random walks often produce a correlation and a t statistic like these. ::ok Right. The two series were simulated separately, and 84.4% of independent pairs of random walks gave an absolute t above 2. The numbers look like evidence, but the correlation comes from two random walks drifting the same way, and the t statistic is inflated by autocorrelated residuals. Neither shows a link.
- The slope is real, because a t statistic above 2 is significant at the 5% level. ::no
- The result would disappear with more days, because a longer sample averages the noise out. ::no The first and third treat the numbers as evidence of a link, and the fourth expects more days to remove them. But the t test assumes independent residuals, and here the residuals have a lag-1 autocorrelation of 0.968, so the t statistic is inflated. More days do not fix it: all 250 days give a correlation of 0.61, and pairs of random walks of length 250 gave an absolute t above 2 in 84.4% of 1,000 tries.

=== step === concept
## What does cointegration mean?

Coffee and inland wheat have nothing in common. Inland and river wheat are not like that, because grain can be shipped between the two elevators.

Let's look at the spread, the inland price minus the river price.

```r
# Compute the spread between the two prices and summarise it
spread <- prices$inland - prices$river

round(c(mean = mean(spread), sd = sd(spread), min = min(spread), max = max(spread)), 3)
#>  mean    sd   min   max
#> 0.403 0.070 0.190 0.600
```

Each price ranges over more than 2 dollars, but the spread only moves between 0.19 and 0.60. Its mean is 0.403, close to the 0.40 freight gap built into the simulation, and its standard deviation is 0.070. So both prices wander, but they wander together, and the spread does not.

Does the spread pass the stationarity test? We run the ADF test on it and measure how persistent it is with its lag-1 autocorrelation.

```r
# Test the spread for a unit root and measure its day-to-day persistence
spread_adf <- suppressWarnings(adf.test(spread))

data.frame(statistic = round(spread_adf$statistic, 2), p_value = spread_adf$p.value, row.names = "spread")
#>        statistic p_value
#> spread     -4.86    0.01

spread_acf <- acf(spread, plot = FALSE)
round(spread_acf$acf[2], 3)
#> [1] 0.78
```

The ADF statistic is -4.86 with a p-value of 0.01, so we reject the unit root and the spread is stationary. It is still persistent, with a lag-1 autocorrelation of 0.78. But it keeps coming back to its mean, and that is what separates it from the residuals of the coffee regression, whose lag-1 autocorrelation was 0.968.

The two stacked plots below put the spread above those coffee regression residuals.

```r
# Plot the spread above the coffee regression residuals, each with its centre line
par(mfrow = c(2, 1))

plot(prices$day, spread, type = "l", col = "#1f7a55", lwd = 2,
     xlab = "Day", ylab = "Spread (dollars)")
abline(h = mean(spread), lty = 2)

plot(prices$day, resid(fit), type = "l", col = "#b5631a", lwd = 2,
     xlab = "Day", ylab = "Coffee regression residual (dollars)")
abline(h = 0, lty = 2)

par(mfrow = c(1, 1))

round(range(resid(fit)), 2)
#> [1] -1.17  1.16
```

The spread crosses its mean again and again. The residuals spend long stretches on one side of zero and range from -1.17 to 1.16 dollars.

[KEY INSIGHT]
Two series are **cointegrated** when each one is I(1) but some combination of them is stationary. Inland and river wheat are cointegrated, because their spread is stationary.

The weights in that combination are called the **cointegrating vector**. For the spread the vector is (1, -1), which means \(1 \times \text{inland} - 1 \times \text{river}\). In general the combination is inland minus beta times river, and beta is a number the data has to tell us. We used beta = 1 here because the spread is easy to read, and the Johansen test later estimates it.

Why would a spread stay near the freight gap? In a real grain market, because grain can be shipped between the elevators, so a spread far above the shipping cost gets closed by trade. The simulation builds that pull in directly. That is what separates a long-run relation from a spurious regression: the combination of a cointegrated pair is stationary, and the residuals of a spurious regression keep wandering.

=== step === concept
## How a VECM is written

A VECM, short for vector error correction model, is a VAR with one extra term. A VAR (vector autoregression) gives each series its own equation, and each equation regresses that series on the recent past of all the series.

In a VECM the series are the daily changes, which are stationary, so the VAR part is valid. But differencing also removes the long-run relation between the two prices. A VAR on the changes alone has no term that depends on how far the spread has moved from its usual level.

So the VECM adds that distance back as an extra term. We call the distance of the spread from its usual level the **equilibrium error**. The three lines below are the model: one equation for each price, and the definition of the error.

\[ \Delta \text{inland}_t = \alpha_1 \, e_{t-1} + \gamma_{11} \, \Delta \text{inland}_{t-1} + \gamma_{12} \, \Delta \text{river}_{t-1} + \varepsilon_{1,t} \]

\[ \Delta \text{river}_t = \alpha_2 \, e_{t-1} + \gamma_{21} \, \Delta \text{inland}_{t-1} + \gamma_{22} \, \Delta \text{river}_{t-1} + \varepsilon_{2,t} \]

\[ e_{t-1} = \text{inland}_{t-1} - \beta \, \text{river}_{t-1} - c \]

Here is what each symbol means.

- \(\Delta\) is the change from one day to the next, so \(\Delta \text{inland}_t\) is today's change in the inland price.
- \(e_{t-1}\) is yesterday's equilibrium error: how far the two prices were from their long-run relation. \(\beta\) is the weight on river and \(c\) is the constant.
- \(\alpha_1\) and \(\alpha_2\) are the **adjustment coefficients**. Each one says how strongly that price's change responds to yesterday's equilibrium error.
- The \(\gamma\) terms are the coefficients on yesterday's changes, as in any VAR, and \(\varepsilon\) is the noise.

There is one more idea: the **rank**, written r. It is the number of equilibrium error terms in the model, and with two prices it can be 0, 1 or 2.

Rank 0 means no cointegration, so there is no error term and the model is a plain VAR in the changes. Rank 1 means one long-run relation, which is the model written above. Rank 2 would mean both prices are already stationary, which they are not.

Does yesterday's equilibrium error really carry information about today's changes? Let's check with two correlations, using the spread minus its mean as the equilibrium error.

```r
# Correlate yesterday's equilibrium error with today's change in each price
equilibrium_error <- spread - mean(spread)

round(cor(equilibrium_error[-n], diff(prices$inland)), 3)
#> [1] -0.159
round(cor(equilibrium_error[-n], diff(prices$river)), 3)
#> [1] 0.037
```

The correlation with today's change in inland is -0.159, and with today's change in river it is 0.037. The sign for inland is negative: when the spread is above its usual level, inland tends to fall the next day. For river the correlation is close to 0.

=== step === concept
## Counting cointegrating relations with the Johansen trace test

How many long-run relations do the two prices have? That number is the rank, and the **Johansen trace test** estimates it. In R it is the `ca.jo()` function from the urca package.

The test needs one input first: K, the number of lags of the VAR fitted to the price levels. The VECM then uses K minus 1 lagged changes. The `VARselect()` function from the vars package compares candidate values of K with four information criteria: AIC, HQ, SC and FPE.

```r
# Choose the lag order K of the VAR in levels with four information criteria
suppressMessages(library(vars))
suppressMessages(library(urca))

lag_choice <- VARselect(prices[, c("inland", "river")], lag.max = 6, type = "const")
lag_choice$selection
#> AIC(n)  HQ(n)  SC(n) FPE(n)
#>      2      2      2      2
```

All four criteria pick 2, so K = 2 and the VECM has one lagged change, which is the form written in the previous step.

Now we run the test. Besides K, the arguments of `ca.jo()` need a word each.

- `type = "trace"` chooses the trace statistic.
- `ecdet = "const"` allows a constant inside the equilibrium error. That constant is the freight gap of about 0.40 dollars. Without it, the long-run relation would be forced to have no constant.
- `spec = "transitory"` puts the equilibrium error at lag 1, as in the equations above.

```r
# Run the Johansen trace test on the two wheat prices
jo <- ca.jo(prices[, c("inland", "river")], type = "trace", ecdet = "const", K = 2, spec = "transitory")

round(jo@lambda[1:2], 4)
#> [1] 0.1636 0.0059
cbind(teststat = round(jo@teststat, 2), jo@cval)
#>          teststat 10pct  5pct  1pct
#> r <= 1 |     1.46  7.52  9.24 12.97
#> r = 0  |    45.76 17.85 19.96 24.60
```

The table has one row for each null hypothesis. The row `r = 0` tests "there are no cointegrating relations", and the row `r <= 1` tests "there is at most 1". You reject a null hypothesis when its statistic is above the critical value, and we use the 5% column.

So we read the table from the `r = 0` row up:

1. For `r = 0`, the statistic 45.76 is above the 5% critical value 19.96, so we reject "no relations".
2. For `r <= 1`, the statistic 1.46 is below the 5% critical value 9.24, so we do not reject "at most 1".
3. We stop at the first row we cannot reject. The rank is 1.

Where do the statistics come from? They are built from the two eigenvalues printed above the table, 0.1636 and 0.0059. Each eigenvalue measures how well one combination of yesterday's prices predicts the daily changes, and a value near 0 means it predicts nothing.

The trace statistic for a row sums the log of 1 minus the eigenvalue over the eigenvalues that row tests, and multiplies the sum by -248. The number 248 is the 250 days less the K = 2 lags. The block below recomputes both rows by hand.

```r
# Recompute both trace statistics by hand from the two eigenvalues
lambda <- jo@lambda[1:2]

round(-(n - 2) * sum(log(1 - lambda)), 2)   # row r = 0 uses both eigenvalues
#> [1] 45.76
round(-(n - 2) * log(1 - lambda[2]), 2)     # row r <= 1 uses only the smaller one
#> [1] 1.46
```

The `r = 0` statistic uses both eigenvalues, and the large one, 0.1636, makes it big: 45.76. The `r <= 1` statistic uses only 0.0059, so it is small: 1.46. That is the evidence for exactly one relation.

=== step === widget
## Fitting a VECM with cajorls() and reading its coefficients

With the rank set to 1, the `cajorls()` function fits the VECM. It returns two things: `beta`, the cointegrating vector, and `rlm`, one regression for each price's daily change.

```r
# Fit the VECM at rank 1 and print the cointegrating vector and the two coefficient tables
vecm <- cajorls(jo, r = 1)

round(vecm$beta, 3)
#>             ect1
#> inland.l1  1.000
#> river.l1  -0.996
#> constant  -0.427

vecm_summary <- summary(vecm$rlm)

round(vecm_summary[["Response inland.d"]]$coefficients, 3)   # inland equation
#>            Estimate Std. Error t value Pr(>|t|)
#> ect1         -0.175      0.074  -2.375    0.018
#> inland.dl1    0.143      0.114   1.255    0.211
#> river.dl1     0.102      0.117   0.879    0.380
round(vecm_summary[["Response river.d"]]$coefficients, 3)    # river equation
#>            Estimate Std. Error t value Pr(>|t|)
#> ect1          0.108      0.072   1.495    0.136
#> inland.dl1   -0.129      0.112  -1.157    0.248
#> river.dl1     0.385      0.115   3.360    0.001
```

The first table is the cointegrating vector: 1 for inland, -0.996 for river and -0.427 for the constant. Read as an equation, the equilibrium error is inland minus 0.996 times river minus 0.427, so the long-run relation is inland = 0.996 river + 0.427. The simulation was built with inland = 1 river + 0.40, so the estimates are close.

The two tables after it are the equations from the previous step, inland first and river second. The widget below lays out the six coefficients in one table.

::widget styled-table {"cols": ["equation", "term", "estimate", "std_error", "t_value"], "rows": [["inland.d", "ect1", "-0.175", "0.074", "-2.375"], ["inland.d", "inland.dl1", "0.143", "0.114", "1.255"], ["inland.d", "river.dl1", "0.102", "0.117", "0.879"], ["river.d", "ect1", "0.108", "0.072", "1.495"], ["river.d", "inland.dl1", "-0.129", "0.112", "-1.157"], ["river.d", "river.dl1", "0.385", "0.115", "3.360"]], "formats": {"estimate": "3dp", "std_error": "3dp", "t_value": "3dp"}, "title": "VECM with rank 1", "note": "Each row is one coefficient from the two regressions that cajorls fits, one for each daily price change."}

Read the `ect1` rows first. `ect1` is the equilibrium error, so its coefficient is the adjustment coefficient: -0.175 for inland (t = -2.38) and 0.108 for river (t = 1.49). The simulation used -0.20 and 0.10.

The other rows are the coefficients on yesterday's changes, and only one stands out: `river.dl1` in the river equation, at 0.385 (t = 3.36).

=== step === widget
## How fast do the prices return to equilibrium?

An adjustment coefficient multiplies yesterday's equilibrium error. Suppose the error is 10 cents today. Inland's coefficient of -0.175 gives an inland price change of -1.75 cents the next day, and river's 0.108 gives a river price change of 1.08 cents.

Both moves shrink the error, because the error is inland minus 0.996 times river, and inland goes down while river goes up. So the two coefficients work together. Set the lagged changes and the new noise aside, and the error follows one simple rule, where \(\rho\) (rho) is the share of the error left after one day:

\[ e_t = \rho \, e_{t-1}, \qquad \rho = 1 + \alpha_1 - \beta \, \alpha_2 \]

The 1 keeps yesterday's error, \(\alpha_1\) is inland's change to it, and \(-\beta \, \alpha_2\) is river's change to it. The block below computes \(\rho\) from the fitted coefficients, and the half-life, which is the number of days the error takes to shrink to half its size. After \(h\) days the error is \(\rho^h\) of its starting size, so the half-life solves \(\rho^h = 0.5\), which gives \(h = \log(0.5) / \log(\rho)\).

```r
# Turn the adjustment coefficients into a share removed per day and a half-life
alpha_inland <- vecm$rlm$coefficients["ect1", "inland.d"]
alpha_river <- vecm$rlm$coefficients["ect1", "river.d"]
beta_river <- -vecm$beta["river.l1", 1]   # cajorls prints minus beta, so flip the sign

rho <- 1 + alpha_inland - beta_river * alpha_river
half_life <- log(0.5) / log(rho)

round(c(alpha_inland, -beta_river * alpha_river), 4)   # inland's part and river's part
#> [1] -0.1748 -0.1077
round(rho, 4)
#> [1] 0.7175
round(100 * (1 - rho), 1)   # percent of the error removed per day
#> [1] 28.2
round(half_life, 2)
#> [1] 2.09

round(10 * rho^(0:10), 1)   # cents left of a 10-cent error, days 0 to 10
#>  [1] 10.0  7.2  5.1  3.7  2.7  1.9  1.4  1.0  0.7  0.5  0.4
```

The two parts of the daily pull are -0.1748 from inland and -0.1077 from river, so \(\rho = 1 - 0.1748 - 0.1077 = 0.7175\). So 28.2% of the equilibrium error is removed each day. The half-life is 2.09 days. The simulation was built to remove 0.20 + 0.10 = 30% a day, so the estimate is close.

The chart shows a 10-cent error shrinking by 28.2% a day, with the cents left after each day.

::widget chart-plotter {"data": [{"x": 0, "y": 10}, {"x": 1, "y": 7.2}, {"x": 2, "y": 5.1}, {"x": 3, "y": 3.7}, {"x": 4, "y": 2.7}, {"x": 5, "y": 1.9}, {"x": 6, "y": 1.4}, {"x": 7, "y": 1}, {"x": 8, "y": 0.7}, {"x": 9, "y": 0.5}, {"x": 10, "y": 0.4}], "geoms": ["bar", "line"], "x": "days_after", "y": "cents_left"}

After 1 day 7.2 cents are left, after 2 days 5.1, and after 7 days 1.0. By day 10 only 0.4 cents remain.

Which price does most of the correcting? Inland's coefficient is larger, 0.175 against 0.108, and it is the one with a t statistic beyond 2, -2.38 against 1.49 for river. So the evidence for the pull back rests mostly on inland. After a positive error inland goes down, because its coefficient is negative, and river goes up.

[TIP]
When you report a VECM, give the adjustment coefficients with their t statistics, then turn them into the share of the error removed per day and the half-life. Those two numbers are the ones a reader can act on.

=== step === quiz
## Quick check: what do the two adjustment coefficients say?

The VECM gave an adjustment coefficient of -0.175 for inland and 0.108 for river. Which sentence reads them correctly?

::quiz {"correct": 2, "gate": true, "difficulty": "intermediate"}
- Inland wheat falls by 0.175 dollars every day, and river wheat rises by 0.108 dollars every day. ::no
- Each day inland changes by -0.175 times yesterday's equilibrium error and river by 0.108 times it, so together they remove about 28% of the error a day. ::ok Yes. An adjustment coefficient multiplies yesterday's equilibrium error, so it is a share of that error and not a fixed daily move. Together the two coefficients remove 28.2% of the error a day, which is what the previous step worked out.
- A positive adjustment coefficient means the river price trends upward over the 250 days. ::no
- A negative adjustment coefficient marks an unstable model. ::no Each of these misreads an adjustment coefficient. It multiplies yesterday's equilibrium error, so the size of the daily move depends on how far the prices are from equilibrium, and it is zero when they are on it. The sign says which way a price moves when the error is positive: inland goes down and river goes up, and that is what closes the error. The model is stable here because the error shrinks to 0.7175 of its size each day.

=== step === tryit
## Your turn: is inland wheat cointegrated with coffee?

The `prices` data frame still holds the coffee column. Fit the Johansen trace test on inland wheat and coffee, with the same arguments as for the two wheat prices, and print the table. Then read the rank from it.

```r
# Test whether inland wheat and coffee are cointegrated.
# Fit ca.jo() on the inland and coffee columns of prices with the same type, ecdet, K and spec as before,
# store it in jo_coffee, and print the table with
# cbind(teststat = round(jo_coffee@teststat, 2), jo_coffee@cval).
# Two lines. Press Check when you have them.
```
::check {"regex": "ca[.]jo[(][^)]*coffee", "gate": true, "difficulty": "intermediate", "ok": "Yes: the statistics are 10.81 for r = 0 and 1.31 for r at most 1, both below their 5% critical values of 19.96 and 9.24. So rank 0 stands, and inland wheat and coffee are not cointegrated.", "no": "Reuse the call from the wheat pair and swap the river column for coffee, so the columns are inland and coffee, then print the table with cbind()."}
::solution
```r
# Trace test on inland wheat and coffee, with the same arguments as before
jo_coffee <- ca.jo(prices[, c("inland", "coffee")], type = "trace", ecdet = "const", K = 2, spec = "transitory")

cbind(teststat = round(jo_coffee@teststat, 2), jo_coffee@cval)
#>          teststat 10pct  5pct  1pct
#> r <= 1 |     1.31  7.52  9.24 12.97
#> r = 0  |    10.81 17.85 19.96 24.60
```

Both statistics are below their 5% critical values: 10.81 against 19.96 for `r = 0`, and 1.31 against 9.24 for `r <= 1`. So we cannot reject rank 0. Inland wheat and coffee are not cointegrated, which fits how coffee was simulated, and a VAR in their daily changes is the right model for that pair.

=== step === concept
## References
::prose-only a list of sources, no visual

- [Spurious regressions in econometrics](https://doi.org/10.1016/0304-4076(74)90034-7) - Granger and Newbold (1974), Journal of Econometrics 2(2), 111-120.
- [Co-integration and error correction: representation, estimation, and testing](https://doi.org/10.2307/1913236) - Engle and Granger (1987), Econometrica 55(2), 251-276.
- [Estimation and hypothesis testing of cointegration vectors in Gaussian vector autoregressive models](https://doi.org/10.2307/2938278) - Johansen (1991), Econometrica 59(6), 1551-1580.
- [Analysis of Integrated and Cointegrated Time Series with R](https://doi.org/10.1007/978-0-387-75967-8) - Pfaff (2008), 2nd edition, Springer.
- [VAR, SVAR and SVEC Models: Implementation Within R Package vars](https://www.jstatsoft.org/v27/i04) - Pfaff (2008), Journal of Statistical Software 27(4).

=== step === complete
## Quick recap

You started with two wheat prices that each wander, and ended with the speed at which they return to equilibrium. To summarize:

- Both wheat prices are non-stationary and I(1): the ADF p-values on the levels are 0.275 and 0.317, and 0.01 on the daily changes.
- A regression on the levels of unrelated non-stationary series is spurious: 84.4% of 1,000 pairs of independent random walks gave an absolute t above 2.
- The wheat prices are cointegrated, because their spread is stationary. It stays between 0.19 and 0.60 while each price ranges over more than 2 dollars.
- A VECM adds yesterday's equilibrium error to a VAR in the daily changes. The Johansen trace test gave 45.76 against a critical value of 19.96 for rank 0, and 1.46 against 9.24 for rank 1 or less, so the rank is 1.
- The adjustment coefficients are -0.175 for inland and 0.108 for river. Together they remove 28.2% of the equilibrium error a day, a half-life of 2.09 days.
- Inland wheat and coffee gave rank 0, so they are not cointegrated.

So whenever someone shows you a strong correlation between two trending series, you now know what to ask: is each series I(1), and is there a combination of them that is stationary?

The next part turns the fitted VECM into forecasts.

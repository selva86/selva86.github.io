---
title: "State Space Models and the Kalman Filter Lesson 6: Dynamic linear models: a coefficient that drifts over time"
catalog_blurb: "See a regression coefficient recovered as it drifts instead of staying fixed."
description: "Extend the Kalman filter with a second state to recover a coefficient that drifts over time, in the general DLM notation, and see what the dlm package adds."
keywords: "dynamic linear models, DLM, time-varying coefficient, Kalman filter, 2-state Kalman filter, dlm package, dlmModReg, dlmFilter, dlmMLE, regression with time-varying parameters"
post_type: "LESSON"
curriculum_id: "5.80.6"
webr: true
mathjax: true
lesson_access: "pro"
course_id: "ts-statespace"
course_title: "State Space Models and the Kalman Filter"
course_lesson: "6"
course_total: "7"
course_landing: "State-Space-Models-and-the-Kalman-Filter-Course.html"
course_next: "Time-Varying-Parameters.html"
course_prev: "Bayesian-Structural-Time-Series-bsts.html"
---

=== step === cover
## Dynamic linear models: a coefficient that drifts over time

Today let's understand dynamic linear models clearly, using one small retailer's ad spend and orders as the running example throughout.

Say you run a small online retailer. Every week you spend money on ads, and every week you count how many orders come in. Here are those order counts for the first 24 weeks.

```r
# Simulate 24 weeks of a small retailer's ad spend and orders
week <- 1:24

set.seed(30)
spend <- round(runif(24, 5, 25), 1)

alpha_true <- 10
set.seed(31)
beta_true <- numeric(24)
beta_true[1] <- 0.80
for (t in 2:24) {
  beta_true[t] <- beta_true[t - 1] + rnorm(1, mean = 0.035, sd = 0.015)
}

set.seed(32)
v <- rnorm(24, mean = 0, sd = 2.5)

orders <- round(alpha_true + beta_true * spend + v)
orders
#>  [1] 16 25 18 24 22 19 35 19 40 20 19 25 30 39 23 40 27 39 35 32 21 32 21 29
```

Here is that same count, plotted week by week.

::widget chart-plotter {"data":[{"x":1,"y":16},{"x":2,"y":25},{"x":3,"y":18},{"x":4,"y":24},{"x":5,"y":22},{"x":6,"y":19},{"x":7,"y":35},{"x":8,"y":19},{"x":9,"y":40},{"x":10,"y":20},{"x":11,"y":19},{"x":12,"y":25},{"x":13,"y":30},{"x":14,"y":39},{"x":15,"y":23},{"x":16,"y":40},{"x":17,"y":27},{"x":18,"y":39},{"x":19,"y":35},{"x":20,"y":32},{"x":21,"y":21},{"x":22,"y":32},{"x":23,"y":21},{"x":24,"y":29}],"geoms":["line"],"x":"week","y":"orders"}

The count climbs across the 24 weeks, from 16 in the first week up to 40, but not at a steady pace. Some weeks jump a lot, others barely move. That raises the real question this lesson answers: does one number explain how ad spend turns into orders, or does something about that relationship itself change as the weeks go by?

=== step === concept
## The general DLM notation

Every dynamic linear model, DLM for short, is built from the same two equations: one for what you observe, and one for how a hidden state moves underneath it.

\[ y_t = F_t' \theta_t + v_t, \qquad v_t \sim N(0, V) \]

This is the observation equation. \(y_t\) is what you actually measure at time t, a number sitting right there in your data. \(\theta_t\) is the hidden state: the quantity, or quantities, the model is trying to track, which you never observe directly.

\(F_t\) is a vector that turns the hidden state into a prediction for \(y_t\); the prime after it means transpose, flipping a column of numbers into a row so the two can be multiplied together. \(v_t\) is that period's own observation noise, with variance V.

\[ \theta_t = G \theta_{t-1} + w_t, \qquad w_t \sim N(0, W) \]

This is the state equation. It says the hidden state this period, \(\theta_t\), equals the previous period's hidden state, \(\theta_{t-1}\), carried forward by the matrix G, plus a small nudge, \(w_t\), with variance W. G decides how the state moves from one period to the next.

What makes a model "dynamic" is that \(F_t\), and sometimes G, is allowed to change with t, or carry that period's own data, instead of staying fixed. The simplest DLM does not do this at all: it has a single hidden level, \(\theta_t\) is one number, and \(F_t = 1\) and \(G = 1\) stay fixed for every t. This lesson's model keeps two numbers in \(\theta_t\) at once, and lets \(F_t\) carry that period's own spend. The table below lines the two cases up side by side.

| Symbol | What it is | Single hidden level | This lesson's model |
|---|---|---|---|
| theta_t | the hidden state the filter tracks | one number, the level | two numbers, an intercept and a slope |
| F_t | maps the state to a prediction for y_t | fixed at 1 every period | carries that period's own spend |
| G | carries the state from one period to the next | fixed at 1 | the identity matrix, each entry carried forward unchanged before noise |
| V | the observation noise's variance | one number | one number |
| W | the state noise's variance | one number | one number for every entry of theta_t |

=== step === concept
## Regression with a time-varying coefficient as a DLM

Because this week's orders and spend are simulated rather than pulled from a live store, we get to know the true numbers behind them, something you would never know with real data.

The organic weekly orders, the orders that would happen even with zero ad spend, are fixed at 10 every week. But the orders-per-\$100-spent effect is not fixed. It starts at 0.80 and rises to 1.56 by week 24, as the brand becomes more recognisable and each ad dollar pulls a little harder. Spend itself is recorded in units of \$100, so a value of 7.0 means \$700 spent that week and 24.3 means \$2,430.

Here is the full 24-week table, together with the true effect's own known start and end.

```r
# Print the 24-week spend/orders table, and the true effect's known start and end
df <- data.frame(week = week, spend = spend, orders = orders)
print(df)

round(c(week1 = beta_true[1], week24 = beta_true[24]), 2)
#>  week1 week24 
#>   0.80   1.56 
```

Written as an equation, each week's order count is

\[ \text{orders}_t = \alpha + \beta_t \cdot \text{spend}_t + v_t \]

with the intercept \(\alpha\) fixed and the slope \(\beta_t\) free to move week by week. As a DLM, \(\theta_t = (\alpha, \beta_t)\) and \(F_t = (1, \text{spend}_t)\): the same observation equation, with \(F_t\) now carrying that week's own spend figure instead of staying fixed at 1.

=== step === concept
## What a single fixed line misses

An ordinary regression cannot see any of that drift. It only ever returns one slope, fit across all 24 weeks at once. Fit that single line and plot it against the data.

```r
# Fit one regression line across all 24 weeks and plot it against the data
library(ggplot2)

ols_fit <- lm(orders ~ spend, data = df)
round(coef(ols_fit), 2)
#> (Intercept)       spend 
#>       10.45        1.22 

ggplot(df, aes(x = spend, y = orders)) +
  geom_point(size = 2) +
  geom_smooth(method = "lm", se = FALSE, color = "steelblue") +
  labs(x = "spend ($100s)", y = "orders",
       title = "One straight line for all 24 weeks")
```

The fitted slope, 1.22, is a compromise. It sits between the early weeks' weak effect, close to 0.80, and the later weeks' strong effect, close to 1.56, because a single straight line has no way to be both at once. Every point on that line is trying to explain a relationship whose steepness was itself changing underneath it.

=== step === concept
## Extending the Kalman filter by one state

A Kalman filter that tracks a single hidden level runs a predict step, then an update step, once for every time point. Extending it to two states, an intercept and a drifting slope, uses exactly the same two steps, just written with vectors and matrices instead of plain numbers.

\[ a = G\,m_{t-1}, \qquad R = G\,C_{t-1}\,G' + W \]
\[ K = \dfrac{R F_t'}{F_t R F_t' + V}, \qquad m_t = a + K(y_t - F_t a), \qquad C_t = R - K F_t R \]

\(m_t\) is the filtered state, the vector \((\alpha_t, \beta_t)\) estimated after seeing week t's data, and \(C_t\) is that estimate's own 2x2 covariance matrix, how uncertain each part of the state still is. The predict step carries last week's estimate forward through G and inflates its uncertainty by W.

The update step compares the week's actual reading to what was predicted, and blends that gap into the state through the gain K. R writes matrix multiplication as `%*%`, the operator used throughout the code below.

For this model, G is the 2x2 identity matrix: both \(\alpha\) and \(\beta_t\) are carried forward unchanged, before any noise is added. W is \(\text{diag}(0, w_\beta)\): the intercept's own evolution variance is held at exactly 0, since it never drifts, while \(\beta_t\)'s evolution variance, \(w_\beta\), controls how much weekly drift the slope is allowed. \(F_t = (1, \text{spend}_t)\), carrying that week's own spend.

The filter needs a starting guess. Use \(m_0 = (10, 1)\), an intercept of 10 and a slope guess of 1 order per \$100 spent, with \(C_0 = \text{diag}(9, 0.09)\) standing in for how unsure that starting guess is. V is 6.25, matching the standard deviation of 2.5 orders used to simulate the noise above, and for now, set \(w_\beta = 0.01\). Run that recursion across all 24 weeks.

```r
# Run the 2-state Kalman filter across all 24 weeks
V <- 6.25
w_beta <- 0.01

G <- diag(2)
W <- diag(c(0, w_beta))

m <- c(10, 1)
C <- diag(c(9, 0.09))

alpha_est <- numeric(24)
beta_est <- numeric(24)

for (t in 1:24) {
  Ft <- c(1, spend[t])

  a <- G %*% m
  R <- G %*% C %*% t(G) + W

  Qt <- as.numeric(Ft %*% R %*% Ft) + V
  K <- (R %*% Ft) / Qt
  e <- orders[t] - as.numeric(Ft %*% a)

  m <- a + K * e
  C <- R - K %*% t(Ft) %*% R

  alpha_est[t] <- m[1]
  beta_est[t] <- m[2]
}

round(head(beta_est), 2)
#> [1] 0.97 1.02 0.90 0.99 1.03 1.04
```

Take week 1 by hand. \(F_1 = (1, 7.0)\), since week 1's spend is 7.0. The predict step carries the starting guess forward unchanged, so a = (10, 1), and because W only adds noise to the slope's own slot, the intercept's predicted variance in R stays at exactly 9 while the slope's grows from 0.09 to 0.10.

The predicted order count is \(1 \times 10 + 7.0 \times 1 = 17\), against an actual reading of 16, a residual of -1. The gain then blends that residual into both the intercept and the slope. That lands the first filtered state at alpha_est[1] = 9.55 and beta_est[1] = 0.97, matching the first number the code above printed.

Every one of the following 23 weeks repeats exactly this: predict, then update, carrying the previous week's filtered state forward and blending in that week's own residual.

=== step === concept
## Reading the recovered coefficient path

Plot the filtered slope, week by week, next to the flat OLS line.

::widget chart-plotter {"data":[{"x":1,"y":0.97},{"x":2,"y":1.02},{"x":3,"y":0.90},{"x":4,"y":0.99},{"x":5,"y":1.03},{"x":6,"y":1.04},{"x":7,"y":1.10},{"x":8,"y":1.09},{"x":9,"y":1.23},{"x":10,"y":1.24},{"x":11,"y":1.25},{"x":12,"y":1.22},{"x":13,"y":1.26},{"x":14,"y":1.29},{"x":15,"y":1.30},{"x":16,"y":1.30},{"x":17,"y":1.36},{"x":18,"y":1.34},{"x":19,"y":1.39},{"x":20,"y":1.45},{"x":21,"y":1.44},{"x":22,"y":1.36},{"x":23,"y":1.38},{"x":24,"y":1.45}],"geoms":["line"],"x":"week","y":"filtered slope (orders per 100 dollars spend)"}

By week 1 the filtered slope reads 0.97 orders per \$100, close to the true 0.80. By week 24 it has climbed to 1.45, close to the true 1.56. Weigh the whole path against the true one, week by week, and compare it to the flat OLS slope doing the same job.

```r
# Compare the filtered path and the flat OLS slope against the true effect
rmse_filtered <- sqrt(mean((beta_est - beta_true)^2))
rmse_ols <- sqrt(mean((coef(ols_fit)[2] - beta_true)^2))

round(c(filtered = rmse_filtered, ols = rmse_ols), 2)
#> filtered      ols 
#>     0.08     0.22 
```

RMSE here is the root mean squared error: how far the estimated path sits from the true path, on average, across all 24 weeks. The filtered path's RMSE is 0.08. The flat OLS slope's RMSE, measured against that same true path, is 0.22, nearly three times as large, because 1.22 can only ever be close to the true effect for the handful of weeks where the true effect happens to pass through 1.22. Every other week, the flat line is further off than the filter ever gets.

=== step === quiz
## Quick check: reading a drifting coefficient

Look at the filtered line in the chart above. It reads about 0.97 in week 1 and climbs to about 1.45 by week 24. Why does the coefficient move like that?

::quiz {"correct": 2, "gate": true, "difficulty": "intermediate"}
- It is just noise scattered around a fixed relationship, close to the OLS slope of 1.22. ::no
- The retailer's orders-per-\$100-spend effect genuinely grew over the 24 weeks, and the 2-state filter tracked that growth as it happened. ::ok Right. The filtered path's RMSE against the true effect is 0.08, well under the flat OLS slope's 0.22, because the filter is free to move with the true effect instead of averaging over all 24 weeks at once.
- The flat OLS line of 1.22 is the real relationship, and the filtered path is drifting away from it by mistake. ::no A flat line and pure noise both fail the same test: measured against the true effect, the filtered path lands at RMSE 0.08 and the flat OLS slope lands at RMSE 0.22. The filter is not wandering off and it is not chasing noise; it is tracking a real change in the underlying effect that a single fixed slope has no way to represent.

=== step === concept
## How much should you let the coefficient move?

\(w_\beta\), the slope's own state variance, is the one real tuning choice this filter makes. It controls how much the filtered slope is allowed to move from one week to the next.

```r
# Re-run the filter with a much smaller and a much larger state variance
run_filter <- function(w_beta) {
  W <- diag(c(0, w_beta))
  m <- c(10, 1)
  C <- diag(c(9, 0.09))
  beta_path <- numeric(24)
  for (t in 1:24) {
    Ft <- c(1, spend[t])
    a <- G %*% m
    R <- G %*% C %*% t(G) + W
    Qt <- as.numeric(Ft %*% R %*% Ft) + V
    K <- (R %*% Ft) / Qt
    e <- orders[t] - as.numeric(Ft %*% a)
    m <- a + K * e
    C <- R - K %*% t(Ft) %*% R
    beta_path[t] <- m[2]
  }
  beta_path
}

beta_stiff <- run_filter(0.0001)
beta_wiggly <- run_filter(0.3)

rmse <- function(x) sqrt(mean((x - beta_true)^2))
change <- function(x) mean(abs(diff(x)))

data.frame(
  w_beta = c("0.0001", "0.01", "0.3"),
  rmse = round(c(rmse(beta_stiff), rmse(beta_est), rmse(beta_wiggly)), 2),
  avg_week_change = round(c(change(beta_stiff), change(beta_est), change(beta_wiggly)), 2)
)
#>   w_beta rmse avg_week_change
#> 1 0.0001 0.14            0.03
#> 2   0.01 0.08            0.05
#> 3    0.3 0.13            0.15
```

At \(w_\beta = 0.0001\), the filter barely lets the slope move: an average week-to-week change of only 0.03, and an RMSE of 0.14, worse than the 0.08 achieved above, because the slope stays too stiff to follow the true climb from 0.80 to 1.56. At \(w_\beta = 0.3\), the filter lets the slope swing five times as much week to week, an average change of 0.15, but its RMSE is 0.13, also worse than 0.08, because it is now chasing the noise in each week's reading rather than the underlying trend. \(w_\beta = 0.01\) sits between the two, with the lowest RMSE of the three: not so stiff that it misses the real drift, not so loose that it reacts to noise.

The same trade shows up in an ordinary smoothing curve.

::widget spline-smoother {}

This widget fits its own curve, not the retailer's spend and orders, but its smoothness dial controls the same trade w_beta just made for beta_t. Drag it toward stiff and the fitted line barely bends to follow the true curve underneath it. Drag it toward wiggly and the line chases every bump of noise instead. Somewhere in between sits the well-chosen setting, exactly the role \(w_\beta = 0.01\) played for the slope above.

=== step === concept
## What the dlm package provides

Every piece of that recursion was worked by hand so it would be visible. The dlm package wraps the same arithmetic into a small set of functions.

- `dlmModReg()` builds a regression DLM directly from a vector of regressors, the same \(F_t = (1, \text{spend}_t)\) built by hand.
- `dlmModPoly(1)` builds a plain local-level model on its own, one hidden number rather than two.
- Two dlm model objects can be combined with `+`, stacking their states into one bigger model, useful when a level and a separately drifting slope need to be built up piece by piece instead of in a single `dlmModReg()` call.
- `dlmFilter()` runs the exact predict-update recursion worked through by hand.
- `dlmSmooth()` adds a backward pass on top of it, the same kind of backward recursion that turns a filtered estimate into a smoothed one by using the whole series instead of only what came before each week.

```r-static
# Build the same 2-state model with the dlm package's own functions, and filter it
library(dlm)

reg_mod <- dlmModReg(spend, dV = 6.25, dW = c(0, 0.01),
                      m0 = c(10, 1), C0 = diag(c(9, 0.09)))
reg_filt <- dlmFilter(orders, reg_mod)

round(tail(reg_filt$m, 1), 3)
#>         [,1]  [,2]
#> [25,] 10.805 1.451
```

That final filtered state, an intercept of 10.805 and a slope of 1.451, matches the hand-rolled filter's own week-24 result exactly. The package is not doing anything different from the recursion worked through by hand; it is only running it inside a function call.

`dlmMLE()` picks V and W by maximum likelihood instead of an eyeballed \(w_\beta\).

```r-static
# Let dlmMLE choose V and W by maximum likelihood instead of eyeballing them
build_fun <- function(par) {
  dlmModReg(spend, dV = exp(par[1]), dW = c(0, exp(par[2])),
            m0 = c(10, 1), C0 = diag(c(9, 0.09)))
}
mle_fit <- dlmMLE(orders, parm = c(log(6.25), log(0.01)), build = build_fun)
round(exp(mle_fit$par), 4)
#> [1] 2.9257 0.0041
```

Left to find its own answer, maximum likelihood picks a smaller observation variance, 2.93 instead of the 6.25 used throughout, and a smaller state variance for the slope, 0.0041 instead of the 0.01 eyeballed by hand. With only 24 weeks of data the two trade off against each other, but the package gives a principled way to choose both instead of guessing.

=== step === quiz
## Quick check: the DLM notation and the state variance

Which of these correctly describes the model built in this lesson?

::quiz {"correct": 2, "gate": true, "difficulty": "advanced"}
- theta_t has one entry, and dlmMLE is the function that runs the predict-update recursion once V and W are already fixed. ::no
- theta_t has two entries, an intercept and a slope; G carries both forward unchanged before noise; and dlmMLE finds V and W by maximum likelihood while dlmFilter runs the recursion once they are fixed. ::ok Exactly. dlmFilter only runs the predict-update recursion after V and W are already set; dlmMLE is the function that searches for the best V and W. And a larger state variance for the slope always makes the filtered path move more from week to week, never less.
- theta_t has two entries, but a larger state variance for the slope makes the filtered path smoother, not jumpier. ::no theta_t carries two numbers in this lesson, an intercept and a slope, with G as the identity matrix carrying both forward unchanged before noise is added. dlmFilter only runs the predict-update recursion once V and W are already fixed; dlmMLE is the function that searches for the best V and W by maximum likelihood. And raising the slope's own state variance always makes the filtered path move more from week to week, the same jump from an average change of 0.03 to 0.15, never smoother.

=== step === tryit
## Your turn: predict the next week from the filtered state

The arrays alpha_est and beta_est still hold the filtered state from every week. Suppose week 25 arrives and the store plans to spend \$2,000, recorded as 20.0 in the same \$100 units used throughout. Use week 24's filtered state and \(F_{25} = (1, \text{spend}_{25})\) to predict week 25's orders.

```r
# Predict week 25's orders using the week-24 filtered state
alpha_24 <- alpha_est[24]
beta_24 <- beta_est[24]
spend_25 <- 20.0

F_25 <- c(1, spend_25)
m_24 <- c(alpha_24, beta_24)

# Complete this line: the one-step prediction f = F_25 %*% m_24
```
::check {"regex": "F_25\\s*%\\*%\\s*m_24", "gate": true, "difficulty": "intermediate", "ok": "Right: about 39.83 orders. That number is nothing more than F_25 read off against the week-24 filtered state, an intercept of 10.805 plus 20.0 times a slope of 1.451.", "no": "Multiply the state by the design vector the same way the filter update did it every week: f is F_25 %*% m_24, matrix multiplication between a 1x2 vector and a 2x1 vector."}
::solution
```r
# Predict week 25's orders using the week-24 filtered state
alpha_24 <- alpha_est[24]
beta_24 <- beta_est[24]
spend_25 <- 20.0

F_25 <- c(1, spend_25)
m_24 <- c(alpha_24, beta_24)

f <- F_25 %*% m_24
round(f, 2)
#>       [,1]
#> [1,] 39.83
```

=== step === concept
## References

- Petris, G., Petrone, S., and Campagnoli, P. (2009). *Dynamic Linear Models with R*. Springer. The textbook whose notation and structure this lesson follows throughout.
- West, M., and Harrison, J. (1997). *Bayesian Forecasting and Dynamic Models* (2nd ed.). Springer. An early, thorough reference for the general DLM framework.
- Durbin, J., and Koopman, S. J. (2012). *Time Series Analysis by State Space Methods* (2nd ed.). Oxford University Press. Covers the predict-update recursion extended to more than one state.
- [Petris, G. (2010). "An R Package for Dynamic Linear Models."](https://doi.org/10.18637/jss.v036.i12) *Journal of Statistical Software*, 36(12). The paper behind the dlm package used in this lesson.
- [The dlm package reference manual](https://cran.r-project.org/package=dlm), CRAN. Documents `dlmModReg`, `dlmFilter`, `dlmSmooth` and `dlmMLE`, the functions used in this lesson.
- [The dlm package vignette, "Dynamic Linear Models with R"](https://cran.r-project.org/web/packages/dlm/vignettes/dlm.pdf), CRAN. A worked walkthrough of the same package functions from the package's own maintainer.

=== step === complete
## Dynamic linear models, from notation to a package

You can now describe a DLM end to end, using this lesson's own retailer as the example throughout.

- You can write the observation and state equations, and name every symbol in them: \(F_t\), \(\theta_t\), G, V and W.
- You can extend a single-state Kalman filter to two states by writing G as the identity matrix and W as a diagonal matrix that only lets the states you want to drift actually drift.
- You can read a filtered coefficient off a chart at any chosen week, and explain in real numbers why it beats a single fixed regression slope: RMSE 0.08 against 0.22.
- You can explain what the state variance \(w_\beta\) controls, and what happens when it is set too small or too large.
- You can name the dlm package's own building blocks, `dlmModReg()`, `dlmModPoly()`, `dlmFilter()`, `dlmSmooth()` and `dlmMLE()`, and what each one does.

The natural next step is letting more than one coefficient drift at once, each with its own state variance, built from exactly the same recursion, just extended by more states than the two used here.

---
title: "Multivariate Time Series Lesson 4: Tracing a shock through a VAR with impulse responses"
slug: "Impulse-Response-Functions"
description: "Trace one shock through a fitted VAR with impulse responses: compute them by hand, add bootstrap bands, and see why the variable ordering changes the answer."
keywords: "impulse response function, impulse response in R, vars package, irf, VAR model, bootstrap confidence bands, Cholesky ordering, orthogonalised impulse response, multivariate time series"
mathjax: true
webr: true
date: "2026-09-26"
post_type: "LESSON"
course_id: "ts-multivariate"
course_title: "Multivariate Time Series"
course_lesson: "4"
course_total: "6"
course_landing: "Multivariate-Time-Series-Course.html"
course_prev: "Granger-Causality"
course_next: "Cointegration-and-the-VECM"
curriculum_id: "5.110.4"
lesson_access: "pro"
catalog_blurb: "Trace one shock through a VAR, and see why variable ordering changes the answer."
---

=== step === cover
## Tracing a shock through a VAR with impulse responses

Today let's learn how to read a fitted VAR through impulse responses: we push one variable once, and watch what the whole system does over the next 12 quarters.

Let's take Canada's labour market. We have 84 quarters, from 1980 Q1 to 2000 Q4, published by the OECD, and three series: employment, the real wage and the unemployment rate.

A VAR, short for vector autoregression, fits one regression per series on the recent past of all the series. Fitted to these three, it gives a table of coefficients that is hard to read. Each coefficient says how one series responds to one lagged series, and the answer we want comes from all of them working together.

So we ask a concrete question instead. Suppose employment growth lands 1 percentage point above what the past of the three series predicts, in one quarter. What happens to wage growth and to the unemployment rate over the following 12 quarters?

The answer is called an impulse response, and there are only three actions in it.

::widget process-flow {"steps":[{"title":"Shock one variable once","sub":"employment growth 1 point above what the past predicts"},{"title":"Run the fitted VAR forward","sub":"push the shock through the coefficients, 12 quarters"},{"title":"Record each variable per quarter","sub":"the gap from the no-shock path, per quarter"}]}

The three boxes above are the whole method. Everything from here on carries them out on the Canada data.

=== step === concept
## The three-series VAR for Canada's labour market

Let's start by building the data and the model, because every response we compute will come from them.

The series are in the `Canada` data of the `vars` package. `e` is employment and `rw` is the real wage. Each is stored as 100 times its natural log, so a change of 1 in either is about a 1 percent change. `U` is the unemployment rate in percent, so a change of 1 is 1 percentage point.

We model quarterly changes rather than levels, using `diff()`, and we name the three changed series `d_emp`, `d_wage` and `d_unemp`. The roots printed at the end of the code show why.

A VAR(2) is three regressions, one per series. Each one regresses a series' change on the last 2 quarters of all three series, plus a constant. That is 7 terms per equation and 3 equations, so 21 coefficients.

Press Run.

```r
# Build the quarterly changes, fit a VAR(2) and check its stability
library(vars)
data(Canada)

levels_df <- Canada[, c("e", "rw", "U")]   # employment, real wage, unemployment rate
d <- diff(levels_df)                       # quarterly changes
colnames(d) <- c("d_emp", "d_wage", "d_unemp")

dim(d)
#> [1] 83  3
round(apply(d, 2, sd), 3)
#>   d_emp  d_wage d_unemp
#>   0.584   1.044   0.435

fit <- VAR(d, p = 2, type = "const")
sum(sapply(fit$varresult, function(eq) length(coef(eq))))
#> [1] 21

round(roots(fit), 3)
#> [1] 0.662 0.662 0.476 0.476 0.217 0.217

fit_levels <- VAR(levels_df, p = 2, type = "const")
round(roots(fit_levels), 3)
#> [1] 0.996 0.854 0.781 0.781 0.049 0.010
round(log(0.5) / log(max(roots(fit_levels))))
#> [1] 161
```

There are 83 quarterly changes, and the VAR uses 81 of them because the first 2 quarters only supply lags. The standard deviations of the 3 changes are 0.584, 1.044 and 0.435: in percent for `d_emp` and `d_wage`, and in percentage points for `d_unemp`.

`roots()` returns six numbers, one for each pattern of movement in the system. Each is the factor by which that pattern shrinks every quarter (formally, the moduli of the eigenvalues of the VAR's companion matrix). When all of them are below 1, the VAR is stable: a disturbance fades away.

For the changes, the largest modulus is 0.662, so a disturbance loses about a third of its size each quarter. For the levels, it is 0.996. A disturbance would keep 99.6% of its size each quarter, and the last line shows it would take about 161 quarters to halve. That is why the responses in this lesson come from the changes.

The lag order 2 is a choice we state here, not one a criterion picked for us.

=== step === concept
## An impulse response worked out by hand

An impulse response is the gap between two paths of the system: one path where a shock hits in quarter 0, and one where nothing does. To compute it, we need to know what a shock is and how the VAR carries it forward.

The fitted VAR(2) says that each quarter's vector of changes \(y_t\) follows this equation.

\[ y_t = c + A_1 y_{t-1} + A_2 y_{t-2} + u_t \]

Here \(c\) is the constant, \(A_1\) and \(A_2\) are the 3 by 3 coefficient matrices, and \(u_t\) is the residual: the part of each change that the last 2 quarters do not predict. A shock is a quarter in which a residual is not zero.

Now take two paths that start from the same history. In the first, every residual is 0. In the second, the residuals are (1, 0, 0) in quarter 0 only: `d_emp` lands 1 point above what the past predicts, and nothing else is off. The two paths share the constant and the history, so the gap between them follows the same equation without the constant.

\[ \Phi_h = A_1 \Phi_{h-1} + A_2 \Phi_{h-2}, \qquad \Phi_0 = (1, 0, 0), \quad \Phi_{-1} = 0 \]

\(\Phi_h\) is the impulse response at quarter \(h\): the gap in the three changes, \(h\) quarters after the shock. In words, each quarter's gap is the previous two gaps run through the coefficient matrices.

The loop below builds \(\Phi_0\) to \(\Phi_{12}\). `Acoef(fit)` returns \(A_1\) and \(A_2\).

```r
# Build the response to a 1 point d_emp shock by iterating the coefficient matrices
A_mats <- Acoef(fit)
A1 <- A_mats[[1]]
A2 <- A_mats[[2]]

phi_hand <- matrix(0, nrow = 13, ncol = 3,
                   dimnames = list(paste0("q", 0:12), colnames(d)))
phi_hand["q0", ] <- c(1, 0, 0)                 # the shock: d_emp 1 point up, nothing else
phi_hand["q1", ] <- A1 %*% phi_hand["q0", ]    # quarter 1 has no term from quarter -1
for (h in 2:12) {
  phi_hand[h + 1, ] <- A1 %*% phi_hand[h, ] + A2 %*% phi_hand[h - 1, ]
}
round(phi_hand, 3)
#>      d_emp d_wage d_unemp
#> q0   1.000  0.000   0.000
#> q1   0.942 -0.243  -0.603
#> q2   0.397  0.111  -0.400
#> q3   0.055  0.267  -0.045
#> q4  -0.065  0.276   0.086
#> q5  -0.098  0.216   0.084
#> q6  -0.100  0.140   0.075
#> q7  -0.080  0.079   0.063
#> q8  -0.053  0.036   0.042
#> q9  -0.029  0.009   0.022
#> q10 -0.013 -0.005   0.009
#> q11 -0.004 -0.010   0.002
#> q12  0.002 -0.010  -0.002
```

Read the `q1` row first. One quarter after the shock, `d_emp` is still 0.942 above the no-shock path, `d_wage` is 0.243 below it and `d_unemp` is 0.603 below it. In `q2`, `d_unemp` is 0.400 below. By `q12`, every entry is within 0.010 of 0.

The vars package computes the same table with `Phi()`. Let's confirm that ours matches.

```r
# Compare the hand-built response with the package's Phi()
phi_arr <- Phi(fit, nstep = 12)
phi_pkg <- t(phi_arr[, 1, ])              # column 1 = the shock to d_emp
max(abs(phi_hand - phi_pkg)) < 1e-10
#> [1] TRUE

round(sqrt(summary(fit)$covres["d_emp", "d_emp"]), 3)   # residual sd of the d_emp equation
#> [1] 0.387
```

`TRUE` means the largest gap between the two tables is below 1e-10, which is rounding error. So the response is nothing more than the fitted VAR run forward from one shock.

The last line gives the size of that shock. The `d_emp` residual has a standard deviation of 0.387, so 1 point is about 2.6 of them. That is a large shock. The VAR is linear, so a shock of one standard deviation gives 0.387 times each number in the table.

[NOTE]
This response assumes that in quarter 0 the `d_wage` and `d_unemp` residuals are exactly 0 while the `d_emp` residual is 1.

=== step === widget
## Reading a response: the fall, the overshoot and the settling

The `d_unemp` column of that table holds quarterly changes in the unemployment rate. To see what happens to the rate itself, we add the changes up with `cumsum()`.

```r
# Add up the d_unemp responses to get the rate's gap from the no-shock path
gap <- cumsum(phi_hand[, "d_unemp"])
data.frame(quarter = 0:12, gap = round(gap, 3))
#>     quarter    gap
#> q0        0  0.000
#> q1        1 -0.603
#> q2        2 -1.003
#> q3        3 -1.048
#> q4        4 -0.962
#> q5        5 -0.877
#> q6        6 -0.802
#> q7        7 -0.739
#> q8        8 -0.698
#> q9        9 -0.676
#> q10      10 -0.667
#> q11      11 -0.664
#> q12      12 -0.666
```

The widget below draws these 13 values. Switch between the line, bar and point views.

::widget chart-plotter {"data":[{"x":0,"y":0},{"x":1,"y":-0.603},{"x":2,"y":-1.003},{"x":3,"y":-1.048},{"x":4,"y":-0.962},{"x":5,"y":-0.877},{"x":6,"y":-0.802},{"x":7,"y":-0.739},{"x":8,"y":-0.698},{"x":9,"y":-0.676},{"x":10,"y":-0.667},{"x":11,"y":-0.664},{"x":12,"y":-0.666}],"geoms":["line","bar","point"],"x":"quarter","y":"unemployment_gap"}

Let's read the path in three parts.

1. The fall: the rate is 0.603 points below the no-shock path after 1 quarter and 1.003 below after 2, and it reaches its bottom at -1.048 in quarter 3.
2. The overshoot: an overshoot means the response goes further than the level it finally holds. Here the rate climbs back after quarter 3 and holds near -0.666, so the bottom sits 0.38 below its final level.
3. The settling: from quarter 10 on, the quarterly changes are smaller than 0.01 in size, so the gap stops moving.

Why does it settle? Every root of this VAR has modulus below 1, and the largest is 0.662. So the changes fade quarter after quarter, and a running total of fading changes levels off.

=== step === widget
## How bootstrap bands are built and what they cover

The response above comes from one fit on 81 rows. Another 81 quarters would give slightly different coefficients, and so a different response. A bootstrap band shows how much the response moves because of that.

Here is how `irf()` builds it.

1. It takes the fitted model's residuals, centred to have mean 0, and resamples their rows with replacement.
2. It rebuilds a series of the same length from the fitted coefficients plus the resampled residual rows.
3. It refits the VAR on that series and computes the response again.
4. It repeats this 200 times. At each quarter, the 2.5th and 97.5th percentiles of the 200 responses are the edges of a 95% band.

We set `ortho = FALSE`, so `irf()` returns the response we built by hand: a shock to `d_emp` alone. We run it twice, once on the changes and once with `cumulative = TRUE`, which gives the running total. `set.seed(2026)` makes the bands reproducible.

```r
# Bootstrap the response of d_unemp to a d_emp shock (200 runs) and list where the band excludes 0
set.seed(2026)
boot_change <- irf(fit, impulse = "d_emp", response = "d_unemp",
                   n.ahead = 12, ortho = FALSE, boot = TRUE, runs = 200)
set.seed(2026)
boot_cum <- irf(fit, impulse = "d_emp", response = "d_unemp",
                n.ahead = 12, ortho = FALSE, boot = TRUE, runs = 200,
                cumulative = TRUE)

band_table <- function(obj) {
  lower <- obj$Lower$d_emp[, "d_unemp"]
  upper <- obj$Upper$d_emp[, "d_unemp"]
  data.frame(
    quarter    = 0:12,
    estimate   = round(obj$irf$d_emp[, "d_unemp"], 3),
    lower      = round(lower, 3),
    upper      = round(upper, 3),
    excludes_0 = lower > 0 | upper < 0
  )
}
print(band_table(boot_change), row.names = FALSE)
#>  quarter estimate  lower  upper excludes_0
#>        0    0.000  0.000  0.000      FALSE
#>        1   -0.603 -0.835 -0.387       TRUE
#>        2   -0.400 -0.659 -0.110       TRUE
#>        3   -0.045 -0.288  0.232      FALSE
#>        4    0.086 -0.127  0.294      FALSE
#>        5    0.084 -0.086  0.265      FALSE
#>        6    0.075 -0.055  0.225      FALSE
#>        7    0.063 -0.023  0.174      FALSE
#>        8    0.042 -0.029  0.124      FALSE
#>        9    0.022 -0.045  0.063      FALSE
#>       10    0.009 -0.049  0.036      FALSE
#>       11    0.002 -0.050  0.023      FALSE
#>       12   -0.002 -0.054  0.019      FALSE
print(band_table(boot_cum), row.names = FALSE)
#>  quarter estimate  lower  upper excludes_0
#>        0    0.000  0.000  0.000      FALSE
#>        1   -0.603 -0.835 -0.387       TRUE
#>        2   -1.003 -1.460 -0.520       TRUE
#>        3   -1.048 -1.722 -0.363       TRUE
#>        4   -0.962 -1.732 -0.143       TRUE
#>        5   -0.877 -1.706  0.022      FALSE
#>        6   -0.802 -1.680  0.121      FALSE
#>        7   -0.739 -1.618  0.180      FALSE
#>        8   -0.698 -1.605  0.215      FALSE
#>        9   -0.676 -1.609  0.197      FALSE
#>       10   -0.667 -1.614  0.153      FALSE
#>       11   -0.664 -1.599  0.129      FALSE
#>       12   -0.666 -1.601  0.114      FALSE
```

The `excludes_0` column says whether the band stays on one side of 0. In the first table, the changes, it does so in quarters 1 and 2 only: -0.835 to -0.387, and -0.659 to -0.110. From quarter 3 on, each band contains 0.

The second table, the running total, is the rate's gap. Its band excludes 0 through quarter 4, where it runs from -1.732 to -0.143. Quarter 5 is borderline, because its upper edge is 0.022.

Another seed puts that edge on either side of 0, so we claim nothing for quarter 5. By quarter 12 the band is -1.601 to 0.114. It contains 0, so the data do not settle whether any gap is left at quarter 12.

The widget below shows what a band covers, on simulated data. It draws its own points around a straight line, not the Canada series. Its green confidence band is the uncertainty about where the fitted line is.

That is the analogue of our response band: uncertainty from estimating on a finite sample. The widget's orange prediction band is where a single new point can land, the analogue of where the actual unemployment rate in a future quarter would land. The bootstrap band is not that.

::widget regression-intervals {}

Set the slider to 81, the number of rows in our VAR. The read-out gives a confidence half-width of ±0.15 and a prediction half-width of ±1.34. Now move it to 300. The confidence band shrinks to ±0.08, while the prediction band stays at ±1.34.

So more data narrows the band around the estimate, but a single new value still carries the full noise. Our bootstrap band works like the green one. It reflects the sampling error in the estimated response, and it narrows as the number of quarters grows. It does not say where the unemployment rate will actually be, because that also depends on the shocks that have not happened yet.

=== step === quiz
## Quick check: what the bands allow you to conclude

The cumulative response of the unemployment rate reaches -1.048 in quarter 3 and is -0.666 in quarter 12, where its 95% band is -1.601 to 0.114. Which statement do these results support?

::quiz {"correct": 3, "gate": true, "difficulty": "intermediate"}
- After the shock, the unemployment rate is permanently 0.67 points lower. ::no
- The band shows where the actual unemployment rate will fall 12 quarters later, with 95% probability. ::no
- The rate is below the no-shock path through quarter 4, but a gap at quarter 12 is not established. ::ok Right. The band separates the fall from 0 through quarter 4, and at quarter 12 it cannot separate the final gap from 0. That is what a band built on sampling error can tell you.
- The dip to -1.048 is below the final -0.666, so the overshoot is proven. ::no Each of these reads more into the response than the band supports. A permanent 0.67 point fall is not established, since the quarter 12 band contains 0. The band covers estimation error, like the widget's green band, and not where a future value will land, which is what the wider orange prediction band shows. And the quarter 3 band, -1.722 to -0.363, contains -0.666, so the data cannot separate the dip from the final level.

=== step === concept
## Correlated residuals and the orthogonalised response

The hand-built response moved the `d_emp` residual by 1 point and left the other two residuals at exactly 0. Let's check whether the data ever look like that.

The code below takes the residual covariance matrix of the fit and turns it into correlations.

```r
# Correlations between the three residual series, and the d_unemp on d_emp slope
S <- summary(fit)$covres
round(cov2cor(S), 3)
#>          d_emp d_wage d_unemp
#> d_emp    1.000 -0.108  -0.717
#> d_wage  -0.108  1.000   0.276
#> d_unemp -0.717  0.276   1.000
round(S["d_unemp", "d_emp"] / S["d_emp", "d_emp"], 3)
#> [1] -0.574
```

The heatmap shows the same three correlations as colours. Green cells are positive and blue cells are negative.

::widget correlation-heatmap {"vars":["d_emp","d_wage","d_unemp"],"matrix":[[1,-0.108,-0.717],[-0.108,1,0.276],[-0.717,0.276,1]]}

The `d_emp` and `d_unemp` residuals have a correlation of -0.717. In a quarter where employment growth beats what the past predicted, the change in the unemployment rate tends to come in below what the past predicted, in the same quarter.

The last number puts that in units. It is the slope of the `d_unemp` residual on the `d_emp` residual: when the `d_emp` residual is 1 point higher, the `d_unemp` residual is on average 0.574 lower.

So "a shock to `d_emp` alone" is not what the data show. The two residuals tend to move together, but the hand-built response kept the `d_unemp` residual at 0 while the `d_emp` residual was 1.

To get responses to shocks that do not overlap, called orthogonalised responses, we split the residuals into uncorrelated shocks. The Cholesky factorisation does this. It writes the residual covariance matrix \(S\) as

\[ S = P P^{\top} \]

where \(P\) is lower triangular, meaning every entry above its diagonal is 0. Then each residual vector is \(u_t = P e_t\), where the three shocks in \(e_t\) are uncorrelated and each has variance 1.

Because \(P\) is lower triangular, the first shock moves all three variables in the same quarter. The second shock moves the second and third variables, and the third shock moves only the third. So the order of the columns in the data matters. The variable placed first can affect all the others within the quarter, and the variable placed last affects none of them within the quarter.

```r
# Cholesky factor with d_emp first, and the orthogonalised response of d_unemp by hand
P <- t(chol(S))
round(P, 3)
#>          d_emp d_wage d_unemp
#> d_emp    0.387  0.000   0.000
#> d_wage  -0.100  0.917   0.000
#> d_unemp -0.222  0.062   0.206

orth_hand <- sapply(0:12, function(h) (phi_arr[, , h + 1] %*% P)[3, 1])
orth_irf <- irf(fit, impulse = "d_emp", response = "d_unemp",
                n.ahead = 12, ortho = TRUE, boot = FALSE)
compare <- rbind(by_hand  = round(orth_hand[1:4], 3),
                 from_irf = round(orth_irf$irf$d_emp[1:4, "d_unemp"], 3))
colnames(compare) <- paste0("q", 0:3)
compare
#>              q0     q1    q2     q3
#> by_hand  -0.222 -0.215 -0.15 -0.079
#> from_irf -0.222 -0.215 -0.15 -0.079
```

Look at the first column of `P`. A first shock of one standard deviation moves `d_emp` by 0.387, `d_wage` by -0.100 and `d_unemp` by -0.222 in the same quarter. Check the last one: 0.387 times -0.574 is -0.222. The first shock carries the whole shared part of the `d_emp` and `d_unemp` residuals.

The orthogonalised response at quarter \(h\) is \(\Phi_h\) times the first column of \(P\). The two rows in `compare` agree: our by-hand version matches `irf(ortho = TRUE)`. Notice that this response starts at -0.222 in quarter 0, where the hand-built response started at 0.

=== step === concept
## The same VAR with the order reversed

Nothing in the data says `d_emp` must come first. So let's fit the same VAR with the columns reversed, `d_unemp` first and `d_emp` last, and compare the responses to a `d_emp` shock. We call the original arrangement order A and the reversed one order B.

Reversing the columns changes only how the residual correlation is split into shocks. The coefficients and residuals stay the same.

One more adjustment is needed. A shock of one standard deviation has a different size in each order. So we divide each response by the impact response of `d_emp`, and both then describe a 1 point rise in `d_emp` on impact.

```r
# Fit the reversed order, scale both responses to a 1 point d_emp rise, and plot the running totals
d_rev <- d[, c("d_unemp", "d_wage", "d_emp")]
fit_rev <- VAR(d_rev, p = 2, type = "const")
round(c(order_A = as.numeric(logLik(fit)), order_B = as.numeric(logLik(fit_rev))), 4)
#>   order_A   order_B
#> -122.0185 -122.0185

irf_A <- irf(fit, impulse = "d_emp", response = c("d_emp", "d_unemp"),
             n.ahead = 12, ortho = TRUE, boot = FALSE)
irf_B <- irf(fit_rev, impulse = "d_emp", response = c("d_emp", "d_unemp"),
             n.ahead = 12, ortho = TRUE, boot = FALSE)

impact_A <- as.numeric(irf_A$irf$d_emp[1, "d_emp"])
impact_B <- as.numeric(irf_B$irf$d_emp[1, "d_emp"])
round(c(order_A = impact_A, order_B = impact_B), 3)
#> order_A order_B
#>   0.387   0.267

paths <- rbind(order_A = irf_A$irf$d_emp[, "d_unemp"] / impact_A,
               order_B = irf_B$irf$d_emp[, "d_unemp"] / impact_B)
colnames(paths) <- paste0("q", 0:12)
round(paths[, 1:5], 3)
#>             q0     q1     q2     q3     q4
#> order_A -0.574 -0.557 -0.388 -0.205 -0.019
#> order_B  0.000 -0.603 -0.400 -0.045  0.086

cum_paths <- t(apply(paths, 1, cumsum))
round(cum_paths[, "q8"], 3)
#> order_A order_B
#>  -1.544  -0.698

matplot(0:12, t(cum_paths), type = "l", lty = 1, lwd = 2, col = c("black", "red"),
        xlab = "quarter", ylab = "cumulative response of d_unemp (points)",
        main = "The same VAR under two orderings")
abline(h = 0, lty = 3)
legend("bottomright", legend = c("order A: d_emp first", "order B: d_emp last"),
       col = c("black", "red"), lty = 1, lwd = 2)
```

The log-likelihood is -122.0185 for both orders, so the data do not favour either one. It is the same fit, split into shocks in two different ways.

The sizes of a one standard deviation `d_emp` shock are 0.387 in order A and 0.267 in order B. In order B the `d_emp` shock is what remains of the `d_emp` residual after the other two residuals are taken out, so it is smaller. That is why we scaled.

Now compare the `d_unemp` responses. In order A the impact is -0.574, because the `d_emp` shock moves `d_unemp` within the quarter. In order B the impact is 0.

Order B then gives -0.603, -0.400, -0.045 and 0.086. That is the hand-built path from before, because with `d_emp` ordered last, its shock has no same-quarter effect on the others, and the hand-built path had none either.

After 8 quarters the running total is -1.544 in order A and -0.698 in order B. In the plot, the two running totals start apart in quarter 0 and stay apart through quarter 12.

`irf()` returns its columns in the order of the VAR, so the code picks responses by name, with `"d_emp"` and `"d_unemp"`, and never by position.

=== step === concept
## Reporting a response that depends on the ordering

Two orderings gave two totals. There are 6 ways to order 3 variables, so let's refit under all 6 and see how far the answer moves.

The loop below refits the VAR for each ordering, scales the `d_emp` shock to 1 point, and records the impact response of `d_unemp`, its running total after 4 quarters and its running total after 8 quarters.

```r
# Refit under all 6 orderings and tabulate the scaled response of d_unemp
orders <- list(
  c("d_emp", "d_wage", "d_unemp"),
  c("d_emp", "d_unemp", "d_wage"),
  c("d_wage", "d_emp", "d_unemp"),
  c("d_wage", "d_unemp", "d_emp"),
  c("d_unemp", "d_emp", "d_wage"),
  c("d_unemp", "d_wage", "d_emp")
)

order_table <- t(sapply(orders, function(ord) {
  ord_fit <- VAR(d[, ord], p = 2, type = "const")
  resp <- irf(ord_fit, impulse = "d_emp", response = c("d_emp", "d_unemp"),
              n.ahead = 8, ortho = TRUE, boot = FALSE)$irf$d_emp
  scaled <- resp[, "d_unemp"] / resp[1, "d_emp"]
  c(impact = scaled[1], q4_total = sum(scaled[1:5]), q8_total = sum(scaled[1:9]))
}))
rownames(order_table) <- sapply(orders, paste, collapse = " > ")
round(order_table, 3)
#>                          impact q4_total q8_total
#> d_emp > d_wage > d_unemp -0.574   -1.743   -1.544
#> d_emp > d_unemp > d_wage -0.574   -1.743   -1.544
#> d_wage > d_emp > d_unemp -0.556   -1.636   -1.406
#> d_wage > d_unemp > d_emp  0.000   -0.962   -0.698
#> d_unemp > d_emp > d_wage  0.000   -0.814   -0.499
#> d_unemp > d_wage > d_emp  0.000   -0.962   -0.698
```

The 6 rows fall into two groups. In the first three, `d_emp` comes before `d_unemp`, and the 8-quarter total runs from -1.544 to -1.406. In the last three, `d_emp` comes after `d_unemp`, and the total runs from -0.698 to -0.499.

The two groups are at least 0.70 apart. That gap comes from the residual correlation of -0.717: the ordering decides which of the two shocks carries it.

Where `d_wage` sits matters much less. Inside a group, moving it shifts the total by at most 0.20. Its residual correlations with the other two are weaker, -0.108 with `d_emp` and 0.276 with `d_unemp`.

So how should a response like this be reported? The ordering cannot be chosen by the data, so it needs an argument from outside them: which variable cannot react to the others within the same quarter? An analyst who argues that employment is set first, and that unemployment responds within the quarter, orders `d_emp` before `d_unemp` and reports a total of -1.544. One who argues the reverse reports -0.698 or -0.499.

Either way, the report should state the ordering it used and show the alternative. The bootstrap band from earlier does not help here. It covers sampling error, and the ordering is not sampling error.

=== step === quiz
## Quick check: why two analysts get different totals

Two analysts fit the same VAR(2) to the same 81 rows and scale the `d_emp` shock to 1 point. One reports that the unemployment rate is 1.54 points below the no-shock path after 8 quarters. The other reports 0.70. What explains the gap?

::quiz {"correct": 2, "gate": true, "difficulty": "intermediate"}
- They ran different bootstrap runs, so their bands and estimates differ. ::no
- They ordered `d_emp` and `d_unemp` differently, so the residual correlation went to different shocks. ::ok Yes. The fit is the same, but the ordering decides which shock carries the -0.717 residual correlation. That is where -1.544 and -0.698 come from.
- With more quarters of data, the two totals would move together and the gap would close. ::no
- One of the two fits is better, so its response is the one to report. ::no None of these explains the gap. Bootstrap runs move the bands, and the estimate itself does not change. More data narrows a band around one estimate, but the gap comes from the ordering, which is an assumption, and not from sampling error. And the two fits are the same one: both have a log-likelihood of -122.0185. Only the ordering differs.

=== step === tryit
## Your turn: put d_wage first and read the impact response

Order `d_wage` first, then `d_emp`, then `d_unemp`. Refit the VAR, get the orthogonalised response to a `d_emp` shock, and scale it so `d_emp` rises by 1 point on impact. Then read `d_unemp`'s response in quarters 0 and 1.

Before you run it, decide which case you expect this to resemble: order A, with an impact near -0.574, or order B, with an impact of 0. The residual correlations of `d_wage` with the other two variables are the clue.

```r
# Refit with d_wage first and print the scaled d_unemp response for quarters 0 and 1.
# d holds the three quarterly change series, and the vars package is loaded.
# Reorder the columns with d_wage first, then d_emp, then d_unemp.
# Refit the VAR(2) on the reordered data.
# Get the orthogonalised response of d_emp and d_unemp to a d_emp shock,
# without bootstrap bands.
# Divide d_unemp's response by d_emp's impact response, so the shock is 1 point.
# Print quarters 0 and 1. Press Check when you have them.
```
::check {"regex": "(?=[\\s\\S]*irf[(])c[(].d_wage.,\\s*.d_emp.,\\s*.d_unemp.[)]", "gate": true, "difficulty": "intermediate", "ok": "Yes: -0.556 on impact and -0.546 in quarter 1. That is close to order A and nowhere near 0. The d_wage residual correlates much less with the other two than they do with each other, so putting it first moves the slope of the d_unemp residual on the d_emp residual only from -0.574 to -0.556.", "no": "Reorder the columns of d with d_wage first, refit with VAR(), then call irf() with ortho = TRUE and boot = FALSE, as in the reversed-order fit."}
::solution
```r
# Refit with d_wage ordered first and scale the d_unemp response to a 1 point d_emp shock
d_wage_first <- d[, c("d_wage", "d_emp", "d_unemp")]
fit_w <- VAR(d_wage_first, p = 2, type = "const")
irf_w <- irf(fit_w, impulse = "d_emp", response = c("d_emp", "d_unemp"),
             n.ahead = 12, ortho = TRUE, boot = FALSE)
scaled_w <- irf_w$irf$d_emp[, "d_unemp"] / irf_w$irf$d_emp[1, "d_emp"]
round(scaled_w[1:2], 3)
#> [1] -0.556 -0.546
```

The impact response is -0.556, near order A's -0.574 and not 0. The `d_wage` residual correlates -0.108 with `d_emp` and 0.276 with `d_unemp`, so ordering it first moves the slope of the `d_unemp` residual on the `d_emp` residual only from -0.574 to -0.556. What decides the impact is where `d_emp` sits relative to `d_unemp`, not where `d_wage` sits.

=== step === concept
## References

- [VAR, SVAR and SVEC Models: Implementation Within R Package vars](https://doi.org/10.18637/jss.v027.i04) - Pfaff (2008), Journal of Statistical Software 27(4). The `irf()`, `Phi()` and `roots()` workflow.
- [New Introduction to Multiple Time Series Analysis](https://doi.org/10.1007/978-3-540-27752-1) - Lütkepohl (2005), Springer. Impulse responses and orthogonalisation.
- [Macroeconomics and Reality](https://doi.org/10.2307/1912017) - Sims (1980), Econometrica 48(1), 1-48. The origin of VAR impulse responses and the Cholesky ordering.
- [Small-Sample Confidence Intervals for Impulse Response Functions](https://doi.org/10.1162/003465398557465) - Kilian (1998), Review of Economics and Statistics 80(2), 218-230.
- [Applied Time Series Econometrics](https://doi.org/10.1017/CBO9780511606885) - Lütkepohl and Krätzig (eds.) (2004), Cambridge University Press. The book resource for the Canada data.

=== step === complete
## Quick recap

You traced one shock through a fitted VAR, built its impulse response by hand, and learnt how far the answer can be trusted. To summarize:

- An impulse response is the fitted VAR run forward from one shock: 1 point on `d_emp`, iterated through the coefficient matrices. It matches `Phi()`.
- The unemployment rate's gap from the no-shock path is -0.603 in quarter 1, reaches -1.048 in quarter 3, and settles near -0.666, so it overshoots its final level.
- A bootstrap band separates that gap from 0 through quarter 4 only. It covers sampling error, not future shocks.
- The `d_emp` and `d_unemp` residuals have a correlation of -0.717, so a shock to one variable alone is not what the data show. A Cholesky ordering assigns the shared part to the variable placed first.
- The same VAR gives -1.544 after 8 quarters with `d_emp` first and -0.698 with `d_emp` last. Report the ordering with the result.

So, whenever someone shows you an impulse response, ask two things: what the band covers, and which ordering it used.

The next lesson covers cointegration and the VECM: series that each wander, but are tied together by a stable relationship.

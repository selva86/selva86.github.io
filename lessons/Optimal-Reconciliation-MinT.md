---
title: "Hierarchical and Grouped Forecasting Lesson 3: Optimal reconciliation with MinT"
slug: "Optimal-Reconciliation-MinT"
description: "Make forecasts add up across a hierarchy with MinT reconciliation in R: build S and G, weight errors by their covariance, and compare RMSE with bottom-up."
keywords: "MinT reconciliation, optimal forecast reconciliation, hierarchical forecasting in R, summing matrix, reconciliation matrix, OLS reconciliation, forecast error covariance, shrinkage covariance, coherent forecasts, ets, forecast package"
mathjax: true
webr: true
post_type: "LESSON"
course_id: "ts-hierarchical"
course_title: "Hierarchical and Grouped Forecasting"
course_lesson: "3"
course_total: "5"
course_landing: "Hierarchical-and-Grouped-Forecasting-Course.html"
course_prev: "Bottom-Up-Top-Down-and-Middle-Out"
course_next: "Reconciliation-with-fabletools"
curriculum_id: "5.120.3"
lesson_access: "pro"
catalog_blurb: "Make forecasts add up across a hierarchy while keeping the total error variance low."
---

=== step === cover
## Optimal reconciliation with MinT

Today let's learn how to make the forecasts of a whole hierarchy add up, using a method called MinT.

Take a chain of four bike shops. North has stores N1 and N2, and South has stores S1 and S2. Every month each store records the units it sold, so the sales also add up to a North total, a South total and a Total for the chain.

That makes 7 series in one hierarchy, and each series is called a **node**. The nodes directly below a node are its **children**, so N1 and N2 are the children of North.

Now suppose you forecast every node on its own, with its own model. Each result is a **base forecast**, and the table shows the base forecasts for January 2025. They do not agree with each other: Total is forecast at 1108.7 units, but the North and South forecasts add up to 1123.7. So two forecasts of the same quantity, the chain's sales, are 15.0 units apart.

::widget styled-table {"cols":["Node","Base forecast","Sum of its children","Gap"],"rows":[["Total",1108.7,1123.7,-15.0],["North",622.2,611.7,10.5],["South",501.5,487.0,14.5]],"formats":{"Base forecast":"1dp","Sum of its children":"1dp","Gap":"1dp"},"title":"Jan 2025 base forecasts, units","note":"Gap is the base forecast of a node minus the sum of the base forecasts of its children."}

Read the Gap column: a set of forecasts that adds up would show 0 in all three rows.

=== step === concept
## What coherent forecasts are, and the summing matrix S

To work on this we need sales data where we know exactly how every series was made. So the code below simulates 10 years of monthly units sold, January 2016 to December 2025, for the four stores. None of it is real store data.

Each store gets a trend (1.2, 0.15, 0.7 and 0.05 extra units every month), a seasonal wave that repeats every 12 months, and random noise with a standard deviation of 25 units. Total, North and South are then the sums of their stores.

The two stores of a region also share one extra shock, which makes them move together. That shock is an AR(1) series: each month's value is half of the previous month's value plus a fresh random draw with a standard deviation of 8.

```r
# Simulate monthly unit sales for four stores and add them up into the hierarchy
library(forecast)

set.seed(7)
n <- 120
month <- 1:n

season <- function(amplitude, phase) amplitude * sin(2 * pi * (month - phase) / 12)
ar1    <- function(phi, sd) as.numeric(arima.sim(list(ar = phi), n = n, sd = sd))

north_shock <- ar1(0.5, 8)
south_shock <- ar1(0.5, 8)

N1 <- 300 + 1.2  * month + season(40, 2) + north_shock + rnorm(n, 0, 25)
N2 <- 220 + 0.15 * month + season(35, 2) + north_shock + rnorm(n, 0, 25)
S1 <- 260 + 0.7  * month + season(38, 2) + south_shock + rnorm(n, 0, 25)
S2 <- 180 + 0.05 * month + season(30, 2) + south_shock + rnorm(n, 0, 25)
stores <- round(cbind(N1, N2, S1, S2), 0)

Y <- ts(cbind(Total = rowSums(stores),
              North = stores[, "N1"] + stores[, "N2"],
              South = stores[, "S1"] + stores[, "S2"],
              stores),
        start = c(2016, 1), frequency = 12)

train <- window(Y, end = c(2024, 12))
test  <- window(Y, start = c(2025, 1))
dim(train)
#> [1] 108   7
dim(test)
#> [1] 12  7
round(colMeans(train))
#> Total North South    N1    N2    S1    S2 
#>  1077   599   478   368   231   298   180
```

We fit on the first 108 months, January 2016 to December 2024, and hold out the 12 months of 2025 to score the forecasts later. The training means show the size of each series. The Total averages 1,077 units a month, which is the four store means added up: 368 + 231 + 298 + 180.

Next come the base forecasts. The code fits one ETS model per node with `ets()`, which is exponential smoothing: each model is described by an error type, a trend type and a seasonal type, and each is additive (A), multiplicative (M) or absent (N). `ets()` picks that combination for every node on its own.

```r
# Fit one ETS model per node, forecast 2025, and keep the training residuals
fit <- lapply(1:7, function(i) ets(train[, i]))
names(fit) <- colnames(Y)
data.frame(node = names(fit), model = sapply(fit, function(f) f$method), row.names = NULL)
#>    node      model
#> 1 Total ETS(A,A,A)
#> 2 North ETS(A,N,A)
#> 3 South ETS(A,A,A)
#> 4    N1 ETS(A,A,A)
#> 5    N2 ETS(A,N,A)
#> 6    S1 ETS(A,A,A)
#> 7    S2 ETS(M,N,A)

fc   <- sapply(fit, function(f) as.numeric(forecast(f, h = 12)$mean))
res  <- sapply(fit, function(f) as.numeric(residuals(f, type = "response")))
yhat <- round(fc[1, ], 1)
yhat
#>  Total  North  South     N1     N2     S1     S2 
#> 1108.7  622.2  501.5  402.8  208.9  328.5  158.5
```

The nodes did not get the same model. Total, South, N1 and S1 have a trend, North and N2 have none, and S2 has a multiplicative error. With 7 models fitted separately, nothing forces their forecasts to add up.

Three objects come out of this block. `fc` holds the 12 forecast months for the 7 nodes. `res` holds the training residuals, which are the actual sales minus each model's forecast of that month, made from the months before it, so it is a 108 by 7 matrix of one-step forecast errors. And `yhat` is the January 2025 row of `fc`, rounded to 1 decimal so every number we print from here can be recomputed by hand.

Now the word for what is missing. A set of forecasts is **coherent** when every parent equals the sum of its children. To build a coherent set you only need the 4 store values, because everything above them is a sum. Write the store values as a vector b, and the full set of 7 as y, and the whole hierarchy is one line:

\[ y = S\, b \]

Here S is the **summing matrix**. It has 7 rows, one per node, and 4 columns, one per store. Each row says which stores add up to that node: the Total row is 1 1 1 1, North is 1 1 0 0, South is 0 0 1 1, and each store row picks out that store alone.

```r
# Build the summing matrix S and test whether a set of 7 forecasts is coherent
S <- rbind(c(1, 1, 1, 1),
           c(1, 1, 0, 0),
           c(0, 0, 1, 1),
           diag(4))
dimnames(S) <- list(colnames(Y), colnames(Y)[4:7])
S
#>       N1 N2 S1 S2
#> Total  1  1  1  1
#> North  1  1  0  0
#> South  0  0  1  1
#> N1     1  0  0  0
#> N2     0  1  0  0
#> S1     0  0  1  0
#> S2     0  0  0  1

is_coherent <- function(y) max(abs(y - S %*% y[4:7])) < 1e-8
is_coherent(as.numeric(Y[1, ]))
#> [1] TRUE
is_coherent(yhat)
#> [1] FALSE
```

The last four rows of S are the 4 by 4 identity matrix, which has 1 on the diagonal and 0 everywhere else, so a set of 7 values is coherent exactly when it equals S times its own 4 store values. `is_coherent()` tests that with a small tolerance. The first month of the history passes, since every Total there is the exact sum of its stores. The base forecasts for January 2025 fail.

```r
# Measure how far each parent's base forecast is from the sum of its children
gap <- c(Total = yhat[["Total"]] - yhat[["North"]] - yhat[["South"]],
         North = yhat[["North"]] - yhat[["N1"]] - yhat[["N2"]],
         South = yhat[["South"]] - yhat[["S1"]] - yhat[["S2"]])
round(gap, 1)
#> Total North South 
#> -15.0  10.5  14.5
```

These are the three gaps from the cover: 1108.7 - 622.2 - 501.5 is -15.0. To close them, some of the 7 base forecasts have to change, and the question is which ones and by how much.

=== step === concept
## The reconciliation matrix G: bottom-up and top-down as special cases

Every method that closes the gaps works in two stages. The first stage turns the 7 base forecasts into 4 store forecasts, and the second stage adds those 4 up again with S. The first stage is a 4 by 7 matrix G, called the **reconciliation matrix**. With \(\hat{y}\) for the base forecasts and \(\tilde{y}\) for the reconciled forecasts, the two stages are:

\[ \tilde{y} = S\, G\, \hat{y} \]

The last stage is always S, so the reconciled forecasts are coherent whatever G is. That leaves G as the only thing that decides which base forecasts get used and by how much.

[KEY INSIGHT]
Every reconciliation method is \(S G \hat{y}\). Bottom-up, top-down, OLS and MinT are different choices of G and nothing else.

**Bottom-up** uses only the 4 store forecasts. Its G has zeros in the first three columns, for Total, North and South, and an identity block for the stores, so each store keeps its own base forecast and everything above is rebuilt by summing.

**Top-down** uses only the Total forecast. Its G has one non-zero column, the Total column, which holds the average share of Total that each store had over the 108 training months. Each store forecast is then its share of the Total forecast, and the regions are rebuilt by summing.

The code builds both G matrices and reconciles the January 2025 forecasts with each.

```r
# Build G for bottom-up and top-down and reconcile the Jan 2025 forecasts
reconcile <- function(G, y = yhat) setNames(as.numeric(S %*% G %*% y), rownames(S))

G_bu <- cbind(matrix(0, 4, 3), diag(4))
share <- setNames(colMeans(train[, 4:7] / train[, "Total"]), colnames(S))
G_td <- cbind(share, matrix(0, 4, 6))
dimnames(G_bu) <- dimnames(G_td) <- list(colnames(S), rownames(S))

G_bu
#>    Total North South N1 N2 S1 S2
#> N1     0     0     0  1  0  0  0
#> N2     0     0     0  0  1  0  0
#> S1     0     0     0  0  0  1  0
#> S2     0     0     0  0  0  0  1
round(G_td, 3)
#>    Total North South N1 N2 S1 S2
#> N1 0.342     0     0  0  0  0  0
#> N2 0.215     0     0  0  0  0  0
#> S1 0.277     0     0  0  0  0  0
#> S2 0.167     0     0  0  0  0  0
round(rbind(Base = yhat, BottomUp = reconcile(G_bu), TopDown = reconcile(G_td)), 1)
#>           Total North South    N1    N2    S1    S2
#> Base     1108.7 622.2 501.5 402.8 208.9 328.5 158.5
#> BottomUp 1098.7 611.7 487.0 402.8 208.9 328.5 158.5
#> TopDown  1108.7 616.7 492.0 378.8 237.9 306.9 185.1
```

Look at the bottom-up row first. The four stores are exactly their base forecasts, and Total is 1098.7, the sum of those four. That is 10.0 below the Total base forecast of 1108.7, which bottom-up throws away, along with the North and South forecasts.

The top-down row does the opposite. Total stays at 1108.7, and the stores change: N1 goes from 402.8 to 378.8 and N2 from 208.9 to 237.9, because each store now gets its fixed share of the Total forecast. The four store base forecasts, and the North and South ones, are all thrown away.

Middle-out sits between the two. It keeps the forecasts of one middle level, here North and South, sums them up into Total and splits them down into stores with shares, so its G is non-zero only in the North and South columns.

So which G is good? One property helps to judge. Suppose the base forecasts are already coherent, so \(\hat{y} = S b\) for some 4 store values b. A good G should return them unchanged. Reconciling gives \(S G S b\), and that equals \(S b\) exactly when

\[ S G S = S \]

The same condition keeps unbiased forecasts unbiased. If each base forecast has an average error of 0, the base forecasts average to the true coherent set \(S b\), and \(S G S = S\) means the reconciled forecasts average to it as well.

The code below builds a coherent test set from the 4 store base forecasts and passes it through each G.

```r
# Check coherence, then check that a coherent set passes through each G unchanged
is_coherent(reconcile(G_bu))
#> [1] TRUE
is_coherent(reconcile(G_td))
#> [1] TRUE

y0 <- as.numeric(S %*% yhat[4:7])
round(max(abs(reconcile(G_bu, y0) - y0)), 1)
#> [1] 0
round(max(abs(reconcile(G_td, y0) - y0)), 1)
#> [1] 27.4
round(max(abs(S %*% G_bu %*% S - S)), 1)
#> [1] 0
round(max(abs(S %*% G_td %*% S - S)), 1)
#> [1] 0.8
```

Both methods return coherent forecasts, as they must. But the test set `y0` passes through bottom-up untouched, with a largest change of 0, while top-down moves one of its 7 forecasts by as much as 27.4 units. The last two lines say the same thing about G itself: \(S G S - S\) is 0 for bottom-up, and for top-down its largest entry in absolute value is 0.8. So bottom-up satisfies \(S G S = S\) and top-down does not.

=== step === concept
## OLS reconciliation: the coherent forecasts nearest to the base forecasts

Bottom-up and top-down each use only part of the 7 base forecasts. There is a way to use all 7: look for the coherent set that is nearest to the base forecasts.

Nearest means the smallest sum of squared differences, which is exactly what ordinary least squares, or OLS, minimises. So regress the 7 base forecasts \(\hat{y}\) on the 4 columns of S. The fitted values \(S \hat{\beta}\) are coherent, because they are S times a vector of 4 numbers, and among all coherent sets they are the closest to \(\hat{y}\). The regression solution gives the G:

\[ \hat{\beta} = (S^{\top} S)^{-1} S^{\top} \hat{y}, \qquad G_{\text{OLS}} = (S^{\top} S)^{-1} S^{\top} \]

\(S^{\top}\) is S transposed, with rows and columns swapped, which is `t(S)` in R. The code computes G with `solve()`, which inverts a matrix, and then confirms that it matches a plain `lm()` fit.

```r
# Compute G for OLS as a regression of the base forecasts on the columns of S
G_ols <- solve(t(S) %*% S) %*% t(S)
rec_ols <- reconcile(G_ols)
all.equal(rec_ols, setNames(as.numeric(fitted(lm(yhat ~ 0 + S))), rownames(S)))
#> [1] TRUE

ols <- round(rec_ols, 1)
rbind(Base = yhat, OLS = ols, Adjustment = ols - yhat)
#>             Total North South    N1    N2    S1    S2
#> Base       1108.7 622.2 501.5 402.8 208.9 328.5 158.5
#> OLS        1111.6 616.8 494.8 405.3 211.4 332.4 162.4
#> Adjustment    2.9  -5.4  -6.7   2.5   2.5   3.9   3.9
max(abs(S %*% G_ols %*% S - S)) < 1e-10
#> [1] TRUE
```

The formula `yhat ~ 0 + S` leaves out the intercept, because the coherent set is S times the coefficients and nothing more. The `lm()` fit gives the same coherent set as G, so OLS reconciliation is a regression.

Now the adjustments. Total goes up by 2.9, North down by 5.4 and South down by 6.7, and every store goes up. N1 and N2 both move by 2.5, and S1 and S2 both by 3.9. OLS shares the gaps out without using anything about how large each forecast's own error is.

One detail about the printed cells. The four stores print as 405.3, 211.4, 332.4 and 162.4, which add to 1111.5, while the Total prints 1111.6. Each printed cell is rounded to 1 decimal, so a printed total can miss its printed parts by 0.1. The unrounded set is coherent, and the last line confirms that OLS satisfies \(S G S = S\).

=== step === widget
## What OLS assumes about the forecast errors

A least squares fit works best when its errors have the same variance and are independent of each other. OLS reconciliation is a least squares fit, so it assumes both about the 7 base forecast errors. Do they hold here?

We cannot see the base forecast errors of 2025 yet, but the training residuals estimate them. The code prints the standard deviation of each node's residuals, and then the correlations between the 7 residual series.

```r
# Compare the size and the correlation of the seven training residual series
sds <- round(apply(res, 2, sd), 1)
sds
#> Total North South    N1    N2    S1    S2 
#>  54.0  36.4  38.2  25.8  25.5  25.5  22.9
round((sds[["Total"]] / sds[["S2"]])^2, 1)
#> [1] 5.6
round(cor(res), 2)
#>       Total North South    N1    N2   S1    S2
#> Total  1.00  0.71  0.76  0.48  0.49 0.63  0.57
#> North  0.71  1.00  0.14  0.64  0.64 0.06  0.18
#> South  0.76  0.14  1.00  0.04  0.05 0.81  0.76
#> N1     0.48  0.64  0.04  1.00 -0.03 0.10 -0.04
#> N2     0.49  0.64  0.05 -0.03  1.00 0.00  0.11
#> S1     0.63  0.06  0.81  0.10  0.00 1.00  0.24
#> S2     0.57  0.18  0.76 -0.04  0.11 0.24  1.00
```

The 7 errors are not the same size. Total's residuals have a standard deviation of 54.0 and S2's have 22.9, so Total's error variance is 5.6 times S2's (54.0 squared over 22.9 squared).

They are not independent either. South's residuals correlate 0.81 with S1's and 0.76 with S2's, which is expected, because South's sales are S1's plus S2's, so a surprise in either store shows up in South too. North correlates 0.64 with both N1 and N2. So the 7 errors are not independent, even though N1 and N2 are almost uncorrelated with each other, at -0.03.

So both assumptions fail. To see what that costs, the widget below runs an ordinary regression on 60 rows of its own data, not the bike sales. It stands in for any least squares fit, and the two assumptions it breaks are the same two that OLS reconciliation needs from the 7 errors. At every dial setting it simulates 2,000 studies and measures two things: coverage, the share of the 95% intervals that contain the true value, and R-squared.

::widget assumption-dial {"assumptions":["heteroskedasticity","independence"],"levels":11,"start":0}

With the dial at 0, equal variance holds, and about 95% of the intervals contain the true value, which is what 95% is supposed to mean. R-squared is about 0.50. Drag the dial to the far right, where the spread grows strongly, and coverage falls to about 71%. But R-squared only moves to about 0.53.

Now switch to independence. Coverage goes from about 95% to about 69% at the far right, and R-squared goes from 0.50 to 0.52. The R block under the widget reruns the experiment at the far right with fresh random draws, so its coverage lands a few points from the widget's.

The fit statistic barely changes while the intervals stop being reliable. A regression that looks fine is no evidence that its assumptions hold, and the same goes for an OLS reconciliation that returns a tidy coherent set.

A better G would use the sizes and the correlations of the errors instead of ignoring them.

=== step === concept
## MinT: choosing G from the forecast error covariance

The sizes and the correlations of the 7 base forecast errors sit together in one matrix, **W**, the covariance matrix of the base forecast errors. Its diagonal holds the 7 error variances, and the entries off the diagonal hold the covariances between pairs of errors. We do not know W, so we estimate it from the training residuals with `cov(res)`, which is a 7 by 7 matrix.

**MinT** stands for minimum trace. When the base forecasts are reconciled with a G that has \(S G S = S\), the reconciled errors have covariance \(S G W G^{\top} S^{\top}\). The diagonal of that matrix holds the 7 reconciled error variances, and the trace of a matrix is the sum of its diagonal. MinT picks the G that minimises

\[ \operatorname{tr}\left(S\, G\, W\, G^{\top} S^{\top}\right) \]

among all G with \(S G S = S\). The solution is a formula:

\[ G_{\text{MinT}} = \left(S^{\top} W^{-1} S\right)^{-1} S^{\top} W^{-1} \]

Put it next to the OLS formula: the only difference is \(W^{-1}\), the inverse of W, in two places. With W equal to the identity matrix, which means all 7 errors have variance 1 and none are correlated, MinT is OLS. With W holding only the variances and 0 everywhere else, each forecast is weighted by 1 over its own error variance. That is weighted least squares, WLS. With the full W, the covariances enter the weights too.

The code estimates W, computes G_MinT, reconciles January 2025, adds up the reconciled error variances for each G, and checks that W as the identity matrix returns the OLS matrix.

```r
# Compute G for MinT from the residual covariance W and reconcile Jan 2025
W <- cov(res)
W_inv <- solve(W)
G_mint <- solve(t(S) %*% W_inv %*% S) %*% t(S) %*% W_inv
rec_mint <- reconcile(G_mint)

mint <- round(rec_mint, 1)
rbind(Base = yhat, MinT = mint, Adjustment = mint - yhat)
#>             Total North South    N1    N2    S1    S2
#> Base       1108.7 622.2 501.5 402.8 208.9 328.5 158.5
#> MinT       1115.7 623.9 491.8 401.6 222.3 331.7 160.1
#> Adjustment    7.0   1.7  -9.7  -1.2  13.4   3.2   1.6
is_coherent(rec_mint)
#> [1] TRUE

# Sum of the 7 reconciled error variances implied by W, for each G
error_variance <- function(G) sum(diag(S %*% G %*% W %*% t(G) %*% t(S)))
round(c(Base = sum(diag(W)), BottomUp = error_variance(G_bu),
        OLS = error_variance(G_ols), MinT = error_variance(G_mint)))
#>     Base BottomUp      OLS     MinT 
#>     8193     8187     8077     7888

# The same formula with W set to the identity matrix gives back the OLS matrix
I_inv <- solve(diag(7))
G_identity <- solve(t(S) %*% I_inv %*% S) %*% t(S) %*% I_inv
all.equal(G_identity, G_ols, check.attributes = FALSE)
#> [1] TRUE
```

Start with the adjustments. MinT moves Total up by 7.0, North up by 1.7 and South down by 9.7. Among the stores, N1 moves by -1.2 and N2 by 13.4, where OLS moved both by 2.5. The adjustments are uneven now, because W decides how the gaps are shared between the forecasts. The reconciled set is coherent, as the check confirms.

The next four numbers are the summed reconciled error variances that our estimate of W implies: 8193 for the base forecasts, 8187 for bottom-up, 8077 for OLS and 7888 for MinT. MinT's is the lowest, because minimising it is exactly what MinT does. These are variances implied by an estimate of W, not scores on new data, so they do not yet show how the methods forecast. Top-down is left out on purpose: the formula for the reconciled error covariance only holds for a G with \(S G S = S\), and top-down fails it.

The last check confirms the link between the two methods: the MinT formula with W as the identity matrix returns `G_ols`.

[KEY INSIGHT]
OLS and MinT differ only in W. OLS uses the identity matrix, so all 7 base forecasts count equally. MinT uses the estimated covariance of the errors, so the sizes and correlations of the errors decide how the gaps are shared.

=== step === quiz
## Quick check: how OLS and MinT treat errors of different sizes

Total's base forecast errors have a standard deviation of 54.0, and S2's have 22.9. How do OLS and MinT reconciliation treat that difference?

::quiz {"correct": 3, "gate": true, "difficulty": "intermediate"}
- Unequal error variances make OLS return forecasts that do not add up, so MinT is needed to get a coherent set. ::no
- OLS drops the forecasts with the largest errors and reconciles what is left. ::no
- OLS gives every forecast the same weight, whatever its error size or correlation, while MinT weights the forecasts through the inverse of W. Both return coherent forecasts. ::ok Yes. OLS is MinT with W set to the identity matrix, so the 54.0 against 22.9 never enters its weights. Both end with S, so both are coherent. The dial made a similar point about regression: ignoring the error structure leaves the fit statistic where it was and costs the intervals their coverage. Here the difference shows in how the gaps are shared: MinT moved N1 by -1.2 and N2 by 13.4, where OLS moved both by 2.5.
- MinT gives Total more weight than S2, because Total is the larger series. ::no Three of these mix up the weights with coherence or with size. Coherence comes from S, so every G gives coherent forecasts, whatever the error sizes. OLS drops nothing and gives all 7 base forecasts the same weight. MinT weights through the inverse of W, which depends on the sizes and correlations of the errors, not on how large the series is.

=== step === concept
## Estimating the error covariance W in practice

So far W came from 108 rows of residuals, which is plenty for 7 nodes. Real hierarchies are bigger, and then W is the weak point. A covariance matrix of k nodes has k(k + 1) / 2 distinct entries, k variances and k(k - 1) / 2 covariances, and all of them are estimated from the same residual rows.

With too few rows the sample covariance matrix becomes singular, which means it cannot be inverted, and the MinT formula needs \(W^{-1}\). A 7 by 7 matrix can be inverted only when its **rank**, the number of rows that are not a combination of the others, is 7, and the sample covariance of n rows has a rank of at most n - 1. To see it, the code keeps only the last 5 residual rows and estimates W from them.

```r
# Estimate W from only 5 residual rows and repair it with shrinkage
7 * 8 / 2
#> [1] 28
100 * 101 / 2
#> [1] 5050

W5 <- cov(res[104:108, ])
qr(W5)$rank
#> [1] 4
tryCatch({ solve(W5); "solve() worked" },
         error = function(e) "solve() failed: W5 is singular")
#> [1] "solve() failed: W5 is singular"

lambda <- 0.5
W5_shr <- lambda * diag(diag(W5)) + (1 - lambda) * W5
qr(W5_shr)$rank
#> [1] 7
dim(solve(W5_shr))
#> [1] 7 7
```

Our 7 nodes have 28 distinct entries in W, and 100 nodes would have 5,050. With 5 rows, the 7 by 7 matrix has a rank of 4 instead of 7, and `solve()` fails.

**Shrinkage** repairs this by blending the estimate with its own diagonal:

\[ W_{\text{shr}} = \lambda\, D + (1 - \lambda)\, W \]

Here D is the matrix that keeps the variances of W and has 0 elsewhere. In R that is `diag(diag(W5))`: the inner `diag()` pulls out the 7 variances, and the outer one builds a 7 by 7 matrix with them on the diagonal. With a lambda of 0.5 the blend has rank 7, so `solve()` works.

Lambda of 1 gives the diagonal matrix, which is WLS, and lambda of 0 gives the sample covariance. Reconciliation software picks lambda from the data with the shrinkage estimator of Schäfer and Strimmer, so you rarely set it by hand. Our 108 rows are far more than 7 nodes, so we keep the plain sample covariance, `cov(res)`, as W.

=== step === concept
## MinT against the other methods on the 2025 holdout

Now the test that matters: forecasts for months the models never saw. We reconcile all 12 forecast months of 2025 with each method's G and compare them with the actual sales. The measure is RMSE, the square root of the mean squared error, in units, computed at 4 levels: Total (1 series), Region (North and South), Store (4 series) and All (all 7 series pooled).

```r
# Reconcile every 2025 month with each method and score RMSE by level
groups <- list(Total = 1, Region = 2:3, Store = 4:7, All = 1:7)
rmse_by_level <- function(forecasts) {
  err <- test - forecasts
  sapply(groups, function(cols) sqrt(mean(err[, cols]^2)))
}
reconcile_all <- function(G) t(S %*% G %*% t(fc))

acc <- rbind(Base     = rmse_by_level(fc),
             BottomUp = rmse_by_level(reconcile_all(G_bu)),
             TopDown  = rmse_by_level(reconcile_all(G_td)),
             OLS      = rmse_by_level(reconcile_all(G_ols)),
             MinT     = rmse_by_level(reconcile_all(G_mint)))
acc <- round(acc, 1)
acc
#>          Total Region Store  All
#> Base      57.3   45.8  28.7 39.2
#> BottomUp  61.4   46.1  28.7 40.2
#> TopDown   57.3   44.8  32.7 40.7
#> OLS       58.3   45.3  28.4 39.1
#> MinT      56.6   43.8  27.9 38.1
round(100 * (acc["MinT", ] / acc["BottomUp", ] - 1), 1)
#>  Total Region  Store    All 
#>   -7.8   -5.0   -2.8   -5.2
```

Lower is better. The Base row is the reference: those forecasts are not coherent, but it shows what each node's own model achieves.

MinT has the lowest RMSE at every level: 56.6 at Total, 43.8 for the regions, 27.9 for the stores and 38.1 over all 7 series. Against bottom-up, that is 7.8% lower at Total, 5.0% at Region, 2.8% at Store and 5.2% overall. Those percentages come from the printed RMSE, so you can redo them by hand.

Three other rows are worth reading.

- Bottom-up's Total RMSE is 61.4, worse than the 57.3 of the Total fitted directly. Its Total forecast is the sum of the 4 store forecasts, so its Total error is the sum of the 4 store errors.
- Top-down's Total is the base Total, so it has the same 57.3, but its Store RMSE is 32.7, the highest in the column. The next step looks at why.
- OLS is within 1.0 of the base RMSE at every level: 58.3 against 57.3 at Total, and 39.1 against 39.2 over all 7 series.

One more thing to keep in mind. These are 12 months of one simulated hierarchy, which is a single draw. A different window, or a different set of simulated sales, could change the ranking, so read the table as one example of how the methods behave, not as proof that MinT always wins.

=== step === widget
## Why top-down is less accurate at the store level

Top-down splits the Total forecast with fixed shares, the training averages. That works only while each store keeps the same share of Total. N1 has the steepest trend of the four stores, 1.2 units a month, so its share of Total should be drifting up.

The code computes N1's share of each year's Total sales, and then the mean error of the N1 forecast in 2025, actual minus forecast, for top-down, bottom-up and MinT.

```r
# Compute the N1 share of Total sales for each year and compare 2025 errors
year <- floor(time(Y) + 1e-6)
n1_share <- 100 * tapply(Y[, "N1"], year, sum) / tapply(Y[, "Total"], year, sum)
round(n1_share, 1)
#> 2016 2017 2018 2019 2020 2021 2022 2023 2024 2025 
#> 33.3 33.2 33.0 32.5 35.1 34.3 34.5 35.7 35.6 36.8
round(cor(as.numeric(names(n1_share)), n1_share), 2)
#> [1] 0.88
round(100 * share[["N1"]], 1)
#> [1] 34.2

n1_error <- function(G) mean(test[, "N1"] - reconcile_all(G)[, "N1"])
round(c(TopDown = n1_error(G_td), BottomUp = n1_error(G_bu), MinT = n1_error(G_mint)), 1)
#>  TopDown BottomUp     MinT 
#>     36.0      8.3      3.1
```

N1's share was 33.3% of Total in 2016 and 36.8% in 2025, and its correlation with the year is 0.88. Top-down used 34.2%, the average over the training months, for every month of 2025. The chart plots the yearly shares, and the point view of the widget shows the same correlation, 0.88.

::widget chart-plotter {"data":[{"x":2016,"y":33.3},{"x":2017,"y":33.2},{"x":2018,"y":33.0},{"x":2019,"y":32.5},{"x":2020,"y":35.1},{"x":2021,"y":34.3},{"x":2022,"y":34.5},{"x":2023,"y":35.7},{"x":2024,"y":35.6},{"x":2025,"y":36.8}],"geoms":["point","line","bar"],"x":"year","y":"n1_share_pct"}

So the share of 34.2% was too low for 2025, and the errors show what that does. Averaged over the 12 months, top-down's N1 forecast was 36.0 units below the actual sales. Bottom-up's was 8.3 below and MinT's was 3.1 below.

Top-down fails \(S G S = S\), which is what makes fixed shares a problem. Unless the true store mix matches the fixed shares, its store forecasts are biased, even when the base forecasts are unbiased. MinT uses no shares at all: its G is built from S and W.

=== step === quiz
## Quick check: what explains top-down's store-level error

Top-down had a Store RMSE of 32.7 on the 2025 holdout, against 27.9 for MinT. What explains the gap?

::quiz {"correct": 2, "gate": true, "difficulty": "advanced"}
- Any method that makes forecasts add up gives up some store accuracy, and top-down pays that price. ::no
- It splits the Total forecast by average shares while N1's share kept rising, and its G fails S G S = S, so its store forecasts are biased. ::ok Yes. The average share for N1 was 34.2%, while its share of the 2025 sales was 36.8%, and its forecast came out 36.0 units too low on average. Fixed shares assume that the past store mix holds, and here it did not.
- Its Total forecast is worse than bottom-up's, and that error carries into the stores. ::no
- MinT also splits the Total by shares, so it should show the same error. ::no Look back at the RMSE table. Coherent methods did not lose store accuracy: MinT has the lowest Store RMSE at 27.9, and OLS at 28.4 beats the base forecasts at 28.7. Top-down's Total RMSE of 57.3 is better than bottom-up's 61.4. And MinT uses no shares, since its G comes from S and W. What is left is the fixed shares, which bias the store forecasts once the store mix drifts, because top-down fails S G S = S.

=== step === tryit
## Your turn: reconcile with variance scaling (WLS)

MinT with a W that keeps only the variances is variance scaling, or WLS. Build that G, reconcile the January 2025 base forecasts with it, and check the result is coherent.

`S`, `W`, `yhat`, `reconcile()` and `is_coherent()` are still in your session. Build `W_diag` from `W`, then write `G_wls` with the MinT formula using `W_diag` in place of `W`.

```r
# Reconcile Jan 2025 with variance scaling (WLS) and check the result is coherent
# S is the summing matrix, W the 7 by 7 covariance of the training residuals
# and yhat the 7 base forecasts for Jan 2025.
# Build W_diag: the variances of W on the diagonal and 0 everywhere else.
# Then write G_wls with the MinT formula, using W_diag in place of W,
# reconcile yhat with it and check that the result is coherent.
# Press Check when you have them.
```
::check {"regex": "^(?=[\\s\\S]*diag[(]diag[(]W[)][)])(?=[\\s\\S]*solve[(]t[(]S[)]\\s*%\\*%)", "gate": true, "difficulty": "intermediate", "ok": "Yes: Total 1109.9, North 616.7, South 493.2 and the stores 405.3, 211.3, 331.9 and 161.3. The four stores add to 1109.8 against a printed Total of 1109.9, the 0.1 that rounding to 1 decimal leaves. The set is coherent, as every method that ends with S must be.", "no": "Build W_diag with diag(diag(W)), invert it with solve(), and write G_wls as solve(t(S) %*% W_inv %*% S) %*% t(S) %*% W_inv, where W_inv is the inverse of W_diag. Then reconcile with reconcile(G_wls)."}
::solution
```r
# Reconcile Jan 2025 with variance scaling (WLS)
W_diag <- diag(diag(W))
W_inv  <- solve(W_diag)
G_wls  <- solve(t(S) %*% W_inv %*% S) %*% t(S) %*% W_inv
rec_wls <- reconcile(G_wls)
round(rec_wls, 1)
#>  Total  North  South     N1     N2     S1     S2 
#> 1109.9  616.7  493.2  405.3  211.3  331.9  161.3
is_coherent(rec_wls)
#> [1] TRUE
```

`diag(W)` pulls out the 7 variances, and the outer `diag()` places them on a diagonal with 0 elsewhere. With that W, each base forecast is weighted by 1 over its own error variance, and the covariances are ignored. The result is coherent, like every method that ends with S.

=== step === concept
## References
::prose-only a list of sources, nothing to draw

- [Optimal forecast reconciliation for hierarchical and grouped time series through trace minimization](https://doi.org/10.1080/01621459.2018.1448825) - Wickramasuriya, Athanasopoulos and Hyndman (2019), Journal of the American Statistical Association 114(526), 804-819. The MinT paper.
- [Optimal combination forecasts for hierarchical time series](https://doi.org/10.1016/j.csda.2011.03.006) - Hyndman, Ahmed, Athanasopoulos and Shang (2011), Computational Statistics and Data Analysis 55(9), 2579-2589. The regression form behind OLS reconciliation.
- [Forecasting: Principles and Practice, chapter 11 on hierarchical and grouped time series](https://otexts.com/fpp3/hierarchical.html) - Hyndman and Athanasopoulos (2021), 3rd edition, OTexts.
- [A shrinkage approach to large-scale covariance matrix estimation and implications for functional genomics](https://doi.org/10.2202/1544-6115.1175) - Schäfer and Strimmer (2005), Statistical Applications in Genetics and Molecular Biology 4(1), article 32.
- [Automatic time series forecasting: the forecast package for R](https://doi.org/10.18637/jss.v027.i03) - Hyndman and Khandakar (2008), Journal of Statistical Software 27(3), 1-22. The source of `ets()`.

=== step === complete
## Quick recap

You took 7 forecasts that did not add up and reconciled them with bottom-up, top-down, OLS, MinT and WLS, and saw what separates one method from the next. To summarize:

- Forecasts made node by node are not coherent. The Total forecast for January 2025 was 15.0 below North plus South, and the hierarchy is written as \(y = S b\).
- Every reconciliation method is \(S G \hat{y}\), and G is the only difference. Bottom-up and top-down are two choices of G, and \(S G S = S\) is the condition that leaves a coherent set unchanged. Top-down fails it.
- OLS is a regression of the base forecasts on the columns of S. It gives every forecast the same weight, which suits errors with equal variance that are uncorrelated. Here Total's error variance was 5.6 times S2's.
- MinT uses \(G = (S^{\top} W^{-1} S)^{-1} S^{\top} W^{-1}\), so the sizes and correlations of the errors decide how the gaps are shared. W has to be estimated from residuals, and shrinkage repairs it when they are few.
- One holdout is one draw. In 2025, MinT had the lowest RMSE at every level, 7.8% below bottom-up at Total, and another window could rank the methods differently.

So when someone asks what MinT does, the answer is short: "It reconciles the base forecasts with the G that minimises the summed error variances, using the covariance of the forecast errors as the weights."

In the next part, you will run this same workflow in the fable grammar, where `reconcile()` with `min_trace()` does the S, W and G work for you. Well done for making it through.

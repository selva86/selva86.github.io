---
title: "Linear Regression, Properly Lesson 4: Robust standard errors, and when they are not enough"
catalog_blurb: "Why your regression's standard error can be wrong even when the coefficient is right."
description: "A retail chain's 50 stores show how heteroskedasticity and clustering break a regression's standard error, and the sandwich and cluster-robust fixes for each."
keywords: "robust standard errors, heteroskedasticity, HC1 standard error, sandwich estimator, White's standard error, cluster-robust standard errors, clustered data, intraclass correlation, vcovHC, coeftest, confidence interval coverage, lm, R"
post_type: "LESSON"
curriculum_id: "4.60.4"
webr: true
mathjax: false
lesson_access: "pro"
course_id: "res-linear-models"
course_title: "Linear Regression, Properly"
course_lesson: "4"
course_total: "8"
course_landing: "Linear-Regression-Properly-Course.html"
course_next: "Weighting-Observations-That-Deserve-Less-Say.html"
course_prev: "Diagnosing-Collinearity-Without-Panicking.html"
---

=== step === cover
## Robust standard errors, and when they are not enough

Today let's understand robust standard errors clearly: when a regression's own standard error can be trusted, and when it cannot.

A retail chain tracks weekly online ad spend and weekly sales across its 50 stores. Ad spend is in hundreds of dollars, sales in thousands. Look at how far sales scatter from the trend as ad spend rises.

::widget chart-plotter {"data": [{"x": 1.0, "y": 11.04}, {"x": 1.0, "y": 9.78}, {"x": 1.0, "y": 10.39}, {"x": 1.1, "y": 10.60}, {"x": 1.2, "y": 10.47}, {"x": 1.2, "y": 10.10}, {"x": 1.4, "y": 11.40}, {"x": 1.5, "y": 10.15}, {"x": 1.6, "y": 11.98}, {"x": 1.8, "y": 10.21}, {"x": 2.0, "y": 11.60}, {"x": 2.2, "y": 12.78}, {"x": 2.4, "y": 8.78}, {"x": 2.7, "y": 10.06}, {"x": 3.0, "y": 10.27}, {"x": 3.2, "y": 11.38}, {"x": 3.6, "y": 10.10}, {"x": 3.9, "y": 6.16}, {"x": 4.2, "y": 6.31}, {"x": 4.6, "y": 13.21}, {"x": 5.0, "y": 10.12}, {"x": 5.4, "y": 6.91}, {"x": 5.8, "y": 10.47}, {"x": 6.3, "y": 13.99}, {"x": 6.8, "y": 16.10}, {"x": 7.2, "y": 9.87}, {"x": 7.8, "y": 10.39}, {"x": 8.3, "y": 5.59}, {"x": 8.8, "y": 12.88}, {"x": 9.4, "y": 9.11}, {"x": 10.0, "y": 13.23}, {"x": 10.6, "y": 14.42}, {"x": 11.2, "y": 16.05}, {"x": 11.9, "y": 9.07}, {"x": 12.6, "y": 14.27}, {"x": 13.2, "y": 3.53}, {"x": 14.0, "y": 8.02}, {"x": 14.7, "y": 7.57}, {"x": 15.4, "y": -1.43}, {"x": 16.2, "y": 12.65}, {"x": 17.0, "y": 13.84}, {"x": 17.8, "y": 10.31}, {"x": 18.6, "y": 17.95}, {"x": 19.5, "y": 7.75}, {"x": 20.4, "y": 2.88}, {"x": 21.2, "y": 16.52}, {"x": 22.2, "y": 6.78}, {"x": 23.1, "y": 25.57}, {"x": 24.0, "y": 9.85}, {"x": 25.0, "y": 19.68}], "geoms": ["point"], "x": "ad_spend", "y": "sales"}

The scatter fans out. Stores spending a little sit close to the trend line, but stores spending a lot land far above it or far below it. That widening fan is what this lesson is about.

=== step === concept
## Unequal spread, not unequal effect

The pattern in that scatter has a name. When the spread of the outcome around its trend changes across a predictor's range, statisticians call it heteroskedasticity: hetero for unequal, skedasticity for spread. When the spread stays about the same everywhere, that is homoskedasticity.

Build the 50 stores and look at the numbers directly.

```r
# Generate the chain's 50 stores: ad spend and sales, with a true effect of 0.15 built in
set.seed(42)
n_stores <- 50
t <- seq(0, 1, length.out = n_stores)
ad_spend <- round(1 + 24 * t^2, 1)
sigma <- 0.3 + 0.35 * ad_spend
sales <- round(10 + 0.15 * ad_spend + rnorm(n_stores, 0, sigma), 2)
store_data <- data.frame(ad_spend, sales)
store_data
#>    ad_spend sales
#> 1       1.0 11.04
#> 2       1.0  9.78
#> 3       1.0 10.39
#> 4       1.1 10.60
#> 5       1.2 10.47
#> 6       1.2 10.10
#> 7       1.4 11.40
#> 8       1.5 10.15
#> 9       1.6 11.98
#> 10      1.8 10.21
#> 11      2.0 11.60
#> 12      2.2 12.78
#> 13      2.4  8.78
#> 14      2.7 10.06
#> 15      3.0 10.27
#> 16      3.2 11.38
#> 17      3.6 10.10
#> 18      3.9  6.16
#> 19      4.2  6.31
#> 20      4.6 13.21
#> 21      5.0 10.12
#> 22      5.4  6.91
#> 23      5.8 10.47
#> 24      6.3 13.99
#> 25      6.8 16.10
#> 26      7.2  9.87
#> 27      7.8 10.39
#> 28      8.3  5.59
#> 29      8.8 12.88
#> 30      9.4  9.11
#> 31     10.0 13.23
#> 32     10.6 14.42
#> 33     11.2 16.05
#> 34     11.9  9.07
#> 35     12.6 14.27
#> 36     13.2  3.53
#> 37     14.0  8.02
#> 38     14.7  7.57
#> 39     15.4 -1.43
#> 40     16.2 12.65
#> 41     17.0 13.84
#> 42     17.8 10.31
#> 43     18.6 17.95
#> 44     19.5  7.75
#> 45     20.4  2.88
#> 46     21.2 16.52
#> 47     22.2  6.78
#> 48     23.1 25.57
#> 49     24.0  9.85
#> 50     25.0 19.68
```

The true effect, 0.15, is the number sitting right there in `10 + 0.15 * ad_spend`: every extra hundred dollars of ad spend adds 0.15 thousand dollars to sales, on average. Because this is simulated data, you get to know that truth exactly, instead of having to guess at it.

Ad spend itself is right-skewed: most stores spend modestly, and a few spend heavily, up near 25. Now fit the trend, and compare how far sales scatter from it when ad spend is low against when it is high.

```r
# Fit the trend, then compare how far sales scatter from it when ad spend is low versus high
fit_naive <- lm(sales ~ ad_spend, data = store_data)
resid_naive <- residuals(fit_naive)
low_half <- store_data$ad_spend <= median(store_data$ad_spend)
c(low_sd = sd(resid_naive[low_half]), high_sd = sd(resid_naive[!low_half]))
#>   low_sd  high_sd 
#> 2.165914 5.659479 
```

Among the 25 stores spending the least, sales scatter around the trend with a standard deviation of 2.17. Among the 25 spending the most, that scatter widens to 5.66, about 2.6 times as much. The upward trend itself is not in question here. What is in question is how far you can trust the standard error attached to it.

=== step === concept
## The coefficient is still right, on average

You already know the true slope is 0.15. Redraw the chain's sales 1,000 times from that exact model, refitting the regression each time, and see where the estimated slope lands on average.

```r
# Redraw the chain's sales 1,000 times from the same model and refit each time
set.seed(42)
sims <- 1000
coef_draws <- numeric(sims)
for (i in seq_len(sims)) {
  sales_i <- 10 + 0.15 * ad_spend + rnorm(n_stores, 0, sigma)
  coef_draws[i] <- coef(lm(sales_i ~ ad_spend))["ad_spend"]
}
mean(coef_draws)
#> [1] 0.1434572
```

Averaged over 1,000 fresh samples, the estimated slope comes out at 0.1435, close to the true 0.15. Heteroskedasticity has not pulled the coefficient away from the truth. What it has done is put the model's own measure of uncertainty, its standard error, in question.

=== step === widget
## Coverage collapses while the fit sits still

Every time you fit sales on ad spend, R hands back a coefficient and a standard error, and from those two you can build a 95% confidence interval for the true slope. Build that same interval on study after study, each time from a fresh batch of data, and about 95% of those intervals should contain the true value. That long-run hit rate is called the interval's coverage.

The widget below runs that experiment thousands of times at once, on a standardized predictor it builds for itself rather than the chain's own ad spend. Its severity dial reproduces exactly the kind of fan-shaped spread you saw in the scatter at the start of this lesson, just with a stand-in predictor playing the part of ad spend.

::widget assumption-dial {"assumption": "heteroskedasticity"}

Drag the dial from none to severe, and watch two numbers: the coverage, and R-squared, the model's usual measure of fit. As severity rises, coverage falls well below the nominal 95%, while R-squared barely moves. The model fits about as well as it ever did. It is only the interval's coverage that breaks down.

=== step === concept
## What this costs on the chain's own numbers

Go back to the chain's own 50 stores and put a real number on that collapse. `fit_naive` already holds the regression of sales on ad spend. Read its standard error for the ad spend coefficient.

```r
# Read the naive standard error for the ad spend coefficient on this one sample
coef(summary(fit_naive))["ad_spend", "Std. Error"]
#> [1] 0.08322405
```

That is the number an ordinary `summary()` call hands back, the one most people read off and trust without a second thought. Now check what it is actually worth. Run the chain's own generative model 5,000 times, each time building the usual 95% interval around the slope and checking whether it contains the true 0.15.

```r
# Over 5,000 redraws, check how often the naive 95% interval contains the true slope of 0.15
set.seed(42)
sims <- 5000
true_beta <- 0.15
hits_naive <- 0
for (i in seq_len(sims)) {
  sales_i <- 10 + 0.15 * ad_spend + rnorm(n_stores, 0, sigma)
  fit_i <- lm(sales_i ~ ad_spend)
  ci <- confint(fit_i)["ad_spend", ]
  if (ci[1] < true_beta && true_beta < ci[2]) hits_naive <- hits_naive + 1
}
hits_naive / sims
#> [1] 0.8226
```

Instead of 95%, the naive interval covers the truth only 82.3% of the time. More than 1 in 6 of these intervals would miss the true effect entirely, built from a standard error that heteroskedasticity has quietly undermined.

=== step === concept
## The fix: a heteroskedasticity-consistent standard error

White's HC1 estimator is the standard repair. Instead of assuming one shared variance for every row, the way the naive formula does, it weighs each row's own squared residual into the coefficient's variance. Rows with a big residual, the high-spend stores, count for more uncertainty than rows with a small one. Build it directly from that idea.

```r
# Build White's HC1 standard error by hand, weighing each row's own squared residual
library(sandwich)
library(lmtest)
X_design <- model.matrix(fit_naive)
p_params <- ncol(X_design)
e_resid <- residuals(fit_naive)
bread <- solve(t(X_design) %*% X_design)
meat <- t(X_design) %*% diag(e_resid^2) %*% X_design
hc1_vcov <- bread %*% meat %*% bread * (n_stores / (n_stores - p_params))
sqrt(diag(hc1_vcov))["ad_spend"]
#>  ad_spend 
#> 0.1113104 
```

Now check that hand-built number against the `sandwich` package, read through `coeftest()`.

```r
# Check the hand-built number against the sandwich package
coeftest(fit_naive, vcov = vcovHC(fit_naive, type = "HC1"))
#>
#> t test of coefficients:
#>
#>             Estimate Std. Error t value Pr(>|t|)    
#> (Intercept)  9.88735    0.67540  14.639   <2e-16 ***
#> ad_spend     0.10208    0.11131   0.917   0.3637    
#> ---
#> Signif. codes:  0 '***' 0.001 '**' 0.01 '*' 0.05 '.' 0.1 ' ' 1
```

Same number to four decimals, 0.1113 against the naive 0.0832. The coefficient itself, 0.102, has not moved by a cent, only the standard error has grown to reflect the uneven spread properly. Check what that buys you in coverage, over the same 5,000 redraws as before.

```r
# Over the same 5,000 redraws, check how often the HC1 interval contains the truth
set.seed(42)
sims <- 5000
hits_hc1 <- 0
for (i in seq_len(sims)) {
  sales_i <- 10 + 0.15 * ad_spend + rnorm(n_stores, 0, sigma)
  fit_i <- lm(sales_i ~ ad_spend)
  e_i <- residuals(fit_i)
  meat_i <- t(X_design) %*% diag(e_i^2) %*% X_design
  vcov_i <- bread %*% meat_i %*% bread * (n_stores / (n_stores - p_params))
  se_i <- sqrt(diag(vcov_i))["ad_spend"]
  b1 <- coef(fit_i)["ad_spend"]
  tcrit <- qt(0.975, n_stores - p_params)
  if (b1 - tcrit * se_i < true_beta && true_beta < b1 + tcrit * se_i) hits_hc1 <- hits_hc1 + 1
}
hits_hc1 / sims
#> [1] 0.9172
```

Coverage rises from 82.3% to 91.7%, without moving the coefficient at all. That is what "robust" means here: robust to unequal spread, specifically, not to every way an assumption can break.

=== step === concept
## A harder case: weeks that share their store

Ad spend's uneven scatter is one way a regression's assumptions can break. Here is a second, different one, on a new slice of the same chain.

Twenty of the chain's stores ran a loyalty promotion: ten were given the promotion, ten were not, and every one of the 20 was tracked for 5 weeks. That is 100 rows in all. Each week's outcome, y, sits on a standardized scale, where a difference of 1 is one standard deviation of a typical week's result, which is what lets a true effect of 0.5 count directly as half of one standard deviation.

```r
# Build 20 of the chain's stores, half running a loyalty promotion, each tracked for 5 weeks
set.seed(42)
k <- 20
m <- 5
n_promo <- k * m
tau <- 0.5
rho <- 0.30
arm <- rep(rep(0:1, length.out = k), each = m)
store_id <- rep(1:k, each = m)
y <- tau * arm + sqrt(rho) * rnorm(k)[store_id] + sqrt(1 - rho) * rnorm(n_promo)
promo_data <- data.frame(y, arm, store_id)
round(head(promo_data, 10), 2)
#>        y arm store_id
#> 1   0.49   0        1
#> 2  -0.74   0        1
#> 3   0.61   0        1
#> 4   1.77   0        1
#> 5   2.34   0        1
#> 6  -0.17   1        2
#> 7  -0.02   1        2
#> 8  -1.28   1        2
#> 9   0.58   1        2
#> 10 -0.34   1        2
```

Ten stores got the promotion (`arm = 1`), ten did not (`arm = 0`), each contributing 5 rows, one per week. The true promotion effect built into this data is 0.5 on that same standardized scale.

Here is the problem. The 5 weeks from one store are not 5 independent pieces of information. A store that runs unusually strong this month tends to stay unusually strong for all 5 of its weeks. Compare how much store averages move around against how much individual weeks do.

```r
# Compare how much store averages move around against how much individual weeks do
store_means <- tapply(promo_data$y, promo_data$store_id, mean)
c(sd_of_store_means = sd(store_means), sd_of_all_weeks = sd(promo_data$y))
#> sd_of_store_means  sd_of_all_weeks 
#>         0.8464875        1.0977290 
```

If the 5 weeks inside a store were truly independent, averaging them should shrink the spread by a factor of the square root of 5, down to about 1.0977 / sqrt(5) = 0.49. Instead, the store averages have a standard deviation of 0.8465, nearly twice as wide as independence would predict. The weeks inside a store are moving together. Statisticians call this correlation inside a group the intraclass correlation, and here it is 0.30, baked into the data on purpose.

=== step === widget
## One standard error moves, one doesn't

The widget below runs this exact design: 20 clusters of 5, a true effect of 0.5, which is exactly `promo_data`'s own setup. Set its intraclass-correlation dial to 0.30, the number you just measured, and read its table of four standard errors side by side.

::widget cluster-icc-sim {"k": 20, "m": 5, "tau": 0.5, "start": 6}

At an intraclass correlation of 0.30, ordinary OLS and the heteroskedasticity-robust HC1 standard error land on almost the same number, and both intervals cover the true effect far less often than 95% should. Only the cluster-robust standard error, which treats each of the 20 stores, not each of the 100 rows, as one piece of evidence, pulls coverage back up near where it belongs.

::quiz {"correct": 2, "gate": true, "difficulty": "intermediate"}
- A heteroskedasticity-consistent (HC1) standard error ::no
- A cluster-robust standard error ::ok Right. HC1 still assumes every row is independent, which is exactly the assumption clustering breaks. A cluster-robust standard error treats each store, not each week, as one piece of evidence, and that is what actually restores coverage.
- A larger sample size ::no
- Keeping one row per store instead of five ::no A bigger sample does not fix a design problem; the widget's own table shows HC1 tracking the naive standard error almost exactly, no matter how many rows feed it, because it still assumes independent rows. Collapsing to one row per store would remove the clustering problem too, but at the cost of throwing away four-fifths of the data. A cluster-robust standard error gets the same correction while keeping every row.

=== step === concept
## Confirming it on the chain's own data

Fit the promotion effect directly on `promo_data`, and compare its naive and HC1 standard errors.

```r
# Fit the promotion effect, then compare its naive and HC1 standard errors
promo_fit <- lm(y ~ arm, data = promo_data)
c(naive_se = coef(summary(promo_fit))["arm", "Std. Error"],
  hc1_se   = coeftest(promo_fit, vcov = vcovHC(promo_fit, type = "HC1"))["arm", "Std. Error"])
#>  naive_se    hc1_se 
#> 0.2191822 0.2191822
```

They are identical to four decimals, 0.2192 either way. HC1 reweighs each row's own squared residual, but it still treats all 100 rows as 100 separate pieces of information, so on data built around 20 clusters it has nothing new to say. Check what that costs in coverage, over 5,000 redraws of this exact design.

```r
# Over 5,000 redraws, check how often naive and HC1 intervals contain the true effect of 0.5
X_promo <- model.matrix(promo_fit)
p_promo <- ncol(X_promo)
set.seed(42)
sims <- 5000
hit_naive_p <- 0
hit_hc1_p <- 0
tcrit_naive_p <- qt(0.975, n_promo - p_promo)
for (i in seq_len(sims)) {
  yi <- tau * arm + sqrt(rho) * rnorm(k)[store_id] + sqrt(1 - rho) * rnorm(n_promo)
  fit_i <- lm(yi ~ arm)
  b1 <- coef(fit_i)["arm"]
  se_n <- coef(summary(fit_i))["arm", "Std. Error"]
  e_i <- residuals(fit_i)
  meat_i <- t(X_promo) %*% diag(e_i^2) %*% X_promo
  vcov_i <- solve(t(X_promo) %*% X_promo) %*% meat_i %*% solve(t(X_promo) %*% X_promo) * (n_promo / (n_promo - p_promo))
  se_h <- sqrt(diag(vcov_i))["arm"]
  if (b1 - tcrit_naive_p * se_n < tau && tau < b1 + tcrit_naive_p * se_n) hit_naive_p <- hit_naive_p + 1
  if (b1 - tcrit_naive_p * se_h < tau && tau < b1 + tcrit_naive_p * se_h) hit_hc1_p <- hit_hc1_p + 1
}
c(naive_coverage = hit_naive_p / sims, hc1_coverage = hit_hc1_p / sims)
#> naive_coverage   hc1_coverage 
#>         0.8132         0.8132 
```

Both intervals cover the true promotion effect only 81.3% of the time instead of 95%, and they agree with each other almost exactly. The heteroskedasticity-robust repair, HC1, does nothing here, because clustering is a different violation with a different repair.

=== step === concept
## The fix: a cluster-robust standard error

A cluster-robust standard error applies the same sandwich idea as HC1, but at the level of the store rather than the row. Sum each store's residuals first, before squaring, so that 5 correlated weeks from one store cannot each count as a fresh piece of evidence the way 5 independent rows would.

```r
# Build a cluster-robust standard error by hand: sum each store's residuals, then square
cluster_sum <- function(fit, X, cluster) {
  u <- residuals(fit)
  clusters <- unique(cluster)
  meat <- matrix(0, ncol(X), ncol(X))
  for (g in clusters) {
    idx <- cluster == g
    score_g <- t(X[idx, , drop = FALSE]) %*% u[idx]
    meat <- meat + score_g %*% t(score_g)
  }
  meat
}
n_total <- nrow(X_promo)
G <- length(unique(promo_data$store_id))
bread_promo <- solve(t(X_promo) %*% X_promo)
meat_cluster <- cluster_sum(promo_fit, X_promo, promo_data$store_id)
cf <- (G / (G - 1)) * ((n_total - 1) / (n_total - p_promo))
cr_vcov <- bread_promo %*% meat_cluster %*% bread_promo * cf
sqrt(diag(cr_vcov))["arm"]
#>       arm 
#> 0.3760008 
```

That is 0.376, well above the naive and HC1 reading of 0.2192, because it is accounting for only 20 independent clusters instead of 100 independent rows. Locally, this hand-built number matches what `sandwich::vcovCL()` would return; that function is not yet proven to run in the browser, so the formula above carries the lesson. Check what the cluster-robust standard error buys you, over the same 5,000 redraws as before.

```r
# Over the same 5,000 redraws, check the cluster-robust interval's coverage
set.seed(42)
sims <- 5000
hit_cr_p <- 0
tcrit_cr20 <- qt(0.975, G - 1)
for (i in seq_len(sims)) {
  yi <- tau * arm + sqrt(rho) * rnorm(k)[store_id] + sqrt(1 - rho) * rnorm(n_promo)
  fit_i <- lm(yi ~ arm)
  b1 <- coef(fit_i)["arm"]
  meat_i <- cluster_sum(fit_i, X_promo, store_id)
  vcov_i <- bread_promo %*% meat_i %*% bread_promo * cf
  se_c <- sqrt(diag(vcov_i))["arm"]
  if (b1 - tcrit_cr20 * se_c < tau && tau < b1 + tcrit_cr20 * se_c) hit_cr_p <- hit_cr_p + 1
}
hit_cr_p / sims
#> [1] 0.95
```

Coverage reaches 95.0%, right where it should be. Two different problems, the uneven spread in the ad-spend example and the shared store-level correlation here, needed two different repairs, and using the wrong one left coverage broken both times.

=== step === concept
## When even the fix is optimistic: few clusters

A cluster-robust standard error needs enough clusters to be trusted, because the correction itself has to be estimated from those clusters. Rerun the identical promotion with only 6 of the 20 stores, same true effect, same intraclass correlation, and check coverage again.

```r
# Rerun the identical promotion with only 6 of the 20 stores and check coverage again
set.seed(42)
k6 <- 6
n_promo6 <- k6 * m
arm6 <- rep(rep(0:1, length.out = k6), each = m)
store_id6 <- rep(1:k6, each = m)
sims <- 5000
hit_cr6 <- 0
tcrit_cr6 <- qt(0.975, k6 - 1)
for (i in seq_len(sims)) {
  yi <- tau * arm6 + sqrt(rho) * rnorm(k6)[store_id6] + sqrt(1 - rho) * rnorm(n_promo6)
  fit_i <- lm(yi ~ arm6)
  b1 <- coef(fit_i)["arm6"]
  X6 <- model.matrix(fit_i)
  bread6 <- solve(t(X6) %*% X6)
  meat6 <- cluster_sum(fit_i, X6, store_id6)
  cf6 <- (k6 / (k6 - 1)) * ((n_promo6 - 1) / (n_promo6 - 2))
  vcov6 <- bread6 %*% meat6 %*% bread6 * cf6
  se_c <- sqrt(diag(vcov6))[2]
  if (b1 - tcrit_cr6 * se_c < tau && tau < b1 + tcrit_cr6 * se_c) hit_cr6 <- hit_cr6 + 1
}
hit_cr6 / sims
#> [1] 0.9236
```

With only 6 clusters, the same cluster-robust formula covers the truth just 92.4% of the time, short of both the 95% target and the 95.0% the full 20 stores reached. The formula has not changed; what changed is that a correction built from only 6 groups is itself a noisy estimate. The fewer the clusters, the more that correction can understate the real uncertainty.

[WARNING]
A cluster-robust standard error is not automatically safe just because it has the right name. With a handful of clusters it can still be optimistic, and no amount of rows within those clusters fixes that, because the correction is counted in clusters, not rows.

=== step === quiz
## Quick check: choosing the right standard error

A clinical-lab analyst fits turnaround time on sample volume across 200 lab-days. No lab-day repeats and none of the 200 rows share a group. The residuals fan out: turnaround times barely vary on light days and vary a lot on heavy days. Which standard error is the correct fix?

::quiz {"correct": 2, "gate": true, "difficulty": "intermediate"}
- Keep the default standard error, since the coefficient itself is still unbiased ::no
- A heteroskedasticity-consistent (HC1, sandwich) standard error ::ok Right. The rows here are independent, no lab-day repeats and no shared group, so the only broken assumption is unequal spread, and that is exactly what a sandwich standard error repairs.
- A cluster-robust standard error ::no
- Drop sample volume from the model entirely ::no Dropping sample volume throws away the one predictor that explains turnaround time, which fixes nothing and makes the model worse. The rows here are independent, so a cluster-robust standard error has no groups to correct for and would land close to the default anyway. The default standard error is exactly what unequal spread breaks. A heteroskedasticity-consistent standard error is built for precisely this case: independent rows, unequal spread.

=== step === tryit
## Your turn: the clustered promotion, reported honestly

`promo_fit` and the cluster-robust covariance object `cr_vcov` are both still sitting in your session. Write the `coeftest()` call that reports `promo_fit`'s effect using the standard error that can actually be trusted on this clustered data.

```r
# Report promo_fit's effect with the standard error that can be trusted here

```
::check {"regex": "coeftest\\s*[(]\\s*promo_fit\\s*,\\s*vcov\\s*=\\s*cr_vcov", "gate": true, "difficulty": "intermediate", "ok": "Right. coeftest(promo_fit, vcov = cr_vcov) reports the arm coefficient with a standard error of 0.376, the honest, cluster-robust one, instead of the naive 0.2192 that both ordinary OLS and HC1 agreed on.", "no": "Call coeftest() on promo_fit, and set its vcov argument to cr_vcov, the cluster-robust covariance object already sitting in your session: coeftest(promo_fit, vcov = cr_vcov)."}
::solution
```r
# Report promo_fit's effect with the standard error that can be trusted here
coeftest(promo_fit, vcov = cr_vcov)
#>
#> t test of coefficients:
#>
#>             Estimate Std. Error t value Pr(>|t|)
#> (Intercept)  0.22645    0.27978  0.8094   0.4203
#> arm          0.25265    0.37600  0.6720   0.5032
```

The estimated promotion effect, 0.25, has not changed from any other fit of this model. What changed is the standard error attached to it, 0.376 instead of 0.2192, and with it the honest conclusion: on 20 clusters, this effect is far less certain than the naive reading suggested.

=== step === concept
## References

- [A Heteroskedasticity-Consistent Covariance Matrix Estimator and a Direct Test for Heteroskedasticity](https://doi.org/10.2307/1912934) - White, H. (1980), Econometrica 48(4), 817-838. The original sandwich estimator this lesson builds by hand.
- [Some Heteroskedasticity-Consistent Covariance Matrix Estimators with Improved Finite Sample Properties](https://doi.org/10.1016/0304-4076%2885%2990158-7) - MacKinnon, J.G. and White, H. (1985), Journal of Econometrics 29(3), 305-325. Source of the HC1 finite-sample correction used here.
- [A Practitioner's Guide to Cluster-Robust Inference](https://doi.org/10.3368/jhr.50.2.317) - Cameron, A.C. and Miller, D.L. (2015), Journal of Human Resources 50(2), 317-372. The reference for cluster-robust standard errors and the caution that few clusters leave even that estimate optimistic.
- [Econometric Computing with HC and HAC Covariance Matrix Estimators](https://doi.org/10.18637/jss.v011.i10) - Zeileis, A. (2004), Journal of Statistical Software 11(10). Documents the sandwich package checked against the hand-built formulas in this lesson.
- [vcovHC() documentation](https://rdrr.io/cran/sandwich/man/vcovHC.html) - sandwich package, A. Zeileis. Computes the HC1 standard error this lesson builds by hand first.

=== step === complete
## The decision rule for choosing a standard error

Here is the rule this lesson has built, one piece at a time.

- If your rows are independent but their spread is unequal across a predictor's range, a heteroskedasticity-consistent (HC1, sandwich) standard error repairs it, without moving the coefficient at all.
- If your rows come in groups, like 5 weeks from the same store, and what happens inside a group moves together, a heteroskedasticity-robust standard error does nothing for you. A cluster-robust standard error is what repairs it, because it still assumes independent rows underneath.
- And if you only have a handful of groups, even a cluster-robust standard error runs a little optimistic, because the correction itself has to be estimated from those few groups.

A default standard error is only as good as the assumption behind it, that every row is an independent, equally spread piece of information. The moment that assumption breaks, the fix has to match the way it broke.

The next lesson in this course turns to a related idea: weighting each row by how much you already know about its variance.
